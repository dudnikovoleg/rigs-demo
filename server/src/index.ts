import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { getDb } from "./db/connection.js";
import { seedDatabase } from "./db/seed.js";
import { routes } from "./routes.js";

const db = getDb();
seedDatabase(db);

const app = express();
app.use(express.json());
app.use(routes);

// Resolves to client/dist from both src/ (dev) and dist/ (build).
const clientDist = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "client",
  "dist",
);

if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`rigs-demo server listening on http://localhost:${port}`);
});
