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

function signUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('signup-form').style.display = 'block';
        })
        .catch(error => console.error(error.message));
}

function signIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            document.getElementById('auth-container').style.display = 'none';
            document.getElementById('quiz-container').style.display = 'block';
        })
        .catch(error => console.error(error.message));
}

function saveName() {
    const user = auth.currentUser;
    const name = document.getElementById('name').value;
    if (user) {
        db.collection('users').doc(user.uid).set({ name })
            .then(() => {
                document.getElementById('signup-form').style.display = 'none';
                document.getElementById('quiz-container').style.display = 'block';
            })
            .catch(error => console.error(error.message));
    }
}

function generateLink() {
    const user = auth.currentUser;
    const selectedQuestions = Array.from(document.getElementById('question-select').selectedOptions).map(option => option.value);
    const quizId = Date.now().toString();
    if (user) {
        db.collection('quizzes').doc(quizId).set({
            owner: user.uid,
            questions: selectedQuestions
        })
        .then(() => {
            const link = `${window.location.href}?quiz=${quizId}`;
            db.collection('users').doc(user.uid).update({
                quizLinks: firebase.firestore.FieldValue.arrayUnion(link)
            });
            alert(`Quiz link: ${link}`);
        })
        .catch(error => console.error(error.message));
    }
}

function submitQuiz() {
    const playerName = document.getElementById('player-name').value;
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quiz');
    if (quizId) {
        db.collection('quizzes').doc(quizId).get()
        .then(doc => {
            if (doc.exists) {
                const questions = doc.data().questions;
                // Logic to handle questions and calculate score
                // For now, just display a success message
                alert('Quiz submitted successfully!');
                // Save result
                db.collection('quizzes').doc(quizId).update({
                    results: firebase.firestore.FieldValue.arrayUnion({ name: playerName, score: Math.floor(Math.random() * 100) })
                });
            } else {
                alert('Quiz not found.');
            }
        })
        .catch(error => console.error(error.message));
    }
}
