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
    "Dietary Fiber":Number,
    "Mono Unsaturated Fatty Acids":Number,
    "Poly Unsaturated Fatty Acids":Number,
    "Category":String,
});

const products = mongoose.model("label_products", productSchema);
module.exports = products;
