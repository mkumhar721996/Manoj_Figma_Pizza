(function () {
  function showState(id) {
    document.querySelectorAll('.state-block').forEach((el) => el.classList.remove('is-active'));
    document.getElementById(id).classList.add('is-active');
  }

  document.getElementById('otp-form').addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const otpInput = document.getElementById('otp-value');
    const errorEl = document.getElementById('otp-error');
    const identifier = sessionStorage.getItem('resetIdentifier') || '';

    const res = await fetch('/api/auth/reset/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, otp: otpInput.value.trim() }),
    });
    const body = await res.json();

    if (body.valid) {
      otpInput.classList.remove('has-error');
      errorEl.style.display = 'none';
      sessionStorage.setItem('resetRequestId', body.requestId);
      sessionStorage.setItem('resetMethodUsed', 'otp');
      sessionStorage.setItem('resetIsFacebookAccount', body.isFacebookAccount ? '1' : '0');
      window.location.href = '/set-password.html';
      return;
    }

    if (body.reason === 'expired') {
      showState('otp-expired');
      return;
    }
    if (body.reason === 'locked') {
      showState('otp-locked');
      return;
    }
    if (body.reason === 'invalidated') {
      showState('otp-invalidated');
      return;
    }

    otpInput.classList.add('has-error');
    errorEl.textContent = 'Incorrect code. Please try again.';
    errorEl.style.display = 'block';
  });
})();
