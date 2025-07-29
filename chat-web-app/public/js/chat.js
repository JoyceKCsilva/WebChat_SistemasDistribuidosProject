const serverAddress = window.location.hostname;
const socket = new WebSocket(`ws://${serverAddress}:8080`);
const messagesContainer = document.getElementById('messages');
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send-btn'); 
const joinButton = document.getElementById('join-btn'); 
const loginOverlay = document.getElementById('login-overlay');
const userDisplay = document.getElementById('user-display');

let username = '';

socket.onopen = function() {
    console.log('Conectado ao servidor WebSocket');
};

socket.onmessage = function(event) {
    const messageData = JSON.parse(event.data);
    displayMessage(messageData.username, messageData.message);
};

joinButton.addEventListener('click', function() {
    username = usernameInput.value.trim();
    if (username) {

        loginOverlay.classList.add('hidden');

        userDisplay.textContent = username;

        messageInput.focus();
    }
});

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

usernameInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        joinButton.click();
    }
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (username && message) {
        const messageData = {
            username: username,
            message: message
        };
        socket.send(JSON.stringify(messageData));
        messageInput.value = '';
        messageInput.focus();
    }
}

function displayMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    if (sender === username) {
        messageElement.classList.add('sent');
    } else {
        messageElement.classList.add('received');
    }

    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    messageElement.innerHTML = `
        <div class="username">${sender}</div>
        <div class="content">${message}</div>
        <div class="time">${time}</div>
    `;

    messagesContainer.appendChild(messageElement);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}