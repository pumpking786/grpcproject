const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const jwt = require("jsonwebtoken");
const Blog = require("../../models/Blog");
const User = require("../../models/User");
const BlogLike = require("../../models/BlogLike");

// Secret key for verifying JWT tokens
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "your-secret-key";

// Load the blog.proto file
const ProtoPath = "./proto/blog.proto";
const packageDefinition = protoLoader.loadSync(ProtoPath);
const blogProto = grpc.loadPackageDefinition(packageDefinition).BlogService;

// Function to verify JWT token from metadata
function withAuth(handler) {
  return async (call, callback) => {
    const token = call.metadata.get("authorization")[0];
    if (!token) {
      return callback({
        code: grpc.status.UNAUTHENTICATED,
        details: "No token provided",
      });
    }

    try {
      const cleanToken = token.startsWith("Bearer ")
        ? token.replace("Bearer ", "")
        : token;

      const decoded = jwt.verify(cleanToken, JWT_SECRET_KEY);
      call.user = decoded; // Attach to call
      return handler(call, callback); // Call the original function
    } catch (err) {
      return callback({
        code: grpc.status.UNAUTHENTICATED,
        details:
          err.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
      });
    }
  };
}

// Function to handle creating a new blog (protected)
async function createBlog(call, callback) {
  const { title, content, author } = call.request;

  // Validate title, content, and author
  if (!title || title.trim() === "") {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: "Title is required and cannot be empty",
    });
  }
  if (!content || content.trim() === "") {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: "Content is required and cannot be empty",
    });
  }
  if (!author || author.trim() === "") {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: "Author is required and cannot be empty",
    });
  }

  try {
    const user = await User.findByPk(call.user.userId);
    if (!user) {
      return callback({
        code: grpc.status.NOT_FOUND,
        details: "User not found",
      });
    }

    const newBlog = await Blog.create({
      title,
      content,
      author,
      userId: call.user.userId,
      likes: 0,
      dislikes: 0,
    });

    callback(null, {
      blogId: newBlog.blogId.toString(),
      title: newBlog.title,
      content: newBlog.content,
      author: newBlog.author,
      likes: newBlog.likes,
      dislikes: newBlog.dislikes,
    });
  } catch (err) {
    console.error("Create blog error:", err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Error creating blog",
    });
  }
}

// Function to handle getting a blog by ID (public)
async function getBlog(call, callback) {
  try {
    const blog = await Blog.findByPk(call.request.blogId);

    if (blog) {
      callback(null, {
        blogId: blog.blogId.toString(),
        title: blog.title,
        content: blog.content,
        author: blog.author,
        likes: blog.likes,
        dislikes: blog.dislikes,
      });
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "Blog not found",
      });
    }
  } catch (err) {
    console.error("Get blog error:", err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Error fetching blog",
    });
  }
}

// Function to handle getting all blogs (public)
async function getAllBlogs(call, callback) {
  try {
    const blogs = await Blog.findAll();
    callback(null, {
      blogs: blogs.map((blog) => ({
        blogId: blog.blogId.toString(),
        title: blog.title,
        content: blog.content,
        author: blog.author,
        likes: blog.likes,
        dislikes: blog.dislikes,
      })),
    });
  } catch (err) {
    console.error("Get all blogs error:", err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Error fetching blogs",
    });
  }
}

// Function to handle updating a blog (protected)
async function updateBlog(call, callback) {
  const { blogId, title, content, author } = call.request;

  try {
    const blog = await Blog.findByPk(blogId);
    if (!blog) {
      return callback({
        code: grpc.status.NOT_FOUND,
        details: "Blog not found",
      });
    }

    if (blog.userId !== call.user.userId) {
      return callback({
        code: grpc.status.PERMISSION_DENIED,
        details: "You can only edit your own blogs",
      });
    }

    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.author = author || blog.author;

    await blog.save();

    callback(null, {
      blogId: blog.blogId.toString(),
      title: blog.title,
      content: blog.content,
      author: blog.author,
      likes: blog.likes,
      dislikes: blog.dislikes,
    });
  } catch (err) {
    console.error("Update blog error:", err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Error updating blog",
    });
  }
}

// Function to handle deleting a blog (protected)
async function deleteBlog(call, callback) {
  const { blogId } = call.request;

  try {
    const blog = await Blog.findByPk(blogId);
    if (!blog) {
      return callback({
        code: grpc.status.NOT_FOUND,
        details: "Blog not found",
      });
    }

    if (blog.userId !== call.user.userId) {
      return callback({
        code: grpc.status.PERMISSION_DENIED,
        details: "You can only delete your own blogs",
      });
    }

    await blog.destroy();
    callback(null, { success: true, message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Delete blog error:", err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Error deleting blog",
    });
  }
}

// Function to handle liking a blog (protected)
async function likeBlog(call, callback) {
  const { blogId } = call.request;
  const userId = call.user.userId;

  try {
    const blog = await Blog.findByPk(blogId);
    if (!blog) {
      return callback({
        code: grpc.status.NOT_FOUND,
        details: "Blog not found",
      });
    }

    // Check if user already liked this blog
    const existingLike = await BlogLike.findOne({
      where: { blogId, userId },
    });

    if (existingLike) {
      return callback({
        code: grpc.status.ALREADY_EXISTS,
        details: "User already liked this blog",
      });
    }

    await BlogLike.create({ blogId, userId });

    blog.likes += 1;
    await blog.save();

    callback(null, {
      blogId: blog.blogId.toString(),
      title: blog.title,
      content: blog.content,
      author: blog.author,
      likes: blog.likes,
      dislikes: blog.dislikes,
    });
  } catch (err) {
    console.error("Like blog error:", err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Error liking blog",
    });
  }
}

// Function to handle disliking a blog (protected)
async function dislikeBlog(call, callback) {
  const { blogId } = call.request;

  try {
    const blog = await Blog.findByPk(blogId);
    if (!blog) {
      return callback({
        code: grpc.status.NOT_FOUND,
        details: "Blog not found",
      });
    }

    blog.dislikes += 1;
    await blog.save();

    callback(null, {
      blogId: blog.blogId.toString(),
      title: blog.title,
      content: blog.content,
      author: blog.author,
      likes: blog.likes,
      dislikes: blog.dislikes,
    });
  } catch (err) {
    console.error("Dislike blog error:", err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Error disliking blog",
    });
  }
}

// Create a gRPC server
const server = new grpc.Server();

// Add the BlogService to the server
server.addService(blogProto.service, {
  createBlog: withAuth(createBlog),
  getBlog,
  getAllBlogs,
  updateBlog: withAuth(updateBlog),
  deleteBlog: withAuth(deleteBlog),
  likeBlog: withAuth(likeBlog),
  dislikeBlog: withAuth(dislikeBlog),
});

// Start the server on port 50052
server.bindAsync(
  "0.0.0.0:50052",
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log("Blog service running at http://0.0.0.0:50052");
    server.start();
  }
);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down Blog gRPC server...");
  server.forceShutdown();
  process.exit();
});
