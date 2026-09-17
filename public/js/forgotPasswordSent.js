(function () {
  const identifier = sessionStorage.getItem('resetIdentifier');
  if (identifier) {
    document.getElementById('sent-identifier').textContent = identifier;
  }
})();
