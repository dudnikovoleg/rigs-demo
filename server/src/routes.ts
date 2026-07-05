import { Router } from "express";
import {
  createShipment,
  getItems,
  getPorts,
  getRigDetail,
  getRigSummaries,
  getShipments,
  getShipmentsForRig,
} from "./store.js";

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

routes.get("/api/ports", (_req, res) => {
  res.json(getPorts());
});

routes.get("/api/items", (_req, res) => {
  res.json(getItems());
});

routes.get("/api/shipments", (req, res) => {
  const { rigId } = req.query;
  res.json(typeof rigId === "string" ? getShipmentsForRig(rigId) : getShipments());
});

routes.post("/api/shipments", (req, res) => {
  const { rigId, itemId, quantity } = req.body ?? {};
  if (typeof rigId !== "string" || typeof itemId !== "string" || typeof quantity !== "number") {
    res.status(400).json({ error: "body must be { rigId, itemId, quantity }" });
    return;
  }
  try {
    res.status(201).json(createShipment({ rigId, itemId, quantity }));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});
