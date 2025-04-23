const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const jwt = require("jsonwebtoken");
// const Blog = require("../../models/Blog");
// const User = require("../../models/User");
// const BlogLikeDislike = require("../../models/BlogLikeDislike");
const { Blog, BlogLikeDislike, User } = require("../../models");
const { Op } = require("sequelize");

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
  const {
    page = 1,
    pageSize = 10,
    filter = "",       // "", "liked", "disliked"
  } = call.request;

  const offset = (page - 1) * pageSize;
  const userId = call.user?.userId;

  try {
    let blogs = [];
    let totalBlogs = 0;

    // If "liked" or "disliked" filter is applied, we query BlogLikeDislike table
    if (filter === "liked" || filter === "disliked") {
      const likeCondition = filter === "liked" ? { like: true } : { dislike: true };

      // Fetch blogs liked or disliked by the user
      const { rows, count } = await BlogLikeDislike.findAndCountAll({
        where: {
          userId,
          ...likeCondition
        },
        include: [
          {
            model: Blog,
            required: true  // Ensure we are getting blogs only
          }
        ],
        limit: pageSize,
        offset
      });

      blogs = rows.map(entry => entry.Blog); // Extract only the blog details
      totalBlogs = count; // Set the total blogs count from the matching entries

    } else {
      // If no filter, fetch all blogs
      const { rows, count } = await Blog.findAndCountAll({
        limit: pageSize,
        offset
      });

      blogs = rows;
      totalBlogs = count;
    }

    // Format the blog response
    const response = blogs.map(blog => ({
      blogId: blog.blogId.toString(),
      title: blog.title,
      content: blog.content,
      author: blog.author,
      likes: blog.likes,
      dislikes: blog.dislikes
    }));

    // Send the response with total count of blogs and total pages
    callback(null, {
      blogs: response,
      totalBlogs,
      totalPages: Math.ceil(totalBlogs / pageSize)
    });

  } catch (err) {
    console.error("Get all blogs error:", err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Error fetching blogs"
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

    const updatedFields = {
      title: title || blog.title,
      content: content || blog.content,
      author: author || blog.author,
    };

    // Directly update the blog in the database
    await Blog.update(updatedFields, { where: { blogId } });

    // Reload the updated blog
    const updatedBlog = await Blog.findByPk(blogId);

    callback(null, {
      blogId: updatedBlog.blogId.toString(),
      title: updatedBlog.title,
      content: updatedBlog.content,
      author: updatedBlog.author,
      likes: updatedBlog.likes,
      dislikes: updatedBlog.dislikes,
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

    const existingEntry = await BlogLikeDislike.findOne({
      where: { blogId, userId },
    });

    if (existingEntry) {
      if (existingEntry.like) {
        // User already liked → remove like (toggle off)
        await BlogLikeDislike.destroy({
          where: { blogId, userId },
        });

        await Blog.update(
          { likes: blog.likes - 1 },
          { where: { blogId } }
        );

        return callback(null, {
          message: "You unliked the blog",
          blogId: blog.blogId.toString(),
          title: blog.title,
          content: blog.content,
          author: blog.author,
          likes: blog.likes - 1,
          dislikes: blog.dislikes,
        });
      }

      // User had previously disliked -> switch to like
      await BlogLikeDislike.update(
        { like: true, dislike: false },
        { where: { blogId, userId } }
      );

      await Blog.update(
        {
          likes: blog.likes + 1,
          dislikes: blog.dislikes - 1,
        },
        { where: { blogId } }
      );
    } else {
      // New like
      await BlogLikeDislike.create({
        blogId,
        userId,
        like: true,
        dislike: false,
      });

      await Blog.update(
        { likes: blog.likes + 1 },
        { where: { blogId } }
      );
    }

    callback(null, {
      blogId: blog.blogId.toString(),
      title: blog.title,
      content: blog.content,
      author: blog.author,
      likes: blog.likes + 1,
      dislikes: existingEntry?.dislike ? blog.dislikes - 1 : blog.dislikes,
    });
  } catch (err) {
    console.error("Like blog error:", err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Error liking blog",
    });
  }
}

async function dislikeBlog(call, callback) {
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

    const existingEntry = await BlogLikeDislike.findOne({
      where: { blogId, userId },
    });

    if (existingEntry) {
      if (existingEntry.dislike) {
        // User already disliked → remove dislike (toggle off)
        await BlogLikeDislike.destroy({
          where: { blogId, userId },
        });

        await Blog.update(
          { dislikes: blog.dislikes - 1 },
          { where: { blogId } }
        );

        return callback(null, {
          message: "You removed your dislike",
          blogId: blog.blogId.toString(),
          title: blog.title,
          content: blog.content,
          author: blog.author,
          likes: blog.likes,
          dislikes: blog.dislikes - 1,
        });
      }

      // User had previously liked -> switch to dislike
      await BlogLikeDislike.update(
        { like: false, dislike: true },
        { where: { blogId, userId } }
      );

      await Blog.update(
        {
          likes: blog.likes - 1,
          dislikes: blog.dislikes + 1,
        },
        { where: { blogId } }
      );
    } else {
      // New dislike
      await BlogLikeDislike.create({
        blogId,
        userId,
        like: false,
        dislike: true,
      });

      await Blog.update(
        { dislikes: blog.dislikes + 1 },
        { where: { blogId } }
      );
    }

    callback(null, {
      blogId: blog.blogId.toString(),
      title: blog.title,
      content: blog.content,
      author: blog.author,
      likes: existingEntry?.like ? blog.likes - 1 : blog.likes,
      dislikes: blog.dislikes + 1,
    });
  } catch (err) {
    console.error("Dislike blog error:", err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Error disliking blog",
    });
  }
}

// async function getLikedBlogs(call, callback) {
//   const userId = call.user.userId;

//   try {
//     const likedEntries = await BlogLikeDislike.findAll({
//       where: {
//         userId,
//         like: true
//       },
//       include: [
//         {
//           model: Blog,
//           required: true
//         }
//       ]
//     });

//     const response = likedEntries.map(entry => {
//       const blog = entry.Blog;
//       return {
//         blogId: blog.blogId.toString(),
//         title: blog.title,
//         content: blog.content,
//         author: blog.author,
//         likes: blog.likes,
//         dislikes: blog.dislikes
//       };
//     });

//     callback(null, { blogs: response });
//   } catch (err) {
//     console.error("Get liked blogs error:", err);
//     callback({
//       code: grpc.status.INTERNAL,
//       details: "Error fetching liked blogs"
//     });
//   }
// }

// async function getDislikedBlogs(call, callback) {
//   const userId = call.user.userId;

//   try {
//     const dislikedEntries = await BlogLikeDislike.findAll({
//       where: {
//         userId,
//         dislike: true
//       },
//       include: [
//         {
//           model: Blog,
//           required: true
//         }
//       ]
//     });

//     const response = dislikedEntries.map(entry => {
//       const blog = entry.Blog;
//       return {
//         blogId: blog.blogId.toString(),
//         title: blog.title,
//         content: blog.content,
//         author: blog.author,
//         likes: blog.likes,
//         dislikes: blog.dislikes
//       };
//     });

//     callback(null, { blogs: response });
//   } catch (err) {
//     console.error("Get disliked blogs error:", err);
//     callback({
//       code: grpc.status.INTERNAL,
//       details: "Error fetching disliked blogs"
//     });
//   }
// }

async function getAnalytics(call, callback) {
  try {
    const totalUsers = await User.count();
    const totalBlogs = await Blog.count();

    callback(null, {
      totalUsers,
      totalBlogs
    });
  } catch (err) {
    console.error("Analytics fetch error:", err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Error fetching analytics"
    });
  }
}


// Create a gRPC server
const server = new grpc.Server();

// Add the BlogService to the server
server.addService(blogProto.service, {
  createBlog: withAuth(createBlog),
  getBlog,
  getAllBlogs: withAuth(getAllBlogs),
  updateBlog: withAuth(updateBlog),
  deleteBlog: withAuth(deleteBlog),
  likeBlog: withAuth(likeBlog),
  dislikeBlog: withAuth(dislikeBlog),
  getAnalytics
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
