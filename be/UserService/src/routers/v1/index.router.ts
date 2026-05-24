import express from "express";
import pingRouter from "./ping.router";
import authRouter from "./auth.router";
import userRouter from "./user.router";

const v1Router = express.Router();

v1Router.use("/ping", pingRouter);
v1Router.use("/auth", authRouter);
v1Router.use("/users", userRouter);

export default v1Router;
