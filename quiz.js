import { initializeApp } from "https://www.gstatic.com/firebasejs/9.12.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.12.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.12.1/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

function showStatus(message, type = 'success') {
    const statusMessageDiv = document.getElementById('status-message');
    statusMessageDiv.textContent = message;
    statusMessageDiv.className = `status-message ${type}`;
    statusMessageDiv.style.display = 'block';
}

function hideStatus() {
    document.getElementById('status-message').style.display = 'none';
}

function loadQuizQuestions(quizId) {
    getDoc(doc(db, 'quizzes', quizId))
        .then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const questions = data.questions;
                const quizContainer = document.getElementById('quiz-questions');
                quizContainer.innerHTML = ''; // Clear previous content

                questions.forEach(q => {
                    const questionDiv = document.createElement('div');
                    questionDiv.className = 'question-section';
                    questionDiv.innerHTML = `
                        <p>${q.questionId}</p>
                        ${q.selectedOptions.map(option => `
                            <label>
                                <input type="radio" name="${q.questionId}" value="${option}">
                                ${option}
                            </label><br>
                        `).join('')}
                    `;
                    quizContainer.appendChild(questionDiv);
                });

                document.getElementById('quiz-container').style.display = 'block';
                displayResults(quizId);
            } else {
                showStatus('Quiz not found.', 'error');
            }
        })
        .catch((error) => {
            showStatus(`Failed to load quiz: ${error.message}`, 'error');
        });
}

function submitQuiz() {
    const playerName = document.getElementById('player-name').value;
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quiz');
    const responses = Array.from(document.querySelectorAll('.question-section')).map(section => {
        const questionId = section.querySelector('p').textContent;
        const selectedOption = Array.from(section.querySelectorAll('input[type="radio"]:checked')).map(input => input.value);
        return { questionId, selectedOption };
    });

    if (quizId && playerName && responses.length > 0) {
        getDoc(doc(db, 'quizzes', quizId))
        .then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const questions = data.questions;
                const score = responses.reduce((totalScore, response) => {
                    const question = questions.find(q => q.questionId === response.questionId);
                    const isCorrect = question && response.selectedOption.includes(question.correctAnswer);
                    return totalScore + (isCorrect ? 4 : 0); // Scoring system (e.g., 4 points per correct answer)
                }, 0);

                updateDoc(doc(db, 'quizzes', quizId), {
                    results: arrayUnion({ name: playerName, score, responses })
                }).then(() => {
                    hideStatus();
                    showStatus(`Quiz submitted successfully! Your score: ${score}`, 'success');
                    displayResults(quizId);
                }).catch((error) => {
                    showStatus(`Failed to submit quiz: ${error.message}`, 'error');
                });
            } else {
                showStatus('Quiz not found.', 'error');
            }
        })
        .catch((error) => {
            showStatus(`Failed to load quiz: ${error.message}`, 'error');
        });
    } else {
        showStatus('Please enter your name and complete the quiz.', 'error');
    }
}

function displayResults(quizId) {
    getDoc(doc(db, 'quizzes', quizId))
    .then(docSnap => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const results = data.results || [];
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = results.map(result => `
                <p>${result.name}: ${result.score} points</p>
            `).join('');
        } else {
            showStatus('No results found.', 'error');
        }
    })
    .catch((error) => {
        showStatus(`Failed to load results: ${error.message}`, 'error');
    });
}

// On Page Load
const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('quiz');

if (quizId) {
    loadQuizQuestions(quizId);
} else {
    showStatus('No quiz ID found in URL.', 'error');
}
