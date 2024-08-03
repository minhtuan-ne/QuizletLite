from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import os
from dotenv import load_dotenv
from openai import OpenAI
import openai

load_dotenv()

app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///flashcards.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'you-will-never-guess'


client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

db = SQLAlchemy(app)

# Model
class Flashcard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    front = db.Column(db.String(200), nullable=False)
    back = db.Column(db.String(200), nullable=False)

# Create tables
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/flashcards', methods=['POST'])
def create_flashcard():
    data = request.json
    new_flashcard = Flashcard(front=data['front'], back=data['back'])
    db.session.add(new_flashcard)
    db.session.commit()
    return jsonify({"id": new_flashcard.id, "front": new_flashcard.front, "back": new_flashcard.back}), 201

@app.route('/api/check-answer', methods=['POST'])
def check_answer():
    try:
        data = request.json
        app.logger.debug(f"Received data: {data}")

        front = data['front']
        correct_answer = data['back']
        user_answer = data['userAnswer']

        prompt = f"""
        Question: {front}
        Correct Answer: {correct_answer}
        User's Answer: {user_answer}

        Evaluate the user's answer based on the following criteria:
        1. Correctness: Is the answer factually correct?
        2. Completeness: Does it cover all aspects of the correct answer?
        3. Clarity: Is the answer clear and well-expressed?

        Provide a score out of 10 and a brief explanation. Format your response as:
        Score: [X/10]
        Explanation: [Your explanation here]
        """

        app.logger.debug(f"Sending prompt to OpenAI: {prompt}")

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an AI tutor evaluating flashcard answers."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150
        )

        result = response.choices[0].message.content.strip()
        app.logger.debug(f"Received response from OpenAI: {result}")

        # Extract score and explanation
        score_line = result.split('\n')[0]
        score = int(score_line.split(':')[1].strip().split('/')[0])
        explanation = result.split('\n', 1)[1].strip()

        return jsonify({
            "score": score,
            "explanation": explanation,
            "full_response": result
        })

    except Exception as e:
        app.logger.error(f"An error occurred: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)