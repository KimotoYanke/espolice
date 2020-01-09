const { Router } = require("express");

const router = Router();
router.use("/b", require("./b.js"));
router.get("/", (req, res) => {
  res.send(["<ul>", '<li><a href="./b">b</a></li>', "</ul>"].join(""));
});
module.exports = router;
