const express = require('express'); // Adicionado Express
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer'); // Adicionado Multer
const cors = require('cors'); // Adicionado CORS
const path = require('path');
const fs = require('fs');

const app = express(); // Inicializa Express
const server = http.createServer(app); // Usa Express com o servidor HTTP
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 8080; // Boa prática usar process.env.PORT

// --- Configuração de CORS (com Express) ---
app.use(cors({
    origin: `http://localhost:${PORT}`,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- Serve arquivos estáticos do frontend (AJUSTE AQUI BASEADO NO SEU CÓDIGO FUNCIONANDO) ---
// Se seu código atual que funciona usa '../public', mantenha assim.
// Se sua pasta 'public' está dentro de 'chat-web-app', use '../chat-web-app/public'.
const frontendPublicPath = path.join(__dirname, '../public'); // CAMINHO AJUSTADO A PARTIR DO SEU CÓDIGO FUNCIONANDO
app.use(express.static(frontendPublicPath));
console.log(`Servindo arquivos estáticos do frontend de: ${frontendPublicPath}`);

// --- Configuração de Upload com Multer ---
const UPLOAD_DIR = path.join(__dirname, 'uploads'); // Pasta 'uploads' dentro de 'server/'
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
    console.log(`Diretório de upload criado: ${UPLOAD_DIR}`);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
        }
    }
});

// --- Endpoint REST para Upload de Imagens ---
app.post('/api/uploadImage', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo de imagem foi enviado.' });
        }

        // O remetente deve ser enviado no FormData do frontend
        const sender = req.body.sender; 
        if (!sender) {
            return res.status(400).json({ error: 'O nome do remetente (sender) é obrigatório para o upload da imagem.' });
        }

        const imageUrl = `/images/${req.file.filename}`; // URL pública para a imagem

        const chatMessage = {
            sender: sender,
            content: imageUrl,
            type: 'image',
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };

        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(chatMessage));
            }
        });

        res.status(200).json({ message: 'Imagem enviada e notificada no chat!', imageUrl: imageUrl });

    } catch (error) {
        console.error('Erro no upload da imagem:', error);
        res.status(500).json({ error: error.message || 'Erro interno do servidor ao fazer upload da imagem.' });
    }
});

// --- Servir arquivos estáticos da pasta 'uploads' (para as imagens) ---
app.use('/images', express.static(UPLOAD_DIR));

// --- Configuração do Servidor WebSocket ---
wss.on('connection', ws => {
    console.log('Cliente WebSocket conectado.');
    
    ws.on('message', message => {
        console.log(`Mensagem WebSocket recebida: ${message}`);
        try {
            const parsedMessage = JSON.parse(message);
            // Adiciona timestamp se não vier do cliente
            if (!parsedMessage.timestamp) {
                parsedMessage.timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            }

            // Broadcast da mensagem para todos os clientes conectados
            wss.clients.forEach(client => {
                // Envia para todos, incluindo o remetente (opcional, dependendo da UX)
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(parsedMessage));
                }
            });

        } catch (e) {
            console.error('Erro ao parsear mensagem WebSocket JSON:', e);
            ws.send(JSON.stringify({ type: 'error', content: 'Erro ao processar sua mensagem.' }));
        }
    });
    
    ws.on('close', () => {
        console.log('Cliente WebSocket desconectado.');
    });
    
    ws.on('error', error => {
        console.error('Erro WebSocket:', error);
    });
});

// Inicia o servidor HTTP e WebSocket na mesma porta
server.listen(PORT, '0.0.0.0', () => { // '0.0.0.0' permite conexões de qualquer interface de rede
    console.log(`Servidor Node.js rodando na porta ${PORT}`);
    console.log(`Frontend servido de: http://localhost:${PORT}/`);
    console.log(`Endpoint de upload: http://localhost:${PORT}/api/uploadImage`);
    console.log(`Servindo imagens de /uploads via http://localhost:${PORT}/images/`);
    console.log(`WebSocket em ws://localhost:${PORT}`);
});