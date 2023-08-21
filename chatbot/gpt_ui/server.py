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

os.environ["OPENAI_API_KEY"] = "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"

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
    file_path = "../../master_data/master_data.csv"
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
loader = CSVLoader("../../master_data/master_data.csv")
places_docs = loader.load_and_split() #default is 1000 tokens

# initailise an embeddings model
embeddings = OpenAIEmbeddings()
txt_docsearch = Chroma.from_documents(places_docs, embeddings, persist_directory="places_persist")
llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.1)
qa = ConversationalRetrievalChain.from_llm(llm, retriever=txt_docsearch.as_retriever())

async def handle_client(websocket, path):
    # Create an individual chat history for this client
    chat_history = []
    
    # Initialize a new chat session with the initial prompt
    response = qa({"question": initial_message, "chat_history": chat_history})
    chat_history.append((initial_message, response["answer"]))

    # send the first response
    await websocket.send(response["answer"])

    async for message in websocket:
        
        # Respond to predefined commands
        if message == "ping":
            await websocket.send("pong")
        elif message == "I am Pablo":
            await websocket.send("Really? You are so cool you are like the coolest person ever born and humble too. And handsome")
        else:
            try:
                question = message
                response = qa({"question": question, "chat_history": chat_history})
                answer = response["answer"]
                chat_history.append((question, answer))
                await websocket.send(answer)
            except Exception as e:
                await websocket.send("<b>Error:</b> " + str(e))

start_server = websockets.serve(handle_client, "localhost", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
