import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.ts";
import * as ctrl from "../controllers/materiales.controller.ts";

const router = Router();
router.use(authenticate);

router.get("/",    ctrl.listar);
router.post("/",   authorize("ADMIN", "ALMACENISTA"), ctrl.crear);
router.get("/:id", ctrl.obtener);
router.put("/:id", authorize("ADMIN", "ALMACENISTA"), ctrl.actualizar);

export default router;
