<!-- interface do usuário/auth.js -->
<script>
/**
 * Auth minimalista com Netlify Identity + lista local de admins
 * Coloque os e-mails que podem ver o Dashboard em ADMIN_EMAILS
 */
const ADMIN_EMAILS = ['lucaslopessd@gmail.com']; // <= adicione mais se quiser

(function () {
  const IDENTITY_URL = `${location.origin}/.netlify/identity`;

  function initIdentity() {
    if (window.netlifyIdentity) {
      try { window.netlifyIdentity.init({ APIUrl: IDENTITY_URL }); } catch (e) {}
    }
  }
  initIdentity();
  document.addEventListener('readystatechange', () => {
    if (document.readyState === 'complete') initIdentity();
  });

  // UI helpers
  const loginBtn  = document.getElementById('btnLogin');
  const logoutBtn = document.getElementById('btnLogout');
  const who       = document.getElementById('who');

  function render(user) {
    if (user) {
      if (who) who.textContent = user.email || '';
      if (loginBtn)  loginBtn.classList.add('hide');
      if (logoutBtn) logoutBtn.classList.remove('hide');
    } else {
      if (who) who.textContent = '';
      if (loginBtn)  loginBtn.classList.remove('hide');
      if (logoutBtn) logoutBtn.classList.add('hide');
    }
  }

  function user() {
    return window.netlifyIdentity?.currentUser() || null;
  }
  function isAdmin() {
    const u = user();
    const email = (u?.email || '').toLowerCase();
    return !!email && ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email);
  }

  // Botões
  loginBtn?.addEventListener('click', () => window.netlifyIdentity?.open('login'));
  logoutBtn?.addEventListener('click', () => window.netlifyIdentity?.logout());

  // Eventos do widget
  window.netlifyIdentity?.on('init',  render);
  window.netlifyIdentity?.on('login', u => { render(u); location.reload(); });
  window.netlifyIdentity?.on('logout', () => { render(null); location.reload(); });

  // Expor helpers globalmente
  window.Auth = { user, isAdmin, render };
})();
</script>
