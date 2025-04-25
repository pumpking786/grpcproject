const express = require('express');
const { authStub } = require('../grpc/client'); // Import gRPC client
const router = express.Router();

router.post("/register", (req, res) => {
  const { username, password } = req.body;

  authStub.register({ username, password }, (err, response) => {
    if (err) {
      console.error("gRPC register error:", err);
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({ success: response.success });
  });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  authStub.login({ username, password }, (err, response) => {
    if (err) {
      console.error("gRPC login error:", err);
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({ token: response.token });
  });
});

module.exports = router;
