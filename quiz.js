import { initializeApp } from "https://www.gstatic.com/firebasejs/9.12.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.12.1/firebase-firestore.js";

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
                        ${q.options.map(option => `
                            <label>
                                <input type="checkbox" name="${q.questionId}" value="${option}">
                                ${option}
                            </label><br>
                        `).join('')}
                    `;
                    quizContainer.appendChild(questionDiv);
                });

                document.getElementById('quiz-container').style.display = 'block';
                loadResults(quizId); // Load results after loading questions
            } else {
                showStatus('Quiz not found.', 'error');
            }
        })
        .catch((error) => {
            showStatus(`Failed to load quiz: ${error.message}`, 'error');
        });
}

function loadResults(quizId) {
    getDoc(doc(db, 'quizzes', quizId))
        .then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const results = data.results || [];
                const resultsContainer = document.getElementById('quiz-results');
                resultsContainer.innerHTML = ''; // Clear previous content

                results.forEach(result => {
                    const resultDiv = document.createElement('div');
                    resultDiv.className = 'result-item';
                    resultDiv.innerHTML = `
                        <p>Name: ${result.name}</p>
                        <p>Score: ${result.score}</p>
                        <p>Date: ${new Date(result.timestamp.seconds * 1000).toLocaleString()}</p>
                        <hr>
                    `;
                    resultsContainer.appendChild(resultDiv);
                });

                document.getElementById('results-container').style.display = 'block';
            } else {
                showStatus('Results not found.', 'error');
            }
        })
        .catch((error) => {
            showStatus(`Failed to load results: ${error.message}`, 'error');
        });
}

window.submitQuiz = function() {
    const playerName = document.getElementById('player-name').value;
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quiz');
    const responses = Array.from(document.querySelectorAll('.question-section')).map(section => {
        const questionId = section.querySelector('p').textContent;
        const selectedOptions = Array.from(section.querySelectorAll('input[type="checkbox"]:checked')).map(input => input.value);
        return { questionId, selectedOptions };
    });

    if (quizId && playerName && responses.length > 0) {
        getDoc(doc(db, 'quizzes', quizId))
            .then(docSnap => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const questions = data.questions;
                    const correctAnswers = questions.reduce((acc, q) => {
                        acc[q.questionId] = q.correctAnswers;
                        return acc;
                    }, {});

                    let score = 0;
                    responses.forEach(response => {
                        const correct = correctAnswers[response.questionId] || [];
                        const correctSet = new Set(correct);
                        const responseSet = new Set(response.selectedOptions);
                        if ([...responseSet].every(option => correctSet.has(option)) &&
                            [...correctSet].every(option => responseSet.has(option))) {
                            score += 10; // 10 points per correct question
                        }
                    });

                    updateDoc(doc(db, 'quizzes', quizId), {
                        results: arrayUnion({
                            name: playerName,
                            score,
                            timestamp: serverTimestamp()
                        })
                    }).then(() => {
                        hideStatus();
                        showStatus(`Quiz submitted successfully! Your score: ${score}`, 'success');
                    }).catch((error) => {
                        showStatus(`Failed to submit quiz: ${error.message}`, 'error');
                    });
                } else {
                    showStatus('Quiz not found.', 'error');
                }
            });
    } else {
        showStatus('Please enter your name and complete the quiz.', 'error');
    }
};

// On Page Load
const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('quiz');

if (quizId) {
    loadQuizQuestions(quizId);
} else {
    showStatus('No quiz ID found in URL.', 'error');
}
