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