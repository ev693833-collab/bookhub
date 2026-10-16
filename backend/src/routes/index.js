const express = require("express");
const router = express.Router();

const authRoutes = require('./auth');
const spotifyRoutes = require('./spotify');
const youtubeRoutes = require('./youtube');
const musicRoutes = require('./music');
const companiesRoutes = require('./companies');

router.use('/auth', authRoutes);
router.use('/spotify', spotifyRoutes);
router.use('/youtube', youtubeRoutes);
router.use('/music', musicRoutes);
router.use('/companies', companiesRoutes);

router.get("/", (req, res) => {
  res.json({ message: "API DevSongs rodando com sucesso!", status: "online" });
});

module.exports = router;
