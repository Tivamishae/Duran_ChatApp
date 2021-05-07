const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = (app) => {
  const socketProxy= createProxyMiddleware('/socket', {
    target: 'https://duran-chatapp-backend.herokuapp.com',
    changeOrigin: true,
    ws: true, 
    logLevel: 'debug',
  });

  app.use(socketProxy);
};