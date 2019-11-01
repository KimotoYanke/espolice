import { Router } from "express";
const router = Router();
router.use("/a", require("./a.js"));
router.use("/d", require("./d.js"));
export default router;
