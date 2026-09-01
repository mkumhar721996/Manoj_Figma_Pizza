function handleAdminRoute(req, res, pathname, method) {
  if (pathname === '/admin' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Admin Dashboard</h1>');
    return true;
  }
  if (pathname === '/admin/orders' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Orders</h1>');
    return true;
  }
  return false;
}

module.exports = { handleAdminRoute };
