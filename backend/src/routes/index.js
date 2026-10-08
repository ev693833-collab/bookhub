const express = require("express");
const router = express.Router();

const authRoutes = require('./auth');





router.use('/auth', authRoutes);





router.get("/", (req, res) => {
  res.send("API rodando!");
});

module.exports = router;
