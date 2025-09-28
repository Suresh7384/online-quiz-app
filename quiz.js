let flag = 0;
function fun() {
    if (flag === 0) {
        document.querySelector(".alart").textContent = "Wait for a while, your question is processing.";
        flag = 1;
    } else if (flag === 1) {
        document.querySelector(".alart").textContent = "";
        flag = 0;
    }
}

const topics = {
    Physics: ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics", "Modern Physics"],
    Chemistry: ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Biochemistry", "Analytical Chemistry"],
    Biology: ["Cell Biology", "Genetics", "Ecology", "Human Anatomy", "Evolution"]
};

const symbols = {
    Physics: '⚛️',
    Chemistry: '🧪',
    Biology: '🧬'
};

const themes = {
    Physics: { bg: 'bg-blue-50', button: 'bg-blue-500 hover:bg-blue-600', text: 'text-blue-800', progress: 'bg-blue-600' },
    Chemistry: { bg: 'bg-green-50', button: 'bg-green-500 hover:bg-green-600', text: 'text-green-800', progress: 'bg-green-600' },
    Biology: { bg: 'bg-red-50', button: 'bg-red-500 hover:bg-red-600', text: 'text-red-800', progress: 'bg-red-600' }
};

const subjectSelect = document.getElementById('subject');
const topicSelect = document.getElementById('topic');
const gradeSelect = document.getElementById('grade');
const startQuizBtn = document.getElementById('start-quiz');
const quizContainer = document.getElementById('quiz-container');
const questionsDiv = document.getElementById('questions');
const submitAnswerBtn = document.getElementById('submit-answer');
const skipQuestionBtn = document.getElementById('skip-question');
const resultsDiv = document.getElementById('results');
const scoreText = document.getElementById('score');
const anotherQuizBtn = document.getElementById('another-quiz');
const topicSelectionDiv = document.getElementById('topic-selection');
const gradeSelectionDiv = document.getElementById('grade-selection');
const timerDisplay = document.getElementById('timer');
const quizTitle = document.getElementById('quiz-title');
const progressBar = document.getElementById('progress-bar');

let quizData = [];
let userAnswers = [];
let currentQuestion = 0;
let score = 0;
let timeLeft = 30;
let timer;
let currentSubject = '';
let currentTheme = {};

// Populate topics based on subject
subjectSelect.addEventListener('change', () => {
    const subject = subjectSelect.value;
    topicSelect.innerHTML = '<option value="">Select a topic</option>';
    if (subject) {
        topics[subject].forEach(topic => {
            const option = document.createElement('option');
            option.value = topic;
            option.textContent = topic;
            topicSelect.appendChild(option);
        });
        topicSelectionDiv.classList.remove('hidden');
    } else {
        topicSelectionDiv.classList.add('hidden');
        gradeSelectionDiv.classList.add('hidden');
    }
});

// Show grade selection when topic is selected
topicSelect.addEventListener('change', () => {
    if (topicSelect.value) {
        gradeSelectionDiv.classList.remove('hidden');
    } else {
        gradeSelectionDiv.classList.add('hidden');
    }
});

// Start quiz and fetch questions
startQuizBtn.addEventListener('click', async () => {
    fun(); // Show processing message
    const subject = subjectSelect.value;
    const topic = topicSelect.value;
    const grade = gradeSelect.value;

    if (!subject || !topic || !grade) {
        alert('Please select a subject, topic, and grade level.');
        fun(); // Clear processing message
        return;
    }

    currentSubject = subject;
    currentTheme = themes[subject];
    applyTheme();

    try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": "AIzaSyC_6RPksAzBPGJmmTXo3M0f8davx9XZZQE"
    },
    body: JSON.stringify({
        contents: [
            {
                parts: [
                    {
                        text: `Generate 10 multiple-choice questions for ${subject}, topic: ${topic}, for ${grade} grade level. Each question should have 4 options and include the correct answer. Format the response as a JSON array of objects, each with "question", "options" (array of 4 strings), and "correctAnswer" (string).`
                    }
                ]
            }
        ]
    })
});


        const data = await response.json();
        let questions;
        try {
            questions = JSON.parse(data.candidates[0].content.parts[0].text);
        } catch (e) {
            questions = JSON.parse(data.candidates[0].content.parts[0].text.replace(/```json\n|\n```/g, ''));
        }

        quizData = questions;
        currentQuestion = 0;
        score = 0;
        userAnswers = [];
        quizTitle.textContent = `${symbols[subject]} ${subject} Quiz`;
        displayQuestion();
        startTimer();
        fun(); // Clear processing message
    } catch (error) {
        console.error('Error fetching questions:', error);
        alert('Failed to fetch questions. Please try again.');
        fun(); // Clear processing message
    }
});

// Apply subject-based theme
function applyTheme() {
    document.body.className = `bg-gray-100 font-sans min-h-screen flex items-center justify-center transition-colors duration-300 ${currentTheme.bg}`;
    startQuizBtn.className = `mt-4 ${currentTheme.button} text-white p-3 rounded w-full sm:text-sm transition-colors duration-200`;
    submitAnswerBtn.className = `flex-1 ${currentTheme.button} text-white p-3 rounded sm:text-sm transition-colors duration-200`;
    skipQuestionBtn.className = 'flex-1 bg-yellow-500 text-white p-3 rounded hover:bg-yellow-600 sm:text-sm transition-colors duration-200';
    anotherQuizBtn.className = `${currentTheme.button} text-white p-3 rounded w-full sm:text-sm transition-colors duration-200`;
    quizTitle.className = `text-xl font-semibold sm:text-lg ${currentTheme.text}`;
    scoreText.className = `text-lg sm:text-base font-bold text-center mb-6 ${currentTheme.text}`;
    progressBar.className = `${currentTheme.progress} h-2.5 rounded-full transition-width duration-300`;
}

// Start timer for each question
function startTimer() {
    clearInterval(timer);
    timeLeft = 30;
    timerDisplay.textContent = `Time Left: ${timeLeft}s`;
    timerDisplay.classList.remove('text-red-500', 'timer-low');
    timer = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `Time Left: ${timeLeft}s`;
        if (timeLeft <= 5) {
            timerDisplay.classList.add('text-red-500', 'timer-low');
        }
        if (timeLeft <= 0) {
            clearInterval(timer);
            nextQuestion(true); // Forced next due to timeout
        }
    }, 1000);
}

// Display current question
function displayQuestion() {
    if (currentQuestion < quizData.length) {
        const q = quizData[currentQuestion];
        questionsDiv.innerHTML = `
            <div class="question mb-4 p-4 bg-gray-50 rounded-lg shadow-sm">
                <p class="font-medium text-base sm:text-sm">${symbols[currentSubject]} Q${currentQuestion + 1}: ${q.question}</p>
                ${q.options.map((option, i) => `
                    <div class="option">
                        <input type="radio" name="q${currentQuestion}" value="${option}" id="opt${i}">
                        <label for="opt${i}" class="text-base sm:text-sm">${option}</label>
                    </div>
                `).join('')}
            </div>
        `;
        const progress = ((currentQuestion + 1) / quizData.length) * 100;
        progressBar.style.width = `${progress}%`;
        subjectSelect.parentElement.classList.add('hidden');
        topicSelectionDiv.classList.add('hidden');
        gradeSelectionDiv.classList.add('hidden');
        quizContainer.classList.remove('hidden');
    } else {
        endQuiz();
    }
}

// Move to next question
function nextQuestion(isForced = false) {
    const selected = document.querySelector(`input[name="q${currentQuestion}"]:checked`);
    if (!isForced && !selected) {
        alert('You have not selected any option');
        return;
    }
    if (selected) {
        userAnswers.push(selected.value);
        if (selected.value === quizData[currentQuestion].correctAnswer) {
            score++;
        }
    } else {
        userAnswers.push(null);
    }
    currentQuestion++;
    if (currentQuestion < quizData.length) {
        displayQuestion();
        startTimer();
    } else {
        endQuiz();
    }
}

// End quiz and show results
function endQuiz() {
    clearInterval(timer);
    scoreText.textContent = `Your score: ${score} out of ${quizData.length}`;
    quizContainer.classList.add('hidden');
    resultsDiv.classList.remove('hidden');
    timerDisplay.textContent = '';
}

// Submit answer and move to next question
submitAnswerBtn.addEventListener('click', () => {
    nextQuestion(false);
});

// Skip question
skipQuestionBtn.addEventListener('click', () => {
    nextQuestion(true);
});

// Start another quiz
anotherQuizBtn.addEventListener('click', () => {
    fun(); // Show processing message
    resultsDiv.classList.add('hidden');
    subjectSelect.value = '';
    topicSelect.value = '';
    gradeSelect.value = '';
    topicSelectionDiv.classList.add('hidden');
    gradeSelectionDiv.classList.add('hidden');
    subjectSelect.parentElement.classList.remove('hidden');
    document.body.className = 'bg-gray-100 font-sans min-h-screen flex items-center justify-center transition-colors duration-300';
    fun(); // Clear processing message
});
