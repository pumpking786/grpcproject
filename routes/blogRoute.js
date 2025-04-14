const express = require("express");

const blogRoutes = (grpcMethods, grpcStatus, authenticate, grpc) => {
  const router = express.Router();

  // Create a new blog (authenticated)
  router.post("/create", authenticate, async (req, res) => {
    const { title, content, author } = req.body;

    // Validate inputs to match blog.server.js
    if (!title || title.trim() === "") {
      return res
        .status(400)
        .json({ error: "Title is required and cannot be empty" });
    }
    if (!content || content.trim() === "") {
      return res
        .status(400)
        .json({ error: "Content is required and cannot be empty" });
    }
    if (!author || author.trim() === "") {
      return res
        .status(400)
        .json({ error: "Author is required and cannot be empty" });
    }

    const metadata = new grpc.Metadata();
    metadata.add("authorization", `Bearer ${req.token}`);
    console.log("Sending createBlog with token:", req.token); // Debug log

    try {
      const response = await grpcMethods.createBlog(
        { title, content, author },
        metadata
      );
      console.log("Create blog response:", response); // Debug log
      res.status(201).json(response);
    } catch (err) {
      console.error("Create blog error:", err);
      res.status(err.code === grpcStatus.UNAUTHENTICATED ? 401 : 500).json({
        error: err.details || "Failed to create blog",
      });
    }
  });

  // Get a blog by ID (public)
  router.get("/:blogId", async (req, res) => {
    const { blogId } = req.params;

    try {
      const response = await grpcMethods.getBlog({ blogId });
      res.json(response);
    } catch (err) {
      console.error("Get blog error:", err);
      res.status(err.code === grpcStatus.NOT_FOUND ? 404 : 500).json({
        error: err.details || "Failed to fetch blog",
      });
    }
  });

  // Get all blogs (public)
  router.get("/", async (req, res) => {
    try {
      const response = await grpcMethods.getAllBlogs({});
      res.json(response.blogs);
    } catch (err) {
      console.error("Get all blogs error:", err);
      res.status(500).json({
        error: err.details || "Failed to fetch blogs",
      });
    }
  });

  // Update a blog (authenticated)
  router.put("/:blogId", authenticate, async (req, res) => {
    const { blogId } = req.params;
    const { title, content, author, likes, dislikes } = req.body;
    const metadata = new grpc.Metadata();
    metadata.add("authorization", `Bearer ${req.token}`);

    try {
      const response = await grpcMethods.updateBlog(
        { blogId, title, content, author, likes, dislikes },
        metadata
      );
      res.json(response);
    } catch (err) {
      console.error("Update blog error:", err);
      res
        .status(
          err.code === grpcStatus.NOT_FOUND
            ? 404
            : err.code === grpcStatus.PERMISSION_DENIED
            ? 403
            : err.code === grpcStatus.UNAUTHENTICATED
            ? 401
            : 500
        )
        .json({
          error: err.details || "Failed to update blog",
        });
    }
  });

  // Delete a blog (authenticated)
  router.delete("/:blogId", authenticate, async (req, res) => {
    const { blogId } = req.params;
    const metadata = new grpc.Metadata();
    metadata.add("authorization", `Bearer ${req.token}`);

    try {
      const response = await grpcMethods.deleteBlog({ blogId }, metadata);
      res.json({ success: response.success, message: response.message });
    } catch (err) {
      console.error("Delete blog error:", err);
      res
        .status(
          err.code === grpcStatus.NOT_FOUND
            ? 404
            : err.code === grpcStatus.PERMISSION_DENIED
            ? 403
            : err.code === grpcStatus.UNAUTHENTICATED
            ? 401
            : 500
        )
        .json({
          error: err.details || "Failed to delete blog",
        });
    }
  });

  // Like a blog (authenticated)
  router.post("/:blogId/like", authenticate, async (req, res) => {
    const { blogId } = req.params;
    const metadata = new grpc.Metadata();
    metadata.add("authorization", `Bearer ${req.token}`);

    try {
      const response = await grpcMethods.likeBlog({ blogId }, metadata);
      res.json(response);
    } catch (err) {
      console.error("Like blog error:", err);
      res
        .status(
          err.code === grpcStatus.NOT_FOUND
            ? 404
            : err.code === grpcStatus.UNAUTHENTICATED
            ? 401
            : 500
        )
        .json({
          error: err.details || "Failed to like blog",
        });
    }
  });

  // Dislike a blog (authenticated)
  router.post("/:blogId/dislike", authenticate, async (req, res) => {
    const { blogId } = req.params;
    const metadata = new grpc.Metadata();
    metadata.add("authorization", `Bearer ${req.token}`);

    try {
      const response = await grpcMethods.dislikeBlog({ blogId }, metadata);
      res.json(response);
    } catch (err) {
      console.error("Dislike blog error:", err);
      res
        .status(
          err.code === grpcStatus.NOT_FOUND
            ? 404
            : err.code === grpcStatus.UNAUTHENTICATED
            ? 401
            : 500
        )
        .json({
          error: err.details || "Failed to dislike blog",
        });
    }
  });

  return router;
};

module.exports = blogRoutes;
