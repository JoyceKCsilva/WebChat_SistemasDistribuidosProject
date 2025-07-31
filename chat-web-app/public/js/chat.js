const serverAddress = window.location.hostname;
const socket = new WebSocket(`ws://${serverAddress}:8080`);
const messagesContainer = document.getElementById('messages');
const usernameInput = document.getElementById('username');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send-btn');
const joinButton = document.getElementById('join-btn');
const loginOverlay = document.getElementById('login-overlay');
const userDisplay = document.getElementById('user-display');
const imageUploadInput = document.getElementById('image-upload');

let username = '';

socket.onopen = function() {
    console.log('Conectado ao servidor WebSocket');
};

socket.onmessage = function(event) {
    const messageData = JSON.parse(event.data);
    displayMessage(messageData.sender, messageData.content, messageData.type, messageData.timestamp);
};

socket.onclose = function() {
    console.log('Desconectado do servidor WebSocket');
};

socket.onerror = function(error) {
    console.error('Erro no WebSocket:', error);
    alert('Ocorreu um erro na conexão com o chat. Por favor, tente novamente.');
};

function getCurrentTimestamp() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

joinButton.addEventListener('click', function() {
    username = usernameInput.value.trim();
    if (username) {
        loginOverlay.classList.add('hidden');
        userDisplay.textContent = `Você: ${username}`;
        messageInput.focus();

        const joinMessage = {
            sender: username,
            content: username + ' entrou no chat.',
            type: 'JOIN',
            timestamp: getCurrentTimestamp()
        };
        socket.send(JSON.stringify(joinMessage));
    } else {
        alert("Por favor, digite um nome de usuário para entrar no chat.");
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

imageUploadInput.addEventListener('change', handleImageUpload);

function sendMessage() {
    const message = messageInput.value.trim();
    if (username && message) {
        const messageData = {
            sender: username,
            content: message,
            type: 'text',
            timestamp: getCurrentTimestamp()
        };
        socket.send(JSON.stringify(messageData));
        messageInput.value = '';
        messageInput.focus();
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && username) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('sender', username);

        fetch(`http://${serverAddress}:8080/api/uploadImage`, {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Erro desconhecido no upload da imagem');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Imagem enviada com sucesso para o backend:', data.imageUrl);
            imageUploadInput.value = null;
        })
        .catch(error => {
            console.error('Erro ao enviar imagem:', error);
            alert(`Erro ao enviar imagem: ${error.message}`);
            imageUploadInput.value = null;
        });
    } else if (!username) {
        alert("Por favor, digite seu nome de usuário antes de enviar uma imagem.");
        imageUploadInput.value = null;
    }
}

function displayMessage(sender, content, type, timestamp) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    if (sender === username) {
        messageElement.classList.add('my-message');
    } else {
        messageElement.classList.add('other-message');
    }

    const usernameDiv = document.createElement('div');
    usernameDiv.classList.add('username');
    usernameDiv.textContent = sender;
    messageElement.appendChild(usernameDiv);

    if (type === 'image') {
        const imgElement = document.createElement('img');
        imgElement.src = `http://${serverAddress}:8080${content}`;
        imgElement.alt = "Imagem enviada";
        imgElement.addEventListener('click', () => {
            window.open(imgElement.src, '_blank');
        });
        messageElement.appendChild(imgElement);
    } else {
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('content');
        contentDiv.textContent = content;
        messageElement.appendChild(contentDiv);
    }

    const timeDiv = document.createElement('div');
    timeDiv.classList.add('time');
    timeDiv.textContent = timestamp;
    messageElement.appendChild(timeDiv);

    messagesContainer.appendChild(messageElement);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}