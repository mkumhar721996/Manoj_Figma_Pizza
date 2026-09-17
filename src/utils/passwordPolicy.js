const POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function meetsPolicy(password) {
  return typeof password === 'string' && POLICY_REGEX.test(password);
}

module.exports = { meetsPolicy, POLICY_REGEX };
