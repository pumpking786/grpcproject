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
        username:"Pramit123",
        password:"Pramit123"
    },
    {
        userId:"2",
        username:"Shyam123",
        password:"Shyam123"
    }
]

function register(call, callback) {
    const { username, password } = call.request;

    // Basic validation
    if (!username || !password) {
        return callback({
            code: grpc.status.INVALID_ARGUMENT,
            details: 'Username and password are required'
        });
    }

    // Username format validation
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return callback({
            code: grpc.status.INVALID_ARGUMENT,
            details: 'Username must be 3-20 characters and contain only letters, numbers, and underscores'
        });
    }

    // Password strength check
    if (password.length < 6) {
        return callback({
            code: grpc.status.INVALID_ARGUMENT,
            details: 'Password must be at least 6 characters long'
        });
    }

    // Check if the username already exists
    const userExists = users.some(user => user.username === username);
    if (userExists) {
        return callback({
            code: grpc.status.ALREADY_EXISTS,
            details: 'Username already taken'
        });
    }

    // Create and store the new user
    const newUser = {
        userId: (users.length + 1).toString(),
        username,
        password // You should hash this in real applications!
    };

    users.push(newUser);

    // Respond with success
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

 server.addService(authProto.service, {
   register,
   login,
   getAllUsers,
 });
 
 server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
   console.log('Auth service running at http://0.0.0.0:50051');
 });
 
 // Optional: graceful shutdown
 process.on('SIGINT', () => {
   console.log('Shutting down Auth gRPC server...');
   server.forceShutdown();
   process.exit();
 });
 