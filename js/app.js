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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Sign Up Function
function signUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('signup-form').style.display = 'block';
        })
        .catch(error => {
            handleError(error);
        });
}

// Sign In Function
function signIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('quiz-container').style.display = 'block';
            showProfile();
        })
        .catch(error => {
            handleError(error);
        });
}

// Save User Name
function saveName() {
    const user = auth.currentUser;
    const name = document.getElementById('name').value;
    if (user) {
        db.collection('users').doc(user.uid).set({ name })
            .then(() => {
                document.getElementById('signup-form').style.display = 'none';
                document.getElementById('quiz-container').style.display = 'block';
            })
            .catch(error => {
                handleError(error);
            });
    }
}

// Generate Quiz Link
function generateLink() {
    const user = auth.currentUser;
    const selectedQuestions = Array.from(document.getElementById('question-select').selectedOptions).map(option => option.value);
    const quizId = Date.now().toString();
    if (user) {
        db.collection('quizzes').doc(quizId).set({
            owner: user.uid,
            questions: selectedQuestions,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            const link = `${window.location.href}?quiz=${quizId}`;
            db.collection('users').doc(user.uid).update({
                quizLinks: firebase.firestore.FieldValue.arrayUnion(link)
            });
            alert(`Quiz link: ${link}`);
        })
        .catch(error => {
            handleError(error);
        });
    }
}

// Submit Quiz
function submitQuiz() {
    const playerName = document.getElementById('player-name').value;
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quiz');
    if (quizId) {
        db.collection('quizzes').doc(quizId).get()
        .then(doc => {
            if (doc.exists) {
                // Simulate quiz completion
                const score = Math.floor(Math.random() * 100);
                db.collection('quizzes').doc(quizId).update({
                    results: firebase.firestore.FieldValue.arrayUnion({ name: playerName, score })
                });
                alert(`Quiz submitted successfully! Your score: ${score}`);
            } else {
                alert('Quiz not found.');
            }
        })
        .catch(error => {
            handleError(error);
        });
    }
}

// Show User Profile
function showProfile() {
    const user = auth.currentUser;
    if (user) {
        db.collection('users').doc(user.uid).get()
        .then(doc => {
            if (doc.exists) {
                const name = doc.data().name;
                const quizLinks = doc.data().quizLinks || [];
                document.getElementById('profile-info').innerHTML = `
                    <p>Name: ${name}</p>
                    <p>Quizzes:</p>
                    <ul>${quizLinks.map(link => `<li><a href="${link}" target="_blank">${link}</a></li>`).join('')}</ul>
                `;
                document.getElementById('profile-container').style.display = 'block';
            }
        })
        .catch(error => {
            handleError(error);
        });
    }
}

// Sign Out Function
function signOut() {
    auth.signOut().then(() => {
        document.getElementById('profile-container').style.display = 'none';
        document.getElementById('auth-container').style.display = 'block';
    }).catch(error => {
        handleError(error);
    });
}

// Real-time Listener for Quiz Results
function listenForResults(quizId) {
    db.collection('quizzes').doc(quizId).onSnapshot(doc => {
        if (doc.exists) {
            const results = doc.data().results || [];
            console.log('Real-time results:', results);
        }
    });
}

// Handle Errors
function handleError(error) {
    console.error('Error:', error.message);
    alert(`An error occurred: ${error.message}`);
}

// On Page Load
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('quiz-container').style.display = 'block';
        showProfile();
    } else {
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('quiz-container').style.display = 'none';
        document.getElementById('profile-container').style.display = 'none';
    }
});
