import express, { Application } from "express";
import { cartRoutes } from "./cartRoutes";

export function createApp(): Application {
  const app = express();
  app.use(express.json());
  app.use(cartRoutes);
  return app;
}
