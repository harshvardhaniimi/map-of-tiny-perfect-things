from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationChain
# from langchain.chains.conversation.memory import ConversationBufferMemory
from langchain.memory import ConversationSummaryBufferMemory
from langchain.prompts import (
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
    ChatPromptTemplate,
    MessagesPlaceholder
)
from langchain.llms import OpenAI
from langchain.vectorstores import Chroma
from langchain.embeddings.openai import OpenAIEmbeddings
import streamlit as st
import openai
import tiktoken
import os
import pandas as pd

# load API key from secrets
os.environ["OPENAI_API_KEY"] = st.secrets["OPENAI_API_KEY"]

# OpenAI package version change to v1
openai.api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(
  api_key=os.environ['OPENAI_API_KEY'],  # this is also the default, it can be omitted
)

# switch default sqllite
# https://discuss.streamlit.io/t/issues-with-chroma-and-sqlite/47950/5
__import__('pysqlite3')
import sys
sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')


# set up buffer memory
if 'buffer_memory' not in st.session_state:
    llm = OpenAI()
    # st.session_state.buffer_memory=ConversationBufferMemory(return_messages=True)
    st.session_state.buffer_memory=ConversationSummaryBufferMemory(llm=llm, max_token_limit=1000, return_messages=True)

def find_match(input):
    """
    Function to find the best match for the input query from the knowledge base.
    Has to be async as vectorstore.asimilarity_search is async. (maybe)
    """
    embeddings = OpenAIEmbeddings()
    vectorstore = Chroma(persist_directory="vectorstore", embedding_function = embeddings)
    
    # Get the top 5 similar items
    results = vectorstore.similarity_search(input, k=5) #default k = 4 docs

    # Extract page_content from each result and concatenate with newline
    contents = [result.page_content for result in results]

    # Join the contents with newline
    output = "\n".join(contents)
    
    return output
    
    # return ["\n" + vectorstore.similarity_search(input, k = 5)[i].page_content for i in range(5)]

def query_refiner(conversation, query):
    """Refine input query based on conversation history."""
    prompt = f"""Refine the query based on the conversation. Use variations of proper nouns for precision. Keep simple queries unchanged.
    \n\nCONVERSATION LOG: \n{conversation}\n\nQuery: {query}\n\nRefined Query:"""
    
    response = openai.Completion.create(
        model="gpt-3.5-turbo-instruct",
        prompt=prompt,
        temperature=0.3,  # Slightly reduce randomness for more consistent outputs
        max_tokens=256,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )
    return response.choices[0].text


def get_conversation_string():
    """Generate a string of the conversation history using st.session_state.messages"""
    conversation_string = ""
    for message in st.session_state.messages:
        role = "Human" if message["role"] == "user" else "Bot"
        conversation_string += f"{role}: {message['content']}\n"
    return conversation_string

def get_num_tokens(string, encoder = "cl100k_base"):
    """Generates the number of tokens in a string using tiktoken

    Args:
        string: string to find the length of

    Returns: number of tokens in the string
    """
    encoding = tiktoken.get_encoding("cl100k_base")
    return len(encoding.encode(str(string)))


if 'responses' not in st.session_state:
    st.session_state['responses'] = ["How can I assist you?"]

if 'requests' not in st.session_state:
    st.session_state['requests'] = []

llm = ChatOpenAI(model_name="gpt-4", temperature=0.7)

# setting base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def get_cities_and_countries():
    # Read the master_data CSV file
    file_path = os.path.join(BASE_DIR, 'master_data.csv')
    df = pd.read_csv(file_path)

    # Extract unique city, state, and country combinations
    cities = set()
    for index, row in df.iterrows():
        city_state_country = f"{row['city']}, {row['state']}, {row['country']}"
        cities.add(city_state_country)

    return '\n - '.join(cities)

city_names = get_cities_and_countries()


prompt_message = f"""
    You are an informational chatbot named Ava that helps user learn about good cafes, restaurants and interesting places in a city. You have an embeddings based search engine to help you find the right answer. 
    
    If there is information in the context below, try your best to use it. The context has high quality information on cafes, restaurants and interesting places in various cities.
    
    If they would like to add places, suggest them to visit perfectplaces.cool/add
    """


prompt_message = prompt_message.replace("{city_names}", city_names)
      
system_msg_template = (SystemMessagePromptTemplate.from_template(template=prompt_message))

human_msg_template = HumanMessagePromptTemplate.from_template(template="{input}")

# this combines system message and human message templates
prompt_template = (ChatPromptTemplate
                    .from_messages([system_msg_template, 
                                    MessagesPlaceholder(variable_name="history"), 
                                    human_msg_template])
                    )

conversation = ConversationChain(memory=st.session_state.buffer_memory, 
                                 prompt=prompt_template, 
                                 llm=llm, 
                                 verbose=True)

st.markdown("## Welcome to Perfect Places! 🏠")
st.markdown("Or as we call it, Map of Tiny Perfect Things 🗺️")

st.markdown("#### 🔍 Example questions to ask Ava")
st.markdown("1. What are the best cafes in New York?")
st.markdown("2. Tell me a quaint place to visit in Bengaluru.")
st.markdown("3. Plan me a perfect day in Berkeley.")
st.markdown("Ava is still learning. You can try asking again. She also might get results wrong.")

st.sidebar.markdown("Ava is here to help you find your next favourite place. She's knowledgeable about food, coffee and interesting places to find in various cities.")
st.sidebar.markdown(f"Currently, she knows about the following cities: \n - {city_names}")
st.sidebar.markdown("If you want to add more places, you can do so at [perfectplaces.cool/add](perfectplaces.cool/add).")


# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat messages from history on app rerun
for message in st.session_state.messages:
        avatar_icon = "🧑‍💻" if message["role"] == "user" else "🤖"
        with st.chat_message(message["role"], avatar=avatar_icon):
            st.markdown(message["content"])


# Accept user input
if prompt := st.chat_input("Ask Ava a question"):
    
    # Display user message in chat message container
    with st.chat_message("user", avatar="🧑‍💻"):
        st.markdown(prompt)
    
    # Add user message to chat history
    st.session_state.messages.append({"role": "user", "content": prompt})
    
    # Generate assistant's response
    with st.spinner("Thinking..."):
        conversation_string = get_conversation_string()
        print(conversation_string)
        
        # refine query based on conversation history
        refined_query = query_refiner(conversation_string, prompt)
        print(refined_query)
        
        # find matching documents in knowledge base
        context = find_match(refined_query)
        print(context)
        
        # check if input is not more than 4000 tokens
        if get_num_tokens(f"Context:\n {context} \n\n Query:\n{refined_query}") > 4000:
            response = "The question (along with memory) is too long. Please refresh the page and restart the conversation."
        
        else:
            response = conversation.predict(input=f"Context:\n {context} \n\n Query:\n{refined_query}")
    
        # saving the full response to the chat history
        st.session_state.messages.append({"role": "assistant", "content": response})
    
    # Display assistant's response in chat message container
    with st.chat_message("assistant", avatar="🤖"):
        st.markdown(response)

    


