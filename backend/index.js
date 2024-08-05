const express = require("express");
const { Bot } = require("grammy");

const bot = new Bot("TOPSECRET:TOKEN");
const app = express();

app.use(express.json());

app.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { total_count, photos } = await bot.api.getUserProfilePhotos(id);
  // Photos are all of user's photos. We want the first one.

  if (total_count !== 0) {
    const currentPhoto = photos[0];
    // currentPhoto is an array of the same photo in different resolutions. We want the last one.

    const bestLookingSelfie = currentPhoto[currentPhoto.length - 1];

    res.json(bestLookingSelfie);
  }

  res.json({ src: "" });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
