createParticles(40);

var isTyping       = false;
var chatSessions   = [];
var currentSession = null;

var messagesContainer = document.getElementById('messagesContainer');
var chatInput         = document.getElementById('chatInput');
var sendBtn           = document.getElementById('sendBtn');
var clearChatBtn      = document.getElementById('clearChatBtn');
var newChatBtn        = document.getElementById('newChatBtn');
var sidebarToggleBtn  = document.getElementById('sidebarToggleBtn');
var chatSidebar       = document.getElementById('chatSidebar');
var historyListDiv    = document.getElementById('historyList');

function formatText(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+?)\*/g,  '<em>$1</em>')
    .replace(/`([^`]+?)`/g, '<code style="background:rgba(34,199,110,0.12);padding:1px 6px;border-radius:4px;font-family:monospace;font-size:0.8em">$1</code>')
    .replace(/^#{1,3} (.+)/gm, '<strong>$1</strong>')
    .replace(/^[•\-\*] (.+)/gm, '<li style="margin-left:1rem;margin-bottom:0.2rem">$1</li>')
    .replace(/^\d+\. (.+)/gm, '<li style="margin-left:1rem;margin-bottom:0.2rem">$1</li>')
    .replace(/\n/g, '<br>');
}

function appendMsg(role, text, animate) {
  var div = document.createElement('div');
  var cssRole = (role === 'assistant') ? 'bot' : role;
  div.className = 'message ' + cssRole + (animate ? ' new-msg' : '');
  div.innerHTML =
    '<div class="message-avatar ' + cssRole + '">' +
      '<i class="fas ' + (cssRole === 'bot' ? 'fa-leaf' : 'fa-user') + '"></i>' +
    '</div>' +
    '<div class="message-content">' +
      '<div class="message-name">' + (cssRole === 'bot' ? 'NutriAI Assistente' : 'Você') + '</div>' +
      '<div class="message-text">' + formatText(text) + '</div>' +
      '<div class="message-time">' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</div>' +
    '</div>';
  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function renderSession(session) {
  messagesContainer.innerHTML = '';
  if (!session) return;
  session.messages.forEach(function(m) { appendMsg(m.role, m.text, false); });
}

function showTyping() {
  var d = document.createElement('div');
  d.className = 'message bot';
  d.id = 'typingIndicator';
  d.innerHTML =
    '<div class="message-avatar bot"><i class="fas fa-leaf"></i></div>' +
    '<div class="message-content">' +
      '<div class="message-name">NutriAI Assistente</div>' +
      '<div class="typing-indicator"><span></span><span></span><span></span></div>' +
    '</div>';
  messagesContainer.appendChild(d);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTyping() {
  var el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

function addMessage(role, text) {
  if (!currentSession) return;
  currentSession.messages.push({ role: role, text: text });
  appendMsg(role, text, true);
}

function createSession(name, initialText) {
  var session = {
    id: Date.now(),
    name: name || ('Conversa ' + (chatSessions.length + 1)),
    messages: []
  };
  chatSessions.unshift(session);
  currentSession = session;
  messagesContainer.innerHTML = '';
  if (initialText) addMessage('bot', initialText);
  renderSidebar();
  return session;
}

function renderSidebar() {
  historyListDiv.innerHTML = '';
  chatSessions.forEach(function(s) {
    var item = document.createElement('div');
    item.className = 'history-item ' + (s.id === (currentSession && currentSession.id) ? 'active' : '');
    item.innerHTML = '<i class="fas fa-comment"></i> ' + s.name;
    item.addEventListener('click', function() {
      currentSession = s;
      renderSession(s);
      renderSidebar();
      if (window.innerWidth <= 768) chatSidebar.classList.remove('open');
    });
    historyListDiv.appendChild(item);
  });
}

function adjustHeight() {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
}

async function sendMessage() {
  var text = chatInput.value.trim();
  if (!text || isTyping) return;

  var token = localStorage.getItem('token');
  if (!token) {
    showToast('⚠️ Faça login para usar o chat!');
    setTimeout(function() { window.location.href = 'login.html'; }, 1500);
    return;
  }

  addMessage('user', text);
  chatInput.value = '';
  adjustHeight();
  isTyping = true;
  sendBtn.disabled = true;
  showTyping();

  try {
    var res = await fetch(API_BASE + '/chat/mensagem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ mensagem: text })
    });

    hideTyping();

    if (res.status === 401) {
      localStorage.removeItem('token');
      addMessage('bot', '⚠️ Sessão expirada. Por favor, faça login novamente.');
      showToast('Sessão expirada!');
      return;
    }

    if (!res.ok) {
      var err = await res.json().catch(function() { return {}; });
      throw new Error(err.detail || 'Erro ' + res.status);
    }

    var data = await res.json();
    if (!data.resposta) throw new Error('Resposta vazia do servidor');
    addMessage('bot', data.resposta);

  } catch (err) {
    hideTyping();
    addMessage('bot', '❌ ' + err.message + '. Verifique se o servidor está rodando em ' + API_BASE);
  } finally {
    isTyping = false;
    sendBtn.disabled = false;
    chatInput.focus();
  }
}

async function clearChat() {
  if (!confirm('Limpar toda a conversa com a IA?')) return;
  var token = localStorage.getItem('token');
  if (token) {
    try {
      await fetch(API_BASE + '/chat/limpar', {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token }
      });
    } catch(e) { console.warn('Não limpou no servidor:', e); }
  }
  if (currentSession) {
    currentSession.messages = [];
    messagesContainer.innerHTML = '';
    addMessage('bot', '💚 Conversa reiniciada! Como posso ajudar você hoje?');
  }
  showToast('Conversa limpa!');
}

async function loadHistoryFromServer() {
  var token = localStorage.getItem('token');
  if (!token) return false;

  try {
    var res = await fetch(API_BASE + '/chat/historico', {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if (!res.ok) return false;

    var mensagens = await res.json();
    if (!mensagens || mensagens.length === 0) return false;

    var session = {
      id: Date.now(),
      name: 'Conversa anterior',
      messages: mensagens.map(function(m) {
        return { role: m.role === 'assistant' ? 'bot' : m.role, text: m.content };
      })
    };
    chatSessions.unshift(session);
    currentSession = session;
    renderSession(session);
    renderSidebar();
    return true;

  } catch(e) {
    console.warn('Erro ao carregar histórico:', e);
    return false;
  }
}

sendBtn.setAttribute('type', 'button');

sendBtn.addEventListener('click', function(e) {
  e.preventDefault();
  e.stopPropagation();
  sendMessage();
});

chatInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

chatInput.addEventListener('input', adjustHeight);
clearChatBtn.addEventListener('click', clearChat);

newChatBtn.addEventListener('click', function() {
  createSession('Conversa ' + (chatSessions.length + 1), '✨ Nova conversa iniciada! Como posso ajudar?');
  showToast('Novo chat criado!');
  if (window.innerWidth <= 768) chatSidebar.classList.remove('open');
});

sidebarToggleBtn.addEventListener('click', function() { chatSidebar.classList.toggle('open'); });

document.querySelectorAll('.suggestion-chip').forEach(function(chip) {
  chip.addEventListener('click', function(e) {
    e.preventDefault();
    chatInput.value = chip.dataset.suggestion;
    adjustHeight();
    sendMessage();
  });
});

document.addEventListener('click', function(e) {
  if (window.innerWidth <= 768 && chatSidebar.classList.contains('open')) {
    if (!chatSidebar.contains(e.target) && !sidebarToggleBtn.contains(e.target)) {
      chatSidebar.classList.remove('open');
    }
  }
});

async function init() {
  adjustHeight();
  var carregou = await loadHistoryFromServer();
  if (!carregou) {
    createSession('Conversa atual',
      'Olá! 👋 Sou o assistente nutricional do NutriAI. Posso ajudar com:\n• 🥗 Recomendações alimentares personalizadas\n• 📊 Análise de macronutrientes\n• 💧 Dicas de hidratação e hábitos saudáveis\n• 🎯 Metas e progresso nutricional\n\nComo posso ajudar você hoje?'
    );
  }
}

init();
