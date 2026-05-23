createParticles(30);

var passwordInput = document.getElementById('password');
var bar1 = document.getElementById('bar1');
var bar2 = document.getElementById('bar2');
var bar3 = document.getElementById('bar3');
var strengthText = document.getElementById('strengthText');

function checkPasswordStrength(pwd) {
  var strength = 0;
  if (pwd.length >= 6) strength++;
  if (pwd.length >= 10) strength++;
  if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) strength++;
  else if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) strength = Math.min(strength, 2);

  var colors = ['#2A302C', '#C73B2B', '#E6A017', '#22C76E'];
  var texts  = ['Muito fraca', 'Fraca', 'Média', 'Forte'];
  var val = Math.min(strength, 3);
  [bar1, bar2, bar3].forEach(function(bar, idx) {
    bar.style.background = idx <= val ? colors[val] : '#2A302C';
  });
  strengthText.textContent = texts[val];
  return val;
}

passwordInput.addEventListener('input', function(e) {
  checkPasswordStrength(e.target.value);
});

var form = document.getElementById('registerForm');
var registerBtn = document.getElementById('registerBtn');

form.addEventListener('submit', async function(e) {
  e.preventDefault();

  var fullName   = document.getElementById('fullName').value.trim();
  var email      = document.getElementById('email').value.trim();
  var password   = document.getElementById('password').value;
  var confirmPwd = document.getElementById('confirmPassword').value;
  var termsAccepted = document.getElementById('termsCheck').checked;

  if (!fullName || fullName.length < 3) {
    showToast('Por favor, insira seu nome completo.', true);
    return;
  }
  if (!email || !email.includes('@') || email.length < 5) {
    showToast('Insira um e-mail válido.', true);
    return;
  }
  if (password.length < 6) {
    showToast('A senha deve ter pelo menos 6 caracteres.', true);
    return;
  }
  if (password !== confirmPwd) {
    showToast('As senhas não coincidem.', true);
    return;
  }
  if (!termsAccepted) {
    showToast('Você precisa aceitar os Termos de Uso.', true);
    return;
  }
  var strength = checkPasswordStrength(password);
  if (strength < 1) {
    showToast('Crie uma senha mais segura (mínimo 6 caracteres).', true);
    return;
  }

  setButtonLoading(registerBtn, true, 'Criando conta...');

  try {
    var response = await fetch(API_BASE + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: fullName, email: email, senha: password })
    });
    var data = await response.json();

    if (response.ok) {
      showToast('🎉 Conta criada com sucesso! Redirecionando para login...');
      form.reset();
      document.getElementById('termsCheck').checked = false;
      setTimeout(function() { window.location.href = 'login.html'; }, 2000);
    } else {
      showToast(data.detail || '❌ Erro ao criar conta. Tente outro e-mail.', true);
    }
  } catch (error) {
    console.error('Erro:', error);
    showToast('❌ Erro de conexão. Verifique se o backend está rodando.', true);
  } finally {
    setButtonLoading(registerBtn, false);
  }
});

document.getElementById('termsLink').addEventListener('click', function(e) {
  e.preventDefault();
  showToast('📜 Termos de Uso: Transparência, segurança e compromisso com sua saúde.');
});

document.getElementById('privacyLink').addEventListener('click', function(e) {
  e.preventDefault();
  showToast('🔒 Seus dados são protegidos. Política de privacidade NutriAI.');
});

document.getElementById('googleRegisterBtn').addEventListener('click', function() {
  showToast('🔐 Cadastro com Google em breve. Use o formulário!');
});

document.getElementById('appleRegisterBtn').addEventListener('click', function() {
  showToast('🍏 Cadastro com Apple em desenvolvimento.');
});
