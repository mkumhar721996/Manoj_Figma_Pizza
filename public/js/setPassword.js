(function () {
  const requestId = sessionStorage.getItem('resetRequestId') || '';
  const methodUsed = sessionStorage.getItem('resetMethodUsed') || 'link';
  const isFacebookAccount = sessionStorage.getItem('resetIsFacebookAccount') === '1';

  const otherMethod = methodUsed === 'link' ? 'one-time code sent via SMS' : 'password reset link sent via email';
  const invalidatedNote = `For your security, the ${otherMethod} for this request is now invalid.`;

  document.getElementById('invalidated-method-note').textContent = invalidatedNote;
  document.getElementById('success-invalidated-note').textContent = invalidatedNote;

  if (isFacebookAccount) {
    document.getElementById('set-password-badge').style.display = 'inline-flex';
    document.getElementById('set-password-title').textContent = 'Set an app password';
    document.getElementById('set-password-subtitle').textContent =
      "Your account was created using Facebook Login and doesn't have an app password yet. Set one below — it will work alongside Facebook Login.";
    document.getElementById('success-facebook-note').style.display = 'block';
  }

  function showState(id) {
    document.querySelectorAll('.state-block').forEach((el) => el.classList.remove('is-active'));
    document.getElementById(id).classList.add('is-active');
  }

  document.getElementById('set-password-form').addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const errorEl = document.getElementById('set-password-error');
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!passwordsMatch(newPassword, confirmPassword)) {
      errorEl.textContent = "Passwords don't match. Please try again.";
      errorEl.style.display = 'block';
      return;
    }

    const res = await fetch('/api/auth/reset/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, newPassword, confirmPassword }),
    });
    const body = await res.json();

    if (!body.success) {
      errorEl.textContent = "That password doesn't meet the requirements above. Please try again.";
      errorEl.style.display = 'block';
      return;
    }

    errorEl.style.display = 'none';
    sessionStorage.setItem('justReset', '1');
    sessionStorage.removeItem('resetRequestId');
    sessionStorage.removeItem('resetMethodUsed');
    sessionStorage.removeItem('resetIsFacebookAccount');
    showState('set-password-success-state');
  });
})();
