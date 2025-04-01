const express = require("express");
const productController = require(`./../controller/product_controller`);
const productRouter = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

productRouter
  .route("/")
  .post(productController.createProduct);

productRouter
  .route("/:id")
  .patch(productController.updateProduct)
  .delete(productController.deleteProduct);

productRouter.route("/nutrients").get(productController.getNutrients);
productRouter.route("/count").get(productController.getCount);
productRouter.route("/search").post(productController.searchBiscuit);
productRouter.route("/scan").post(upload.single("image"),productController.scanImage);

module.exports = productRouter;