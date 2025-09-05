import { Router } from "express";
import {
  createLog,
  getHistory,
  getInsights,
  getLogById,
  updateLog,
  deleteLog,
  getStats,
} from "../controllers/symptom.controller.js";
import { auth } from "../middleware/auth.js";
import { validate, validateQuery } from "../utils/validation.js";
import { symptomLogSchema, locationSchema } from "../utils/validation.js";

const router = Router();

// Create new symptom log
router.post("/log", auth(), validate(symptomLogSchema), createLog);

// Get symptom history with filtering and pagination
router.get("/history", auth(), validateQuery(locationSchema), getHistory);

// Get specific symptom log by ID
router.get("/log/:id", auth(), getLogById);

// Update symptom log
router.patch("/log/:id", auth(), validate(symptomLogSchema), updateLog);

// Delete symptom log
router.delete("/log/:id", auth(), deleteLog);

// Get insights and correlations
router.get("/insights", auth(), getInsights);

// Get statistical summary
router.get("/stats", auth(), getStats);

export default router;
