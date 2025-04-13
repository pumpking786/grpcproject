const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const jwt = require("jsonwebtoken");
const Blog = require("../../models/Blog");

const ProtoPath = "./proto/blog.proto";
const packageDefinition = protoLoader.loadSync(ProtoPath);
const blogProto = grpc.loadPackageDefinition(packageDefinition).BlogService;

const JWT_SECRET_KEY = "your-secret-key";

// JWT Verifier
function verifyToken(call) {
  const metadata = call.metadata.get("authorization");
  if (!metadata.length) {
    throw {
      code: grpc.status.UNAUTHENTICATED,
      details: "Access denied. No token provided.",
    };
  }

  const token = metadata[0].split(" ")[1]; // Bearer <token>
  try {
    return jwt.verify(token, JWT_SECRET_KEY);
  } catch (err) {
    throw {
      code: grpc.status.UNAUTHENTICATED,
      details: "Invalid or expired token.",
    };
  }
}

// Auth wrapper for handlers
function withAuth(handler) {
  return async (call, callback) => {
    try {
      call.user = verifyToken(call); // attaches user info to call
      await handler(call, callback);
    } catch (err) {
      console.error(err);
      callback(
        err.code
          ? err
          : {
              code: grpc.status.INTERNAL,
              details: "Server error",
            }
      );
    }
  };
}

// 🟢 Public Handlers

async function getBlog(call, callback) {
  try {
    const blog = await Blog.findByPk(call.request.blogId);
    if (blog) callback(null, blog);
    else callback({ code: grpc.status.NOT_FOUND, details: "Blog not found" });
  } catch (err) {
    console.error(err);
    callback({ code: grpc.status.INTERNAL, details: "Error fetching blog" });
  }
}

async function getAllBlogs(call, callback) {
  try {
    const blogs = await Blog.findAll();
    callback(null, { blogs });
  } catch (err) {
    console.error(err);
    callback({ code: grpc.status.INTERNAL, details: "Error fetching blogs" });
  }
}

// 🔒 Auth-Protected Handlers

async function createBlog(call, callback) {
  const { title, content } = call.request;
  const author = call.user.username;

  try {
    const newBlog = await Blog.create({
      title,
      content,
      author,
      likes: 0,
      dislikes: 0,
    });
    callback(null, newBlog);
  } catch (err) {
    console.error(err);
    callback({ code: grpc.status.INTERNAL, details: "Error creating blog" });
  }
}

async function updateBlog(call, callback) {
  try {
    const blog = await Blog.findByPk(call.request.blogId);
    if (blog) {
      blog.title = call.request.title || blog.title;
      blog.content = call.request.content || blog.content;
      blog.author = call.request.author || blog.author;
      if (typeof call.request.likes !== "undefined")
        blog.likes = call.request.likes;
      if (typeof call.request.dislikes !== "undefined")
        blog.dislikes = call.request.dislikes;

      await blog.save();
      callback(null, blog);
    } else {
      callback({ code: grpc.status.NOT_FOUND, details: "Blog not found" });
    }
  } catch (err) {
    console.error(err);
    callback({ code: grpc.status.INTERNAL, details: "Error updating blog" });
  }
}

async function deleteBlog(call, callback) {
  try {
    const blog = await Blog.findByPk(call.request.blogId);
    if (blog) {
      await blog.destroy();
      callback(null, { success: true, message: "Blog deleted successfully" });
    } else {
      callback({ code: grpc.status.NOT_FOUND, details: "Blog not found" });
    }
  } catch (err) {
    console.error(err);
    callback({ code: grpc.status.INTERNAL, details: "Error deleting blog" });
  }
}

async function likeBlog(call, callback) {
  try {
    const blog = await Blog.findByPk(call.request.blogId);
    if (blog) {
      blog.likes += 1;
      await blog.save();
      callback(null, blog);
    } else {
      callback({ code: grpc.status.NOT_FOUND, details: "Blog not found" });
    }
  } catch (err) {
    console.error(err);
    callback({ code: grpc.status.INTERNAL, details: "Error liking blog" });
  }
}

async function dislikeBlog(call, callback) {
  try {
    const blog = await Blog.findByPk(call.request.blogId);
    if (blog) {
      blog.dislikes += 1;
      await blog.save();
      callback(null, blog);
    } else {
      callback({ code: grpc.status.NOT_FOUND, details: "Blog not found" });
    }
  } catch (err) {
    console.error(err);
    callback({ code: grpc.status.INTERNAL, details: "Error disliking blog" });
  }
}

// Create and start the gRPC server
const server = new grpc.Server();

server.addService(blogProto.service, {
  getBlog,
  getAllBlogs,
  createBlog: withAuth(createBlog),
  updateBlog: withAuth(updateBlog),
  deleteBlog: withAuth(deleteBlog),
  likeBlog: withAuth(likeBlog),
  dislikeBlog: withAuth(dislikeBlog),
});

server.bindAsync(
  "0.0.0.0:50052",
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log("Blog service running at http://0.0.0.0:50052");
    server.start();
  }
);

// const grpc = require("@grpc/grpc-js");
// const protoLoader = require("@grpc/proto-loader");
// const Blog = require("../../models/Blog"); // Import the Sequelize Blog model
// // Load the blog.proto file
// const ProtoPath = "./proto/blog.proto"; // Adjust the path as needed
// const packageDefinition = protoLoader.loadSync(ProtoPath);
// const blogProto = grpc.loadPackageDefinition(packageDefinition).BlogService;

// // Function to handle creating a new blog
// async function createBlog(call, callback) {
//   try {
//     const { title, content, author } = call.request;

//     const newBlog = await Blog.create({
//       title,
//       content,
//       author,
//       likes: 0,
//       dislikes: 0,
//     });

//     callback(null, newBlog);
//   } catch (err) {
//     console.error(err);
//     callback({
//       code: grpc.status.INTERNAL,
//       details: "Error creating blog",
//     });
//   }
// }

// // Function to handle getting a blog by ID
// async function getBlog(call, callback) {
//   try {
//     const blog = await Blog.findByPk(call.request.blogId);

//     if (blog) {
//       callback(null, blog);
//     } else {
//       callback({
//         code: grpc.status.NOT_FOUND,
//         details: "Blog not found",
//       });
//     }
//   } catch (err) {
//     console.error(err);
//     callback({
//       code: grpc.status.INTERNAL,
//       details: "Error fetching blog",
//     });
//   }
// }

// // Function to handle getting all blogs
// async function getAllBlogs(call, callback) {
//   try {
//     const blogs = await Blog.findAll();
//     callback(null, { blogs });
//   } catch (err) {
//     console.error(err);
//     callback({
//       code: grpc.status.INTERNAL,
//       details: "Error fetching blogs",
//     });
//   }
// }

// // Function to handle updating a blog
// async function updateBlog(call, callback) {
//   try {
//     const blog = await Blog.findByPk(call.request.blogId);

//     if (blog) {
//       // Update the title, content, and author only if provided
//       blog.title = call.request.title || blog.title;
//       blog.content = call.request.content || blog.content;
//       blog.author = call.request.author || blog.author;

//       // Update likes and dislikes if provided
//       if (typeof call.request.likes !== "undefined") {
//         blog.likes = call.request.likes;
//       }

//       if (typeof call.request.dislikes !== "undefined") {
//         blog.dislikes = call.request.dislikes;
//       }

//       await blog.save(); // Save the updated blog

//       callback(null, blog); // Return the updated blog
//     } else {
//       callback({
//         code: grpc.status.NOT_FOUND,
//         details: "Blog not found",
//       });
//     }
//   } catch (err) {
//     console.error(err);
//     callback({
//       code: grpc.status.INTERNAL,
//       details: "Error updating blog",
//     });
//   }
// }

// // Function to handle deleting a blog
// async function deleteBlog(call, callback) {
//   try {
//     const blog = await Blog.findByPk(call.request.blogId);

//     if (blog) {
//       await blog.destroy(); // Delete the blog from the database
//       callback(null, { success: true, message: "Blog deleted successfully" });
//     } else {
//       callback({
//         code: grpc.status.NOT_FOUND,
//         details: "Blog not found",
//       });
//     }
//   } catch (err) {
//     console.error(err);
//     callback({
//       code: grpc.status.INTERNAL,
//       details: "Error deleting blog",
//     });
//   }
// }

// // Function to handle liking a blog
// async function likeBlog(call, callback) {
//   try {
//     const blog = await Blog.findByPk(call.request.blogId);

//     if (blog) {
//       blog.likes += 1;
//       await blog.save(); // Save the updated blog
//       callback(null, blog);
//     } else {
//       callback({
//         code: grpc.status.NOT_FOUND,
//         details: "Blog not found",
//       });
//     }
//   } catch (err) {
//     console.error(err);
//     callback({
//       code: grpc.status.INTERNAL,
//       details: "Error liking blog",
//     });
//   }
// }

// // Function to handle disliking a blog
// async function dislikeBlog(call, callback) {
//   try {
//     const blog = await Blog.findByPk(call.request.blogId);

//     if (blog) {
//       blog.dislikes += 1;
//       await blog.save(); // Save the updated blog
//       callback(null, blog);
//     } else {
//       callback({
//         code: grpc.status.NOT_FOUND,
//         details: "Blog not found",
//       });
//     }
//   } catch (err) {
//     console.error(err);
//     callback({
//       code: grpc.status.INTERNAL,
//       details: "Error disliking blog",
//     });
//   }
// }
// // Create a gRPC server
// const server = new grpc.Server();

// // Add the BlogService to the server
// server.addService(blogProto.service, {
//   createBlog,
//   getBlog,
//   getAllBlogs,
//   updateBlog,
//   deleteBlog,
//   likeBlog,
//   dislikeBlog,
// });

// // Start the server on port 50051
// server.bindAsync(
//   "0.0.0.0:50052",
//   grpc.ServerCredentials.createInsecure(),
//   () => {
//     console.log("Blog service running at http://0.0.0.0:50052");
//     server.start();
//   }
// );
