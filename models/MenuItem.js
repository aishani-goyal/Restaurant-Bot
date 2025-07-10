const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  name: { type: String, required: true },
  price: Number,
  description: String,
  imageUrl: String,
});

module.exports = mongoose.model("MenuItem", menuItemSchema);
