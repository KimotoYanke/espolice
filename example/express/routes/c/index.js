const { Router } = require("express");

const router = Router();
router.use("/a", require("./a.js"));
router.get("/", (req, res) => {
  res.send(["<ul>", '<li><a href="./a">a</a></li>', "</ul>"].join(""));
});
module.exports = router;
