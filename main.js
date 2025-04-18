// grpc/client.js
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const express = require("express");
const errorHandler = require("./middleware/errorHandler");
const verifyToken = require("./middleware/authMiddleware");

const app = express();
app.use(express.json());
// Load proto files
const authProtoPath = "./proto/auth.proto";
const blogProtoPath = "./proto/blog.proto";

const authPackageDef = protoLoader.loadSync(authProtoPath);
const blogPackageDef = protoLoader.loadSync(blogProtoPath);

// Load gRPC Packages
const authProto = grpc.loadPackageDefinition(authPackageDef);
const blogProto = grpc.loadPackageDefinition(blogPackageDef);

// Create gRPC Clients
const authStub = new authProto.AuthService(
  "0.0.0.0:50051",
  grpc.credentials.createInsecure()
);
const blogStub = new blogProto.BlogService(
  "0.0.0.0:50052",
  grpc.credentials.createInsecure()
);

app.post("/register", (req, res) => {
  const { username, password } = req.body;

  authStub.register({ username, password }, (err, response) => {
    if (err) {
      console.error("gRPC register error:", err);
      return res.json({ message: err.details });
    }

    res.json({ success: response.success });
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  authStub.login({ username, password }, (err, response) => {
    if (err) {
      console.error("gRPC login error:", err);
      return res.json({ message: err.details });
    }

    res.json({ token: response.token });
  });
});

app.get("/getAllBlogs", (req, res) => {
  blogStub.getAllBlogs({}, (err, response) => {
    if (err) {
      console.error("gRPC getAllBlog error:", err);
      return res.json({ message: err.details });
    }

    res.json({ blogs: response });
  });
});
app.get("/getBlog/:blogId", (req, res) => {
  const { blogId } = req.params;
  blogStub.getBlog({ blogId }, (err, response) => {
    if (err) {
      console.error("gRPC getBlog error:", err);
      return res.json({ message: err.details });
    }

    res.json({ blog: response });
  });
});

app.post("/createBlog",(req, res) => {
  const { title, content, author } = req.body;

  blogStub.createBlog({ title, content, author }, (err, response) => {
    if (err) {
      console.error("gRPC createBlog error:", err);
      return res.json({ message: err.details });
    }

    res.json({ "blog created:": response });
  });
});

app.put("/updateBlog/:blogId",(req, res) => {
  const { blogId } = req.params;
  const { title, content, author } = req.body;

  blogStub.updateBlog(
    { blogId, title, content, author },
    metadata,
    (err, response) => {
      if (err) {
        console.error("gRPC updateBlog error:", err);
        return res.json({ message: err.details });
      }

      res.json({ "blog updated:": response });
    }
  );
});

app.delete("/deleteBlog/:blogId",  (req, res) => {
  const { blogId } = req.params;

  blogStub.deleteBlog({ blogId },(err, response) => {
    if (err) {
      console.error("gRPC deleteBlog error:", err);
      return res.json({ message: err.details });
    }

    res.json({ "blog deleted:": response });
  });
});

app.post("/likeBlog/:blogId",  (req, res) => {
  const { blogId } = req.params;


  blogStub.likeBlog({ blogId }, (err, response) => {
    if (err) {
      console.error("gRPC likeBlog error:", err);
      return res.json({ message: err.details });
    }

    res.json({ "blog liked:": response });
  });
});

app.post("/dislikeBlog/:blogId", (req, res) => {
  const { blogId } = req.params;


  blogStub.dislikeBlog({ blogId },(err, response) => {
    if (err) {
      console.error("gRPC dislikeBlog error:", err);
      return res.json({ message: err.details });
    }

    res.json({ "blog disliked:": response });
  });
});

app.get("/getanalytics", (req, res) => {
  blogStub.getAnalytics({}, (err, response) => {
    if (err) {
      console.error("gRPC getAllBlog error:", err);
      return res.json({ message: err.details });
    }

    res.json({ Analytics: response });
  });
});

app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`REST API for AuthService running at http://localhost:${PORT}`);
});
