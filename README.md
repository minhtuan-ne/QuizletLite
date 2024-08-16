# Quizzler

A simple web application for creating and studying flashcards, built with Flask and SQLite.

## Features

- Create flashcards with a front (question) and back (answer)
- View all created flashcards
- Study flashcards in a randomized order
- Delete flashcards
- Persistent storage using SQLite database

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Python 3.7 or higher installed on your system
- Git installed on your system (for cloning the repository)

## Installation and Setup

Follow these steps to get your development environment set up:

1. Clone the repository
   ```
   git clone https://github.com/minhtuan-ne/QuizletLite.git
   cd QuizletLite
   ```

2. Create a virtual environment
   ```
   python -m venv venv
   ```

3. Activate the virtual environment
   - On Windows:
     ```
     venv\Scripts\activate
     ```
   - On macOS and Linux:
     ```
     source venv/bin/activate
     ```

4. Install required packages
   ```
   pip install flask flask-sqlalchemy python-dotenv logging Werkzeug
   ```

5. Create a `.env` file in the project root and add the following:
   ```
   SECRET_KEY=your_secret_key_here
   ```
   Replace `your_secret_key_here` with a random string of your choice.

6. Initialize the database
   ```
   python
   >>> from app import app, db
   >>> with app.app_context():
   ...     db.create_all()
   >>> exit()
   ```

## Running the Application

1. Ensure your virtual environment is activated
2. Run the Flask application:
   ```
   python app.py
   ```
3. Open a web browser and navigate to ` http://127.0.0.1:5000`

## Usage

- To create a new flashcard, fill in the "Front" and "Back" fields and click "Add Flashcard"
- To view all flashcards, scroll through the list on the main page
- To study flashcards, click the "Study Mode" button
- To delete a flashcard, click the "Delete" button next to the flashcard in the list

## Contributing

Contributions to the Flask Flashcard App are welcome. Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Flask: https://flask.palletsprojects.com/
- SQLAlchemy: https://www.sqlalchemy.org/
- Python-dotenv: https://github.com/theskumar/python-dotenv