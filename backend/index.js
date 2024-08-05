const express = require("express");
const { Bot } = require("grammy");
const { createProxyMiddleware } = require("http-proxy-middleware");

const TOKEN = "TOPSECRET:TOKEN";
const bot = new Bot(TOKEN);
const app = express();

app.use(express.json());

app.use(
  "/bot-api",
  createProxyMiddleware({
    target: "https://api.telegram.org/file/bot" + TOKEN,
    changeOrigin: true, // Make sure to set this, otherwise your requests will be rejected by Telegram servers
  })
);

app.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { total_count, photos } = await bot.api.getUserProfilePhotos(id);
  // Photos are all of user's photos. We want the first one.

  if (total_count !== 0) {
    const currentPhoto = photos[0];
    // currentPhoto is an array of the same photo in different resolutions. We want the last one.

    const { file_id } = currentPhoto[currentPhoto.length - 1];

    console.log(file_id); // Save to database

    const file = await bot.api.getFile(file_id);

    res.json({ src: "http://localhost:3000/bot-api/" + file.file_path });
  }

  res.json({ src: "" });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
