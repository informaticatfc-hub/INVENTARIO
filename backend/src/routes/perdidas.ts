import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.ts";
import * as ctrl from "../controllers/perdidas.controller.ts";

const router = Router();
router.use(authenticate);

router.get("/",    ctrl.listar);
router.post("/",   authorize("ADMIN", "ALMACENISTA"), ctrl.crear);
router.get("/:id", ctrl.obtener);

export default router;
