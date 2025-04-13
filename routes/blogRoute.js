const express = require("express");
const { Metadata } = require("@grpc/grpc-js"); // Import Metadata from @grpc/grpc-js

module.exports = (blogStub, verifyToken) => {
  const router = express.Router();

  // Helper function to create gRPC metadata with the JWT token
  const createMetadata = (req) => {
    const metadata = new Metadata();
    const authHeader = req.headers.authorization;
    if (authHeader) {
      metadata.add("authorization", authHeader); // Pass the full "Bearer <token>" string
    }
    return metadata;
  };

  router.post("/create", verifyToken, (req, res) => {
    const { title, content, author } = req.body;
    const metadata = createMetadata(req); // Create metadata with the token
    blogStub.CreateBlog(
      { title, content, author },
      metadata,
      (err, response) => {
        if (err) {
          console.error("gRPC Error:", err); // Log the gRPC error for debugging
          return res.status(500).send(err.details || "Error creating blog.");
        }
        res.status(200).json(response);
      }
    );
  });

  router.get("/:blogId", (req, res) => {
    const metadata = createMetadata(req); // Pass metadata even for public routes (server will ignore if not needed)
    blogStub.GetBlog(
      { blogId: req.params.blogId },
      metadata,
      (err, response) => {
        if (err) return res.status(404).send(err.details || "Blog not found.");
        res.status(200).json(response);
      }
    );
  });

  router.get("/", (req, res) => {
    const metadata = createMetadata(req);
    blogStub.GetAllBlogs({}, metadata, (err, response) => {
      if (err)
        return res.status(500).send(err.details || "Error fetching blogs.");
      res.status(200).json(response.blogs);
    });
  });

  router.put("/update", verifyToken, (req, res) => {
    const { blogId, title, content, author, likes, dislikes } = req.body;
    const requestData = { blogId, title, content, author };

    if (likes !== undefined) requestData.likes = likes;
    if (dislikes !== undefined) requestData.dislikes = dislikes;

    const metadata = createMetadata(req);
    blogStub.UpdateBlog(requestData, metadata, (err, response) => {
      if (err)
        return res.status(500).send(err.details || "Error updating blog.");
      res.status(200).json(response);
    });
  });

  router.delete("/delete/:blogId", verifyToken, (req, res) => {
    const metadata = createMetadata(req);
    blogStub.DeleteBlog(
      { blogId: req.params.blogId },
      metadata,
      (err, response) => {
        if (err) return res.status(404).send(err.details || "Blog not found.");
        res.status(200).json(response);
      }
    );
  });

  router.post("/like/:blogId", verifyToken, (req, res) => {
    const metadata = createMetadata(req);
    blogStub.LikeBlog(
      { blogId: req.params.blogId },
      metadata,
      (err, response) => {
        if (err) return res.status(404).send(err.details || "Blog not found.");
        res.status(200).json(response);
      }
    );
  });

  router.post("/dislike/:blogId", verifyToken, (req, res) => {
    const metadata = createMetadata(req);
    blogStub.DislikeBlog(
      { blogId: req.params.blogId },
      metadata,
      (err, response) => {
        if (err) return res.status(404).send(err.details || "Blog not found.");
        res.status(200).json(response);
      }
    );
  });

  return router;
};
