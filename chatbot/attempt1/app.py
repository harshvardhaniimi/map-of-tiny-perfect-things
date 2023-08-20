from flask import Flask, request

app = Flask(__name__)

def chatbot_function(user_message):
    # Your code here (e.g., call OpenAI's API)
    return "Response to: " + user_message

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.form['message']
    response = chatbot_function(user_message)
    return response

if __name__ == '__main__':
    app.run()
