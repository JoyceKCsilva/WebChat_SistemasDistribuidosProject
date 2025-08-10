// Teste simples das rotas de API
const fetch = require('node-fetch');

async function testAPI() {
  console.log("🧪 Testando rotas da API...");
  
  try {
    // Teste 1: Verificar se o servidor está respondendo
    console.log("\n1. Testando conexão com o servidor...");
    const healthCheck = await fetch('http://localhost:8080');
    console.log("Status:", healthCheck.status);
    
    // Teste 2: Verificar rota de login (para obter token)
    console.log("\n2. Testando rota de login...");
    const loginResponse = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass'
      })
    });
    console.log("Login status:", loginResponse.status);
    
    // Teste 3: Verificar se as rotas de room existem
    console.log("\n3. Testando rota de sala sem token (deve dar 401)...");
    const roomResponse = await fetch('http://localhost:8080/api/rooms/TEST123/leave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log("Room leave status:", roomResponse.status);
    
    const closeResponse = await fetch('http://localhost:8080/api/rooms/TEST123/close', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log("Room close status:", closeResponse.status);
    
  } catch (error) {
    console.error("❌ Erro no teste:", error.message);
  }
}

testAPI();
