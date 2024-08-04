from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import os
from dotenv import load_dotenv
import logging

load_dotenv()

app = Flask(__name__)

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///flashcards.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'you-will-never-guess'

db = SQLAlchemy(app)

# Model
class Flashcard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    front = db.Column(db.String(200), nullable=False)
    back = db.Column(db.String(200), nullable=False)

# Create tables
with app.app_context():
    db.create_all()
    app.logger.info("Database tables created")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/flashcards', methods=['GET', 'POST'])
def flashcards():
    if request.method == 'GET':
        try:
            flashcards = Flashcard.query.all()
            app.logger.info(f"Retrieved {len(flashcards)} flashcards")
            return jsonify([{"id": card.id, "front": card.front, "back": card.back} for card in flashcards])
        except Exception as e:
            app.logger.error(f"Error retrieving flashcards: {str(e)}")
            return jsonify({"error": "Failed to retrieve flashcards"}), 500
    elif request.method == 'POST':
        try:
            data = request.json
            new_flashcard = Flashcard(front=data['front'], back=data['back'])
            db.session.add(new_flashcard)
            db.session.commit()
            app.logger.info(f"Created new flashcard: {new_flashcard.id}")
            return jsonify({"id": new_flashcard.id, "front": new_flashcard.front, "back": new_flashcard.back}), 201
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error creating flashcard: {str(e)}")
            return jsonify({"error": "Failed to create flashcard"}), 500

@app.route('/api/flashcards/<int:flashcard_id>', methods=['DELETE'])
def delete_flashcard(flashcard_id):
    try:
        flashcard = Flashcard.query.get_or_404(flashcard_id)
        db.session.delete(flashcard)
        db.session.commit()
        app.logger.info(f"Deleted flashcard: {flashcard_id}")
        return '', 204
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting flashcard {flashcard_id}: {str(e)}")
        return jsonify({"error": "Failed to delete flashcard"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)