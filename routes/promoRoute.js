import express from "express";
import { getPromo, getAdminPromo, savePromo } from "../controllers/promoController.js";
//import adminAuth from "../middleware/adminAuth.js"; // your existing admin middleware

const promoRouter = express.Router();

// Public — user-facing website fetches this
promoRouter.get("/user", getPromo);

// Admin protected
promoRouter.get("/admin", getAdminPromo);
promoRouter.post("/admin", savePromo);

export default promoRouter;