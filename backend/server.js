const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
dotenv.config({ path: `./config.env` });

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.PASSWORD);
mongoose
  .connect(DB)
  .then(() => {
    console.log("Connection success");
});

const app = require("./app");
app.use(cors());

const port = process.env.PORT;
app.listen(port, () => {console.log(`App running on port ${port}...`);});

process.on(`unhandledRejection`,err=>{console.log(err.name,err.message);});

//>>npm start




require("dotenv").config();
const ocrRoutes = require("./routes/ocr");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", ocrRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.send("OCR API is running...");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ App running on port ${PORT}...`);
});
