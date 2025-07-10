const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cuisine: String,
  location: String,
  priceRange: String,
  description: String,
  imageUrl: String,
});

module.exports = mongoose.model("Restaurant", restaurantSchema);
