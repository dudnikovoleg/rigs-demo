import { Router } from "express";
import {
  createShipment,
  getItems,
  getPorts,
  getRigDetail,
  getRigSummaries,
  getShipments,
  getShipmentsForRig,
  SHIPMENT_STATUSES,
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
  const { rigId, itemId, quantity, status, progress } = req.body ?? {};
  if (typeof rigId !== "string" || typeof itemId !== "string" || typeof quantity !== "number") {
    res.status(400).json({ error: "body must be { rigId, itemId, quantity, status?, progress? }" });
    return;
  }
  if (status !== undefined && !SHIPMENT_STATUSES.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${SHIPMENT_STATUSES.join(", ")}` });
    return;
  }
  if (
    progress !== undefined &&
    (typeof progress !== "number" || Number.isNaN(progress) || progress < 0 || progress > 1)
  ) {
    res.status(400).json({ error: "progress must be a number between 0 and 1" });
    return;
  }
  try {
    res.status(201).json(createShipment({ rigId, itemId, quantity, status, progress }));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});
