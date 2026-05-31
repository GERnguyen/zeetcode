import express from "express";
import battleRouter from "./battle.router";

const v1Router = express.Router();

v1Router.use("/battles", battleRouter);

export default v1Router;
