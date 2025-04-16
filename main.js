// grpc/client.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const express = require('express');

const app=express();
app.use(express.json())
// Load proto files
const authProtoPath = './proto/auth.proto';
const blogProtoPath = './proto/blog.proto';

const authPackageDef = protoLoader.loadSync(authProtoPath);
const blogPackageDef = protoLoader.loadSync(blogProtoPath);

// Load gRPC Packages
const authProto = grpc.loadPackageDefinition(authPackageDef);
const blogProto = grpc.loadPackageDefinition(blogPackageDef);

// Create gRPC Clients
const authStub = new authProto.AuthService('0.0.0.0:50051', grpc.credentials.createInsecure());
const blogStub = new blogProto.BlogService('0.0.0.0:50052', grpc.credentials.createInsecure());

app.post('/register',(req,res)=>{
    const {username,password}=req.body;

    authStub.register({username,password},(err,response)=>{
        if (err) {
            console.error('gRPC register error:', err);
            return res.status(400).json({ message: err.details });
          }
      
          res.status(200).json({ success: response.success });
        });
})

app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    authStub.login({ username, password }, (err, response) => {
      if (err) {
        console.error('gRPC login error:', err);
        return res.status(400).json({ message: err.details });
      }
  
      res.status(200).json({ token: response.token });
    });
  });

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`REST API for AuthService running at http://localhost:${PORT}`);
});
