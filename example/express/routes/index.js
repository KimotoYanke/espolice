import { Router } from "express";
const router = Router();
router.use("/b", require("./b.js"));
export default router;
