function createParticles(count) {
  count = count || 30;
  var container = document.getElementById('particles');
  if (!container) return;
  for (var i = 0; i < count; i++) {
    var p = document.createElement('div');
    p.classList.add('particle');
    var size = Math.random() * 6 + 2;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = (Math.random() * 100) + '%';
    p.style.top = (Math.random() * 100) + '%';
    p.style.animationDelay = (Math.random() * 12) + 's';
    p.style.animationDuration = (12 + Math.random() * 15) + 's';
    container.appendChild(p);
  }
}

function showToast(msg, isError) {
  var existing = document.querySelector('.toast-msg');
  if (existing) existing.remove();
  var toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.textContent = msg;
  if (isError) {
    toast.style.background = '#C73B2B';
    toast.style.boxShadow = '0 4px 12px rgba(199, 59, 43, 0.2)';
  }
  document.body.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
  }, 2800);
}

function setButtonLoading(button, isLoading, loadingText) {
  if (isLoading) {
    button.disabled = true;
    button.style.opacity = '0.7';
    button.dataset.original = button.innerHTML;
    button.innerHTML = '<span class="loader"></span> ' + (loadingText || 'Carregando...');
  } else {
    button.disabled = false;
    button.style.opacity = '1';
    if (button.dataset.original) button.innerHTML = button.dataset.original;
  }
}

function getToken() {
  return localStorage.getItem('token');
}

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + getToken()
  };
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = 'login.html';
}
