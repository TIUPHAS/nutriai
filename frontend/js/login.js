createParticles(25);

async function handleLogin(event) {
  event.preventDefault();

  var emailInput    = document.getElementById('emailInput');
  var passwordInput = document.getElementById('passwordInput');
  var rememberCheck = document.getElementById('rememberCheck');
  var loginBtn      = document.getElementById('loginBtn');

  var email    = emailInput.value.trim();
  var password = passwordInput.value.trim();

  if (!email || !password) {
    showToast('Por favor, preencha e-mail e senha.', true);
    return;
  }
  if (!email.includes('@') || email.length < 5) {
    showToast('Insira um e-mail válido.', true);
    return;
  }
  if (password.length < 6) {
    showToast('A senha deve ter no mínimo 6 caracteres.', true);
    return;
  }

  setButtonLoading(loginBtn, true, 'Validando...');

  try {
    var response = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, senha: password })
    });
    var data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      if (rememberCheck.checked) {
        localStorage.setItem('remember_email', email);
      } else {
        localStorage.removeItem('remember_email');
      }
      showToast('✅ Login bem-sucedido! Redirecionando...');
      setTimeout(function() { window.location.href = 'dashboard.html'; }, 1000);
    } else {
      showToast(data.detail || '❌ E-mail ou senha incorretos', true);
    }
  } catch (error) {
    console.error('Erro:', error);
    showToast('❌ Erro de conexão. Verifique se o backend está rodando.', true);
  } finally {
    setButtonLoading(loginBtn, false);
  }
}

function loadRememberedCredentials() {
  var savedEmail = localStorage.getItem('remember_email');
  if (savedEmail) {
    document.getElementById('emailInput').value    = savedEmail;
    document.getElementById('rememberCheck').checked = true;
  }
}

document.getElementById('forgotBtn').addEventListener('click', function(e) {
  e.preventDefault();
  showToast('🔐 Enviamos instruções de recuperação para seu e-mail cadastrado.');
});

document.getElementById('googleBtn').addEventListener('click', function() {
  showToast('🔐 Integração com Google em desenvolvimento. Use o formulário padrão.');
});

document.getElementById('appleBtn').addEventListener('click', function() {
  showToast('🍏 Login com Apple em breve. Acompanhe as novidades!');
});

document.getElementById('loginForm').addEventListener('submit', handleLogin);

loadRememberedCredentials();

document.querySelectorAll('.input-field').forEach(function(input) {
  input.addEventListener('focus', function() {
    input.parentElement.style.transform = 'scale(1.01)';
  });
  input.addEventListener('blur', function() {
    input.parentElement.style.transform = 'scale(1)';
  });
});
