const express = require('express');
const { blogStub } = require('../grpc/client'); // Import gRPC client
const verifyToken = require('../middleware/authMiddleware'); // Token verification middleware
const router = express.Router();

router.get("/getAllBlogs", verifyToken, (req, res) => {
  const { page = 1, pageSize = 10 } = req.body || {};
  const request = { page, pageSize };

  blogStub.getAllBlogs(request, req.grpcMetadata, (err, response) => {
    if (err) {
      console.error("gRPC getAllBlogs error:", err);
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({
      blogs: response.blogs,
      totalBlogs: response.totalBlogs,
      totalPages: response.totalPages
    });
  });
});

router.get("/getAllBlogs/:filter", verifyToken, (req, res) => {
  const { filter } = req.params;
  const { page = 1, pageSize = 10 } = req.query;

  const request = {
    filter,
    page: parseInt(page, 10),
    pageSize: parseInt(pageSize, 10),
  };

  blogStub.getAllBlogs(request, req.grpcMetadata, (err, response) => {
    if (err) {
      console.error("gRPC getAllBlogs error:", err);
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({
      blogs: response.blogs,
      totalBlogs: response.totalBlogs,
      totalPages: response.totalPages,
    });
  });
});

router.get("/getBlog/:blogId", (req, res) => {
  const { blogId } = req.params;

  blogStub.getBlog({ blogId }, (err, response) => {
    if (err) {
      console.error("gRPC getBlog error:", err);
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({ blog: response });
  });
});

router.post("/createBlog", verifyToken, (req, res) => {
  const { title, content, author } = req.body;

  blogStub.createBlog({ title, content, author }, req.grpcMetadata, (err, response) => {
    if (err) {
      console.error("gRPC createBlog error:", err);
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({ "blog created:": response });
  });
});

router.put("/updateBlog/:blogId", verifyToken, (req, res) => {
  const { blogId } = req.params;
  const { title, content, author } = req.body;

  blogStub.updateBlog({ blogId, title, content, author }, req.grpcMetadata, (err, response) => {
    if (err) {
      console.error("gRPC updateBlog error:", err);
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({ "blog updated:": response });
  });
});

router.delete("/deleteBlog/:blogId", verifyToken, (req, res) => {
  const { blogId } = req.params;

  blogStub.deleteBlog({ blogId }, req.grpcMetadata, (err, response) => {
    if (err) {
      console.error("gRPC deleteBlog error:", err);
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({ "blog deleted:": response });
  });
});

router.post("/likeBlog/:blogId", verifyToken, (req, res) => {
  const { blogId } = req.params;

  blogStub.likeBlog({ blogId }, req.grpcMetadata, (err, response) => {
    if (err) {
      console.error("gRPC likeBlog error:", err);
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({ "blog liked:": response });
  });
});

router.post("/dislikeBlog/:blogId", verifyToken, (req, res) => {
  const { blogId } = req.params;

  blogStub.dislikeBlog({ blogId }, req.grpcMetadata, (err, response) => {
    if (err) {
      console.error("gRPC dislikeBlog error:", err);
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({ "blog disliked:": response });
  });
});

router.get("/getanalytics", (req, res) => {
  blogStub.getAnalytics({}, (err, response) => {
    if (err) {
      console.error("gRPC getAllBlog error:", err);
      return res.status(400).json({ message: err.details });
    }

    res.status(200).json({ Analytics: response });
  });
});

module.exports = router;
