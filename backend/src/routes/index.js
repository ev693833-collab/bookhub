const express = require("express");
const router = express.Router();

const authRoutes = require('./auth');
const spotifyRoutes = require('./spotify');
const booksRoutes = require('./books');
const youtubeRoutes = require('./youtube');
const musicRoutes = require('./music');

router.use('/auth', authRoutes);
router.use('/spotify', spotifyRoutes);
router.use('/books', booksRoutes);
router.use('/youtube', youtubeRoutes);
router.use('/music', musicRoutes);

router.get("/", (req, res) => {
  res.json({ message: "API DevSongs rodando com sucesso!", status: "online" });
});

module.exports = router;
