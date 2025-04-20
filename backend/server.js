const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
dotenv.config({ path: `./config.env` });

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.PASSWORD);
mongoose
  .connect(DB)
  .then(() => {
    console.log("Connection success");
})
.catch((err) => {
    console.log("Database connection error: ", err);
});

const app = require("./app");  // Assuming you have an app.js in the same directory

app.use(cors());

// Ensure you're using a single app.listen call
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ App running on port ${port}...`);
});

// Handle unhandled promise rejections globally
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
});
