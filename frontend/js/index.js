(function() {
  var token   = localStorage.getItem('token');
  var usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
  var logado  = !!token;

  var navActions = document.querySelector('.nav-actions');
  if (navActions && logado) {
    navActions.innerHTML =
      '<span style="font-size:0.8rem;color:var(--white-muted)">Olá, ' + (usuario && usuario.nome ? usuario.nome.split(' ')[0] : 'usuário') + '</span>' +
      '<a href="dashboard.html" class="btn-primary-nav" style="text-decoration:none">Meu painel</a>' +
      '<button onclick="logout()" class="btn-ghost-nav" style="cursor:pointer;border:none;background:transparent;color:var(--white-dim);font-size:0.85rem">Sair</button>';
  }

  var heroPrimary = document.querySelector('.btn-primary-hero');
  if (heroPrimary && logado) {
    heroPrimary.href = 'dashboard.html';
    heroPrimary.innerHTML = heroPrimary.innerHTML.replace('Criar meu plano agora', 'Ir para o painel');
  }

  var ctaFinal = document.querySelector('.btn-primary-hero:last-of-type');
  if (ctaFinal && logado && ctaFinal.href && ctaFinal.href.indexOf('cadastro') !== -1) {
    ctaFinal.href = 'dashboard.html';
  }

  document.querySelectorAll('[data-protected="true"]').forEach(function(card) {
    card.addEventListener('click', function(e) {
      if (!logado) {
        e.preventDefault();
        showLoginRequired(card.href);
      }
    });
  });

  function showLoginRequired(destino) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(13,15,14,0.85);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);animation:fadeIn 0.2s ease;';
    overlay.innerHTML =
      '<div style="background:#1F2421;border:1px solid #2A302C;border-radius:20px;padding:2rem 2.5rem;max-width:380px;width:90%;text-align:center;">' +
        '<div style="width:52px;height:52px;background:#0D6B3D;border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 1.2rem;font-size:1.4rem">🔒</div>' +
        '<h3 style="font-family:\'Space Grotesk\',sans-serif;font-size:1.1rem;font-weight:600;margin-bottom:0.6rem;color:#F4F7F5">Funcionalidade exclusiva</h3>' +
        '<p style="font-size:0.85rem;color:#7A8B80;line-height:1.6;margin-bottom:1.5rem">Crie uma conta gratuita ou faça login para acessar esta funcionalidade.</p>' +
        '<div style="display:flex;gap:0.8rem;justify-content:center">' +
          '<a href="login.html" style="background:transparent;border:1px solid #2A302C;color:#B8C4BC;padding:0.6rem 1.2rem;border-radius:10px;text-decoration:none;font-size:0.85rem;transition:all 0.2s;">Fazer login</a>' +
          '<a href="cadastro.html" style="background:#22C76E;color:#0D0F0E;padding:0.6rem 1.4rem;border-radius:10px;text-decoration:none;font-size:0.85rem;font-weight:600;transition:all 0.2s;">Criar conta grátis</a>' +
        '</div>' +
        '<button onclick="this.closest(\'[style*=fixed]\').remove()" style="margin-top:1rem;background:transparent;border:none;color:#7A8B80;font-size:0.75rem;cursor:pointer;">Fechar</button>' +
      '</div>';
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.reload();
  };
})();
