import { Router } from "express";
import { getItems, getRigDetail, getRigSummaries } from "./store.js";

export const routes = Router();

routes.get("/api/rigs", (_req, res) => {
  res.json(getRigSummaries());
});

routes.get("/api/rigs/:id", (req, res) => {
  const rig = getRigDetail(req.params.id);
  if (!rig) {
    res.status(404).json({ error: `rig not found: ${req.params.id}` });
    return;
  }
  res.json(rig);
});

routes.get("/api/items", (_req, res) => {
  res.json(getItems());
});
