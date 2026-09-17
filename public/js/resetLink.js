(function () {
  function showState(id) {
    document.querySelectorAll('.state-block').forEach((el) => el.classList.remove('is-active'));
    document.getElementById(id).classList.add('is-active');
  }

  const token = new URLSearchParams(window.location.search).get('token') || '';

  fetch('/api/auth/reset/verify-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
    .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
    .then(({ ok, body }) => {
      if (ok && body.valid) {
        showState('reset-link-valid');
        document.getElementById('reset-link-continue').addEventListener('click', () => {
          sessionStorage.setItem('resetRequestId', body.requestId);
          sessionStorage.setItem('resetMethodUsed', 'link');
          sessionStorage.setItem('resetIsFacebookAccount', body.isFacebookAccount ? '1' : '0');
          window.location.href = '/set-password.html';
        });
      } else {
        showState('reset-link-expired');
      }
    });
})();
