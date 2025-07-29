const socket = new WebSocket('ws://localhost:3000');

const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');
const messageList = document.getElementById('messages');
const usernameForm = document.getElementById('username-form');
const messageForm = document.getElementById('message-form');

let username;

socket.addEventListener('open', () => {
    console.log('Conectado ao servidor WebSocket');
});

socket.addEventListener('message', (event) => {
    const messageData = JSON.parse(event.data);
    displayMessage(messageData.username, messageData.message);
});

function displayMessage(user, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.style.backgroundColor = '#262229';
    messageElement.innerHTML = `<strong style="color: #2776D6;">${user}:</strong> <span style="color: #F5F5F5;">${message}</span>`;
    messageList.appendChild(messageElement);
}

usernameForm.addEventListener('submit', (event) => {
    event.preventDefault();
    username = usernameInput.value;
    usernameForm.style.display = 'none';
    messageForm.style.display = 'block';
});

messageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = messageInput.value;
    socket.send(JSON.stringify({ username, message }));
    messageInput.value = '';
});