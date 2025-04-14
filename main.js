const express = require("express");
const { authStub, blogStub } = require("./grpc/client"); // 👈 Import from grpc folder

const app = express();
app.use(express.json());

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
