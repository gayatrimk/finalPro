const express = require("express");
const cors = require("cors");
require("dotenv").config();
const userRouter = require(`./routes/user_router`);
const productRouter = require(`./routes/product_router`);
const ocrRouter=require(`./routes/ocr`);

const app = express();
app.use(cors());
app.use(express.json());
app.use(`/users`, userRouter);
app.use(`/products`,productRouter);
app.use(`/ocr`,ocrRouter);

app.get("/", (req, res) => {
    res.send("Server is running...");
  });

app.get("/", (req, res) => {
  res.send("OCR API is running...");
  });

module.exports=app;
