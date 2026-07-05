import express from "express";
import { routes } from "./routes.js";

const app = express();
app.use(express.json());
app.use(routes);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`rigs-demo server listening on http://localhost:${port}`);
});
