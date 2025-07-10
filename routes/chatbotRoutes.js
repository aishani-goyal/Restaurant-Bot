const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");
const authMiddleware = require("../middlewares/authMiddleware");

// Protected chatbot route
router.post("/message", authMiddleware, chatbotController.chatHandler);

// Restaurant routes
router.post("/restaurants", chatbotController.addRestaurant);
router.get("/restaurants", chatbotController.getRestaurants);
router.get("/restaurants/search", chatbotController.searchRestaurants);

// Menu Items
router.post('/restaurants/:id/menu', chatbotController.addMenuItem);
router.get('/restaurants/:id/menu', chatbotController.getMenuItems);

// Reservations
router.post('/reservations', chatbotController.bookReservation);
router.get('/reservations/:name', chatbotController.viewReservations);
router.delete('/reservations/:id', chatbotController.cancelReservation);

// Orders
router.post('/orders', chatbotController.placeOrder);
router.get('/orders/:id/status', chatbotController.trackOrderStatus);
router.get('/orders/user/:name', chatbotController.viewUserOrders); // optional

router.post("/message", chatbotController.chatHandler);

module.exports = router;
