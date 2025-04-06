const Product = require("./../models/product_model");
const catchAsync = require("./../utils/catchAsync");
const AppError=require('./../utils/appError');
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

exports.createProduct = catchAsync(async (req, res, next) => {
  const newProduct = await Product.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      product: newProduct
    }})
});

exports.updateProduct = catchAsync(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return next(new appError("No tour found with this id", 404));
  }

  res.status(201).json({
    status: "success",
    data: {
      product,
    },
  });
});

exports.deleteProduct = catchAsync(async (req, res) => {
  const product=await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return next(new appError("No tour found with this id", 404));
  }

  res.status(204).json({
    status: "success",
    dataProduct
  });
});

// Get total count of documents
exports.getCount = catchAsync( async (req, res) => {
        const totalDocuments = await Product.countDocuments();
        res.status(200).json({
            status: "success",
            data: totalDocuments,
          });
});

// Search for a brand or company
exports.searchBiscuit = catchAsync(async (req, res) => {
  console.log("inside search fun..");
        const searchQuery = req.body.query;
        if (!searchQuery) {
          console.log(searchQuery);
            return res.status(400).json({ message: "Search query is required" });
        }

        const results = await Product.find({
            $or: [
                { "Brand Name": { $regex: searchQuery, $options: "i" } },
            ]
        });
        console.log("Raw Search Results:", results);
        if (results.length === 0) {
            return res.status(404).json({ message: "No matching results found" });
        }

        res.status(200).json({
            status: "success",
            data: results,
          });

       
});

exports.getNutrients=catchAsync(
  async(req,res)=>{
    const productId = req.query.id; // Get product ID from query params

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Fetch product details by ID
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    console.log(product.nutrients);

    res.status(200).json({
      status: "success",
      data: results.map(({ "Brand Name": brand, nutrients }) => ({
        brand,
        nutrients
    })),
    });

  }
);

exports.scanImage=catchAsync(
  async(req,res)=>{

    console.log("Request received:", req.file);
    if (!req.file) {
      console.log("problemmmmmmmmm");
      return res.status(400).json({
        status: "fail",
        message: "No file uploaded",
      });
    }

    console.log("Image received:!!!");
  
    // Process the image (Here, we're just returning its details)
    res.status(200).json({
      status: "success",
      message: "Image received successfully!",
      filename: req.file.originalname,
      size: `${req.file.size} bytes`,
    });
  }
);