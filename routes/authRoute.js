const express = require("express");

const authRoutes = (grpcMethods, grpcStatus) => {
  const router = express.Router();

  // Register a new user
  router.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (
      !username ||
      !password ||
      username.trim() === "" ||
      password.trim() === ""
    ) {
      return res
        .status(400)
        .json({
          error: "Username and password are required and cannot be empty",
        });
    }

    try {
      const response = await grpcMethods.register({ username, password });
      res.status(201).json({
        success: response.success,
        message: "User registered successfully",
      });
    } catch (err) {
      console.error("Register error:", err);
      res.status(err.code === grpcStatus.ALREADY_EXISTS ? 409 : 500).json({
        error: err.details || "Failed to register user",
      });
    }
  });

  // Login and get JWT token
  router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (
      !username ||
      !password ||
      username.trim() === "" ||
      password.trim() === ""
    ) {
      return res
        .status(400)
        .json({
          error: "Username and password are required and cannot be empty",
        });
    }

    try {
      const response = await grpcMethods.login({ username, password });
      console.log("Login token issued:", response.token); // Debug log
      res.json({ token: response.token });
    } catch (err) {
      console.error("Login error:", err);
      res.status(err.code === grpcStatus.NOT_FOUND ? 404 : 401).json({
        error: err.details || "Failed to login",
      });
    }
  });

  return router;
};

module.exports = authRoutes;
