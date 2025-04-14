const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");

// Secret key for signing JWT tokens
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "your-secret-key";

// Load the auth.proto file
const ProtoPath = "./proto/auth.proto";
const packageDefinition = protoLoader.loadSync(ProtoPath);
const authProto = grpc.loadPackageDefinition(packageDefinition).AuthService;

async function register(call, callback) {
  const { username, password } = call.request;

  if (!username || !password) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: "Username and password are required",
    });
  }

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      details:
        "Username must be 3-20 characters and contain only letters, numbers, and underscores",
    });
  }

  if (password.length < 6) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: "Password must be at least 6 characters long",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user, created] = await User.findOrCreate({
      where: { username },
      defaults: { password: hashedPassword },
    });

    if (!created) {
      return callback({
        code: grpc.status.ALREADY_EXISTS,
        details: "Username already taken",
      });
    }

    callback(null, { success: true });
  } catch (err) {
    console.error("Register error:", err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Something went wrong",
    });
  }
}

async function login(call, callback) {
  const { username, password } = call.request;

  try {
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return callback({
        code: grpc.status.NOT_FOUND,
        details: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        details: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    console.log("Generated token:", token); // Debug token
    callback(null, { token });
  } catch (err) {
    console.error("Login error:", err);
    callback({
      code: grpc.status.INTERNAL,
      details: "Login failed",
    });
  }
}

// Create a gRPC server
const server = new grpc.Server();

server.addService(authProto.service, {
  register,
  login,
});

server.bindAsync(
  "0.0.0.0:50051",
  grpc.ServerCredentials.createInsecure(),
  () => {
    console.log("Auth service running at http://0.0.0.0:50051");
  }
);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down Auth gRPC server...");
  server.forceShutdown();
  process.exit();
});
