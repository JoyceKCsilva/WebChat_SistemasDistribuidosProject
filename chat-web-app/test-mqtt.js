const mqtt = require('mqtt');

// Configuração de teste
const client = mqtt.connect('mqtt://localhost:1883', {
  clientId: 'test-client-' + Date.now(),
  clean: true
});

client.on('connect', () => {
  console.log('✅ Conectado ao broker MQTT para teste');
  
  // Subscrever a tópicos de teste
  const testTopics = [
    'forum/rooms/+/messages',
    'forum/rooms/+/users',
    'forum/system/events'
  ];
  
  testTopics.forEach(topic => {
    client.subscribe(topic, { qos: 1 }, (err) => {
      if (err) {
        console.error(`❌ Erro ao subscrever ${topic}:`, err);
      } else {
        console.log(`📡 Subscrito a: ${topic}`);
      }
    });
  });
  
  // Publicar mensagem de teste
  setTimeout(() => {
    const testMessage = {
      type: 'test',
      message: 'Teste de mensagem MQTT',
      timestamp: new Date().toISOString()
    };
    
    client.publish('forum/rooms/test123/messages', JSON.stringify(testMessage), { qos: 1 }, (err) => {
      if (err) {
        console.error('❌ Erro ao publicar mensagem de teste:', err);
      } else {
        console.log('📤 Mensagem de teste publicada');
      }
    });
  }, 2000);
});

client.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    console.log(`📥 Mensagem recebida em ${topic}:`, payload);
  } catch (error) {
    console.log(`📥 Mensagem recebida em ${topic}:`, message.toString());
  }
});

client.on('error', (error) => {
  console.error('❌ Erro MQTT:', error);
});

client.on('close', () => {
  console.log('🔌 Conexão MQTT fechada');
});

// Encerrar teste após 10 segundos
setTimeout(() => {
  console.log('🔄 Encerrando teste...');
  client.end();
  process.exit(0);
}, 10000);
