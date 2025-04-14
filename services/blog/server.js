const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const Blog = require("../../models/Blog"); // Import the Sequelize Blog model
// Load the blog.proto file
const ProtoPath = "./proto/blog.proto"; // Adjust the path as needed
const packageDefinition = protoLoader.loadSync(ProtoPath);
const blogProto = grpc.loadPackageDefinition(packageDefinition).BlogService;

// Function to handle creating a new blog
async function createBlog(call, callback) {
  try {
    const { title, content, author } = call.request;

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
    callback({
      code: grpc.status.INTERNAL,
      details: "Error creating blog",
    });
  }
}

// Function to handle getting a blog by ID
async function getBlog(call, callback) {
  try {
    const blog = await Blog.findByPk(call.request.blogId);

    if (blog) {
      callback(null, blog);
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "Blog not found",
      });
    }
  } catch (err) {
    console.error(err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Error fetching blog",
    });
  }
}

// Function to handle getting all blogs
async function getAllBlogs(call, callback) {
  try {
    const blogs = await Blog.findAll();
    callback(null, { blogs });
  } catch (err) {
    console.error(err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Error fetching blogs",
    });
  }
}

// Function to handle updating a blog
async function updateBlog(call, callback) {
  try {
    const blog = await Blog.findByPk(call.request.blogId);

    if (blog) {
      // Update the title, content, and author only if provided
      blog.title = call.request.title || blog.title;
      blog.content = call.request.content || blog.content;
      blog.author = call.request.author || blog.author;

      // Update likes and dislikes if provided
      if (typeof call.request.likes !== "undefined") {
        blog.likes = call.request.likes;
      }

      if (typeof call.request.dislikes !== "undefined") {
        blog.dislikes = call.request.dislikes;
      }

      await blog.save(); // Save the updated blog

      callback(null, blog); // Return the updated blog
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "Blog not found",
      });
    }
  } catch (err) {
    console.error(err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Error updating blog",
    });
  }
}

// Function to handle deleting a blog
async function deleteBlog(call, callback) {
  try {
    const blog = await Blog.findByPk(call.request.blogId);

    if (blog) {
      await blog.destroy(); // Delete the blog from the database
      callback(null, { success: true, message: "Blog deleted successfully" });
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "Blog not found",
      });
    }
  } catch (err) {
    console.error(err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Error deleting blog",
    });
  }
}

// Function to handle liking a blog
async function likeBlog(call, callback) {
  try {
    const blog = await Blog.findByPk(call.request.blogId);

    if (blog) {
      blog.likes += 1;
      await blog.save(); // Save the updated blog
      callback(null, blog);
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "Blog not found",
      });
    }
  } catch (err) {
    console.error(err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Error liking blog",
    });
  }
}

// Function to handle disliking a blog
async function dislikeBlog(call, callback) {
  try {
    const blog = await Blog.findByPk(call.request.blogId);

    if (blog) {
      blog.dislikes += 1;
      await blog.save(); // Save the updated blog
      callback(null, blog);
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "Blog not found",
      });
    }
  } catch (err) {
    console.error(err);
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
  createBlog,
  getBlog,
  getAllBlogs,
  updateBlog,
  deleteBlog,
  likeBlog,
  dislikeBlog,
});

// Start the server on port 50051
server.bindAsync(
  "0.0.0.0:50052",
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log("Blog service running at http://0.0.0.0:50052");
    server.start();
  }
);
