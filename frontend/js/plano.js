var currentPlan = null;
var currentDay  = 0;
var weekDays = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

function generateMealPlan(userData) {
  var name = userData.name, goal = userData.goal, dietPref = userData.dietPref, restrictions = userData.restrictions;

  var mealOptions = {
    emagrecer: {
      cafe:   ["Café da manhã: 2 ovos mexidos + 1 fatia de pão integral + 1/2 abacate", "Vitamina de whey com água + 1 colher de aveia", "Iogurte natural + chia + morangos"],
      almoco: ["Almoço: 150g frango grelhado + salada verde + 2 colheres de arroz integral", "Peixe assado + legumes no vapor + quinoa", "Omelete de legumes + salada"],
      jantar: ["Jantar: Sopa de legumes + 100g de tofu grelhado", "Salada de atum com folhas verdes", "Omelete de claras + espinafre"],
      lanche: ["Lanche: 1 maçã + 10 castanhas", "Whey protein com água", "Palmito + pepino"]
    },
    manter: {
      cafe:   ["Café da manhã: Pão integral + queijo branco + café", "Granola com iogurte + frutas vermelhas", "Vitamina de banana + aveia"],
      almoco: ["Almoço: Arroz integral + feijão + 120g de carne + salada", "Massa integral + molho de tomate + frango", "Salmão + purê de batata doce + brócolis"],
      jantar: ["Jantar: Wrap de frango com legumes", "Sopa de legumes + ovo cozido", "Tapioca com ricota + rúcula"],
      lanche: ["Lanche: 1 banana + pasta de amendoim", "Barra de cereal integral", "Frutas da estação"]
    },
    ganhar: {
      cafe:   ["Café da manhã: 4 ovos + 2 fatias de pão integral + 1 banana", "Vitamina hipercalórica: whey + aveia + pasta de amendoim + banana", "Cuscuz com frango desfiado"],
      almoco: ["Almoço: 200g frango + 300g batata doce + brócolis", "Maminha + arroz + feijão + farofa", "Strogonoff de frango + batata palha"],
      jantar: ["Jantar: Salmão + purê de batata + legumes", "Frango com macarrão integral", "Omelete de 4 ovos + queijo + presunto"],
      lanche: ["Lanche: 3 ovos cozidos + 1 banana", "Shake de whey + leite + aveia", "Sanduíche de pasta de amendoim"]
    }
  };

  var plan = [];
  for (var day = 0; day < 7; day++) {
    var dayPlan = {
      day: weekDays[day],
      meals: {
        cafe:   mealOptions[goal].cafe[day   % mealOptions[goal].cafe.length],
        almoco: mealOptions[goal].almoco[day % mealOptions[goal].almoco.length],
        jantar: mealOptions[goal].jantar[day % mealOptions[goal].jantar.length],
        lanche: mealOptions[goal].lanche[day % mealOptions[goal].lanche.length]
      }
    };
    plan.push(dayPlan);
  }

  var recipes = {
    emagrecer: ["• Receita: Salada de grão-de-bico com limão e hortelã", "• Receita: Sopa detox de abóbora com gengibre"],
    manter:    ["• Receita: Frango ao curry com arroz integral", "• Receita: Bowl de quinoa com legumes grelhados"],
    ganhar:    ["• Receita: Panqueca de banana com aveia e whey", "• Receita: Batata doce recheada com frango"]
  };

  var substitutions = "";
  if (dietPref === "vegetariano") {
    substitutions = "🥬 Substitua carnes por: tofu, grão-de-bico, lentilha, seitan ou ovos. Para proteína, aumente leguminosas.";
  } else if (dietPref === "vegano") {
    substitutions = "🌱 Versão vegana: substitua leite por vegetais (amêndoas, soja), ovos por tofu ou farinha de linhaça, queijos por levedura nutricional.";
  } else if (dietPref === "lowcarb") {
    substitutions = "🥑 Versão low carb: troque arroz e pão por vegetais verdes, couve-flor, abobrinha. Aumente gorduras boas.";
  } else if (dietPref === "sem gluten") {
    substitutions = "🚫 Sem glúten: use pão sem glúten, arroz, quinoa, tapioca. Evite trigo, cevada, centeio.";
  } else {
    substitutions = "🍽️ Substituições inteligentes: troque carboidratos refinados por integrais, aumente vegetais, varie as fontes de proteína.";
  }

  if (restrictions) {
    substitutions += "\n\n⚠️ Restrições informadas: " + restrictions + ". Adapte as receitas conforme necessário.";
  }

  var totalCalories = goal === "emagrecer" ? "~1600-1900 kcal/dia" : (goal === "ganhar" ? "~2500-3000 kcal/dia" : "~2000-2300 kcal/dia");

  return { plan: plan, recipes: recipes[goal], substitutions: substitutions, totalCalories: totalCalories, goal: goal };
}

function renderPlan(planData) {
  currentPlan = planData;

  var summaryHtml =
    '<div class="summary-item"><div class="summary-value">' + planData.totalCalories + '</div><div class="summary-label">Meta calórica diária</div></div>' +
    '<div class="summary-item"><div class="summary-value">' + (planData.goal === "emagrecer" ? "🔥 Perda de peso" : (planData.goal === "ganhar" ? "💪 Ganho muscular" : "⚖️ Manutenção")) + '</div><div class="summary-label">Objetivo</div></div>' +
    '<div class="summary-item"><div class="summary-value">7 dias</div><div class="summary-label">Plano completo</div></div>';
  document.getElementById('planSummary').innerHTML = summaryHtml;

  var tabsHtml = planData.plan.map(function(day, idx) {
    return '<div class="day-tab ' + (idx === currentDay ? 'active' : '') + '" data-day="' + idx + '">' + day.day + '</div>';
  }).join('');
  document.getElementById('weekTabs').innerHTML = tabsHtml;

  document.querySelectorAll('.day-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      currentDay = parseInt(tab.dataset.day);
      renderCurrentDay(planData);
      document.querySelectorAll('.day-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
    });
  });

  document.getElementById('substitutionsText').innerHTML = planData.substitutions.replace(/\n/g, '<br>');

  renderCurrentDay(planData);
}

function renderCurrentDay(planData) {
  var dayData = planData.plan[currentDay];
  var mealsHtml =
    '<div class="meal-card">' +
      '<div class="meal-header"><i class="fas fa-sun"></i><h3>Café da manhã</h3></div>' +
      '<div class="meal-content">' +
        '<div class="meal-food">' + dayData.meals.cafe + '</div>' +
        '<div class="meal-nutrition"><span><strong>~350-450 kcal</strong> · 20g prot · 40g carb · 15g gord</span></div>' +
        '<div class="recipe-link" onclick="showRecipe(\'cafe\')"><i class="fas fa-book-open"></i> Ver receita completa</div>' +
      '</div>' +
    '</div>' +
    '<div class="meal-card">' +
      '<div class="meal-header"><i class="fas fa-utensils"></i><h3>Almoço</h3></div>' +
      '<div class="meal-content">' +
        '<div class="meal-food">' + dayData.meals.almoco + '</div>' +
        '<div class="meal-nutrition"><span><strong>~550-650 kcal</strong> · 35g prot · 55g carb · 20g gord</span></div>' +
        '<div class="recipe-link" onclick="showRecipe(\'almoco\')"><i class="fas fa-book-open"></i> Ver receita completa</div>' +
      '</div>' +
    '</div>' +
    '<div class="meal-card">' +
      '<div class="meal-header"><i class="fas fa-apple-alt"></i><h3>Lanche da tarde</h3></div>' +
      '<div class="meal-content">' +
        '<div class="meal-food">' + dayData.meals.lanche + '</div>' +
        '<div class="meal-nutrition"><span><strong>~150-200 kcal</strong> · 10g prot · 20g carb · 5g gord</span></div>' +
      '</div>' +
    '</div>' +
    '<div class="meal-card">' +
      '<div class="meal-header"><i class="fas fa-moon"></i><h3>Jantar</h3></div>' +
      '<div class="meal-content">' +
        '<div class="meal-food">' + dayData.meals.jantar + '</div>' +
        '<div class="meal-nutrition"><span><strong>~450-550 kcal</strong> · 30g prot · 45g carb · 15g gord</span></div>' +
        '<div class="recipe-link" onclick="showRecipe(\'jantar\')"><i class="fas fa-book-open"></i> Ver receita completa</div>' +
      '</div>' +
    '</div>';
  document.getElementById('mealsContainer').innerHTML = mealsHtml;
}

window.showRecipe = function(mealType) {
  var recipesDetail = {
    cafe:   "🧑‍🍳 **Modo de preparo:** Bata os ingredientes ou prepare conforme sua preferência. Para opções mais elaboradas: adicione canela, mel ou frutas picadas.",
    almoco: "🧑‍🍳 **Modo de preparo:** Tempere a proteína com ervas e alho. Cozinhe os acompanhamentos no vapor ou grelhados. Finalize com azeite e limão.",
    jantar: "🧑‍🍳 **Modo de preparo:** Refogue legumes, adicione a proteína, cozinhe até dourar. Sirva com salada fresca."
  };
  showToast('📖 ' + (recipesDetail[mealType] || "Confira os ingredientes e prepare uma refeição deliciosa!"));
};

async function generatePlan() {
  var name = document.getElementById('userName').value.trim() || "Usuário";
  var goal = "";
  document.querySelectorAll('input[name="goal"]').forEach(function(radio) {
    if (radio.checked) goal = radio.value;
  });
  var dietPref     = document.getElementById('dietPref').value;
  var restrictions = document.getElementById('restrictions').value;

  document.getElementById('loadingOverlay').style.display = 'block';
  document.getElementById('planResult').style.display = 'none';
  document.getElementById('generatePlanBtn').disabled = true;

  var token = localStorage.getItem('token');

  if (token) {
    try {
      var goalLabel = goal === 'emagrecer' ? 'emagrecimento' : goal === 'ganhar' ? 'ganho de massa muscular' : 'manutenção do peso';
      var prompt =
        'Crie um plano alimentar semanal completo (7 dias) para ' + name + '.\n' +
        'Objetivo: ' + goalLabel + '.\n' +
        'Preferência alimentar: ' + (dietPref || 'onívoro') + '.\n' +
        'Restrições: ' + (restrictions || 'nenhuma') + '.\n' +
        'Formato: organize por dia (Segunda a Domingo) com café da manhã, almoço, jantar e lanche.\n' +
        'Inclua estimativa calórica diária e dica nutricional ao final.';

      var res = await fetch(API_BASE + '/chat/mensagem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ mensagem: prompt })
      });

      if (res.ok) {
        var data = await res.json();
        document.getElementById('loadingOverlay').style.display = 'none';
        document.getElementById('planResult').style.display = 'block';
        document.getElementById('generatePlanBtn').disabled = false;
        var container = document.getElementById('planResult');
        var respostaHtml = data.resposta
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n/g, '<br>');
        var respostaJson = JSON.stringify(data.resposta);
        container.innerHTML =
          '<div style="padding:24px">' +
            '<h3 style="margin-bottom:16px;font-size:18px">✨ Plano personalizado para ' + name + '</h3>' +
            '<div style="white-space:pre-wrap;line-height:1.7;font-size:14px">' + respostaHtml + '</div>' +
            '<button onclick="salvarPlano(\'' + goalLabel + '\', ' + respostaJson + ')" style="margin-top:20px;padding:10px 20px;background:#22C76E;border:none;border-radius:8px;color:#0D0F0E;font-weight:600;cursor:pointer">💾 Salvar no histórico</button>' +
          '</div>';
        showToast('✨ Plano gerado com IA para ' + name + '!');
        return;
      }
    } catch(e) {
      console.warn('Erro na IA, usando gerador local:', e);
    }
  }

  setTimeout(function() {
    var userData = { name: name, goal: goal, dietPref: dietPref, restrictions: restrictions };
    var planData = generateMealPlan(userData);
    document.getElementById('loadingOverlay').style.display = 'none';
    document.getElementById('planResult').style.display = 'block';
    document.getElementById('generatePlanBtn').disabled = false;
    renderPlan(planData);
    showToast('✨ Plano gerado para ' + name + '! Faça login para usar IA personalizada.');
  }, 1500);
}

async function salvarPlano(titulo, texto) {
  var token = localStorage.getItem('token');
  if (!token) { showToast('Faça login para salvar!', true); return; }
  try {
    var res = await fetch(API_BASE + '/historico/salvar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ titulo: 'Plano - ' + titulo, calorias: 0, dieta_gerada: texto })
    });
    if (res.ok) showToast('✅ Plano salvo no histórico!');
    else showToast('❌ Erro ao salvar', true);
  } catch(e) { showToast('❌ Erro de conexão', true); }
}

function downloadPlan() {
  if (!currentPlan) {
    showToast('Gere um plano primeiro!', true);
    return;
  }
  var content = document.getElementById('planResult').cloneNode(true);
  var printWindow = window.open('', '_blank');
  printWindow.document.write(
    '<html><head><title>Plano NutriAI - ' + document.getElementById('userName').value + '</title>' +
    '<style>' +
      'body { font-family: Arial, sans-serif; padding: 2rem; background: white; color: black; }' +
      '.meal-card { border: 1px solid #ddd; margin-bottom: 1rem; padding: 1rem; border-radius: 12px; }' +
      '.meal-header { background: #f0f0f0; padding: 0.5rem; }' +
      '.plan-summary { display: flex; gap: 2rem; margin-bottom: 2rem; }' +
    '</style>' +
    '</head><body>' + content.innerHTML + '</body></html>'
  );
  printWindow.document.close();
  printWindow.print();
  showToast('🖨️ Enviando para impressão...');
}

document.getElementById('generatePlanBtn').addEventListener('click', generatePlan);
document.getElementById('downloadPlanBtn').addEventListener('click', downloadPlan);
document.getElementById('printPlanBtn').addEventListener('click', downloadPlan);

setTimeout(function() {
  generatePlan();
}, 300);
