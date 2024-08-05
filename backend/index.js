const express = require("express");
const { Bot } = require("grammy");

const bot = new Bot("TOPSECRET:TOKEN");
const app = express();

app.use(express.json());

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
