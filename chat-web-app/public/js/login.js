// Login page functionality
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkExistingAuth();
    }

    bindEvents() {
        // Form toggles
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.showForm('register');
        });

        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showForm('login');
        });

        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Password confirmation validation
        const passwordConfirm = document.getElementById('register-password-confirm');
        const password = document.getElementById('register-password');
        
        passwordConfirm.addEventListener('input', () => {
            if (passwordConfirm.value !== password.value) {
                passwordConfirm.setCustomValidity('As senhas não coincidem');
            } else {
                passwordConfirm.setCustomValidity('');
            }
        });
    }

    showForm(formType) {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (formType === 'register') {
            loginForm.classList.remove('active');
            registerForm.classList.add('active');
        } else {
            registerForm.classList.remove('active');
            loginForm.classList.add('active');
        }
        
        this.hideError();
    }

    async handleLogin() {
        const formData = new FormData(document.getElementById('loginForm'));
        const data = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        if (!data.username || !data.password) {
            this.showError('Por favor, preencha todos os campos');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                // Salvar token e informações do usuário
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('username', result.user.username);
                localStorage.setItem('displayName', result.user.display_name);
                
                // Redirecionar para a página principal
                window.location.href = '/';
            } else {
                this.showError(result.message || 'Erro ao fazer login');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            this.showError('Erro de conexão. Tente novamente.');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister() {
        const formData = new FormData(document.getElementById('registerForm'));
        const data = {
            username: formData.get('username'),
            email: formData.get('email'),
            displayName: formData.get('displayName'),
            password: formData.get('password'),
            passwordConfirm: formData.get('passwordConfirm')
        };

        // Validações básicas
        if (!data.username || !data.password || !data.passwordConfirm) {
            this.showError('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        if (data.password !== data.passwordConfirm) {
            this.showError('As senhas não coincidem');
            return;
        }

        if (data.password.length < 6) {
            this.showError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
            this.showError('Nome de usuário deve conter apenas letras, números e underscore');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: data.username,
                    email: data.email || null,
                    displayName: data.displayName || data.username,
                    password: data.password
                })
            });

            const result = await response.json();

            if (response.ok) {
                // Mostrar sucesso e redirecionar para login
                this.showSuccess('Conta criada com sucesso! Fazendo login...');
                
                setTimeout(() => {
                    // Auto-login após registro
                    this.autoLoginAfterRegister(data.username, data.password);
                }, 1500);
            } else {
                this.showError(result.message || 'Erro ao criar conta');
            }
        } catch (error) {
            console.error('Erro no registro:', error);
            this.showError('Erro de conexão. Tente novamente.');
        } finally {
            this.showLoading(false);
        }
    }

    async autoLoginAfterRegister(username, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('username', result.user.username);
                localStorage.setItem('displayName', result.user.display_name);
                window.location.href = '/';
            } else {
                this.showForm('login');
                this.showError('Conta criada! Por favor, faça login.');
            }
        } catch (error) {
            this.showForm('login');
            this.showError('Conta criada! Por favor, faça login.');
        }
    }

    checkExistingAuth() {
        const token = localStorage.getItem('authToken');
        if (token) {
            // Verificar se o token ainda é válido
            fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                if (response.ok) {
                    // Token válido, redirecionar para página principal
                    window.location.href = '/';
                } else {
                    // Token inválido, remover do storage
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('username');
                    localStorage.removeItem('displayName');
                }
            })
            .catch(() => {
                // Erro na verificação, remover token
                localStorage.removeItem('authToken');
                localStorage.removeItem('username');
                localStorage.removeItem('displayName');
            });
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const forms = document.querySelectorAll('.auth-form');
        
        if (show) {
            loading.classList.remove('hidden');
            forms.forEach(form => form.style.display = 'none');
        } else {
            loading.classList.add('hidden');
            forms.forEach(form => form.style.display = '');
            // Mostrar o formulário ativo novamente
            const activeForm = document.querySelector('.auth-form.active');
            if (activeForm) {
                activeForm.style.display = 'block';
            }
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        
        // Auto-hide após 5 segundos
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        const errorDiv = document.getElementById('error-message');
        errorDiv.classList.add('hidden');
    }

    showSuccess(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.className = 'success-message';
        
        // Auto-hide após 3 segundos
        setTimeout(() => {
            errorDiv.classList.add('hidden');
            errorDiv.className = 'error-message hidden';
        }, 3000);
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});
