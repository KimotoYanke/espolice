const { Router } = require("express");

const router = Router();
router.use("/c", require("./c"));
router.use("/b", require("./b.js"));
router.use("/test", require("./test.js"));
router.use("/testsub", require("./testsub.js"));
router.use("/x", require("./x.js"));
module.exports = router;
