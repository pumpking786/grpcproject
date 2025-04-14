const express = require("express");
const { authStub, blogStub } = require("./grpc/client"); // Import gRPC clients
const grpc = require("@grpc/grpc-js");

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
const register = promisifyGrpc(authStub, "register");
const login = promisifyGrpc(authStub, "login");
const createBlog = promisifyGrpc(blogStub, "createBlog");
const getBlog = promisifyGrpc(blogStub, "getBlog");
const getAllBlogs = promisifyGrpc(blogStub, "getAllBlogs");
const updateBlog = promisifyGrpc(blogStub, "updateBlog");
const deleteBlog = promisifyGrpc(blogStub, "deleteBlog");
const likeBlog = promisifyGrpc(blogStub, "likeBlog");
const dislikeBlog = promisifyGrpc(blogStub, "dislikeBlog");

// Register a new user
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    const response = await register({ username, password });
    res.status(201).json({
      success: response.success,
      message: "User registered successfully",
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(err.code === grpc.status.ALREADY_EXISTS ? 409 : 500).json({
      error: err.details || "Failed to register user",
    });
  }
});

// Login and get JWT token
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    const response = await login({ username, password });
    res.json({ token: response.token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(err.code === grpc.status.NOT_FOUND ? 404 : 401).json({
      error: err.details || "Failed to login",
    });
  }
});

// Middleware to extract token from Authorization header
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Authorization header missing or invalid" });
  }
  req.token = authHeader.replace("Bearer ", "");
  next();
};

// Create a new blog (authenticated)
app.post("/blogs/create", authenticate, async (req, res) => {
  const { title, content, author } = req.body;
  const metadata = new grpc.Metadata();
  metadata.add("authorization", `Bearer ${req.token}`);

  try {
    const response = await createBlog({ title, content, author }, metadata);
    res.status(201).json(response);
  } catch (err) {
    console.error("Create blog error:", err);
    res.status(err.code === grpc.status.UNAUTHENTICATED ? 401 : 500).json({
      error: err.details || "Failed to create blog",
    });
  }
});

// Get a blog by ID (public)
app.get("/blogs/:blogId", async (req, res) => {
  const { blogId } = req.params;

  try {
    const response = await getBlog({ blogId });
    res.json(response);
  } catch (err) {
    console.error("Get blog error:", err);
    res.status(err.code === grpc.status.NOT_FOUND ? 404 : 500).json({
      error: err.details || "Failed to fetch blog",
    });
  }
});

// Get all blogs (public)
app.get("/blogs", async (req, res) => {
  try {
    const response = await getAllBlogs({});
    res.json(response.blogs);
  } catch (err) {
    console.error("Get all blogs error:", err);
    res.status(500).json({
      error: err.details || "Failed to fetch blogs",
    });
  }
});

// Update a blog (authenticated)
app.put("/blogs/:blogId", authenticate, async (req, res) => {
  const { blogId } = req.params;
  const { title, content, author, likes, dislikes } = req.body;
  const metadata = new grpc.Metadata();
  metadata.add("authorization", `Bearer ${req.token}`);

  try {
    const response = await updateBlog(
      { blogId, title, content, author, likes, dislikes },
      metadata
    );
    res.json(response);
  } catch (err) {
    console.error("Update blog error:", err);
    res
      .status(
        err.code === grpc.status.NOT_FOUND
          ? 404
          : err.code === grpc.status.PERMISSION_DENIED
          ? 403
          : err.code === grpc.status.UNAUTHENTICATED
          ? 401
          : 500
      )
      .json({
        error: err.details || "Failed to update blog",
      });
  }
});

// Delete a blog (authenticated)
app.delete("/blogs/:blogId", authenticate, async (req, res) => {
  const { blogId } = req.params;
  const metadata = new grpc.Metadata();
  metadata.add("authorization", `Bearer ${req.token}`);

  try {
    const response = await deleteBlog({ blogId }, metadata);
    res.json({ success: response.success, message: response.message });
  } catch (err) {
    console.error("Delete blog error:", err);
    res
      .status(
        err.code === grpc.status.NOT_FOUND
          ? 404
          : err.code === grpc.status.PERMISSION_DENIED
          ? 403
          : err.code === grpc.status.UNAUTHENTICATED
          ? 401
          : 500
      )
      .json({
        error: err.details || "Failed to delete blog",
      });
  }
});

// Like a blog (authenticated)
app.post("/blogs/:blogId/like", authenticate, async (req, res) => {
  const { blogId } = req.params;
  const metadata = new grpc.Metadata();
  metadata.add("authorization", `Bearer ${req.token}`);

  try {
    const response = await likeBlog({ blogId }, metadata);
    res.json(response);
  } catch (err) {
    console.error("Like blog error:", err);
    res
      .status(
        err.code === grpc.status.NOT_FOUND
          ? 404
          : err.code === grpc.status.UNAUTHENTICATED
          ? 401
          : 500
      )
      .json({
        error: err.details || "Failed to like blog",
      });
  }
});

// Dislike a blog (authenticated)
app.post("/blogs/:blogId/dislike", authenticate, async (req, res) => {
  const { blogId } = req.params;
  const metadata = new grpc.Metadata();
  metadata.add("authorization", `Bearer ${req.token}`);

  try {
    const response = await dislikeBlog({ blogId }, metadata);
    res.json(response);
  } catch (err) {
    console.error("Dislike blog error:", err);
    res
      .status(
        err.code === grpc.status.NOT_FOUND
          ? 404
          : err.code === grpc.status.UNAUTHENTICATED
          ? 401
          : 500
      )
      .json({
        error: err.details || "Failed to dislike blog",
      });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
