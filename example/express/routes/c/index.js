const { Router } = require("express");

const router = Router();
router.use("/a", require("./a"));
router.get("/", (req, res) => {
  res.send(["<ul>", "</ul>"].join(""));
});
module.exports = router;
