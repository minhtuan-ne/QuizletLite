from flask import Flask, render_template, request, jsonify, send_file, url_for, abort
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os
import logging
from werkzeug.utils import secure_filename
from sqlalchemy import inspect
import uuid


app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = app.logger

# SQLite database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'flashcards.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max-limit

db = SQLAlchemy(app)
migrate = Migrate(app, db)

class FlashcardSet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    flashcards = db.relationship('Flashcard', backref='flashcard_set', lazy=True)

class Flashcard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    front = db.Column(db.Text, nullable=False)
    back = db.Column(db.Text, nullable=False)
    front_image = db.Column(db.String(255))
    back_image = db.Column(db.String(255))
    set_id = db.Column(db.Integer, db.ForeignKey('flashcard_set.id'), nullable=False)


with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/sets', methods=['GET', 'POST'])
def manage_sets():
    if request.method == 'GET':
        sets = FlashcardSet.query.all()
        return jsonify([{'id': s.id, 'name': s.name} for s in sets])
    elif request.method == 'POST':
        data = request.json
        new_set = FlashcardSet(name=data['name'])
        db.session.add(new_set)
        db.session.commit()
        return jsonify({'id': new_set.id, 'name': new_set.name}), 201

@app.route('/api/sets/<int:set_id>', methods=['DELETE'])
def delete_set(set_id):
    try:
        set_to_delete = FlashcardSet.query.get_or_404(set_id)
        # Delete associated flashcards first
        Flashcard.query.filter_by(set_id=set_id).delete()
        db.session.delete(set_to_delete)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting set {set_id}: {str(e)}")
        return jsonify({"error": "Failed to delete set"}), 500



@app.route('/api/flashcards', methods=['GET', 'POST'])
def manage_flashcards():
    if request.method == 'GET':
        set_id = request.args.get('set_id')
        if set_id:
            flashcards = Flashcard.query.filter_by(set_id=set_id).all()
        else:
            flashcards = Flashcard.query.all()
        return jsonify([{
            'id': f.id,
            'front': f.front,
            'back': f.back,
            'front_image': f.front_image,
            'back_image': f.back_image,
            'set_id': f.set_id
        } for f in flashcards])
    elif request.method == 'POST':
        data = request.form
        front_image = request.files.get('front_image')
        back_image = request.files.get('back_image')
        
        new_flashcard = Flashcard(
            front=data['front'],
            back=data['back'],
            set_id=data['set_id']
        )
        
        if front_image:
            front_image_path = save_image(front_image)
            new_flashcard.front_image = front_image_path
        
        if back_image:
            back_image_path = save_image(back_image)
            new_flashcard.back_image = back_image_path
        
        db.session.add(new_flashcard)
        db.session.commit()
        
        return jsonify({
            'id': new_flashcard.id,
            'front': new_flashcard.front,
            'back': new_flashcard.back,
            'front_image': new_flashcard.front_image,
            'back_image': new_flashcard.back_image,
            'set_id': new_flashcard.set_id
        }), 201


@app.route('/api/flashcards/<int:flashcard_id>', methods=['DELETE'])
def delete_flashcard(flashcard_id):
    flashcard = Flashcard.query.get_or_404(flashcard_id)
    if flashcard.front_image:
        delete_image(flashcard.front_image)
    if flashcard.back_image:
        delete_image(flashcard.back_image)
    db.session.delete(flashcard)
    db.session.commit()
    return '', 204
    
def save_image(image):
    filename = secure_filename(image.filename)
    unique_filename = f"{uuid.uuid4()}_{filename}"
    path = os.path.join('static', 'uploads', unique_filename)
    image.save(path)
    return path

def delete_image(image_path):
    if os.path.exists(image_path):
        os.remove(image_path)


@app.route('/api/flashcards/update', methods=['POST'])
def update_flashcard():
    try:
        flashcard_id = request.form.get('id')
        flashcard = Flashcard.query.get_or_404(flashcard_id)

        flashcard.front = request.form.get('front')
        flashcard.back = request.form.get('back')

        front_image = request.files.get('front_image')
        back_image = request.files.get('back_image')

        if front_image:
            if flashcard.front_image:
                delete_image(flashcard.front_image)
            front_image_path = save_image(front_image)
            flashcard.front_image = front_image_path

        if back_image:
            if flashcard.back_image:
                delete_image(flashcard.back_image)
            back_image_path = save_image(back_image)
            flashcard.back_image = back_image_path

        db.session.commit()

        return jsonify({
            'id': flashcard.id,
            'front': flashcard.front,
            'back': flashcard.back,
            'front_image': flashcard.front_image,
            'back_image': flashcard.back_image,
            'set_id': flashcard.set_id
        }), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error updating flashcard: {str(e)}")
        return jsonify({"error": "Failed to update flashcard"}), 500

@app.route('/uploads/<path:filename>')
def serve_image(filename):
    return send_file(os.path.join(app.config['UPLOAD_FOLDER'], filename))

def init_db():
    with app.app_context():
        try:
            db.create_all()
            logger.info("Database tables created successfully.")
            
            # Verify tables were created
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            logger.info(f"Tables in the database: {tables}")
            
            if 'flashcard_set' not in tables or 'flashcard' not in tables:
                logger.error("Required tables are missing. Attempting to create them again.")
                db.create_all()
                tables = inspector.get_table_names()
                logger.info(f"Tables after second attempt: {tables}")
            
            # Check if tables are empty and add sample data if needed
            if FlashcardSet.query.count() == 0:
                sample_set = FlashcardSet(name="Sample Set")
                db.session.add(sample_set)
                db.session.commit()
                logger.info("Added sample flashcard set.")
            
            if Flashcard.query.count() == 0:
                sample_card = Flashcard(front="Sample Front", back="Sample Back", set_id=1)
                db.session.add(sample_card)
                db.session.commit()
                logger.info("Added sample flashcard.")
            
        except Exception as e:
            logger.error(f"Error initializing database: {str(e)}", exc_info=True)
            raise

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=8000)
