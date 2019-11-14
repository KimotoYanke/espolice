const { Router } = require("express");

const router = Router();
router.use("/d", require("./d.js"));
module.exports = router;
