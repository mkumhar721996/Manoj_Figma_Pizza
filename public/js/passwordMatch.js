function passwordsMatch(password, confirmation) {
  return password === confirmation;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { passwordsMatch };
}
