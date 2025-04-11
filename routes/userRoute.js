const express = require('express');
const grpc = require('@grpc/grpc-js');

module.exports = (authStub) => {
  const router = express.Router();

  // Register user
  router.post('/register', (req, res) => {
    const { username, password } = req.body;
    authStub.Register({ username, password }, (err, response) => {
      if (err) {
        switch (err.code) {
          case grpc.status.INVALID_ARGUMENT:
            return res.status(400).json({ error: err.details });
          case grpc.status.ALREADY_EXISTS:
            return res.status(409).json({ error: err.details });
          default:
            return res.status(500).json({ error: 'Internal server error' });
        }
      }
      res.status(200).json({ message: 'User registered successfully.' });
    });
  });

  // Login
  router.post('/login', (req, res) => {
    const { username, password } = req.body;
    authStub.Login({ username, password }, (err, response) => {
      if (err) return res.status(401).send('Invalid credentials');
      res.status(200).json({ token: response.token });
    });
  });

  return router;
};
