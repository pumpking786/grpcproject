// // grpc/client.js
// const grpc = require('@grpc/grpc-js');
// const protoLoader = require('@grpc/proto-loader');

// // Load proto files
// const authProtoPath = './proto/auth.proto';
// const blogProtoPath = './proto/blog.proto';

// const authPackageDef = protoLoader.loadSync(authProtoPath);
// const blogPackageDef = protoLoader.loadSync(blogProtoPath);

// // Load gRPC Packages
// const authProto = grpc.loadPackageDefinition(authPackageDef);
// const blogProto = grpc.loadPackageDefinition(blogPackageDef);

// // Create gRPC Clients
// const authStub = new authProto.AuthService('0.0.0.0:50051', grpc.credentials.createInsecure());
// const blogStub = new blogProto.BlogService('0.0.0.0:50052', grpc.credentials.createInsecure());

// module.exports = {
//   authStub,
//   blogStub,
// };
