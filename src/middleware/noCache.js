function setNoCache(res) {
  res.setHeader('Cache-Control', 'no-store');
}

module.exports = { setNoCache };
