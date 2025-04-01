const express = require("express");
const authController = require(`./../controller/auth_controller`);
const userRouter = express.Router();

userRouter.route("/signup").post(authController.signup);
userRouter.route("/signin").post(authController.signin);

module.exports = userRouter;