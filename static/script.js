let currentMode = 'create'; // Possible values: 'create', 'study', 'pure-flashcard'
let flashcards = [];
let currentCardIndex = 0;
let isPureFlashcardMode = false;
let currentSetId = null;

function switchMode(mode) {
    currentMode = mode;
    document.getElementById('create-mode').style.display = mode === 'create' ? 'block' : 'none';
    document.getElementById('study-mode').style.display = mode === 'study' ? 'block' : 'none';
    document.getElementById('pure-flashcard-mode').style.display = mode === 'pure-flashcard' ? 'block' : 'none';

    // Update UI based on the mode
    if (mode === 'create') {
        setupCreateMode();
        loadSets();
    } else if (mode === 'study') {
        setupStudyMode();
    } else if (mode === 'pure-flashcard') {
        setupPureFlashcardMode();
    }
}

function setupCreateMode() {
const createModeElement = document.getElementById('create-mode');
createModeElement.innerHTML = `
<div id="sets-list"></div>

<div id="create-mode" class="mode active">
<h2>Create New Set</h2>
<div class="input-group">
<label for="set-name">Set Name:</label>
<input type="text" id="set-name" placeholder="Enter set name">
<button onclick="createSet()">Create Set</button>
</div>

<div class="input-group">
<label for="set-select">Select Set:</label>
<select id="set-select" onchange="fetchFlashcards()"></select>
</div>

<div id="create-flashcard">
<h2>Create Flashcard</h2>
<div class="input-group">
    <label for="front">Front:</label>
    <textarea id="front" placeholder="Front of card" rows="3"></textarea>
</div>
<div class="input-group">
    <label for="back">Back:</label>
    <textarea id="back" placeholder="Back of card" rows="3"></textarea>
</div>
<div class="input-group">
    <label for="front-image">Front Image:</label>
    <input type="file" id="front-image" accept="image/*">
    <img id="front-image-preview" class="image-preview" alt="Front image preview">
</div>
<div class="input-group">
    <label for="back-image">Back Image:</label>
    <input type="file" id="back-image" accept="image/*">
    <img id="back-image-preview" class="image-preview" alt="Back image preview">
</div>
<button onclick="createFlashcard()">Add Flashcard</button>
</div>

<div id="flashcards-list"></div>
</div>
`;
}

function openTab(evt, tabName) {
const tabContents = document.getElementsByClassName("tab-content");
for (let i = 0; i < tabContents.length; i++) {
tabContents[i].classList.remove("active");
}

const tabs = document.getElementsByClassName("tab");
for (let i = 0; i < tabs.length; i++) {
tabs[i].classList.remove("active");
}

document.getElementById(tabName).classList.add("active");
evt.currentTarget.classList.add("active");
}

async function createSet() {
const setName = document.getElementById('set-name').value;
if (!setName) {
alert('Please enter a set name');
return;
}
try {
const response = await fetch('/api/sets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: setName })
});
if (!response.ok) throw new Error('Failed to create set');
const newSet = await response.json();
alert('Set created successfully');
document.getElementById('set-name').value = '';
await loadSets();
} catch (error) {
console.error('Error creating set:', error);
alert('Failed to create set. Please try again.');
}
}

async function loadSets(selectId = 'set-select') {
    console.log('Loading sets...');
    try {
        const response = await fetch('/api/sets');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const sets = await response.json();
        console.log('Fetched sets:', sets);
        
        // Populate the sets list in create mode
        displaySets(sets);
        
        const setSelect = document.getElementById(selectId);
        if (!setSelect) {
            console.error(`${selectId} element not found`);
            return;
        }
        
        setSelect.innerHTML = '<option value="">Select a set</option>';
        sets.forEach(set => {
            const option = document.createElement('option');
            option.value = set.id;
            option.textContent = set.name;
            setSelect.appendChild(option);
        });
        console.log('Set select options updated');
        
        // Add change event listener to the dropdown
        setSelect.addEventListener('change', (event) => {
            console.log('Set selected:', event.target.value);
            fetchFlashcards(event.target.value);
        });
        
    } catch (error) {
        console.error('Error loading sets:', error);
        updateStatusMessage('Failed to load sets. Please try again.', 'error');
    }
}

async function loadSetsForStudyMode() {
    try {
        const response = await fetch('/api/sets');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const sets = await response.json();
        
        const setSelect = document.getElementById('study-mode-set-select');
        setSelect.innerHTML = '<option value="">Select a set</option>';
        sets.forEach(set => {
            const option = document.createElement('option');
            option.value = set.id;
            option.textContent = set.name;
            setSelect.appendChild(option);
        });
        
        // Add change event listener to the dropdown
        setSelect.addEventListener('change', (event) => {
            if (event.target.value) {
                fetchFlashcards(event.target.value);
            }
        });
    } catch (error) {
        console.error('Error loading sets for study mode:', error);
        updateStatusMessage('Failed to load sets. Please try again.', 'error');
    }
}

async function loadSetsForPureFlashcardMode() {
    try {
        const response = await fetch('/api/sets');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const sets = await response.json();
        
        const setSelect = document.getElementById('pure-flashcard-set-select');
        setSelect.innerHTML = '<option value="">Select a set</option>';
        sets.forEach(set => {
            const option = document.createElement('option');
            option.value = set.id;
            option.textContent = set.name;
            setSelect.appendChild(option);
        });
        
        // Add change event listener to the dropdown
        setSelect.addEventListener('change', (event) => {
            if (event.target.value) {
                fetchFlashcards(event.target.value);
            }
        });
    } catch (error) {
        console.error('Error loading sets for pure flashcard mode:', error);
        updateStatusMessage('Failed to load sets. Please try again.', 'error');
    }
}

// Make sure loadSets is called when the page loads
window.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    loadSets();
});


function updateStatusMessage(message, type) {
const statusElement = document.getElementById('status-message');
if (!statusElement) {
const statusDiv = document.createElement('div');
statusDiv.id = 'status-message';
document.body.insertBefore(statusDiv, document.body.firstChild);
}
const statusMessage = document.getElementById('status-message');
statusMessage.textContent = message;
statusMessage.className = type;
statusMessage.style.display = 'block';
setTimeout(() => {
statusMessage.style.display = 'none';
}, 5000);
}

function displaySets(sets) {
    const setsList = document.getElementById('sets-list');
    setsList.innerHTML = '<h2>Your Sets</h2>';
    if (sets.length === 0) {
        setsList.innerHTML += '<p>No sets found. Try creating some!</p>';
    } else {
        const setListUl = document.createElement('ul');
        sets.forEach(set => {
            const setItem = document.createElement('li');
            setItem.className = 'set-item';
            setItem.innerHTML = `
                <span>${set.name}</span>
                <button onclick="deleteSet(${set.id})">Delete</button>
            `;
            setListUl.appendChild(setItem);
        });
        setsList.appendChild(setListUl);
    }
}

async function createFlashcard() {
const front = document.getElementById('front').value;
const back = document.getElementById('back').value;
const setId = document.getElementById('set-select').value;
const frontImage = document.getElementById('front-image').files[0];
const backImage = document.getElementById('back-image').files[0];

if (!setId) {
alert('Please select a set first');
return;
}
if (!front || !back) {
alert('Please enter both front and back of the card');
return;
}

const formData = new FormData();
formData.append('front', front);
formData.append('back', back);
formData.append('set_id', setId);
if (frontImage) formData.append('front_image', frontImage);
if (backImage) formData.append('back_image', backImage);

try {
const response = await fetch('/api/flashcards', {
    method: 'POST',
    body: formData
});
if (!response.ok) throw new Error('Failed to create flashcard');
const newFlashcard = await response.json();
alert('Flashcard created successfully');
resetForm();
await fetchFlashcards(setId); // Add this line
} catch (error) {
console.error('Error creating flashcard:', error);
alert('Failed to create flashcard. Please try again.');
}
}

function resetForm() {
document.getElementById('front').value = '';
document.getElementById('back').value = '';
document.getElementById('front-image').value = '';
document.getElementById('back-image').value = '';
document.getElementById('front-image-preview').style.display = 'none';
document.getElementById('back-image-preview').style.display = 'none';
}

async function fetchFlashcards(setId) {
    if (!setId) return;
    console.log("Fetching flashcards for set:", setId);
    try {
        const response = await fetch(`/api/flashcards?set_id=${setId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch flashcards');
        }
        flashcards = await response.json();
        console.log("Fetched flashcards:", flashcards);
        currentSetId = setId;
        currentCardIndex = 0;
        
        if (currentMode === 'create') {
            updateFlashcardsList();
        } else if (currentMode === 'study') {
            displayCurrentCard();
        } else if (currentMode === 'pure-flashcard') {
            displayPureFlashcard();
        }
        
        updateStatusMessage('Flashcards loaded successfully', 'success');
    } catch (error) {
        console.error('Error fetching flashcards:', error);
        updateStatusMessage(`Failed to fetch flashcards: ${error.message}`, 'error');
        flashcards = [];
        if (currentMode === 'create') {
            updateFlashcardsList();
        }
    }
}

function updateSetSelects(sets) {
const setSelects = document.querySelectorAll('.set-select');
setSelects.forEach(setSelect => {
setSelect.innerHTML = '<option value="">Select a set</option>';
sets.forEach(set => {
    const option = document.createElement('option');
    option.value = set.id;
    option.textContent = set.name;
    setSelect.appendChild(option);
});
});
}



async function deleteSet(setId) {
if (confirm('Are you sure you want to delete this set? This action cannot be undone.')) {
try {
    const response = await fetch(`/api/sets/${setId}`, { method: 'DELETE' });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete set');
    }
    alert('Set deleted successfully');
    await loadSets();
    if (currentSetId === setId) {
        currentSetId = null;
        flashcards = [];
        updateFlashcardsList();
    }
} catch (error) {
    console.error('Error deleting set:', error);
    alert(`Failed to delete set: ${error.message}`);
}
}
}

function updateFlashcardsList() {
const list = document.getElementById('flashcards-list');
list.innerHTML = '<h2>Your Flashcards</h2>';
if (flashcards.length === 0) {
list.innerHTML += '<p>No flashcards found. Try creating some!</p>';
} else {
flashcards.forEach((card, index) => {
    const cardElement = document.createElement('div');
    cardElement.className = 'flashcard';
    cardElement.innerHTML = `
        <p><strong>Front:</strong> ${card.front}</p>
        <p><strong>Back:</strong> ${card.back}</p>
        ${card.front_image ? `<img src="${card.front_image}" alt="Front image" style="max-width: 100px;">` : ''}
        ${card.back_image ? `<img src="${card.back_image}" alt="Back image" style="max-width: 100px;">` : ''}
        <div class="flashcard-controls">
            <button onclick="editFlashcard(${index})">Edit</button>
            <button class="delete-btn" onclick="deleteFlashcard(${card.id})">Delete</button>
        </div>
    `;
    list.appendChild(cardElement);
});
}
}

async function deleteFlashcard(id) {
if (confirm('Are you sure you want to delete this flashcard?')) {
try {
    const response = await fetch(`/api/flashcards/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete flashcard');
    await fetchFlashcards();
    alert('Flashcard deleted successfully');
} catch (error) {
    console.error('Error deleting flashcard:', error);
    alert('Failed to delete flashcard. Please try again.');
}
}
}

function editFlashcard(index) {
const card = flashcards[index];
document.getElementById('front').value = card.front;
document.getElementById('back').value = card.back;
// You might want to handle image editing here as well
// This is a simple implementation; you may want to expand on this
}

function startStudyMode() {
isPureFlashcardMode = false;
document.getElementById('study-mode').style.display = 'block';
document.getElementById('pure-flashcard-mode').style.display = 'none';
document.getElementById('create-mode').style.display = 'none';
setupStudyMode();
}

function setupStudyMode() {
    const studyControls = document.getElementById('study-controls');
    studyControls.innerHTML = `
        <select id="study-mode-set-select">
            <option value="">Select a set</option>
        </select>
        <button onclick="Start()">Start</button>
        <button onclick="shuffleFlashcards()">Shuffle</button>
        <button onclick="exitStudyMode()">Exit Study Mode</button>
    `;
    loadSetsForStudyMode();


const flashcardDisplay = document.getElementById('flashcard-display');
flashcardDisplay.innerHTML = `
<div class="flashcard">
    <p id="front-display"></p>
    <textarea id="user-answer" placeholder="Your answer" rows="3"></textarea>
    <button onclick="checkAnswer()">Check Answer</button>
    <p id="back-display" style="display: none;"></p>
</div>
<div id="result"></div>
<div class="navigation-controls">
    <button onclick="prevCard()">Previous Card</button>
    <button onclick="nextCard()">Next Card</button>
</div>
`;
flashcardDisplay.style.display = 'none';

document.addEventListener('keydown', handleKeyPress);
}


function displayCurrentCard() {
    console.log("Displaying current card, index:", currentCardIndex);
    const flashcardDisplay = document.getElementById('flashcard-display');
    if (flashcards.length === 0) {
        flashcardDisplay.innerHTML = '<p>No flashcards available for this set.</p>';
        return;
    }

    const card = flashcards[currentCardIndex];
    flashcardDisplay.innerHTML = `
        <div class="flashcard">
            <p id="front-display">${card.front}</p>
            <textarea id="user-answer" placeholder="Your answer" rows="3"></textarea>
            <button onclick="checkAnswer()">Check Answer</button>
            <p id="back-display" style="display: none;">${card.back}</p>
        </div>
        <div id="result"></div>
        <div class="navigation-controls">
            <button onclick="prevCard()">Previous Card</button>
            <button onclick="nextCard()">Next Card</button>
        </div>
    `;
    flashcardDisplay.style.display = 'block';
}

function checkAnswer() {
const userAnswer = normalizeString(document.getElementById('user-answer').value);
const correctAnswer = normalizeString(flashcards[currentCardIndex].back);
const resultElement = document.getElementById('result');

if (userAnswer === correctAnswer) {
resultElement.textContent = 'Correct!';
resultElement.className = 'correct';
} else {
resultElement.textContent = 'Incorrect. Try again!';
resultElement.className = 'incorrect';
}

document.getElementById('back-display').style.display = 'block';
}

function normalizeString(str) {
return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

function nextCard() {
currentCardIndex = (currentCardIndex + 1) % flashcards.length;
if (isPureFlashcardMode) {
displayPureFlashcard();
} else {
displayCurrentCard();
}
}

function prevCard() {
currentCardIndex = (currentCardIndex - 1 + flashcards.length) % flashcards.length;
if (isPureFlashcardMode) {
displayPureFlashcard();
} else {
displayCurrentCard();
}
}


function shuffleFlashcards() {
for (let i = flashcards.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1));
[flashcards[i], flashcards[j]] = [flashcards[j], flashcards[i]];
}
if (isPureFlashcardMode) {
displayPureFlashcard();
} else {
displayCurrentCard();
}
}

function startPureFlashcardMode() {
isPureFlashcardMode = true;
document.getElementById('pure-flashcard-mode').style.display = 'block';
document.getElementById('study-mode').style.display = 'none';
document.getElementById('create-mode').style.display = 'none';
setupPureFlashcardMode();
}


function setupPureFlashcardMode() {
    const pureFlashcardControls = document.getElementById('pure-flashcard-controls');
    pureFlashcardControls.innerHTML = `
        <select id="pure-flashcard-set-select">
            <option value="">Select a set</option>
        </select>
        <button onclick="Start()">Start</button>
        <button onclick="shuffleFlashcards()">Shuffle</button>
        <button onclick="exitPureFlashcardMode()">Exit Pure Flashcard Mode</button>
        `;
    loadSetsForPureFlashcardMode();

const pureFlashcardDisplay = document.getElementById('pure-flashcard-display');
pureFlashcardDisplay.innerHTML = `
<div class="pure-flashcard" onclick="flipPureFlashcard()">
    <div class="pure-flashcard-inner">
        <div class="pure-flashcard-front">
            <img id="pure-front-image" class="pure-flashcard-image">
            <p id="pure-front-text"></p>
        </div>
        <div class="pure-flashcard-back">
            <img id="pure-back-image" class="pure-flashcard-image">
            <p id="pure-back-text"></p>
        </div>
    </div>
</div>
<div class="navigation-controls">
    <button onclick="prevCard()">Previous Card</button>
    <button onclick="nextCard()">Next Card</button>
</div>
`;
pureFlashcardDisplay.style.display = 'none';

// Add event listener for set selection
const pureFlashcardSetSelect = document.getElementById('pure-flashcard-set-select');
pureFlashcardSetSelect.addEventListener('change', function() {
fetchFlashcards(this.value);
});

}


function displayPureFlashcard() {
    const pureFlashcardDisplay = document.getElementById('pure-flashcard-display');
    console.log("Displaying pure flashcard, index:", currentCardIndex);

    if (flashcards.length === 0) {
        pureFlashcardDisplay.innerHTML = '<p>No flashcards available for this set.</p>';
        return;
    }

    const card = flashcards[currentCardIndex];
    const frontImageHtml = card.front_image ? `<img src="${card.front_image}" alt="Front image" class="flashcard-image">` : '';
    const backImageHtml = card.back_image ? `<img src="${card.back_image}" alt="Back image" class="flashcard-image">` : '';

    pureFlashcardDisplay.innerHTML = `
        <div class="pure-flashcard" onclick="flipPureFlashcard()">
            <div class="pure-flashcard-inner">
                <div class="pure-flashcard-front">
                    ${frontImageHtml}
                    <p id="pure-front-text">${card.front}</p>
                </div>
                <div class="pure-flashcard-back">
                    ${backImageHtml}
                    <p id="pure-back-text">${card.back}</p>
                </div>
            </div>
        </div>
        <div class="navigation-controls">
            <button onclick="prevCard()">Previous Card</button>
            <button onclick="nextCard()">Next Card</button>
        </div>
    `;
    pureFlashcardDisplay.style.display = 'block';
}

function flipPureFlashcard() {
document.querySelector('.pure-flashcard').classList.toggle('flipped');
}

function handleKeyPress(event) {
if (event.key === 'Enter' && !event.shiftKey) {
if (isPureFlashcardMode) {
    flipPureFlashcard();
} else {
    checkAnswer();
}
} else if (event.key === 'ArrowRight') {
nextCard();
} else if (event.key === 'ArrowLeft') {
prevCard();
}
}

// Event listeners for image previews
document.getElementById('front-image').addEventListener('change', function(event) {
previewImage(event, 'front-image-preview');
});

document.getElementById('back-image').addEventListener('change', function(event) {
previewImage(event, 'back-image-preview');
});

function previewImage(event, previewId) {
const file = event.target.files[0];
if (file) {
const reader = new FileReader();
reader.onload = function(e) {
    const preview = document.getElementById(previewId);
    preview.src = e.target.result;
    preview.style.display = 'block';
}
reader.readAsDataURL(file);
}
}

function exitStudyMode() {
document.removeEventListener('keydown', handleKeyPress);
document.getElementById('study-mode').style.display = 'none';
document.getElementById('create-mode').style.display = 'block';
}

function exitPureFlashcardMode() {
document.removeEventListener('keydown', handleKeyPress);
document.getElementById('pure-flashcard-mode').style.display = 'none';
document.getElementById('create-mode').style.display = 'block';
}

function Start() {
    if (isPureFlashcardMode) {
        displayPureFlashcard();
        } else {
        displayCurrentCard();
        }
}

// Initialize the application
window.onload = function() {
loadSets();
document.getElementById('create-set-btn').addEventListener('click', () => switchMode('create'));
document.addEventListener('keydown', handleKeyPress);
document.getElementById('start-study-btn').addEventListener('click', startStudyMode);
document.getElementById('start-pure-flashcard-btn').addEventListener('click', startPureFlashcardMode);
switchMode('create');
};

function displaySets(sets) {
const setsList = document.getElementById('sets-list');
setsList.innerHTML = '<h2>Your Sets</h2>';
if (sets.length === 0) {
setsList.innerHTML += '<p>No sets found. Try creating some!</p>';
} else {
sets.forEach(set => {
    const setElement = document.createElement('div');
    setElement.className = 'set-item';
    setElement.innerHTML = `
        <span>${set.name}</span>
        <button onclick="deleteSet(${set.id})">Delete Set</button>
    `;
    setsList.appendChild(setElement);
});
}
}
document.addEventListener('DOMContentLoaded', (event) => {
    const createSetSelect = document.getElementById('set-select');
    if (createSetSelect) {
        createSetSelect.addEventListener('change', function() {
            fetchFlashcards(this.value);
        });
    }

// Add event listener for the start pure flashcard mode button
const startPureFlashcardBtn = document.getElementById('start-pure-flashcard-btn');
if (startPureFlashcardBtn) {
startPureFlashcardBtn.addEventListener('click', startPureFlashcardMode);
}
});
