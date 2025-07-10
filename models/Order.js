const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  items: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
      quantity: Number,
    },
  ],
  deliveryType: String, // "pickup" or "delivery"
  address: String,
  status: { type: String, default: "Confirmed" },
  createdAt: { type: Date, default: Date.now },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Pending",
  },
  paymentMethod: String,
  totalAmount: Number,
});

module.exports = mongoose.model("Order", orderSchema);
