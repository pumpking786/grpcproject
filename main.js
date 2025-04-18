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
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({ success: response.success });
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  authStub.login({ username, password }, (err, response) => {
    if (err) {
      console.error("gRPC login error:", err);
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({ token: response.token });
  });
});

app.get("/getAllBlogs", (req, res) => {
  blogStub.getAllBlogs({}, (err, response) => {
    if (err) {
      console.error("gRPC getAllBlog error:", err);
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({ blogs: response });
  });
});

app.get("/getBlog/:blogId", (req, res) => {
  const { blogId } = req.params;
  blogStub.getBlog({ blogId }, (err, response) => {
    if (err) {
      console.error("gRPC getBlog error:", err);
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({ blog: response });
  });
});

app.post("/createBlog", verifyToken, (req, res) => {
  const { title, content, author } = req.body;

  blogStub.createBlog({ title, content, author }, req.grpcMetadata, (err, response) => {
    if (err) {
      console.error("gRPC createBlog error:", err);
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({ "blog created:": response });
  });
});

app.put("/updateBlog/:blogId", verifyToken, (req, res) => {
  const { blogId } = req.params;
  const { title, content, author } = req.body;

  blogStub.updateBlog(
    { blogId, title, content, author },
    req.grpcMetadata,
    (err, response) => {
      if (err) {
        console.error("gRPC updateBlog error:", err);
        return res.status(400).json({ message: err.details });
      }

      res.status(200).json({ "blog updated:": response });
    }
  );
});

app.delete("/deleteBlog/:blogId", verifyToken, (req, res) => {
  const { blogId } = req.params;

  blogStub.deleteBlog({ blogId }, req.grpcMetadata, (err, response) => {
    if (err) {
      console.error("gRPC deleteBlog error:", err);
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({ "blog deleted:": response });
  });
});

app.post("/likeBlog/:blogId", verifyToken, (req, res) => {
  const { blogId } = req.params;

  blogStub.likeBlog({ blogId }, req.grpcMetadata, (err, response) => {
    if (err) {
      console.error("gRPC likeBlog error:", err);
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({ "blog liked:": response });
  });
});

app.post("/dislikeBlog/:blogId", verifyToken, (req, res) => {
  const { blogId } = req.params;

  blogStub.dislikeBlog({ blogId }, req.grpcMetadata, (err, response) => {
    if (err) {
      console.error("gRPC dislikeBlog error:", err);
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({ "blog disliked:": response });
  });
});

app.get("/getanalytics", (req, res) => {
  blogStub.getAnalytics({}, (err, response) => {
    if (err) {
      console.error("gRPC getAllBlog error:", err);
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({ Analytics: response });
  });
});

app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`REST API for AuthService running at http://localhost:${PORT}`);
});
