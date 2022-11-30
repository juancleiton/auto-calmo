import express, { Express, Request, Response } from "express";
import { router } from "./routes/index.routes";

const app: Express = express();

app.use(express.json());
app.use("/v1", router);

export { app };
