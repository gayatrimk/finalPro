const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    "Brand Name":String,
    "ENERGY(kcal)":Number,
    "PROTEIN":Number,
    "CARBOHYDRATE":Number,
    "ADDED SUGARS":Number,
    "TOTAL SUGARS":Number,
    "TOTAL FAT":Number,
    "SATURATED FAT":Number,
    "TRANS FAT":Number,
    "CHOLESTEROL(mg)":Number,
    "SODIUM(mg)":Number,
});

const products = mongoose.model("products", productSchema);
module.exports = products;
