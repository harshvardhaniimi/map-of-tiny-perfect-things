import streamlit as st
from langchain.chains import ConversationalRetrievalChain
from langchain.chat_models import ChatOpenAI
from langchain.document_loaders.csv_loader import CSVLoader
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.memory import ConversationBufferMemory
import os
import pandas as pd

# Set up Streamlit header and initial configurations
st.subheader("Perfect Places Chatbot")

# get cities and countries
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

# Load data and initialize components
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
loader = CSVLoader(os.path.join(BASE_DIR, 'master_data.csv'))
places_docs = loader.load_and_split()

embeddings = OpenAIEmbeddings()
txt_docsearch = Chroma.from_documents(places_docs, embeddings, persist_directory="places_persist")
llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.8)
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
qa = ConversationalRetrievalChain.from_llm(llm, retriever=txt_docsearch.as_retriever(), memory=memory)


# System prompt
system_prompt = """
Hello! I'm Ava. I'm here to help you find your next favourite place. I'm knowledgeable about food, coffee and interesting places to find in various cities. Here are all the places I know about:
{name of cities with country}
"""
city_names = get_cities_and_countries()
initial_message = system_prompt.replace("{name of cities with country}", city_names)

# Initialize or retrieve chat history from session state
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = [{'sender': 'bot', 'text': initial_message}]


# Initialize or retrieve chat history from session state
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []
    
# Display chat history
for message in st.session_state.chat_history:
    if message['sender'] == 'user':
        st.write(f"You: {message['text']}")
    else:
        st.write(f"Ava: {message['text']}")
        
# Handle user input and display chatbot response
query = st.text_input("Your Query: ", key="input")

# Check if there's a new user input and if it's different from the last processed input
if query and query != st.session_state.get("user_input", ""):
    with st.spinner("Processing..."):
        response = qa({"question": query})
        # Update chat history in session state
        st.session_state.chat_history.append({'sender': 'user', 'text': query})
        st.session_state.chat_history.append({'sender': 'bot', 'text': response["answer"]})
        
        # Store the processed user input in session state
        st.session_state.user_input = query
        
        # Refresh the page to display updated chat history
        st.experimental_rerun()

        


