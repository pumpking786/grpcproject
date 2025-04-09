const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const jwt = require('jsonwebtoken');  // Import the jsonwebtoken package

// Secret key for signing JWT tokens (In production, store this securely)
const JWT_SECRET_KEY = 'your-secret-key';  // You can use environment variables for better security
// Load the blog.proto file
const ProtoPath = './proto/auth.proto';  // Adjust the path as needed
const packageDefinition = protoLoader.loadSync(ProtoPath);
const authProto = grpc.loadPackageDefinition(packageDefinition).AuthService;

let users=[
    {
        userId:"1",
        username:"Pramit",
        password:"Pramit"
    },
    {
        userId:"2",
        username:"Shyam",
        password:"Shyam"
    }
]

function register (call,callback){
    const newUser={
        userId: (users.length+1).toString(),
        username: call.request.username,
        password: call.request.password,
    }
     // Check if the username already exists
     const userExists = users.some(user => user.username === newUser.username);
     if (userExists) {
         return callback({
             code: grpc.status.ALREADY_EXISTS,
             details: 'Username already taken'
         });
     }
 
     users.push(newUser);
     callback(null, { success: true });
 }

 // Login function to authenticate a user and return a JWT token
 function login(call, callback) {
     const { username, password } = call.request;
 
     // Find the user by username
     const user = users.find(u => u.username === username);
     if (!user) {
         return callback({
             code: grpc.status.NOT_FOUND,
             details: 'User not found'
         });
     }
 
     // Check if the password matches
     if (user.password !== password) {
         return callback({
             code: grpc.status.INVALID_ARGUMENT,
             details: 'Invalid credentials'
         });
     }
 
     // Generate a JWT token (you can include more user details in the payload if necessary)
     const token = jwt.sign({ userId: user.userId, username: user.username }, JWT_SECRET_KEY, { expiresIn: '1h' });
 
     callback(null, { token });
 }
 
// GetAllUsers function to retrieve the list of users
function getAllUsers(call, callback) {
    // Create an array of users to return
    const userList = users.map(user => ({
        userId: user.userId,
        username: user.username
    }));

    // Create a ShowUsers object with the users list
    const showUsers = {
        users: userList
    };

    callback(null, showUsers);
}

 // Create a gRPC server
 const server = new grpc.Server();
 
 // Add the AuthService to the server
 server.addService(authProto.service, {
     register,
     login,
     getAllUsers
 });
 
 // Start the server on port 50051
 server.bindAsync('0.0.0.0:50052', grpc.ServerCredentials.createInsecure(), () => {
     console.log('Auth service running at http://0.0.0.0:50052');
     server.start();
 });
