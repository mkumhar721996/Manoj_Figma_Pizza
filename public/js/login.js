(function () {
  const banner = document.getElementById('login-reset-banner');
  const errorEl = document.getElementById('login-error');
  const emailInput = document.getElementById('login-email');
  let wasPostReset = false;

  if (sessionStorage.getItem('justReset') === '1') {
    banner.style.display = 'block';
    emailInput.value = sessionStorage.getItem('resetIdentifier') || '';
    wasPostReset = true;
    sessionStorage.removeItem('justReset');
  }

  document.getElementById('forgot-password-link').addEventListener('click', () => {
    window.location.href = '/forgot-password.html';
  });

  document.getElementById('login-form').addEventListener('submit', async (evt) => {
    evt.preventDefault();
    errorEl.style.display = 'none';

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: emailInput.value,
        password: document.getElementById('login-password').value,
      }),
    });

    if (response.ok) {
      sessionStorage.setItem('loginWasPostReset', wasPostReset ? '1' : '0');
      window.location.href = '/login-success.html';
      return;
    }

    errorEl.textContent = 'Incorrect email/mobile number or password.';
    errorEl.style.display = 'block';
  });
})();
