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
            console.error('Sign up error:', error);
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
            console.error('Sign in error:', error);
            showStatus(`Sign in failed: ${error.message}`, 'error');
        });
};

window.saveName = function() {
    const user = auth.currentUser;
    const name = document.getElementById('name').value;
    if (user) {
        setDoc(doc(db, 'users', user.uid), { name, quizLinks: [] }, { merge: true })
            .then(() => {
                hideStatus();
                showElement('quiz-setup');
                initializeQuestions();
                showStatus('Name saved successfully! Please set up your quiz.', 'success');
            })
            .catch((error) => {
                console.error('Save name error:', error);
                showStatus(`Failed to save name: ${error.message}`, 'error');
            });
    } else {
        showStatus('User not authenticated.', 'error');
    }
};

function addQuestionSection(questionId, options) {
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
        <label>
            Correct Answer:
            <select name="${questionId}-correct">
                ${options.map(option => `<option value="${option}">${option}</option>`).join('')}
            </select>
        </label><br>
    `;
    questionSelectionDiv.appendChild(questionDiv);
}

function initializeQuestions() {
    const questions = [
        { id: 'Q1', options: ['Option 1.1', 'Option 1.2', 'Option 1.3', 'Option 1.4', 'Option 1.5'] },
        { id: 'Q2', options: ['Option 2.1', 'Option 2.2', 'Option 2.3', 'Option 2.4', 'Option 2.5'] },
        // Add more questions as needed
    ];
    questions.forEach(q => addQuestionSection(q.id, q.options));
}

window.generateLink = function() {
    const user = auth.currentUser;
    const selectedQuestions = Array.from(document.querySelectorAll('.question-section')).map(section => {
        const questionId = section.querySelector('p').textContent;
        const selectedOptions = Array.from(section.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
        const correctAnswer = section.querySelector(`select[name="${questionId}-correct"]`).value;
        return { questionId, selectedOptions, correctAnswer };
    });

    if (user && selectedQuestions.length > 0) {
        const quizId = Date.now().toString(); // Unique ID for the quiz
        setDoc(doc(db, 'quizzes', quizId), {
            questions: selectedQuestions,
            createdBy: user.uid,
            timestamp: serverTimestamp()
        }).then(() => {
            updateDoc(doc(db, 'users', user.uid), {
                quizLinks: arrayUnion(`quiz.html?quiz=${quizId}`)
            }).then(() => {
                hideStatus();
                showStatus(`Quiz link generated: <a href="quiz.html?quiz=${quizId}" target="_blank">Share this link</a>`, 'success');
            }).catch((error) => {
                console.error('Update user profile error:', error);
                showStatus(`Failed to update user profile: ${error.message}`, 'error');
            });
        }).catch((error) => {
            console.error('Create quiz error:', error);
            showStatus(`Failed to create quiz: ${error.message}`, 'error');
        });
    } else {
        showStatus('Please select at least one question and option.', 'error');
    }
};

window.submitQuiz = function() {
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
                    return totalScore + (isCorrect ? 4 : 0);
                }, 0);

                updateDoc(doc(db, 'quizzes', quizId), {
                    results: arrayUnion({ name: playerName, score, responses })
                }).then(() => {
                    hideStatus();
                    showStatus(`Quiz submitted successfully! Your score: ${score}`, 'success');
                    displayResults(quizId);
                }).catch((error) => {
                    console.error('Submit quiz error:', error);
                    showStatus(`Failed to submit quiz: ${error.message}`, 'error');
                });
            } else {
                showStatus('Quiz not found.', 'error');
            }
        })
        .catch((error) => {
            console.error('Load quiz error:', error);
            showStatus(`Failed to load quiz: ${error.message}`, 'error');
        });
    } else {
        showStatus('Please enter your name and complete the quiz.', 'error');
    }
};

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
        }
    })
    .catch((error) => {
        console.error('Display results error:', error);
        showStatus(`Failed to load results: ${error.message}`, 'error');
    });
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
        } else {
            showStatus('Quiz not found.', 'error');
        }
    })
    .catch((error) => {
        console.error('Load quiz questions error:', error);
        showStatus(`Failed to load quiz: ${error.message}`, 'error');
    });
}

window.showProfile = function() {
    const user = auth.currentUser;
    if (user) {
        getDoc(doc(db, 'users', user.uid))
        .then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const name = data.name;
                const quizLinks = data.quizLinks || [];
                document.getElementById('profile-info').innerHTML = `
                    <p>Name: ${name}</p>
                    <p>Quizzes:</p>
                    <ul>${quizLinks.map(link => `<li><a href="${link}" target="_blank">${link}</a></li>`).join('')}</ul>
                `;
                document.getElementById('profile-container').style.display = 'block';
            }
        })
        .catch((error) => {
            console.error('Show profile error:', error);
            showStatus(`Failed to load profile: ${error.message}`, 'error');
        });
    }
};

window.signOut = function() {
    firebaseSignOut(auth).then(() => {
        hideStatus();
        showElement('auth-container');
        showStatus('Signed out successfully!', 'success');
    }).catch((error) => {
        console.error('Sign out error:', error);
        showStatus(`Sign out failed: ${error.message}`, 'error');
    });
};

// On Page Load
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-container').style.display = 'none';
        const urlParams = new URLSearchParams(window.location.search);
        const quizId = urlParams.get('quiz');
        if (quizId) {
            loadQuizQuestions(quizId);
        } else {
            document.getElementById('signup-form').style.display = 'block';
            showProfile();
        }
    } else {
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('quiz-setup').style.display = 'none';
    }
});
