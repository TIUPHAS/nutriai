var meals = [];
var currentDate = new Date();

var dailyGoals = {
  calories: 2000,
  protein:  120,
  carbs:    250,
  fat:       65,
};

var currentTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

var weeklyCaloriesData = [0, 0, 0, 0, 0, 0, 0];
var weeklyLabels       = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

var mealsContainer = document.getElementById('mealsContainer');
var alertContainer = document.getElementById('alertContainer');

function toISODate(d) {
  return d.toISOString().split('T')[0];
}

async function loadUserProfile() {
  var token = localStorage.getItem('token');
  if (!token) return;
  try {
    var res = await fetch(API_BASE + '/calculator/perfil', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return;
    var data = await res.json();
    if (data.perfil) {
      var p = data.perfil;
      dailyGoals = {
        calories: Math.round(p.meta_calorica  || dailyGoals.calories),
        protein:  Math.round(p.meta_proteina  || dailyGoals.protein),
        carbs:    Math.round(p.meta_carbo     || dailyGoals.carbs),
        fat:      Math.round(p.meta_gordura   || dailyGoals.fat),
      };
      document.getElementById('caloriesGoal').innerText = dailyGoals.calories;
      document.getElementById('proteinGoal').innerText  = dailyGoals.protein;
      document.getElementById('carbsGoal').innerText    = dailyGoals.carbs;
      document.getElementById('fatGoal').innerText      = dailyGoals.fat;

      var objetivoMap = {
        perda_leve:     '🎯 Perda leve',
        perda_moderada: '🎯 Perda moderada',
        manutencao:     '⚖️ Manutenção',
        ganho_leve:     '💪 Ganho leve',
        ganho_moderado: '💪 Ganho moderado',
      };
      var badgeEl = document.getElementById('goalBadge');
      if (badgeEl && p.objetivo) {
        badgeEl.textContent = objetivoMap[p.objetivo] || p.objetivo;
        badgeEl.style.display = 'inline-block';
      }

      var history = loadCalcHistory();
      var match = history.find(function(e) {
        return e.peso === p.peso && e.altura === p.altura &&
          e.idade === p.idade && e.sexo === p.sexo &&
          String(e.atividade) === String(p.atividade) && e.objetivo === p.objetivo;
      });
      if (match) { activeProfileId = match.id; updateProfileBar(match); }
      else if (history.length > 0) {
        document.getElementById('profileSwitcherBar').style.display = 'flex';
        document.getElementById('psActiveLabel').innerHTML = '<span style="color:var(--white-muted)">Perfil atual do servidor · clique para trocar</span>';
      }
    }
  } catch (e) {
    console.warn('Não foi possível carregar o perfil:', e);
  }

  var history = loadCalcHistory();
  if (history.length > 0 && document.getElementById('profileSwitcherBar').style.display === 'none') {
    document.getElementById('profileSwitcherBar').style.display = 'flex';
  }
}

function updateDateDisplay() {
  var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('currentDate').innerText =
    currentDate.toLocaleDateString('pt-BR', options);
  loadMealsForDate();
  loadWeeklyData();
}

async function loadMealsForDate() {
  var token = localStorage.getItem('token');
  if (!token) { meals = []; renderAll(); return; }
  var dateKey = toISODate(currentDate);
  try {
    var res = await fetch(API_BASE + '/diario/dia/' + dateKey, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.ok) {
      var data = await res.json();
      meals = data.refeicoes.map(function(r) {
        return {
          id:       r.id,
          name:     r.nome,
          protein:  r.proteina,
          carbs:    r.carbo,
          fat:      r.gordura,
          calories: r.calorias,
          category: r.categoria,
          date:     dateKey,
        };
      });
    } else {
      meals = [];
    }
  } catch (e) {
    console.warn('Erro ao carregar diário:', e);
    meals = [];
  }
  renderAll();
}

async function loadWeeklyData() {
  var token = localStorage.getItem('token');
  if (!token) return;

  var d = new Date(currentDate);
  var day = d.getDay();
  var diffToMonday = (day === 0) ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  var dataInicio = toISODate(d);

  weeklyLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  try {
    var res = await fetch(
      API_BASE + '/diario/semana?data_inicio=' + dataInicio,
      { headers: { 'Authorization': 'Bearer ' + token } }
    );
    if (res.ok) {
      var dados = await res.json();
      weeklyCaloriesData = dados.map(function(item) { return item.calorias; });
      updateCharts();
    }
  } catch (e) {
    console.warn('Erro ao carregar semana:', e);
  }
}

function renderAll() {
  calculateTotals();
  renderMeals();
  updateMacroCards();
  updateAlerts();
  updateCharts();
}

function calculateTotals() {
  currentTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  meals.forEach(function(meal) {
    currentTotals.protein  += meal.protein;
    currentTotals.carbs    += meal.carbs;
    currentTotals.fat      += meal.fat;
    currentTotals.calories += meal.calories;
  });
  currentTotals.calories = Math.round(currentTotals.calories * 10) / 10;
  currentTotals.protein  = Math.round(currentTotals.protein  * 10) / 10;
  currentTotals.carbs    = Math.round(currentTotals.carbs    * 10) / 10;
  currentTotals.fat      = Math.round(currentTotals.fat      * 10) / 10;
}

function updateMacroCards() {
  var calPerc   = Math.min((currentTotals.calories / dailyGoals.calories) * 100, 100);
  var protPerc  = Math.min((currentTotals.protein  / dailyGoals.protein)  * 100, 100);
  var carbsPerc = Math.min((currentTotals.carbs    / dailyGoals.carbs)    * 100, 100);
  var fatPerc   = Math.min((currentTotals.fat      / dailyGoals.fat)      * 100, 100);

  document.getElementById('caloriesValue').innerText = Math.round(currentTotals.calories);
  document.getElementById('proteinValue').innerText  = currentTotals.protein;
  document.getElementById('carbsValue').innerText    = currentTotals.carbs;
  document.getElementById('fatValue').innerText      = currentTotals.fat;

  document.getElementById('caloriesFill').style.width = calPerc + '%';
  document.getElementById('proteinFill').style.width  = protPerc + '%';
  document.getElementById('carbsFill').style.width    = carbsPerc + '%';
  document.getElementById('fatFill').style.width      = fatPerc + '%';

  var calElement = document.getElementById('caloriesValue');
  calElement.style.color = currentTotals.calories > dailyGoals.calories
    ? 'var(--orange-warning)' : 'var(--white)';
}

var searchTimeout;
document.getElementById('foodName').addEventListener('input', function(e) {
  clearTimeout(searchTimeout);
  var query = e.target.value.trim();
  if (query.length < 2) {
    document.getElementById('suggestions').style.display = 'none';
    return;
  }
  searchTimeout = setTimeout(async function() {
    var token = localStorage.getItem('token');
    try {
      var res = await fetch(
        API_BASE + '/alimento/buscar?q=' + encodeURIComponent(query),
        { headers: { 'Authorization': 'Bearer ' + token } }
      );
      if (res.ok) {
        var alimentos = await res.json();
        var suggestionsDiv = document.getElementById('suggestions');
        if (alimentos.length === 0) { suggestionsDiv.style.display = 'none'; return; }
        suggestionsDiv.innerHTML = alimentos.map(function(a) {
          return '<div class="suggestion-item" onclick="selectFood(\'' + escapeHtml(a.nome) + '\')">' +
            escapeHtml(a.nome) + ' — ' + a.calorias + ' kcal/100g' +
          '</div>';
        }).join('');
        suggestionsDiv.style.display = 'block';
      }
    } catch (e) {
      console.error('Erro ao buscar alimentos:', e);
    }
  }, 300);
});

document.addEventListener('click', function(e) {
  if (!e.target.closest('.autocomplete-wrapper')) {
    document.getElementById('suggestions').style.display = 'none';
  }
});

window.selectFood = function(nome) {
  document.getElementById('foodName').value = nome;
  document.getElementById('suggestions').style.display = 'none';
  document.getElementById('calculateBtn').click();
};

function renderMeals() {
  if (meals.length === 0) {
    mealsContainer.innerHTML =
      '<div class="empty-state" style="text-align:center;padding:3rem;color:var(--white-muted);">' +
        '<div style="font-size:2rem;margin-bottom:1rem;">🍽️</div>' +
        '<p>Nenhuma refeição registrada hoje.</p>' +
        '<p style="font-size:0.85rem;margin-top:0.5rem;">Use o formulário ao lado para adicionar!</p>' +
      '</div>';
    return;
  }

  var categories = {
    cafe:       '☕ Café da Manhã',
    almoco:     '🍲 Almoço',
    cafe_tarde: '🍎 Café da Tarde',
    jantar:     '🌙 Jantar',
    lanche:     '🥪 Lanche',
    outro:      '🍽️ Outros',
  };

  var grouped = {};
  meals.forEach(function(meal) {
    var cat = meal.category || 'outro';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(meal);
  });

  var html = '';
  var order = ['cafe', 'almoco', 'cafe_tarde', 'lanche', 'jantar', 'outro'];
  var sortedKeys = Object.keys(grouped).sort(function(a, b) {
    return order.indexOf(a) - order.indexOf(b);
  });

  for (var i = 0; i < sortedKeys.length; i++) {
    var cat = sortedKeys[i];
    var catMeals = grouped[cat];
    html +=
      '<div style="padding:0.8rem 1.5rem;background:var(--black-surface);border-bottom:1px solid var(--black-border);">' +
        '<span style="font-weight:600;color:var(--green-400);">' + (categories[cat] || cat) + '</span>' +
      '</div>';
    catMeals.forEach(function(meal) {
      html +=
        '<div class="meal-item">' +
          '<div class="meal-info">' +
            '<span class="meal-name">' + escapeHtml(meal.name) + '</span>' +
            '<div class="meal-nutrients">' +
              '<span>🥩 <strong>' + meal.protein + 'g</strong> prot</span>' +
              '<span>🍚 <strong>' + meal.carbs + 'g</strong> carb</span>' +
              '<span>🫙 <strong>' + meal.fat + 'g</strong> gord</span>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:1rem;">' +
            '<span style="font-family:var(--font-head);font-size:1.1rem;font-weight:600;color:var(--green-400);">' +
              Math.round(meal.calories) + ' kcal' +
            '</span>' +
            '<button class="delete-meal" onclick="deleteMeal(' + meal.id + ')" title="Remover">✕</button>' +
          '</div>' +
        '</div>';
    });
  }
  mealsContainer.innerHTML = html;
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(String(text)));
  return div.innerHTML;
}

var calculatedMacros = null;

document.getElementById('calculateBtn').addEventListener('click', async function() {
  var foodName = document.getElementById('foodName').value.trim();
  var weight   = parseFloat(document.getElementById('foodWeight').value);
  if (!foodName || !(weight > 0)) {
    showToast('Preencha o alimento e um peso válido', true);
    return;
  }
  var token = localStorage.getItem('token');
  try {
    var res = await fetch(API_BASE + '/alimento/calcular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ nome: foodName, peso: weight }),
    });
    if (!res.ok) {
      var err = await res.json().catch(function() { return {}; });
      throw new Error(err.detail || 'Alimento não encontrado');
    }
    var data = await res.json();
    calculatedMacros = {
      name:     data.nome,
      weight:   weight,
      protein:  data.proteina,
      carbs:    data.carbo,
      fat:      data.gordura,
      calories: data.calorias,
    };
    document.getElementById('resultName').textContent     = calculatedMacros.name;
    document.getElementById('resultWeight').textContent   = calculatedMacros.weight;
    document.getElementById('resultProtein').textContent  = calculatedMacros.protein.toFixed(1);
    document.getElementById('resultCarbs').textContent    = calculatedMacros.carbs.toFixed(1);
    document.getElementById('resultFat').textContent      = calculatedMacros.fat.toFixed(1);
    document.getElementById('resultCalories').textContent = Math.round(calculatedMacros.calories);
    document.getElementById('calcResult').style.display = 'block';
  } catch (e) {
    showToast('❌ ' + e.message, true);
  }
});

document.getElementById('confirmAddBtn').addEventListener('click', async function() {
  if (!calculatedMacros) return;
  var category = document.getElementById('mealCategory').value;
  var dateKey  = toISODate(currentDate);
  var token    = localStorage.getItem('token');
  try {
    var res = await fetch(API_BASE + '/diario/adicionar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({
        nome:      calculatedMacros.name,
        proteina:  calculatedMacros.protein,
        carbo:     calculatedMacros.carbs,
        gordura:   calculatedMacros.fat,
        calorias:  calculatedMacros.calories,
        categoria: category,
        data:      dateKey,
      }),
    });
    if (!res.ok) throw new Error('Erro ao salvar');
    document.getElementById('foodName').value           = '';
    document.getElementById('foodWeight').value         = '100';
    document.getElementById('calcResult').style.display = 'none';
    calculatedMacros = null;
    await loadMealsForDate();
    await loadWeeklyData();
    showToast('✅ Refeição adicionada!');
  } catch (e) {
    showToast('❌ ' + e.message, true);
  }
});

window.deleteMeal = async function(id) {
  var token = localStorage.getItem('token');
  if (!token) return;
  try {
    var res = await fetch(API_BASE + '/diario/refeicao/' + id, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token },
    });
    if (res.ok || res.status === 404) {
      await loadMealsForDate();
      await loadWeeklyData();
      showToast('🗑️ Refeição removida');
    } else {
      showToast('❌ Erro ao remover refeição', true);
    }
  } catch (e) {
    showToast('❌ Erro de conexão', true);
  }
};

function updateAlerts() {
  var alerts = [];
  if (currentTotals.calories > dailyGoals.calories) {
    alerts.push('⚠️ Você ultrapassou sua meta em ' + Math.round(currentTotals.calories - dailyGoals.calories) + ' kcal.');
  } else if (currentTotals.calories < dailyGoals.calories * 0.7 && meals.length > 0) {
    alerts.push('🥗 Você está abaixo da meta calórica. Considere uma refeição nutritiva!');
  }
  if (currentTotals.protein < dailyGoals.protein * 0.8 && meals.length > 0) {
    alerts.push('💪 Proteína abaixo da meta! Invista em frango, ovos ou leguminosas.');
  }
  if (currentTotals.carbs > dailyGoals.carbs * 1.1) {
    alerts.push('🍚 Carboidratos acima do recomendado. Priorize carboidratos complexos.');
  }
  if (alerts.length === 0 && meals.length > 0) {
    alerts.push('🎉 Parabéns! Você está dentro das metas nutricionais hoje!');
  } else if (meals.length === 0) {
    alerts.push('📝 Comece a registrar suas refeições para acompanhar seus macros!');
  }
  alertContainer.innerHTML = alerts.map(function(alert) {
    return '<div class="alert-card">' +
      '<div class="alert-icon">' + (alert.startsWith('⚠️') ? '⚠️' : alert.startsWith('🎉') ? '🎉' : '💡') + '</div>' +
      '<div class="alert-text">' + alert + '</div>' +
    '</div>';
  }).join('');
}

var macrosChart, weeklyChart;

function updateCharts() {
  var ctxMacros = document.getElementById('macrosChart').getContext('2d');
  if (macrosChart) macrosChart.destroy();
  macrosChart = new Chart(ctxMacros, {
    type: 'doughnut',
    data: {
      labels: ['Proteínas (g)', 'Carboidratos (g)', 'Gorduras (g)'],
      datasets: [{
        data: [currentTotals.protein, currentTotals.carbs, currentTotals.fat],
        backgroundColor: ['#22C76E', '#E6A017', '#C73B2B'],
        borderColor: 'transparent',
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#B8C4BC' } } },
    },
  });

  var ctxWeekly = document.getElementById('weeklyChart').getContext('2d');
  if (weeklyChart) weeklyChart.destroy();

  var todayStr = toISODate(new Date());
  var d = new Date(currentDate);
  var dayOfWeek = d.getDay();
  var diffToMonday = (dayOfWeek === 0) ? -6 : 1 - dayOfWeek;
  var monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  var weekDates = Array.from({ length: 7 }, function(_, i) {
    var dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return toISODate(dt);
  });
  var pointColors = weekDates.map(function(dt) {
    return dt === todayStr ? '#3DD68C' : 'rgba(61,214,140,0.4)';
  });
  var pointRadius = weekDates.map(function(dt) {
    return dt === todayStr ? 6 : 4;
  });

  weeklyChart = new Chart(ctxWeekly, {
    type: 'line',
    data: {
      labels: weeklyLabels,
      datasets: [{
        label: 'Calorias (kcal)',
        data: weeklyCaloriesData,
        borderColor: '#22C76E',
        backgroundColor: 'rgba(34,199,110,0.05)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: pointColors,
        pointRadius: pointRadius,
      }, {
        label: 'Meta',
        data: Array(7).fill(dailyGoals.calories),
        borderColor: 'rgba(230,160,23,0.4)',
        borderDash: [6, 3],
        pointRadius: 0,
        fill: false,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#B8C4BC' } } },
      scales: {
        y: { grid: { color: '#2A302C' }, ticks: { color: '#7A8B80' }, beginAtZero: true },
        x: { ticks: { color: '#7A8B80' } },
      },
    },
  });
}

document.getElementById('prevDayBtn').addEventListener('click', function() {
  currentDate.setDate(currentDate.getDate() - 1);
  updateDateDisplay();
});

document.getElementById('nextDayBtn').addEventListener('click', function() {
  if (currentDate.toDateString() === new Date().toDateString()) {
    showToast('Você não pode ir para o futuro!', true);
    return;
  }
  currentDate.setDate(currentDate.getDate() + 1);
  updateDateDisplay();
});

document.getElementById('foodName').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') document.getElementById('calculateBtn').click();
});

var HISTORY_KEY = 'nutriai_calc_history';
var GOAL_LABELS_PS = {
  perda_moderada: '🎯 Perda moderada', perda_leve: '🎯 Perda leve',
  manutencao: '⚖️ Manutenção', ganho_leve: '💪 Ganho leve', ganho_moderado: '💪 Ganho moderado',
};
var ACTIVITY_LABELS_PS = {
  '1.2':'Sedentário', '1.375':'Lev. ativo', '1.55':'Mod. ativo', '1.725':'Muito ativo', '1.9':'Extremo',
};
var activeProfileId = null;

function loadCalcHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch(e) { return []; }
}

function updateProfileBar(entry) {
  var bar   = document.getElementById('profileSwitcherBar');
  var label = document.getElementById('psActiveLabel');
  if (!entry) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  label.innerHTML = '<span>' + Math.round(entry.meta) + ' kcal/dia</span> · ' + entry.peso + 'kg · ' + entry.altura + 'cm · ' + entry.idade + 'a · ' + (GOAL_LABELS_PS[entry.objetivo] || entry.objetivo) + ' · <span style="color:var(--white-muted);font-size:0.72rem;">' + entry.date + '</span>';
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
        '<span class="ps-item-badge">' + (GOAL_LABELS_PS[e.objetivo] || e.objetivo) + '</span>' +
        (e.id === activeProfileId ? '<span class="ps-item-badge" style="background:rgba(61,214,140,0.2);border-color:var(--green-400);">✓ Ativo</span>' : '') +
      '</div>' +
      '<div class="ps-item-values">' +
        '<div class="ps-val"><span>' + e.tmb + '</span><small>TMB</small></div>' +
        '<div class="ps-val"><span>' + e.get + '</span><small>GET</small></div>' +
        '<div class="ps-val"><span>' + e.meta + '</span><small>Meta kcal</small></div>' +
      '</div>' +
      '<div class="ps-item-params"><b>' + e.peso + 'kg</b> · <b>' + e.altura + 'cm</b> · <b>' + e.idade + 'a</b> · ' + (e.sexo === 'masculino' ? '♂ Masc.' : '♀ Fem.') + ' · ' + (ACTIVITY_LABELS_PS[String(e.atividade)] || e.atividade) + '</div>' +
    '</div>';
  }).join('');
}

window.applyProfile = async function(id) {
  var history = loadCalcHistory();
  var entry   = history.find(function(e) { return e.id === id; });
  if (!entry) return;

  var body = document.getElementById('psModalBody');
  body.innerHTML = '<div class="ps-loading">⏳ Aplicando perfil e salvando no servidor...</div>';

  var token = localStorage.getItem('token');
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

    dailyGoals = {
      calories: Math.round(r.meta_calorica),
      protein:  Math.round(r.macros_recomendados.proteina_g),
      carbs:    Math.round(r.macros_recomendados.carboidrato_g),
      fat:      Math.round(r.macros_recomendados.gordura_g),
    };
    document.getElementById('caloriesGoal').innerText = dailyGoals.calories;
    document.getElementById('proteinGoal').innerText  = dailyGoals.protein;
    document.getElementById('carbsGoal').innerText    = dailyGoals.carbs;
    document.getElementById('fatGoal').innerText      = dailyGoals.fat;

    var badgeEl = document.getElementById('goalBadge');
    if (badgeEl) {
      badgeEl.textContent = GOAL_LABELS_PS[entry.objetivo] || entry.objetivo;
      badgeEl.style.display = 'inline-block';
    }

    activeProfileId = id;
    updateProfileBar(entry);
    renderAll();
    closeProfileModal();
    showToast('✅ Perfil aplicado e metas atualizadas!');

  } catch (err) {
    showToast('❌ ' + err.message, true);
    renderProfileModal();
  }
};

document.getElementById('switchProfileBtn').addEventListener('click', openProfileModal);
document.getElementById('psClose').addEventListener('click', closeProfileModal);
document.getElementById('psOverlay').addEventListener('click', function(e) {
  if (e.target === document.getElementById('psOverlay')) closeProfileModal();
});

async function init() {
  var token = localStorage.getItem('token');
  if (!token) { window.location.href = 'login.html'; return; }

  await loadUserProfile();
  updateDateDisplay();
}

init();
