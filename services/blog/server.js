const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Load the blog.proto file
const ProtoPath = './proto/blog.proto';  // Adjust the path as needed
const packageDefinition = protoLoader.loadSync(ProtoPath);
const blogProto = grpc.loadPackageDefinition(packageDefinition).BlogService;

// Dummy in-memory blog data
let blogs = [
    {
        blogId: '1',
        title: 'First Blog Post',
        content: 'This is the content of the first blog post.',
        author: 'Pramit.',
        likes: 0,
        dislikes: 0
    },
    {
        blogId: '2',
        title: 'Second Blog Post',
        content: 'Content for the second blog post goes here.',
        author: 'Pramit.',
        likes: 0,
        dislikes: 0
    }
];

// Function to handle creating a new blog
function createBlog(call, callback) {
    const newBlog = {
        blogId: (blogs.length + 1).toString(),  // Generate new blogId
        title: call.request.title,
        content: call.request.content,
        author: call.request.author,
        likes: 0,
        dislikes: 0
    };
    
    blogs.push(newBlog);
    callback(null, newBlog);
}

// Function to handle getting a blog by ID
function getBlog(call, callback) {
    const blog = blogs.find(b => b.blogId === call.request.blogId);
    if (blog) {
        callback(null, blog);
    } else {
        callback({
            code: grpc.status.NOT_FOUND,
            details: 'Blog not found',
        });
    }
}

// Function to handle getting all blogs
function getAllBlogs(call, callback) {
    callback(null, { blogs });
}

// Function to handle updating a blog
// Function to handle updating a blog
function updateBlog(call, callback) {
    const blog = blogs.find(b => b.blogId === call.request.blogId);
    
    if (blog) {
        // Update the title, content, and author only if provided
        blog.title = call.request.title || blog.title;
        blog.content = call.request.content || blog.content;
        blog.author = call.request.author || blog.author;
        
        // Update likes and dislikes if provided
        if (typeof call.request.likes !== 'undefined') {
            blog.likes = call.request.likes;
        }

        if (typeof call.request.dislikes !== 'undefined') {
            blog.dislikes = call.request.dislikes;
        }

        callback(null, blog); // Return the updated blog
    } else {
        callback({
            code: grpc.status.NOT_FOUND,
            details: 'Blog not found',
        });
    }
}


// Function to handle deleting a blog
function deleteBlog(call, callback) {
    const index = blogs.findIndex(b => b.blogId === call.request.blogId);
    if (index !== -1) {
        blogs.splice(index, 1);
        callback(null, { success: true, message: 'Blog deleted successfully' });
    } else {
        callback({
            code: grpc.status.NOT_FOUND,
            details: 'Blog not found',
        });
    }
}

// Function to handle liking a blog
function likeBlog(call, callback) {
    const blog = blogs.find(b => b.blogId === call.request.blogId);
    if (blog) {
        blog.likes += 1;
        callback(null, blog);
    } else {
        callback({
            code: grpc.status.NOT_FOUND,
            details: 'Blog not found',
        });
    }
}

// Function to handle disliking a blog
function dislikeBlog(call, callback) {
    const blog = blogs.find(b => b.blogId === call.request.blogId);
    if (blog) {
        blog.dislikes += 1;
        callback(null, blog);
    } else {
        callback({
            code: grpc.status.NOT_FOUND,
            details: 'Blog not found',
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
    dislikeBlog
});

// Start the server on port 50051
server.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), () => {
    console.log('Blog service running at http://0.0.0.0:50052');
    server.start();
});
