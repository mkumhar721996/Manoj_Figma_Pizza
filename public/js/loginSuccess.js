(function () {
  const wasPostReset = sessionStorage.getItem('loginWasPostReset') === '1';
  if (wasPostReset) {
    document.getElementById('login-success-banner').textContent = "You're logged in with your new password.";
  }
  sessionStorage.removeItem('loginWasPostReset');
})();
