import { initializeApp } from "https://www.gstatic.com/firebasejs/9.12.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut as firebaseSignOut } from "https://www.gstatic.com/firebasejs/9.12.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.12.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAAYFrQ4la9wDoFYF6IAauti_DBouzWlGM",
    authDomain: "friendship-checking.firebaseapp.com",
    projectId: "friendship-checking",
    storageBucket: "friendship-checking.appspot.com",
    messagingSenderId: "118314602222",
    appId: "1:118314602222:web:38a71de7c01442821aadff",
    measurementId: "G-8Q6PZYQSBW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function showStatus(message, type = 'success') {
    const statusMessageDiv = document.getElementById('status-message');
    statusMessageDiv.textContent = message;
    statusMessageDiv.className = `status-message ${type}`;
    statusMessageDiv.style.display = 'block';
}

function hideStatus() {
    document.getElementById('status-message').style.display = 'none';
}

function showElement(id) {
    document.querySelectorAll('.container').forEach(el => el.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

window.signUp = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
            hideStatus();
            showElement('signup-form');
            showStatus('Sign up successful! Please enter your name.', 'success');
        })
        .catch((error) => {
            showStatus(`Sign up failed: ${error.message}`, 'error');
        });
};

window.signIn = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            hideStatus();
            showElement('signup-form');
            showStatus('Sign in successful! Please enter your name.', 'success');
        })
        .catch((error) => {
            showStatus(`Sign in failed: ${error.message}`, 'error');
        });
};

window.saveName = function() {
    const user = auth.currentUser;
    const name = document.getElementById('name').value;
    if (user) {
        setDoc(doc(db, 'users', user.uid), { name })
            .then(() => {
                hideStatus();
                showElement('quiz-setup');
                initializeQuestions();
                showStatus('Name saved successfully! Please set up your quiz.', 'success');
            })
            .catch((error) => {
                showStatus(`Failed to save name: ${error.message}`, 'error');
            });
    }
};

function addQuestionSection(questionId, options, correctAnswers) {
    const questionSelectionDiv = document.getElementById('question-selection');
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-section';
    questionDiv.innerHTML = `
        <p>${questionId}</p>
        ${options.map(option => `
            <label>
                <input type="checkbox" name="${questionId}" value="${option}">
                ${option}
            </label><br>
        `).join('')}
        <p>Correct answers:</p>
        ${options.map(option => `
            <label>
                <input type="radio" name="correct-${questionId}" value="${option}">
                ${option}
            </label><br>
        `).join('')}
    `;
    questionSelectionDiv.appendChild(questionDiv);
}

function initializeQuestions() {
    const questions = [
        { id: 'Q1', options: ['Option 1.1', 'Option 1.2', 'Option 1.3', 'Option 1.4', 'Option 1.5'] },
        { id: 'Q2', options: ['Option 2.1', 'Option 2.2', 'Option 2.3', 'Option 2.4', 'Option 2.5'] }
    ];

    questions.forEach(question => {
        addQuestionSection(question.id, question.options, []);
    });
}

window.generateLink = function() {
    const user = auth.currentUser;
    if (user) {
        const quizId = Date.now().toString(); // Unique ID for the quiz
        const questions = Array.from(document.querySelectorAll('.question-section')).map(section => {
            const questionId = section.querySelector('p').textContent;
            const options = Array.from(section.querySelectorAll('input[type="checkbox"]:checked')).map(input => input.value);
            const correctAnswers = Array.from(section.querySelectorAll(`input[name="correct-${questionId}"]:checked`)).map(input => input.value);
            return { questionId, options, correctAnswers };
        });

        setDoc(doc(db, 'quizzes', quizId), {
            creatorId: user.uid,
            createdAt: serverTimestamp(),
            questions
        })
        .then(() => {
            hideStatus();
            showStatus(`Quiz created successfully! Share this link: <a href="quiz.html?quiz=${quizId}">quiz.html?quiz=${quizId}</a>`, 'success');
        })
        .catch((error) => {
            showStatus(`Failed to create quiz: ${error.message}`, 'error');
        });
    }
};

window.signOut = function() {
    firebaseSignOut(auth)
        .then(() => {
            hideStatus();
            showElement('auth-container');
            showStatus('Signed out successfully.', 'success');
        })
        .catch((error) => {
            showStatus(`Sign out failed: ${error.message}`, 'error');
        });
};

// Initialize
onAuthStateChanged(auth, (user) => {
    if (user) {
        showElement('signup-form');
    } else {
        showElement('auth-container');
    }
});
