(function () {
  document.getElementById('forgot-form').addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const identifier = document.getElementById('forgot-identifier').value;

    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });

    sessionStorage.setItem('resetIdentifier', identifier);
    window.location.href = '/forgot-password-sent.html';
  });
})();
