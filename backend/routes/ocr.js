const express = require("express");
const router = express.Router();
const ocrcontroller=require("./../controller/ocr_controller");
router.route("/image").post(ocrcontroller.ocrfunc);
module.exports = router;
