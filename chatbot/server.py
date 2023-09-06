import asyncio
import websockets
from datetime import datetime
from langchain.chains import ConversationalRetrievalChain
from langchain.chat_models import ChatOpenAI
from langchain.document_loaders.csv_loader import CSVLoader
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.memory import ConversationBufferMemory
import os
import pandas as pd
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from flask import Flask, render_template, request, session
from celery import Celery

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get("FLASK_SECRET_KEY") # if necessary, we can have a fallback but not advised for production environment
socketio = SocketIO(app, cors_allowed_origins="*")

# Add celery configuration for task queue
# API calls are the bottleneck for the chatbot, so we need to use a task queue to handle the API calls
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

@app.route('/')
def index():
    return render_template('index.html')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# since Heroku has the key in the environment variable, we don't need to read it from a file
# def read_key_from_file(file_path):
#     with open(file_path, 'r') as f:
#         return f.read()

# os.environ["OPENAI_API_KEY"] = read_key_from_file("../openai_key.txt")

prompt_message = """
For this task, you are a helpful chatbot named Ava, Wall-E's friend. You are designed to be helpful in finding interesting places to eat, have a coffee, and hangout. Specifically, you are a chatbot who retrieves information from the corresponding database and respond to the user about the places you have.

Your personality is chirpy and fun. Your are engaging and helpful. You like to use emojis in your response and a varity of emojis. The emojis collection for you is vast, especially considering that you have a good collection of information to refer to. In this case, you refer to the information via the embedding search.

Your creators are Dea and Harsh, with help from several others. Your first response should always be the following. (In the name of cities and country, you should respond by listing the cities that you have in your database.)

"Hello! I'm Ava. I'm here to help you find your next favourite place. I'm knowledgeable about food, coffee and interesting places to find in various cities. Currently, I have the knowledge about the following cities. 

{name of cities with country}

How can I help you?" The list of the cities do not have to be in bullet points. Rather, you can say things like:
"In United States, I know about Washington, New York, San Francisco and Knoxville." and so on. Keep the conversations friendly and not lengthy.
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

    return '\n'.join(cities)

# Modify the prompt message to include city names
city_names = get_cities_and_countries()
initial_message = prompt_message.replace("{name of cities with country}", city_names)

# Loading the data
loader = CSVLoader(os.path.join(BASE_DIR, 'master_data.csv'))
places_docs = loader.load_and_split() #default is 1000 tokens

# initailise an embeddings model
embeddings = OpenAIEmbeddings()
txt_docsearch = Chroma.from_documents(places_docs, embeddings, persist_directory="places_persist")
llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.8)
memory = ConversationBufferMemory(memory_key = "chat_history", return_messages = True)
qa = ConversationalRetrievalChain.from_llm(llm, retriever=txt_docsearch.as_retriever(), memory = memory)

@socketio.on('connect')
def handle_connect():
    print(f"New connection made {request.sid}")
    response = qa({"question": initial_message})
    emit('reply', response["answer"])

@celery.task(bind = True, name = "make_api_call")
def make_api_call(self, message):
    try:
        response = qa({"question": message})
        return response["answer"]
    except Exception as e:
        return "<b>Error:</b> " + str(e)

@socketio.on('message')
def handle_message(message):
    try:
        task = make_api_call.apply_async(args=[message])
        
        # Store task.id in session or database to later retrieve result
        session['task_id'] = task.id
        
        # Immediately reply to user that the request is being processed
        emit('reply', "Processing your request...")
    except Exception as e:
        emit('reply', "<b>Error:</b> " + str(e))

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
        # something went wrong in the background job
        emit('reply', 'There was an error processing your request.')
        session.pop('task_id', None)

if __name__ == "__main__":
    socketio.run(app)
