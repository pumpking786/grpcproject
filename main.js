const express = require("express");
const { authStub, blogStub } = require("./grpc/client");
const grpc = require("@grpc/grpc-js");
const authRoutes = require("./routes/authRoute");
const blogRoutes = require("./routes/blogRoute");

const app = express();
app.use(express.json());

// Helper function to wrap gRPC calls in Promises
const promisifyGrpc = (stub, method) => {
  return (request, metadata = new grpc.Metadata()) =>
    new Promise((resolve, reject) => {
      stub[method](request, metadata, (err, response) => {
        if (err) return reject(err);
        resolve(response);
      });
    });
};

// Promisified gRPC methods
const grpcMethods = {
  register: promisifyGrpc(authStub, "register"),
  login: promisifyGrpc(authStub, "login"),
  createBlog: promisifyGrpc(blogStub, "createBlog"),
  getBlog: promisifyGrpc(blogStub, "getBlog"),
  getAllBlogs: promisifyGrpc(blogStub, "getAllBlogs"),
  updateBlog: promisifyGrpc(blogStub, "updateBlog"),
  deleteBlog: promisifyGrpc(blogStub, "deleteBlog"),
  likeBlog: promisifyGrpc(blogStub, "likeBlog"),
  dislikeBlog: promisifyGrpc(blogStub, "dislikeBlog"),
};

// Middleware to extract token from Authorization header
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Authorization header missing or invalid" });
  }
  req.token = authHeader.replace("Bearer ", "");
  console.log("Extracted token:", req.token); // Debug log
  next();
};

// Mount routes
app.use("/auth", authRoutes(grpcMethods, grpc.status));
app.use("/blogs", blogRoutes(grpcMethods, grpc.status, authenticate, grpc));

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
