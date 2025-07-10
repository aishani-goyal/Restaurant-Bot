const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  name: String,
  date: String,
  time: String,
  partySize: Number,
  notes: String,
});

module.exports = mongoose.model("Reservation", reservationSchema);
