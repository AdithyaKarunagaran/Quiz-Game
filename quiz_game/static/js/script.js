document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("overlay").style.display = "block";
    document.getElementById("quiz-container").style.display = "none";
    document.getElementById("end").style.display = "none";
});


function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}


function validatePhoneNumber(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
}


function validateUserData() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();

    if (!name) {
        alert("Name is required.");
        return false;
    }

    if (!validateEmail(email)) {
        alert("Please enter a valid email address.");
        return false;
    }

    if (!validatePhoneNumber(phone)) {
        alert("Please enter a valid 10-digit phone number.");
        return false;
    }
    return true;
}


function acceptUserData() {

    if (!validateUserData()) {
        return;
    }

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;

    registerUser(name, email, phone)

    document.getElementById("register").style.display = "none";
    document.getElementById("user-display-name").style.display = "block";
    document.getElementById("user-display-name").textContent = name + "!";
    document.getElementById("quiz-container").style.display = "block";
    document.getElementById("instructions").style.display = "block";
    document.getElementById("question-container").style.display = "none";
}


function acceptInstructions() {
    document.getElementById("instructions").style.display = "none";
    document.getElementById("question-container").style.display = "none";
    fetchQuestions();
}



let currentQuestionIndex = 0;
let score = 0;
let answers = [];
let timerInterval;
let timeLeft = 60;
let questions = [];
const url = 'http://127.0.0.1:8000/';

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


function updateAnswerIndicator() {
    let dropdown = document.getElementById("dropdown-status");
    dropdown.innerHTML = "";

    questions.forEach((question, index) => {
        let p = document.createElement("p");
        p.textContent = index + 1;

        if (answers[index] !== undefined && answers[index] !== -1) {
            p.className = "answered";
        }

        else if (answers[index] === -1) {
            if (index === currentQuestionIndex) {
                p.className = "current";
            } else {
                p.className = "unanswered";
            }
        }
        else {
            p.className = "upcoming";
        }

        dropdown.appendChild(p);
    });
}


let quizStarted = false;
let quizEnded = false;

function fetchQuestions() {
    document.getElementById("question-container").style.display = "block";
    document.getElementById("ref").style.display = "block";
    document.getElementById("timer").style.display = "block";

    fetch(url + "get_question/", {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    }).then(response => response.json())
    .then(data => {
        shuffleArray(data);
        questions = data;
        quizStarted = true;
        loadQuestion(0);
        updateAnswerIndicator();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to load questions.');
    });
}


function loadQuestion(index) {
    if (index >= questions.length) {
        submitQuiz();
        return;
    }
    currentQuestionIndex = index;
    const question = questions[index];

    if (answers[index] === undefined) {
        answers[index] = -1;
    }

    document.getElementById("question-text").textContent = question.question;
    document.getElementById("question-number").textContent = index + 1;
    const choicesList = document.getElementById("choices-list");
    choicesList.innerHTML = "";
    document.getElementById("next-button").style.display = 'none';
    question.choices.forEach((choice, i) => {
        const li = document.createElement("li");
        const input = document.createElement("input");
        input.type = "radio";
        input.id = "choice" + i;
        input.name = "choice";
        input.value = i;
        input.onclick = () => {
            answers[currentQuestionIndex] = i;
            document.getElementById("next-button").style.display = 'block';


            if (currentQuestionIndex === questions.length - 1) {
                document.getElementById("next-button").textContent = "Submit";
                document.getElementById("next-button").onclick = submitQuiz;
            }

            else {
                document.getElementById("next-button").textContent = "Next";
                document.getElementById("next-button").onclick = nextQuestion;
            }
        };
        const label = document.createElement("label");
        label.htmlFor = "choice" + i;
        label.textContent = choice;
        label.className = "radio-label";
        li.appendChild(input);
        li.appendChild(label);
        choicesList.appendChild(li);
    });
    resetTimer();
    updateAnswerIndicator();
}


function nextQuestion() {
    if (quizEnded) {
        return;
    }

    if (currentQuestionIndex < questions.length -1) {
        currentQuestionIndex++;
        loadQuestion(currentQuestionIndex);
    } else {
        quizEnded = true;
    }
}


document.addEventListener("visibilitychange", function() {
    if (document.visibilityState === 'hidden' && quizStarted && !quizEnded) {
        nextQuestion();
    }
});

function submitQuiz() {
    if (quizEnded) {
        return;
    }
    quizEnded = true
    clearInterval(timerInterval);
    score = answers.reduce((acc, answer, index) => {
        if (answer !== -1 && questions[index] && answer === questions[index].answer) {
            return acc + 1;
        }
        return acc;
    }, 0);

    console.log('Final Score:', score);

    const userEmail = document.getElementById("email").value;
    fetch('http://127.0.0.1:8000/quiz_submission/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            e_mail: userEmail,
            score: score
        })
    }).then(response => {
        if (!response.ok) throw Error('Failed to submit');
        return response.json();
    }).then(data => {
        console.log('Successfully submitted');
        document.getElementById("quiz-container").style.display = "none";
        document.getElementById("end").style.display = "block";
    }).catch(error => {
        console.error('Submission error:', error);
        alert('Submission failed, please try again.');
    });
}


function resetTimer() {
    clearInterval(timerInterval);
    timeLeft = 60;
    document.getElementById("timer").textContent = timeLeft + " s";
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById("timer").textContent = timeLeft + " s";
        if (timeLeft === 0) {
            clearInterval(timerInterval);
            if (currentQuestionIndex === questions.length - 1) {
                submitQuiz();
            } else {
                nextQuestion();
            }
        }
    }, 1000);
}


function registerUser(name, email, phone) {
    const data = {
        name: name,
        e_mail: email,
        ph_no: phone
    };

    fetch('http://127.0.0.1:8000/register/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        // alert(data.Message);
        if (data && data.Message === 'User already exists') {
            document.getElementById("user-welcome").textContent = "Welcome Back";
        } else {
            console.log("Received different message or no message");
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Failed to register');
    });
}



function changeAdminLogin() {
    document.getElementById("user-info-form").style.display = "none";
    document.getElementById("admin-details").style.display = "block";
}


function AdminLogin() {
    const id = document.getElementById("admin-id").value;
    const name = document.getElementById("admin-name").value;
    const password = document.getElementById("password").value;

    console.log(id, name, password);

    if (id === '' || name === '' || password === '') {
        alert("Please enter both ID, name, and password.");
        return;
    }

    fetch(url + "admin_login/", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: id,
            name: name,
            password: password
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.Message === "Admin authenticated") {
            fetch(url + "check_superior_admin/", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: id
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(superiorData => {
                if (superiorData.is_superior) {
                    document.getElementById("register").style.display = "none";
                    document.getElementById("admin-container").style.display = "block";
                    document.getElementById("question-container").style.display = "none";
                    document.getElementById("admin-display-name").textContent = name + " (Superior)!";
                    document.getElementById("manage-admins-button").style.display = "block";
                    document.getElementById("manage-requests").style.display = "block";
                } else {
                    document.getElementById("register").style.display = "none";
                    document.getElementById("admin-container").style.display = "block";
                    document.getElementById("question-container").style.display = "none";
                    document.getElementById("admin-display-name").textContent = name + "!";
                    document.getElementById("manage-admins-button").style.display = "none";
                    document.getElementById("manage-requests").style.display = "none"; 
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to authenticate admin.');
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (data.Message === "Incorrect details") {
            alert("Incorrect Details. Please check your username and password.");
        } else if (data.Message === "Admin with provided ID not found") {
            alert("Admin with provided ID not found.");
        } if (error.message === 'Network response was not ok') {
            alert('Failed to authenticate admin. Please check your network connection.');
        } 
    });
}


function updateQuestions() {
    document.getElementById("question-list-container").style.display = "block" ;
    document.getElementById("result-filter-container").style.display = "none" ;
    document.getElementById("admin-list-container").style.display = "none";
    fetchAndDisplayQuestions();
}

function fetchAndDisplayQuestions() {
    fetch(url + "get_questions/", {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        displayQuestions(data);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to load questions.');
    });
}

function displayQuestions(questions) {
    const questionListContainer = document.getElementById("question-list-container");

    questions.forEach((questionData, index) => {
        const questionBox = document.createElement("div");
        questionBox.classList.add("question-box");

        // Create and hide input for question ID
        const questionIdInput = document.createElement("input");
        questionIdInput.type = "hidden";
        questionIdInput.value = questionData.id;
        questionBox.appendChild(questionIdInput);

        // Create input field to question text
        const questionInput = document.createElement("textarea");
        questionInput.classList.add("question-text");
        questionInput.value = questionData.question;
        questionInput.disabled = true;
        questionBox.appendChild(questionInput);

        // Create input fields to choices
        questionData.choices.forEach((choice, choiceIndex) => {
            const choiceInput = document.createElement("input");
            choiceInput.type = "text";
            choiceInput.classList.add("choice-input");
            choiceInput.value = choice;
            choiceInput.disabled = true;
            questionBox.appendChild(choiceInput);
        });

        // Create input field to answer
        const answerInput = document.createElement("input");
        answerInput.type = "text";
        answerInput.classList.add("answer-input");
        answerInput.value = "Ans: " + (questionData.answer+1);
        answerInput.disabled = true;
        questionBox.appendChild(answerInput);

        // Create buttons for editing, saving, and deleting
        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("buttons");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.classList.add("edit-button");
        editButton.onclick = () => toggleEdit(questionBox, questionData.id);
        buttonContainer.appendChild(editButton);

        const saveButton = document.createElement("button");
        saveButton.textContent = "Save";
        saveButton.classList.add("save-button");
        saveButton.style.display = "none";
        saveButton.onclick = () => saveQuestion(questionBox, questionData.id);
        buttonContainer.appendChild(saveButton);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("delete-button");
        deleteButton.onclick = () => deleteQuestion(questionData.id);
        buttonContainer.appendChild(deleteButton);

        questionBox.appendChild(buttonContainer);
        questionListContainer.appendChild(questionBox);
    });

    questionListContainer.style.display = "block";
}

async function checkAdminAccess(adminId, requestType, questionBox = null, questionId = null) {
    try {
        const response = await fetch(url + `check_access/${adminId}/${requestType}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Check access response:', data);

        const status = data.status;
        
        if (status === 'approved') {
            if (requestType === 'edit_question') {
                if (questionBox) {
                    enableEditing(questionBox);
                } else if (questionId) {
                    performDeleteQuestion(questionId);
                }
            } else if (requestType === 'add_question') {
                performAddQuestion();
            }
        } else if (status === 'pending') {
            data.status = 'waiting';
            alert('Request raised, waiting for approval.');
        } else if (status === 'waiting') {
            alert('Waiting for approval.');
        } else if (status === 'denied') {
            alert('Access denied.');
        } else {
            alert('Unknown status.');
        }
    } catch (error) {
        console.error('Error checking admin access:', error);
        alert('Failed to check admin access. Please try again later.');
    }
}

function toggleEdit(questionBox, questionId) {
    const adminId = document.getElementById("admin-id").value;
    checkAdminAccess(adminId, 'edit_question', questionBox, questionId);
}

function deleteQuestion(questionId) {
    const adminId = document.getElementById("admin-id").value;
    checkAdminAccess(adminId, 'edit_question', null, questionId);
}

function addNewQuestion() {
    const adminId = document.getElementById("admin-id").value;
    checkAdminAccess(adminId, 'add_question');
}

// Function to enable editing
function enableEditing(questionBox, questions) {
    const inputs = questionBox.querySelectorAll(".question-text, .choice-input, .answer-input");
    const editButton = questionBox.querySelector(".edit-button");
    const saveButton = questionBox.querySelector(".save-button");

    const cancelButton = questionBox.querySelector(".delete-button");
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = () => cancelEditing(questionBox, questions);

    inputs.forEach(input => {
        input.disabled = !input.disabled;
    });

    editButton.style.display = "none"; // Hide edit button during editing
    saveButton.style.display = "block";
}

function cancelEditing(questionBox, questions) {
    // Ensure questionBox is defined and handle accordingly
    if (!questionBox) {
        console.error('No question box found.');
        return;
    }

    const inputs = questionBox.querySelectorAll(".question-text, .choice-input, .answer-input");
    const cancelButton = questionBox.querySelector(".delete-button");
    cancelButton.textContent = 'Delete';
    cancelButton.onclick = () => deleteQuestion(questionBox.querySelector('input[type="hidden"]').value); // Reassign delete function

    inputs.forEach(input => {
        input.disabled = true;
    });

    const editButton = questionBox.querySelector(".edit-button");
    editButton.style.display = "block";

    const saveButton = questionBox.querySelector(".save-button");
    saveButton.style.display = "none";
}

function saveQuestion(questionBox) {
    const questionIdInput = questionBox.querySelector("input[type='hidden']");
    const questionInput = questionBox.querySelector(".question-text");
    const choiceInputs = questionBox.querySelectorAll(".choice-input");
    const answerInput = questionBox.querySelector(".answer-input");
    let inputValue = answerInput.value;
    let match = inputValue.match(/\d+/);
    let extractedNumber = match ? parseInt(match[0]) : null;

    const questionData = {
        id: questionIdInput.value,
        question: questionInput.value.replace(/^Question no \d+: /, ''),
        choices: Array.from(choiceInputs).map(input => input.value),
        answer: extractedNumber-1
    };

    const updatedBy = document.getElementById("admin-name").value;

    if (confirm(`Do You Want to modify Question No: ${questionData.id}`)) {
        questionData.updated_by = updatedBy;

        fetch(url + "create_question/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(questionData)
        })
        .then(response => response.json())
        .then(data => {
            alert(data[0].Message);
            fetchAndDisplayQuestions();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to save question.');
        });
    }
}


function performDeleteQuestion(questionBox, questionId) {
    if (confirm("Are you sure you want to delete this question?")) {
        fetch(url + "delete_question/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: questionId })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.Message);
            questionBox.remove();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to delete question.');
        });
    }
}

// Function to perform add question action
function performAddQuestion() {
    document.getElementById("result-filter-container").style.display = "none";
    document.getElementById("result-container").style.display = "none";
    document.getElementById("question-list-container").style.display = "block";
    document.getElementById("admin-list-container").style.display = "none";


    const newQuestionBox = document.createElement("div");
    newQuestionBox.classList.add("question-box");

    const questionInput = document.createElement("textarea");
    questionInput.classList.add("question-text");
    questionInput.placeholder = "Enter new question";
    newQuestionBox.appendChild(questionInput);

    for (let i = 0; i < 4; i++) {
        const choiceInput = document.createElement("input");
        choiceInput.type = "text";
        choiceInput.classList.add("choice-input");
        choiceInput.placeholder = `Choice ${i}`;
        newQuestionBox.appendChild(choiceInput);
    }

    const answerInput = document.createElement("input");
    answerInput.type = "text";
    answerInput.classList.add("answer-input");
    answerInput.placeholder = "Enter the correct answer (0-3)";
    newQuestionBox.appendChild(answerInput);

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.classList.add("save-button");
    saveButton.onclick = () => {
        const questionData = {
            question: questionInput.value,
            choices: Array.from(newQuestionBox.querySelectorAll(".choice-input")).map(input => input.value),
            answer: answerInput.value-1
        };

        const createdBy = document.getElementById("admin-name").value;;

        if (confirm(`Please confirm to Add new Question`)){
            questionData.created_by = createdBy;

            fetch(url + "create_question/", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(questionData)
            })
            .then(response => response.json())
            .then(data => {
                alert(data[0].Message);
                fetchAndDisplayQuestions();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to save question.');
            });
        }
    };
    newQuestionBox.appendChild(saveButton);

    document.getElementById("question-list-container").appendChild(newQuestionBox);
}

function showResultFilter() {
    document.getElementById("result-filter-container").style.display = "block";
    document.getElementById("question-list-container").style.display = "none";
    document.getElementsByClassName("question-box").style.display = "none";
    document.getElementById("admin-list-container").style.display = "none";
}

function viewResults() {
    const resultDate = document.getElementById("result-date").value;
    if (!resultDate) {
        alert("Please select a date and time.");
        return;
    }

    const payload = {
        start_time: resultDate
    };

    fetch(url + "get_results/", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        displayResults(data);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to load results.');
    });
}

function displayResults(results) {
    const resultContainer = document.getElementById("result-container");
    const resultTableBody = document.getElementById("result-table").getElementsByTagName("tbody")[0];

    resultTableBody.innerHTML = '';

    results.forEach(result => {
        const row = resultTableBody.insertRow();
        row.insertCell(0).textContent = result.name;
        row.insertCell(1).textContent = result.quiz_attempts;
        row.insertCell(2).textContent = result.quiz_marks.join(', ');
        row.insertCell(3).textContent = result.e_mail;
        row.insertCell(4).textContent = result.ph_no;
    });

    resultContainer.style.display = "block";
}

async function viewRequests() {
    // Hide unnecessary containers
    document.getElementById("admin-list-container").style.display = "none";
    document.getElementById("result-filter-container").style.display = "none";
    document.getElementById("question-list-container").style.display = "none";
    document.getElementById("result-container").style.display = "none";

    try {
        const response = await fetch(url + 'view_requests/', {
            method: 'GET'
        });

        if (!response.ok) {
            const message = await response.json();
            alert(message.error || 'Failed to load requests.');
            return;
        }

        const requests = await response.json();
        displayRequests(requests);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load requests. Please try again later.');
    }
}

function displayRequests(requests) {
    const requestListContainer = document.getElementById("request-list-container");
    requestListContainer.innerHTML = '';  // Clear previous requests

    requests.forEach(request => {
        const requestBox = document.createElement("div");
        requestBox.classList.add("request-box");

        const requestText = document.createElement("p");
        requestText.textContent = `${request.admin_name} has requested to ${request.request_type.replace('_', ' ')}.`;
        requestBox.appendChild(requestText);

        const acceptButton = document.createElement("button");
        acceptButton.textContent = "Accept";
        acceptButton.onclick = () => manageRequest(request.admin_id, request.request_type, true);
        requestBox.appendChild(acceptButton);

        const declineButton = document.createElement("button");
        declineButton.textContent = "Deny";
        declineButton.onclick = () => manageRequest(request.admin_id, request.request_type, false);
        requestBox.appendChild(declineButton);

        requestListContainer.appendChild(requestBox);
    });

    requestListContainer.style.display = "block";  // Display the request list container
}

async function manageRequest(adminId, requestType, isAccepted) {
    const action = isAccepted ? 'accept' : 'deny';

    try {
        const response = await fetch(url + `${action}_request/${adminId}/${requestType}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        if (!response.ok) {
            const message = await response.json();
            alert(message.error || `Failed to ${action} request.`);
            return;
        }
        viewRequests();
    } catch (error) {
        console.error(`Error ${action}ing request:`, error);
        alert(`Failed to ${action} request. Please try again later.`);
    }
}

async function fetchAdmins() {
    document.getElementById("admin-list-container").style.display = "block";
    document.getElementById("result-filter-container").style.display = "none";
    document.getElementById("question-list-container").style.display = "none";
    document.getElementById("result-container").style.display = "none";
    document.getElementById("request-list-container").style.display = "none";

    try {
        const response = await fetch(url + 'fetch_admins/');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const admins = await response.json();
        displayAdmins(admins);
    } catch (error) {
        console.error('Error fetching admins:', error);
        alert('Failed to fetch admins. Please try again later.');
    }
}

function displayAdmins(admins) {
    const adminTableBody = document.getElementById('admin-table-body');
    adminTableBody.innerHTML = '';  // Clear previous admins

    admins.forEach(admin => {
        const adminRow = document.createElement('tr');
        adminRow.setAttribute('data-id', admin.id);

        const idTd = document.createElement('td');
        idTd.textContent = admin.id;
        adminRow.appendChild(idTd);

        const nameTd = document.createElement('td');
        const nameInput = document.createElement('input');
        nameInput.setAttribute('type', 'text');
        nameInput.setAttribute('value', admin.name);
        nameInput.disabled = true;
        nameTd.appendChild(nameInput);
        adminRow.appendChild(nameTd);

        const passwordTd = document.createElement('td');
        const passwordInput = document.createElement('input');
        passwordInput.setAttribute('type', 'text');
        passwordInput.setAttribute('value', admin.password);
        passwordInput.disabled = true;
        passwordTd.appendChild(passwordInput);
        adminRow.appendChild(passwordTd);

        const editCheckboxTd = document.createElement('td');
        const editCheckbox = document.createElement('input');
        editCheckbox.type = 'checkbox';
        editCheckbox.checked = admin.edit_question_status === 'approved'; // Ensure checkbox is checked if status is 'approved'
        editCheckbox.onclick = () => toggleEditCheckbox(admin.id, editCheckbox.checked); // Use onclick to handle checkbox click
        editCheckboxTd.appendChild(editCheckbox);
        adminRow.appendChild(editCheckboxTd);

        const addCheckboxTd = document.createElement('td');
        const addCheckbox = document.createElement('input');
        addCheckbox.type = 'checkbox';
        addCheckbox.checked = admin.add_question_status === 'approved'; // Ensure checkbox is checked if status is 'approved'
        addCheckbox.onclick = () => toggleAddCheckbox(admin.id, addCheckbox.checked); // Use onclick to handle checkbox click
        addCheckboxTd.appendChild(addCheckbox);
        adminRow.appendChild(addCheckboxTd);

        const actionsTd = document.createElement('td');
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.setAttribute('id', `Edit-Admin${admin.id}`);
        editButton.onclick = () => editAdmin(admin.id);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.setAttribute('id', `Delete-Admin${admin.id}`);
        deleteButton.onclick = () => deleteAdmin(admin.id);

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.style.display = 'none';
        saveButton.setAttribute('id', `saveAdmin${admin.id}`);
        saveButton.onclick = () => saveAdmin(admin.id);

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.style.display = 'none';
        cancelButton.setAttribute('id', `cancelAdmin${admin.id}`);
        cancelButton.onclick = () => cancelEdit(admin.id);

        actionsTd.appendChild(editButton);
        actionsTd.appendChild(deleteButton);
        actionsTd.appendChild(saveButton);
        actionsTd.appendChild(cancelButton);
        adminRow.appendChild(actionsTd);

        adminTableBody.appendChild(adminRow);
    });

    // Add form for creating a new admin
    const newRow = document.createElement('tr');

    const idTd = document.createElement('td');
    idTd.textContent = 'Auto';

    const nameTd = document.createElement('td');
    const nameInput = document.createElement('input');
    nameInput.setAttribute('type', 'text');
    nameInput.setAttribute('placeholder', 'Enter new admin name');
    nameInput.setAttribute('id', 'new-admin-name-input');
    nameTd.appendChild(nameInput);

    const passwordTd = document.createElement('td');
    const passwordInput = document.createElement('input');
    passwordInput.setAttribute('type', 'text');
    passwordInput.setAttribute('placeholder', 'Enter new admin password');
    passwordInput.setAttribute('id', 'new-admin-password-input');
    passwordTd.appendChild(passwordInput);

    const actionsTd = document.createElement('td');
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.addEventListener('click', saveNewAdmin);

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', cancelAddAdmin);

    actionsTd.appendChild(saveButton);
    actionsTd.appendChild(cancelButton);

    newRow.appendChild(idTd);
    newRow.appendChild(nameTd);
    newRow.appendChild(passwordTd);
    newRow.appendChild(actionsTd);

    adminTableBody.appendChild(newRow);
}

function addNewAdmin() {
    const adminTableBody = document.getElementById('admin-table-body');

    const newRow = document.createElement('tr');

    const idTd = document.createElement('td');
    idTd.textContent = 'Auto';

    const nameTd = document.createElement('td');
    const nameInput = document.createElement('input');
    nameInput.setAttribute('type', 'text');
    nameInput.setAttribute('placeholder', 'Enter new admin name');
    nameInput.setAttribute('id', 'new-admin-name-input');
    nameTd.appendChild(nameInput);

    const passwordTd = document.createElement('td');
    const passwordInput = document.createElement('input');
    passwordInput.setAttribute('type', 'password');
    passwordInput.setAttribute('placeholder', 'Enter new admin password');
    passwordInput.setAttribute('id', 'new-admin-password-input');
    passwordTd.appendChild(passwordInput);

    const actionsTd = document.createElement('td');
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.addEventListener('click', saveNewAdmin);

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.addEventListener('click', cancelAddAdmin);

    actionsTd.appendChild(saveButton);
    actionsTd.appendChild(cancelButton);

    newRow.appendChild(idTd);
    newRow.appendChild(nameTd);
    newRow.appendChild(passwordTd);
    newRow.appendChild(actionsTd);

    adminTableBody.appendChild(newRow);
}

function saveNewAdmin() {
    const newAdminName = document.getElementById('new-admin-name-input').value;
    const newAdminPassword = document.getElementById('new-admin-password-input').value;

    const formData = {
        name: newAdminName,
        password: newAdminPassword
    };

    fetch(url + 'new_admin/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.Message); // Optionally show a success message
        fetchAdmins(); // Hide the add admin form after successful addition
    })
    .catch(error => console.error('Error adding new admin:', error));
}

function cancelAddAdmin() {
    const adminTableBody = document.getElementById('admin-table-body');
    const newRow = document.querySelector('#admin-table-body tr:last-child');
    if (newRow) {
        adminTableBody.removeChild(newRow);
    }
    fetchAdmins();
}

function editAdmin(adminId) {
    let saveButton = document.getElementById(`saveAdmin${adminId}`);
    let cancelButton = document.getElementById(`cancelAdmin${adminId}`);
    let editButton = document.getElementById(`Edit-Admin${adminId}`);
    let deleteButton = document.getElementById(`Delete-Admin${adminId}`);

    if (editButton && deleteButton && saveButton && cancelButton) {
        saveButton.style.display = 'inline-block';
        cancelButton.style.display = 'inline-block';
        editButton.style.display = 'none';
        deleteButton.style.display = 'none';

        const adminRow = document.querySelector(`#admin-table-body tr[data-id="${adminId}"]`);
        if (adminRow) {
            adminRow.querySelectorAll('input[type="text"], input[type="password"]').forEach(input => {
                input.disabled = false;
            });
        }
    }
}

function saveAdmin(adminId) {
    const adminRow = document.querySelector(`#admin-table-body tr[data-id="${adminId}"]`);
    if (adminRow) {
        const editedAdminName = adminRow.querySelector('input[type="text"]').value;
        const editedAdminPassword = adminRow.querySelector('input[type="password"]').value;

        const formData = {
            id: adminId,
            name: editedAdminName,
            password: editedAdminPassword
        };

        fetch(url + `save_admin/${adminId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        })
        .then(response => response.json())
        .then(data => {
            alert(data.Message);
            fetchAdmins(); 
        })
        .catch(error => console.error('Error saving admin:', error));
    }
}

function cancelEdit(adminId) {
    fetchAdmins(); 
}

function deleteAdmin(adminId) {
    if (confirm('Are you sure you want to delete this admin?')) {
        fetch(url + `delete_admin/${adminId}/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            alert(data.message);
            fetchAdmins();
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
}


async function toggleEditCheckbox(adminId, isChecked) {
    try {
        const response = await fetch(`/update_permission/${adminId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ edit_question: isChecked })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

       
        const data = await response.json();
        console.log('Toggle Edit Checkbox Response:', data);

        
        const editCheckbox = document.getElementById(`editCheckbox-${adminId}`);
        if (editCheckbox) {
            editCheckbox.checked = data.request_type_status === 'approved';
        } else {
            console.error('Edit checkbox element not found:', adminId);
        }

    } catch (error) {
        console.error('Error toggling edit checkbox:', error);
        alert('Failed to toggle edit checkbox. Please try again later.');
    }
}

// Function to toggle add checkbox
async function toggleAddCheckbox(adminId, isChecked) {
    try {
        const response = await fetch(`/update_permission/${adminId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ add_question: isChecked })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Optionally handle success message or update UI
        const data = await response.json();
        console.log('Toggle Add Checkbox Response:', data);

        // Update the checkbox state in UI based on response
        const addCheckbox = document.getElementById(`addCheckbox-${adminId}`);
        if (addCheckbox) {
            addCheckbox.checked = data.request_type_status === 'approved';
        } else {
            console.error('Add checkbox element not found:', adminId);
        }

    } catch (error) {
        console.error('Error toggling add checkbox:', error);
        alert('Failed to toggle add checkbox. Please try again later.');
    }
}




function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

