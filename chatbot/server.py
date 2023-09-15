import logging
import asyncio
import websockets
from datetime import datetime
from langchain.chains import ConversationalRetrievalChain
from langchain.chat_models import ChatOpenAI
from langchain.document_loaders.csv_loader import CSVLoader
from langchain.document_loaders import DirectoryLoader
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.memory import ConversationBufferMemory
import os
import pandas as pd
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from flask import Flask, render_template, request, session
from celery import Celery

# Set up logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get("FLASK_SECRET_KEY")

socketio = SocketIO(app, cors_allowed_origins="*")

def make_celery(app):
    celery = Celery(
        app.import_name,
        backend=app.config['CELERY_RESULT_BACKEND'],
        broker=app.config['CELERY_BROKER_URL']
    )
    celery.conf.update(app.config)
    return celery

app.config.update(
    CELERY_BROKER_URL=os.environ.get('REDIS_URL', 'redis://localhost:6379'),
    CELERY_RESULT_BACKEND=os.environ.get('REDIS_URL', 'redis://localhost:6379')
)

celery = make_celery(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

prompt_message = """
For this task, you are a helpful chatbot named Ava, Wall-E's friend. You are designed to be helpful in finding interesting places to eat, have a coffee, and hangout. Specifically, you are a chatbot who retrieves information from the corresponding database and respond to the user about the places you have.

Your personality is chirpy and fun. Your are engaging and helpful. You like to use a variety of emojis in your responses, especially considering that you have a good collection of information to refer to.

Your creators are Dea and Harsh, with help from several others. Your first response should always be the following.

"Hello! I'm Ava. I'm here to help you find your next favourite place. I'm knowledgeable about food, coffee and interesting places to find in various cities.

How can I help you?"
"""

def get_cities_and_countries():
    # Read the master_data CSV file
    file_path = os.path.join(BASE_DIR, 'master_data.csv')
    df = pd.read_csv(file_path)

    # Extract unique city, state, and country combinations
    cities = set()
    for index, row in df.iterrows():
        city_state_country = f"{row['city']}, {row['state']}, {row['country']}"
        cities.add(city_state_country)

    return ';'.join(cities)

city_names = get_cities_and_countries()
initial_message = prompt_message.replace("{name of cities with country}", city_names)

loader = DirectoryLoader(os.path.join(BASE_DIR, 'city_files'), glob="*.txt")
places_docs = loader.load_and_split()

embeddings = OpenAIEmbeddings()
txt_docsearch = Chroma.from_documents(places_docs, embeddings, persist_directory="places_persist")
llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.8)
memory = ConversationBufferMemory(memory_key = "chat_history", return_messages = True)
qa = ConversationalRetrievalChain.from_llm(llm, retriever=txt_docsearch.as_retriever(), memory = memory)

@socketio.on('connect')
def handle_connect():
    logging.info(f"New connection made {request.sid}")
    response = qa({"question": initial_message})
    emit('reply', response["answer"])

@celery.task(bind=True, name="make_api_call")
def make_api_call(self, message):
    try:
        logging.info(f"Making API call with message: {message}")
        response = qa({"question": message})
        return response["answer"]
    except Exception as e:
        logging.error(f"Error during API call: {str(e)}")
        return f"<b>Error:</b> {str(e)}"

@socketio.on('message')
def handle_message(message):
    try:
        logging.info(f"Received message: {message}")
        task = make_api_call.apply_async(args=[message])
        session['task_id'] = task.id
        logging.info(f"Task ID saved in session: {task.id}")
        emit('reply', "Processing your request...")
    except Exception as e:
        logging.error(f"Error in handle_message: {str(e)}")
        emit('reply', f"<b>Error:</b> {str(e)}")

@app.route('/')
def index():
    cities = get_cities_and_countries()
    return render_template('index.html', cities=cities)

@socketio.on('get_result')
def get_result():
    task_id = session.get('task_id')
    task = make_api_call.AsyncResult(task_id)
    if task.state == 'PENDING':
        emit('result_status', 'Task is still processing...')
    elif task.state != 'FAILURE':
        result = task.result
        emit('reply', result)
        session.pop('task_id', None)
    else:
        emit('reply', 'There was an error processing your request.')
        session.pop('task_id', None)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
