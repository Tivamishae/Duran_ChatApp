const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://duran-chatapp-backend.herokuapp.com',
      changeOrigin: true,
    })
  );
};