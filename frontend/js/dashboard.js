createParticles(40);

var token   = localStorage.getItem('token');
var usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

if (!token) window.location.href = 'login.html';

document.getElementById('userName').innerText = usuario.nome || 'Usuário';

var hoje = new Date();
var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
document.getElementById('currentDate').innerHTML = hoje.toLocaleDateString('pt-BR', options);

// ── Seletor de perfil ────────────────────────────────────────────────────────
var HISTORY_KEY = 'nutriai_calc_history';
var GOAL_LABELS = {
  perda_moderada: '🎯 Perda moderada', perda_leve: '🎯 Perda leve',
  manutencao: '⚖️ Manutenção', ganho_leve: '💪 Ganho leve', ganho_moderado: '💪 Ganho moderado',
};
var ACTIVITY_LABELS = {
  '1.2':'Sedentário','1.375':'Lev. ativo','1.55':'Mod. ativo','1.725':'Muito ativo','1.9':'Extremo',
};

var activeProfileId = null;

function loadCalcHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch (e) { return []; }
}

function updateProfileBar(entry) {
  var bar   = document.getElementById('profileSwitcherBar');
  var label = document.getElementById('psActiveLabel');
  if (!entry) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  label.innerHTML = '<span>' + Math.round(entry.meta) + ' kcal/dia</span> · ' + entry.peso + 'kg · ' + entry.altura + 'cm · ' + entry.idade + 'a · ' + (GOAL_LABELS[entry.objetivo] || entry.objetivo) + ' · <span style="color:var(--white-muted);font-size:0.72rem;">' + entry.date + '</span>';
}

function openProfileModal() {
  document.getElementById('psOverlay').classList.add('open');
  renderProfileModal();
}

function closeProfileModal() {
  document.getElementById('psOverlay').classList.remove('open');
}

function renderProfileModal() {
  var body    = document.getElementById('psModalBody');
  var history = loadCalcHistory();
  if (history.length === 0) {
    body.innerHTML = '<div class="ps-empty">Nenhum cálculo no histórico ainda.<br>Use a <a href="calculadora.html" style="color:var(--green-400);">Calculadora</a> para gerar perfis.</div>';
    return;
  }
  body.innerHTML = history.map(function(e) {
    return '<div class="ps-item ' + (e.id === activeProfileId ? 'active' : '') + '" onclick="applyProfile(' + e.id + ')">' +
      '<div class="ps-item-top">' +
        '<span class="ps-item-date">🕐 ' + e.date + '</span>' +
        '<span class="ps-item-badge">' + (GOAL_LABELS[e.objetivo] || e.objetivo) + '</span>' +
        (e.id === activeProfileId ? '<span class="ps-item-badge" style="background:rgba(61,214,140,0.2);border-color:var(--green-400);">✓ Ativo</span>' : '') +
      '</div>' +
      '<div class="ps-item-values">' +
        '<div class="ps-val"><span>' + e.tmb + '</span><small>TMB</small></div>' +
        '<div class="ps-val"><span>' + e.get + '</span><small>GET</small></div>' +
        '<div class="ps-val"><span>' + e.meta + '</span><small>Meta kcal</small></div>' +
      '</div>' +
      '<div class="ps-item-params"><b>' + e.peso + 'kg</b> · <b>' + e.altura + 'cm</b> · <b>' + e.idade + 'a</b> · ' + (e.sexo === 'masculino' ? '♂ Masc.' : '♀ Fem.') + ' · ' + (ACTIVITY_LABELS[String(e.atividade)] || e.atividade) + '</div>' +
    '</div>';
  }).join('');
}

async function applyProfile(id) {
  var history = loadCalcHistory();
  var entry   = history.find(function(e) { return e.id === id; });
  if (!entry) return;

  var body = document.getElementById('psModalBody');
  body.innerHTML = '<div class="ps-loading">⏳ Aplicando perfil e salvando no servidor...</div>';

  try {
    var res = await fetch(API_BASE + '/calculator/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({
        peso: entry.peso, altura: entry.altura, idade: entry.idade,
        sexo: entry.sexo, atividade: entry.atividade, objetivo: entry.objetivo,
      }),
    });

    if (!res.ok) {
      var err = await res.json().catch(function() { return {}; });
      throw new Error(err.detail || 'Erro ' + res.status);
    }

    var r = await res.json();

    document.getElementById('statTMB').innerText  = Math.round(r.tmb)           + ' kcal';
    document.getElementById('statGET').innerText  = Math.round(r.get)           + ' kcal';
    document.getElementById('statMeta').innerText = Math.round(r.meta_calorica) + ' kcal';
    var calMeta = document.getElementById('caloriasMeta');
    if (calMeta) calMeta.innerText = Math.round(r.meta_calorica);

    localStorage.setItem('ultimaMeta', Math.round(r.meta_calorica));

    activeProfileId = id;
    updateProfileBar(entry);
    closeProfileModal();
    showToast('✅ Perfil aplicado e salvo!');
  } catch (err) {
    showToast('❌ ' + err.message, true);
    renderProfileModal();
  }
}

document.getElementById('switchProfileBtn').addEventListener('click', openProfileModal);
document.getElementById('psClose').addEventListener('click', closeProfileModal);
document.getElementById('psOverlay').addEventListener('click', function(e) {
  if (e.target === document.getElementById('psOverlay')) closeProfileModal();
});

// ── Carregar dados da calculadora ────────────────────────────────────────────
async function carregarDadosCalculadora() {
  try {
    var res = await fetch(API_BASE + '/calculator/perfil', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.ok) {
      var data = await res.json();
      if (data.perfil) {
        var p = data.perfil;
        document.getElementById('statTMB').innerText  = Math.round(p.tmb)           + ' kcal';
        document.getElementById('statGET').innerText  = Math.round(p.get)           + ' kcal';
        document.getElementById('statMeta').innerText = Math.round(p.meta_calorica) + ' kcal';
        var calMeta = document.getElementById('caloriasMeta');
        if (calMeta) calMeta.innerText = Math.round(p.meta_calorica);

        var history = loadCalcHistory();
        var match = history.find(function(e) {
          return e.peso === p.peso && e.altura === p.altura &&
            e.idade === p.idade && e.sexo === p.sexo &&
            String(e.atividade) === String(p.atividade) && e.objetivo === p.objetivo;
        });
        if (match) { activeProfileId = match.id; updateProfileBar(match); }
        else if (history.length > 0) {
          updateProfileBar(null);
          document.getElementById('profileSwitcherBar').style.display = 'flex';
        }
        return;
      }
    }
  } catch(e) { console.warn('Perfil não disponível:', e); }

  document.getElementById('statTMB').innerHTML  = '<a href="calculadora.html" style="color:var(--green-400);">Calcular →</a>';
  document.getElementById('statGET').innerHTML  = '<a href="calculadora.html" style="color:var(--green-400);">Calcular →</a>';
  document.getElementById('statMeta').innerHTML = '<a href="calculadora.html" style="color:var(--green-400);">Calcular →</a>';

  var history = loadCalcHistory();
  if (history.length > 0) {
    document.getElementById('profileSwitcherBar').style.display = 'flex';
    document.getElementById('psActiveLabel').innerHTML = '<span style="color:var(--white-muted)">Nenhum perfil ativo — selecione um do histórico</span>';
  }
}

function calcularDiasJornada() {
  var dataCadastro = localStorage.getItem('dataCadastro');
  if (!dataCadastro) {
    dataCadastro = new Date().toISOString();
    localStorage.setItem('dataCadastro', dataCadastro);
  }
  var inicio   = new Date(dataCadastro);
  var hojeData = new Date();
  var diffTime = Math.abs(hojeData - inicio);
  var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  document.getElementById('statDias').innerText = diffDays;
  return diffDays;
}

var progressChart;
function criarGrafico() {
  var ctx = document.getElementById('progressChart').getContext('2d');
  progressChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
      datasets: [{
        label: 'Calorias consumidas',
        data: [1850, 1920, 1780, 2100, 1950, 2200, 1900],
        borderColor: '#22C76E',
        backgroundColor: 'rgba(34, 199, 110, 0.1)',
        tension: 0.4, fill: true,
        pointBackgroundColor: '#3DD68C', pointBorderColor: '#0D0F0E',
        pointBorderWidth: 2, pointRadius: 5
      }, {
        label: 'Meta calórica',
        data: [2000, 2000, 2000, 2000, 2000, 2000, 2000],
        borderColor: '#7A8B80', borderDash: [5, 5],
        fill: false, pointRadius: 0
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { labels: { color: '#B8C4BC', font: { family: "'DM Sans', sans-serif" } } } },
      scales: {
        y: { grid: { color: '#2A302C' }, ticks: { color: '#B8C4BC' } },
        x: { grid: { color: '#2A302C' }, ticks: { color: '#B8C4BC' } }
      }
    }
  });
}

function atualizarProgressoMeta() {
  var meta      = parseFloat(localStorage.getItem('ultimaMeta')) || 2000;
  var consumido = 1850;
  var percentual = (consumido / meta) * 100;
  document.getElementById('caloriasAtuais').innerText = consumido;
  document.getElementById('calorieProgress').style.width = Math.min(percentual, 100) + '%';
  var progressoSemana = 65;
  document.getElementById('weekProgress').innerText    = progressoSemana + '%';
  document.getElementById('weekProgressBar').style.width = progressoSemana + '%';
}

async function verDetalhesDieta(dietaId) {
  try {
    var response = await fetch(API_BASE + '/historico/' + dietaId, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (response.ok) {
      var dieta = await response.json();
      mostrarModalDieta(dieta);
    }
  } catch (error) { console.error('Erro:', error); }
}

function mostrarModalDieta(dieta) {
  var modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);z-index:1000;display:flex;align-items:center;justify-content:center;padding:2rem;';
  modal.innerHTML =
    '<div style="background:#181C1A;border-radius:24px;max-width:600px;width:100%;max-height:80vh;overflow-y:auto;padding:2rem;border:1px solid #2A302C;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">' +
        '<h2 style="color:#22C76E;">' + (dieta.titulo || 'Dieta') + '</h2>' +
        '<button onclick="this.closest(\'div\').parentElement.remove()" style="background:none;border:none;color:#C73B2B;font-size:1.5rem;cursor:pointer;">✕</button>' +
      '</div>' +
      '<p style="color:#7A8B80;margin-bottom:1rem;">📅 ' + new Date(dieta.data).toLocaleDateString('pt-BR') + ' | 🔥 ' + Math.round(dieta.calorias) + ' kcal</p>' +
      '<div style="color:#F4F7F5;line-height:1.6;white-space:pre-wrap;">' + dieta.dieta_gerada + '</div>' +
      '<button onclick="this.closest(\'div\').parentElement.remove()" style="background:#22C76E;border:none;padding:0.8rem;border-radius:12px;color:#0D0F0E;font-weight:600;margin-top:1rem;width:100%;cursor:pointer;">Fechar</button>' +
    '</div>';
  document.body.appendChild(modal);
}

async function deletarDieta(dietaId, elemento) {
  if (!confirm('Tem certeza que deseja excluir esta dieta?')) return;
  try {
    var response = await fetch(API_BASE + '/historico/' + dietaId, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (response.ok) {
      elemento.remove();
      showToast('🗑️ Dieta removida com sucesso');
    }
  } catch (error) { console.error('Erro:', error); }
}

async function carregarHistorico() {
  try {
    var response = await fetch(API_BASE + '/historico/listar', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (response.ok) {
      var dietas      = await response.json();
      var historyList = document.getElementById('historyList');
      if (dietas.length === 0) {
        historyList.innerHTML = '<div class="empty-state">🍽️ Nenhuma dieta registrada ainda.<br>Vá ao chat e peça uma dieta personalizada!</div>';
      } else {
        historyList.innerHTML = dietas.slice(0, 5).map(function(dieta) {
          return '<div class="history-item" data-id="' + dieta.id + '">' +
            '<div style="flex:1;">' +
              '<div class="history-date">📅 ' + new Date(dieta.data).toLocaleDateString('pt-BR') + '</div>' +
              '<div style="font-size:0.85rem;margin-top:0.3rem;">' + (dieta.titulo || 'Dieta personalizada') + '</div>' +
              '<div style="font-size:0.75rem;color:#7A8B80;margin-top:0.2rem;">' + dieta.dieta_gerada.substring(0, 60) + '...</div>' +
            '</div>' +
            '<div style="text-align:right;">' +
              '<div class="history-calories">' + Math.round(dieta.calorias) + ' kcal</div>' +
              '<div style="margin-top:0.5rem;">' +
                '<button onclick="verDetalhesDieta(' + dieta.id + ')" style="background:none;border:none;color:#3DD68C;cursor:pointer;font-size:0.7rem;">📖 Ver</button>' +
                '<button onclick="deletarDieta(' + dieta.id + ', this.parentElement.parentElement.parentElement)" style="background:none;border:none;color:#C73B2B;cursor:pointer;font-size:0.7rem;margin-left:0.5rem;">🗑️</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('');
      }
    }
  } catch (error) { console.log('Erro ao carregar histórico:', error); }
}

async function definirMeta() {
  var novaMeta = prompt('Qual sua meta calórica diária? (kcal)', localStorage.getItem('ultimaMeta') || '2000');
  if (novaMeta && !isNaN(novaMeta)) {
    localStorage.setItem('ultimaMeta', novaMeta);
    await carregarDadosCalculadora();
    atualizarProgressoMeta();
    showToast('✅ Meta atualizada com sucesso!');
  }
}

function verHistoricoCompleto() {
  window.location.href = 'historico.html';
}

// ── Inicialização ────────────────────────────────────────────────────────────
(async function() {
  await carregarDadosCalculadora();
  calcularDiasJornada();
  criarGrafico();
  atualizarProgressoMeta();
  carregarHistorico();
})();
