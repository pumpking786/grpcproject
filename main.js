const express = require("express");
const jwt = require("jsonwebtoken");
const { authStub, blogStub } = require("./grpc/client"); // 👈 Import from grpc folder

const app = express();
app.use(express.json());

// JWT Middleware
function verifyToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(403).send("Access denied. No token provided.");

  jwt.verify(token, "your-secret-key", (err, decoded) => {
    if (err) return res.status(401).send("Invalid token.");
    req.user = decoded;
    next();
  });
}

// Load routes
const userRoutes = require("./routes/userRoute")(authStub);
const blogRoutes = require("./routes/blogRoute")(blogStub, verifyToken);

app.use("/users", userRoutes);
app.use("/blogs", blogRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
