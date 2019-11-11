const { Router } = require("express");

const router = Router();
router.use("/f", require("./f"));
router.use("/a", require("./a.js"));
router.use("/d", require("./d.js"));
module.exports = router;
