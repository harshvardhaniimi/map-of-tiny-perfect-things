import logging
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

@app.route('/')
def index():
    return render_template('index.html')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

city_names = get_cities_and_countries()
initial_message = prompt_message.replace("{name of cities with country}", city_names)

loader = CSVLoader(os.path.join(BASE_DIR, 'master_data.csv'))
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
