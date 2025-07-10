const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const chatbotRoutes = require("./routes/chatbotRoutes");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
app.use("/api/chatbot", chatbotRoutes);

// Auth Routes 
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const path = require("path");

// Add this line:
app.use(express.static(path.join(__dirname, "public")));


// Test Route
app.get("/", (req, res) => {
  res.send("Restaurant Bot Backend Running");
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () =>
      console.log(`Server running at http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.log(err));
