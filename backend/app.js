const express = require("express");
const cors = require("cors");
require("dotenv").config();
const userRouter = require(`./routes/user_router`);
const productRouter = require(`./routes/product_router`);

const app = express();
app.use(cors({
  origin: 'http://localhost:8081', // your frontend port
  credentials: true // to allow cookies
}));
app.use(express.json());
app.use(`/users`, userRouter);
app.use(`/products`,productRouter);

app.get("/", (req, res) => {
    res.send("Server is running...");
  });

app.get("/", (req, res) => {
  res.send("OCR API is running...");
  });

module.exports=app;
