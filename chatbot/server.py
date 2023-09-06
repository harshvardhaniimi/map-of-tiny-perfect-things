import asyncio
import websockets
from datetime import datetime
from langchain.chains import ConversationalRetrievalChain
from langchain.chat_models import ChatOpenAI
from langchain.document_loaders.csv_loader import CSVLoader
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
import os
import pandas as pd
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from flask import Flask, render_template, request


app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

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

How can I help you?"
"""

def get_cities_and_countries():
    # Read the master_data CSV file
    file_path = os.path.join(BASE_DIR, "..", 'master_data', 'master_data.csv')
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
loader = CSVLoader(os.path.join(BASE_DIR, "..", 'master_data', 'master_data.csv'))
places_docs = loader.load_and_split() #default is 1000 tokens

# initailise an embeddings model
embeddings = OpenAIEmbeddings()
txt_docsearch = Chroma.from_documents(places_docs, embeddings, persist_directory="places_persist")
llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.8)
qa = ConversationalRetrievalChain.from_llm(llm, retriever=txt_docsearch.as_retriever())

chat_histories = {}

@socketio.on('connect')
def handle_connect():
    # Create an individual chat history for each client
    chat_histories[request.sid] = []

    # Initialize a new chat session with the initial prompt
    response = qa({"question": initial_message, "chat_history": chat_histories[request.sid]})
    chat_histories[request.sid].append((initial_message, response["answer"]))

    # Send the first response
    emit('reply', response["answer"])

@socketio.on('message')
def handle_message(message):
    try:
        chat_history = chat_histories[request.sid]
        
        # Respond to predefined commands
        if message == "ping":
            answer = "pong"
        elif message == "I am Pablo":
            answer = "Really? You are so cool you are like the coolest person ever born and humble too. And handsome"
        else:
            response = qa({"question": message, "chat_history": chat_history})
            answer = response["answer"]
            chat_history.append((message, answer))
        
        emit('reply', answer)
    except Exception as e:
        emit('reply', "<b>Error:</b> " + str(e))


if __name__ == "__main__":
    socketio.run(app)
