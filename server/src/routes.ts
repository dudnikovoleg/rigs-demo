import { Router } from "express";
import { getRigSummaries } from "./store.js";

export const routes = Router();

routes.get("/api/rigs", (_req, res) => {
  res.json(getRigSummaries());
});
