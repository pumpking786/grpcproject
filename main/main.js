const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const express = require('express');
const jwt = require('jsonwebtoken');  // For verifying JWT

const ProtoPathauth = './proto/auth.proto';
const ProtoPathblog = './proto/blog.proto';
const packageDefinitionAuth = protoLoader.loadSync(ProtoPathauth);
const packageDefinitionBlog = protoLoader.loadSync(ProtoPathblog);
const authProto = grpc.loadPackageDefinition(packageDefinitionAuth);
const blogProto = grpc.loadPackageDefinition(packageDefinitionBlog);

// gRPC Stubs
const authStub = new authProto.AuthService('0.0.0.0:50051', grpc.credentials.createInsecure());
const blogStub = new blogProto.BlogService('0.0.0.0:50052', grpc.credentials.createInsecure());

const app = express();
app.use(express.json());

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract token from "Authorization: Bearer <token>"

  if (!token) {
    return res.status(403).send('Access denied. No token provided.');
  }

  jwt.verify(token, 'your-secret-key', (err, decoded) => {
    if (err) {
      return res.status(401).send('Invalid token.');
    }
    req.user = decoded;  // Attach the decoded user info to the request
    next();
  });
}

// Auth route to register a new user (not implemented in the code yet)
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  authStub.Register({ username, password }, (err, response) => {
    if (err) {
      return res.status(500).send('Error registering user.');
    }
    return res.status(200).send('User registered successfully.');
  });
});

// Auth route to login and get the JWT token
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  authStub.Login({ username, password }, (err, response) => {
    if (err) {
      return res.status(401).send('Invalid credentials');
    }
    return res.status(200).json({ token: response.token });
  });
});

// Blog route to create a new blog post (authentication required)
app.post('/createBlog', verifyToken, (req, res) => {
  const { title, content, author } = req.body;
  const userId = req.user.userId; // From the JWT token

  blogStub.CreateBlog({ title, content, author }, (err, response) => {
    if (err) {
      return res.status(500).send('Error creating blog.');
    }
    return res.status(200).json(response);
  });
});

// Blog route to get a specific blog post by ID
app.get('/getBlog/:blogId', (req, res) => {
  const { blogId } = req.params;

  blogStub.GetBlog({ blogId }, (err, response) => {
    if (err) {
      return res.status(404).send('Blog not found.');
    }
    return res.status(200).json(response);
  });
});

// Blog route to get all blogs
app.get('/getAllBlogs', (req, res) => {
  blogStub.GetAllBlogs({}, (err, response) => {
    if (err) {
      return res.status(500).send('Error fetching blogs.');
    }
    return res.status(200).json(response.blogs);
  });
});

// Blog route to update a blog post (authentication required)
// Blog route to update a blog post (authentication required)
app.put('/updateBlog', verifyToken, (req, res) => {
  const { blogId, title, content, author, likes, dislikes } = req.body;
  const userId = req.user.userId; // From the JWT token

  // Prepare the request data for the gRPC service
  const requestData = {
    blogId,
    title,
    content,
    author,
  };

  // Only pass likes and dislikes if they are provided in the request
  if (typeof likes !== 'undefined') {
    requestData.likes = likes;
  }
  if (typeof dislikes !== 'undefined') {
    requestData.dislikes = dislikes;
  }

  // Call the gRPC service to update the blog
  blogStub.UpdateBlog(requestData, (err, response) => {
    if (err) {
      return res.status(500).send('Error updating blog.');
    }
    return res.status(200).json(response);
  });
});


// Blog route to delete a blog post (authentication required)
app.delete('/deleteBlog/:blogId', verifyToken, (req, res) => {
  const { blogId } = req.params;
  const userId = req.user.userId; // From the JWT token

  blogStub.DeleteBlog({ blogId }, (err, response) => {
    if (err) {
      return res.status(404).send('Blog not found.');
    }
    return res.status(200).json(response);
  });
});

app.post('/likeBlog/:blogId', verifyToken, (req, res) => {
    const { blogId } = req.params;
    blogStub.LikeBlog({ blogId }, (err, response) => {
      if (err) {
        return res.status(404).send('Blog not found.');
      }
      return res.status(200).json(response);
    });
  });
  
  // Dislike a blog post
  app.post('/dislikeBlog/:blogId', verifyToken, (req, res) => {
    const { blogId } = req.params;
    blogStub.DislikeBlog({ blogId }, (err, response) => {
      if (err) {
        return res.status(404).send('Blog not found.');
      }
      return res.status(200).json(response);
    });
  });

// Start Express server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
