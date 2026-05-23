var tmbAge     = document.getElementById('tmbAge');
var tmbWeight  = document.getElementById('tmbWeight');
var tmbHeight  = document.getElementById('tmbHeight');
var tmbGenderRadios = document.querySelectorAll('input[name="tmbGender"]');
var activityLevel   = document.getElementById('activityLevel');
var goalLevel       = document.getElementById('goalLevel');

var tmbValueSpan    = document.getElementById('tmbValue');
var getValueSpan    = document.getElementById('getValue');
var combinedResult  = document.getElementById('combinedResult');
var combinedTmbSpan = document.getElementById('combinedTmb');
var combinedGetSpan = document.getElementById('combinedGet');
var combinedGoalSpan= document.getElementById('combinedGoal');
var recText         = document.getElementById('recommendationText');

var HISTORY_KEY = 'nutriai_calc_history';
var MAX_HISTORY = 10;

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch(e) { return []; }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

var GOAL_LABELS = {
  perda_moderada: 'Perda moderada',
  perda_leve:     'Perda leve',
  manutencao:     'Manutenção',
  ganho_leve:     'Ganho leve',
  ganho_moderado: 'Ganho moderado',
};

var ACTIVITY_LABELS = {
  '1.2':   'Sedentário',
  '1.375': 'Lev. ativo',
  '1.55':  'Mod. ativo',
  '1.725': 'Muito ativo',
  '1.9':   'Extremo',
};

function addToHistory(dados, result) {
  var history = loadHistory();
  var entry = {
    id: Date.now(),
    date: new Date().toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
    tmb:  Math.round(result.tmb),
    get:  Math.round(result.get),
    meta: Math.round(result.meta_calorica),
    peso: dados.weight,
    altura: dados.height,
    idade: Math.round(dados.age),
    sexo: dados.gender,
    atividade: dados.activity,
    objetivo: dados.objetivo,
  };
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.pop();
  saveHistory(history);
  renderHistory();
}

function renderHistory() {
  var history = loadHistory();
  var section = document.getElementById('historySection');
  var list    = document.getElementById('historyList');

  if (history.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';
  list.innerHTML = history.map(function(e) {
    return '<div class="history-item">' +
      '<div class="history-date"><i class="fas fa-clock" style="margin-right:4px;"></i>' + e.date + '</div>' +
      '<div>' +
        '<div class="history-values">' +
          '<div class="history-val"><span>' + e.tmb + '</span><small>TMB</small></div>' +
          '<div class="history-val"><span>' + e.get + '</span><small>GET</small></div>' +
          '<div class="history-val"><span>' + e.meta + '</span><small>Meta</small></div>' +
        '</div>' +
        '<div class="history-params" style="margin-top:0.4rem;">' +
          '<b>' + e.peso + 'kg</b> · <b>' + e.altura + 'cm</b> · <b>' + e.idade + 'a</b> · ' + (e.sexo === 'masculino' ? '♂' : '♀') + ' · ' + (ACTIVITY_LABELS[String(e.atividade)] || e.atividade) + ' · ' + (GOAL_LABELS[e.objetivo] || e.objetivo) +
        '</div>' +
      '</div>' +
      '<button class="history-reuse-btn" onclick="reusarCalculo(' + e.id + ')"><i class="fas fa-rotate-left"></i> Reusar</button>' +
    '</div>';
  }).join('');
}

function reusarCalculo(id) {
  var entry = loadHistory().find(function(e) { return e.id === id; });
  if (!entry) return;

  tmbAge.value    = entry.idade;
  tmbWeight.value = entry.peso;
  tmbHeight.value = entry.altura;

  tmbGenderRadios.forEach(function(r) {
    r.checked = (r.value === (entry.sexo === 'masculino' ? 'male' : 'female'));
  });

  activityLevel.value = String(entry.atividade);

  var goalReverseMap = {
    perda_moderada: '0.85', perda_leve: '0.9', manutencao: '1', ganho_leve: '1.1', ganho_moderado: '1.15',
  };
  goalLevel.value = goalReverseMap[entry.objetivo] || '1';

  showToast('✅ Dados recarregados! Clique em Calcular para confirmar.');
}

function lerFormulario() {
  var age    = parseFloat(tmbAge.value);
  var weight = parseFloat(tmbWeight.value);
  var height = parseFloat(tmbHeight.value);

  var gender = 'feminino';
  tmbGenderRadios.forEach(function(r) {
    if (r.checked) gender = r.value === 'male' ? 'masculino' : 'feminino';
  });

  var activity = parseFloat(activityLevel.value);

  var goalMap = {
    '0.85': 'perda_moderada',
    '0.9':  'perda_leve',
    '1':    'manutencao',
    '1.1':  'ganho_leve',
    '1.15': 'ganho_moderado',
  };
  var objetivo = goalMap[goalLevel.value] || 'manutencao';

  return { age: age, weight: weight, height: height, gender: gender, activity: activity, objetivo: objetivo };
}

function validar(dados) {
  if (isNaN(dados.age)    || dados.age    <= 0) { showToast('⚠️ Informe uma idade válida.', true);   return false; }
  if (isNaN(dados.weight) || dados.weight <= 0) { showToast('⚠️ Informe um peso válido.', true);     return false; }
  if (isNaN(dados.height) || dados.height <= 0) { showToast('⚠️ Informe uma altura válida.', true);  return false; }
  return true;
}

async function calcular() {
  var dados = lerFormulario();
  if (!validar(dados)) return;

  document.getElementById('calcTmbBtn').disabled = true;
  document.getElementById('calcGetBtn').disabled = true;

  try {
    var token = localStorage.getItem('token');
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    var res = await fetch(API_BASE + '/calculator/get', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        peso:      dados.weight,
        altura:    dados.height,
        idade:     Math.round(dados.age),
        sexo:      dados.gender,
        atividade: dados.activity,
        objetivo:  dados.objetivo,
      })
    });

    if (!res.ok) {
      var err = await res.json().catch(function() { return {}; });
      throw new Error(err.detail || 'Erro ' + res.status);
    }

    var r = await res.json();

    tmbValueSpan.textContent     = Math.round(r.tmb);
    getValueSpan.textContent     = Math.round(r.get);
    combinedTmbSpan.textContent  = Math.round(r.tmb);
    combinedGetSpan.textContent  = Math.round(r.get);
    combinedGoalSpan.textContent = Math.round(r.meta_calorica);
    combinedResult.style.display = 'block';

    gerarRecomendacao(r.tmb, r.get, r.meta_calorica, dados.objetivo);

    localStorage.setItem('ultimaTMB',  Math.round(r.tmb));
    localStorage.setItem('ultimoGET',  Math.round(r.get));
    localStorage.setItem('ultimaMeta', Math.round(r.meta_calorica));

    addToHistory(dados, r);
    showToast('✅ Cálculo atualizado!');

  } catch (err) {
    showToast('❌ ' + err.message, true);
  } finally {
    document.getElementById('calcTmbBtn').disabled = false;
    document.getElementById('calcGetBtn').disabled = false;
  }
}

function gerarRecomendacao(tmb, get, meta, objetivo) {
  var nomes = {
    perda_moderada: 'perda de peso moderada',
    perda_leve:     'perda de peso leve',
    manutencao:     'manutenção do peso',
    ganho_leve:     'ganho muscular leve',
    ganho_moderado: 'ganho muscular moderado',
  };
  var nome = nomes[objetivo] || 'seu objetivo';
  var txt = '';

  if (objetivo.indexOf('perda') === 0) {
    var deficit = Math.round(get - meta);
    txt = '🎯 Para <strong>' + nome + '</strong>, consuma <strong>' + Math.round(meta) + ' kcal/dia</strong>. '
        + 'Isso representa um déficit de ' + deficit + ' kcal. '
        + '⚠️ Nunca consuma menos que sua TMB (' + Math.round(tmb) + ' kcal). Priorize proteínas e fibras.';
  } else if (objetivo === 'manutencao') {
    txt = '⚖️ Para <strong>' + nome + '</strong>, consuma <strong>' + Math.round(meta) + ' kcal/dia</strong>. '
        + 'Distribua entre 40% carboidratos, 30% proteínas e 30% gorduras.';
  } else {
    var surplus = Math.round(meta - get);
    txt = '💪 Para <strong>' + nome + '</strong>, consuma <strong>' + Math.round(meta) + ' kcal/dia</strong>. '
        + 'Superávit de ' + surplus + ' kcal. Priorize proteínas (1.6–2.2 g/kg) e treino de força.';
  }

  recText.innerHTML = txt;
}

document.getElementById('calcTmbBtn').addEventListener('click', calcular);
document.getElementById('calcGetBtn').addEventListener('click', calcular);

document.getElementById('clearHistoryBtn').addEventListener('click', function() {
  if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
    showToast('🗑️ Histórico apagado.');
  }
});

renderHistory();
