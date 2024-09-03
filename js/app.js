// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.12.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut as firebaseSignOut } from "https://www.gstatic.com/firebasejs/9.12.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp, collection } from "https://www.gstatic.com/firebasejs/9.12.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAAYFrQ4la9wDoFYF6IAauti_DBouzWlGM",
    authDomain: "friendship-checking.firebaseapp.com",
    projectId: "friendship-checking",
    storageBucket: "friendship-checking.appspot.com",
    messagingSenderId: "118314602222",
    appId: "1:118314602222:web:38a71de7c01442821aadff",
    measurementId: "G-8Q6PZYQSBW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Show Status Message
function showStatus(message, type = 'success') {
    const statusMessageDiv = document.getElementById('status-message');
    statusMessageDiv.textContent = message;
    statusMessageDiv.className = `status-message ${type}`;
    statusMessageDiv.style.display = 'block';
}

// Hide Status Message
function hideStatus() {
    document.getElementById('status-message').style.display = 'none';
}

// Sign Up Function
window.signUp = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
            hideStatus();
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('signup-form').style.display = 'block';
            showStatus('Sign up successful! Please enter your name.', 'success');
        })
        .catch((error) => {
            showStatus(`Sign up failed: ${error.message}`, 'error');
        });
};

// Sign In Function
window.signIn = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            hideStatus();
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('quiz-setup').style.display = 'block';
            showProfile();
            showStatus('Sign in successful!', 'success');
        })
        .catch((error) => {
            showStatus(`Sign in failed: ${error.message}`, 'error');
        });
};

// Save User Name
window.saveName = function() {
    const user = auth.currentUser;
    const name = document.getElementById('name').value;
    if (user) {
        setDoc(doc(db, 'users', user.uid), { name })
            .then(() => {
                hideStatus();
                document.getElementById('signup-form').style.display = 'none';
                document.getElementById('quiz-setup').style.display = 'block';
                showStatus('Name saved successfully!', 'success');
            })
            .catch((error) => {
                showStatus(`Failed to save name: ${error.message}`, 'error');
            });
    }
};

// Generate Quiz Link
window.generateLink = function() {
    const user = auth.currentUser;
    const name = document.getElementById('name').value;
    const selectedQuestions = Array.from(document.querySelectorAll('.question-section')).map(section => {
        const questionId = section.querySelector('p').textContent;
        const options = Array.from(section.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
        return { questionId, options };
    });

    const quizId = Date.now().toString();
    if (user) {
        setDoc(doc(db, 'quizzes', quizId), {
            owner: user.uid,
            creatorName: name,
            questions: selectedQuestions,
            createdAt: serverTimestamp()
        })
        .then(() => {
            const link = `${window.location.href}?quiz=${quizId}`;
            updateDoc(doc(db, 'users', user.uid), {
                quizLinks: arrayUnion(link)
            });
            hideStatus();
            alert(`Quiz link: ${link}`);
            showStatus('Quiz link generated successfully!', 'success');
        })
        .catch((error) => {
            showStatus(`Failed to generate quiz link: ${error.message}`, 'error');
        });
    }
};

// Submit Quiz
window.submitQuiz = function() {
    const playerName = document.getElementById('player-name').value;
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quiz');
    const responses = Array.from(document.querySelectorAll('input[type="radio"]:checked')).map(input => ({
        questionId: input.name,
        selectedOption: input.value
    }));

    if (quizId) {
        getDoc(doc(db, 'quizzes', quizId))
        .then(docSnap => {
            if (docSnap.exists()) {
                const score = Math.floor(Math.random() * 100); // Simplified scoring for demo purposes
                updateDoc(doc(db, 'quizzes', quizId), {
                    results: arrayUnion({ name: playerName, score, responses })
                });
                hideStatus();
                showStatus(`Quiz submitted successfully! Your score: ${score}`, 'success');
            } else {
                showStatus('Quiz not found.', 'error');
            }
        })
        .catch((error) => {
            showStatus(`Failed to submit quiz: ${error.message}`, 'error');
        });
    }
};

// Show Quiz Questions
function loadQuizQuestions(quizId) {
    getDoc(doc(db, 'quizzes', quizId))
    .then(docSnap => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const questions = data.questions;
            const quizContainer = document.getElementById('quiz-questions');
            quizContainer.innerHTML = ''; // Clear previous content

            questions.forEach((q, index) => {
                const questionDiv = document.createElement('div');
                questionDiv.innerHTML = `<p>${q.questionId}</p>`;
                q.options.forEach(option => {
                    questionDiv.innerHTML += `
                        <label>
                            <input type="radio" name="${q.questionId}" value="${option}">
                            ${option}
                        </label><br>
                    `;
                });
                quizContainer.appendChild(questionDiv);
            });

            document.getElementById('quiz-container').style.display = 'block';
        } else {
            showStatus('Quiz not found.', 'error');
        }
    })
    .catch((error) => {
        showStatus(`Failed to load quiz: ${error.message}`, 'error');
    });
}

// Show User Profile
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
            showStatus(`Failed to load profile: ${error.message}`, 'error');
        });
    }
};

// Sign Out Function
window.signOut = function() {
    firebaseSignOut(auth).then(() => {
        hideStatus();
        document.getElementById('profile-container').style.display = 'none';
        document.getElementById('auth-container').style.display = 'block';
        showStatus('Signed out successfully!', 'success');
    }).catch((error) => {
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
            document.getElementById('quiz-setup').style.display = 'block';
            showProfile();
        }
    } else {
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('quiz-setup').style.display = 'none';
        document.getElementById('quiz-container').style.display = 'none';
        document.getElementById('profile-container').style.display = 'none';
    }
});
