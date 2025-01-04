const Product = require("../models/Product");
const Purchase = require("../models/purchase");
const Sales = require("../models/sales");

// Add Post (with category and reorder point)
const addProduct = (req, res) => {
  const addProduct = new Product({
    userID: req.body.userId,
    name: req.body.name,
    manufacturer: req.body.manufacturer,
    stock: 0,
    description: req.body.description,
    category: req.body.category, // New field for category
    reorderPoint: req.body.reorderPoint, // New field for reorder point
  });

  addProduct
    .save()
    .then((result) => {
      res.status(200).send(result);
    })
    .catch((err) => {
      res.status(402).send(err);
    });
};

// Get All Products
const getAllProducts = async (req, res) => {
  try {
    const findAllProducts = await Product.find({
      userID: req.params.userId,
    }).sort({ _id: -1 }); // -1 for descending;
    res.json(findAllProducts);
  } catch (err) {
    res.status(500).send("Error fetching products");
  }
};

// Delete Selected Product
const deleteSelectedProduct = async (req, res) => {
  try {
    const deleteProduct = await Product.deleteOne({ _id: req.params.id });
    const deletePurchaseProduct = await Purchase.deleteOne({
      ProductID: req.params.id,
    });
    const deleteSaleProduct = await Sales.deleteOne({
      ProductID: req.params.id,
    });

    res.json({
      deleteProduct,
      deletePurchaseProduct,
      deleteSaleProduct,
    });
  } catch (err) {
    res.status(500).send("Error deleting product");
  }
};

// Update Selected Product (including category and reorder point)
const updateSelectedProduct = async (req, res) => {
  try {
    const updatedResult = await Product.findByIdAndUpdate(
      { _id: req.body.productID },
      {
        name: req.body.name,
        manufacturer: req.body.manufacturer,
        description: req.body.description,
        category: req.body.category, // Update category
        reorderPoint: req.body.reorderPoint, // Update reorder point
      },
      { new: true }
    );
    res.json(updatedResult);
  } catch (error) {
    console.log(error);
    res.status(402).send("Error updating product");
  }
};

// Search Products (by name or category)
const searchProduct = async (req, res) => {
  const searchTerm = req.query.searchTerm;
  const category = req.query.category; // New field for category search
  
  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { category: { $regex: category, $options: "i" } },
      ],
    });
    res.json(products);
  } catch (err) {
    res.status(500).send("Error searching for products");
  }
};

// Record stock in/out transactions
const recordStockTransaction = async (req, res) => {
  const { productID, quantity, transactionType } = req.body; // transactionType: 'in' or 'out'

  try {
    const product = await Product.findById(productID);
    if (!product) {
      return res.status(404).send("Product not found");
    }

    let updatedStock = product.stock;

    if (transactionType === "in") {
      updatedStock += quantity; // Add stock
    } else if (transactionType === "out") {
      if (updatedStock >= quantity) {
        updatedStock -= quantity; // Subtract stock
      } else {
        return res.status(400).send("Insufficient stock");
      }
    } else {
      return res.status(400).send("Invalid transaction type");
    }

    product.stock = updatedStock;
    await product.save();
    res.status(200).json({ product, message: "Stock updated successfully" });
  } catch (error) {
    res.status(500).send("Error recording stock transaction");
  }
};

module.exports = {
  addProduct,
  getAllProducts,
  deleteSelectedProduct,
  updateSelectedProduct,
  searchProduct,
  recordStockTransaction, // Exposed new method for stock transactions
};
