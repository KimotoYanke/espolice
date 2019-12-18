const { Router } = require("express");

const router = Router();
router.use("/c", require("./c"));
router.use("/b", require("./b.js"));
router.use("/test", require("./test.js"));
router.use("/testsub", require("./testsub.js"));
router.use("/x", require("./x.js"));
router.get("/", (req, res) => {
  res.send(
    [
      "<ul>",
      '<li><a href="./b">b</a></li>',
      '<li><a href="./test">test</a></li>',
      '<li><a href="./testsub">testsub</a></li>',
      '<li><a href="./x">x</a></li>',
      "</ul>"
    ].join("")
  );
});
module.exports = router;
