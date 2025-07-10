const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");
const Reservation = require("../models/Reservation");
const Order = require("../models/Order");

// POST /api/chatbot/restaurants
exports.addRestaurant = async (req, res) => {
  try {
    const restaurant = new Restaurant(req.body);
    await restaurant.save();
    res
      .status(201)
      .json({ message: "Restaurant added successfully", restaurant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/chatbot/restaurants
exports.getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/chatbot/restaurants/search?cuisine=Indian&location=Delhi
exports.searchRestaurants = async (req, res) => {
  try {
    const { cuisine, location, priceRange } = req.query;
    let filters = {};

    if (cuisine) filters.cuisine = { $regex: cuisine, $options: "i" };
    if (location) filters.location = { $regex: location, $options: "i" };
    if (priceRange) filters.priceRange = priceRange;

    const results = await Restaurant.find(filters);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/chatbot/restaurants/:id/menu
exports.addMenuItem = async (req, res) => {
    try {
      const { id } = req.params;
      const menuItem = new MenuItem({
        restaurantId: id,
        ...req.body
      });
      await menuItem.save();
      res.status(201).json({ message: 'Menu item added', menuItem });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};
  
// GET /api/chatbot/restaurants/:id/menu
exports.getMenuItems = async (req, res) => {
    try {
      const { id } = req.params;
      const items = await MenuItem.find({ restaurantId: id });
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};

// POST /api/chatbot/reservations
exports.bookReservation = async (req, res) => {
    try {
      const reservation = new Reservation(req.body);
      await reservation.save();
      res.status(201).json({ message: 'Reservation booked', reservation });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};
  
// GET /api/chatbot/reservations/:name
exports.viewReservations = async (req, res) => {
    try {
      const name = req.params.name;
      const reservations = await Reservation.find({ name });
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};
  
// DELETE /api/chatbot/reservations/:id
exports.cancelReservation = async (req, res) => {
    try {
      const { id } = req.params;
      await Reservation.findByIdAndDelete(id);
      res.json({ message: 'Reservation cancelled' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};

// POST /api/chatbot/orders
exports.placeOrder = async (req, res) => {
    try {
      const order = new Order(req.body);
      await order.save();
      res.status(201).json({ message: 'Order placed', orderId: order._id });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};
  
// GET /api/chatbot/orders/:id/status
exports.trackOrderStatus = async (req, res) => {
    try {
      const order = await Order.findById(req.params.id).populate('items.itemId');
      if (!order) return res.status(404).json({ error: 'Order not found' });
  
      res.json({ status: order.status, createdAt: order.createdAt, items: order.items });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};
  
// GET /api/chatbot/orders/user/:name (optional if name is stored in order)
exports.viewUserOrders = async (req, res) => {
    try {
      const orders = await Order.find({ name: req.params.name });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};

exports.chatHandler = async (req, res) => {
  const userMessage = req.body.message.toLowerCase();

  try {
    // 🧠 If user asks for restaurants
    if (userMessage.includes("restaurant") || userMessage.includes("find")) {
      // Try to extract cuisine and location
      const cuisines = [
        "indian",
        "chinese",
        "italian",
        "mexican",
        "thai",
        "japanese",
      ];
      const cities = [
        "delhi",
        "mumbai",
        "bangalore",
        "hyderabad",
        "pune",
        "kolkata",
      ];

      let cuisineFound = cuisines.find((c) => userMessage.includes(c));
      let locationFound = cities.find((c) => userMessage.includes(c));

      let query = {};
      if (cuisineFound) query.cuisine = { $regex: cuisineFound, $options: "i" };
      if (locationFound)
        query.location = { $regex: locationFound, $options: "i" };

      const results = await Restaurant.find(query);

      if (results.length > 0) {
        let reply = `Found ${results.length} restaurants:\n\n`;
        results.forEach((r) => {
          reply += `🍽️ ${r.name} (${r.cuisine}) - ${r.location}, ${r.priceRange}\n`;
        });
        return res.json({ reply });
      } else {
        return res.json({
          reply:
            "Sorry, I couldn't find any matching restaurants. Try different keywords!",
        });
      }
    }

    // Reservation logic inside chatHandler:
    if (userMessage.includes("book") || userMessage.includes("reserve")) {
      try {
        // Extract restaurant name, party size, date and time
        const restaurantMatch = userMessage.match(/at\s(.+?)\sfor/i);
        const partySizeMatch = userMessage.match(/for\s(\d+)/i);
        const dateMatch = userMessage.match(/on\s([\d\w\s]+)/i); // Matches "on 15th August"
        const timeMatch = userMessage.match(
          /at\s(\d{1,2}(:\d{2})?\s?(am|pm)?)/i
        ); // Matches "at 8:30pm"

        const restaurantName = restaurantMatch
          ? restaurantMatch[1].trim()
          : null;
        const partySize = partySizeMatch ? parseInt(partySizeMatch[1]) : null;
        const date = dateMatch ? dateMatch[1].trim() : "Unknown";
        const time = timeMatch ? timeMatch[1].trim() : "Unknown";

        if (!restaurantName || !partySize) {
          return res.json({
            reply:
              "Please provide details like: 'Book at Spicy Bistro for 2 on 12th August at 7pm'",
          });
        }

        const restaurant = await Restaurant.findOne({
          name: { $regex: restaurantName, $options: "i" },
        });

        if (!restaurant) {
          return res.json({
            reply: `Sorry, I couldn't find a restaurant named "${restaurantName}".`,
          });
        }

        const reservation = new Reservation({
          restaurantId: restaurant._id,
          name: "ChatUser",
          date,
          time,
          partySize,
          notes: "Reserved via chatbot",
        });

        await reservation.save();

        return res.json({
          reply: `✅ Your table for ${partySize} at *${restaurant.name}* is booked on ${date} at ${time}.`,
        });
      } catch (error) {
        console.error(error);
        return res.json({
          reply: "There was an error while processing your reservation.",
        });
      }
    }

    if (userMessage.includes("track order")) {
      try {
        const match = userMessage.match(/track order\s+([a-f0-9]{24})/i);
        const orderId = match ? match[1] : null;

        if (!orderId) {
          return res.json({ reply: "Please provide a valid Order ID." });
        }

        const order = await Order.findById(orderId).populate("items.itemId");

        if (!order) {
          return res.json({ reply: `❌ No order found with ID: ${orderId}` });
        }

        let reply = `🛵 *Order Status*: ${order.status}\n📦 *Items*:\n`;

        order.items.forEach((item) => {
          reply += `- ${item.quantity} × ${item.itemId.name}\n`;
        });

        const date = new Date(order.createdAt).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        });

        reply += `📅 *Placed at*: ${date}`;

        return res.json({ reply });
      } catch (error) {
        console.error("❌ Tracking error:", error);
        return res.json({
          reply: "There was an error while tracking your order.",
        });
      }
    }
      

    if (userMessage.includes("pay for order")) {
      try {
        const match = userMessage.match(
          /pay for order\s+([a-f0-9]{24})\s+using\s+([a-zA-Z]+)/i
        );

        if (!match) {
          return res.json({
            reply:
              "Please provide order ID and payment method like 'Pay for order 686f... using UPI'",
          });
        }

        const orderId = match[1];
        const method = match[2].toUpperCase();

        const order = await Order.findById(orderId).populate("items.itemId");

        if (!order) {
          return res.json({ reply: `❌ No order found with ID: ${orderId}` });
        }

        if (order.paymentStatus === "Paid") {
          return res.json({
            reply: `✅ Order ${orderId} is already marked as paid.`,
          });
        }

        // Calculate total
        let total = 0;
        order.items.forEach((item) => {
          total += item.quantity * item.itemId.price;
        });

        // Simulate payment success
        order.paymentStatus = "Paid";
        order.paymentMethod = method;
        order.totalAmount = total;
        await order.save();

        return res.json({
          reply: `✅ Simulated payment successful via ${method}.\n💰 Amount Paid: ₹${total}`,
        });
      } catch (error) {
        console.error("❌ Simulated payment error:", error);
        return res.json({
          reply: "There was an error while processing your payment.",
        });
      }
    }
    

    if (userMessage.includes("order")) {
      try {
        // Extract restaurant name
        const restMatch = userMessage.match(/from\s(.+?)(?:\sfor|\sto|$)/i);
        const restaurantName = restMatch ? restMatch[1].trim() : null;

        if (!restaurantName) {
          return res.json({
            reply:
              "Please specify the restaurant name like 'Order ... from Spicy Bistro'",
          });
        }

        const deliveryMatch = userMessage.includes("pickup")
          ? "pickup"
          : "delivery";

        // Extract address (if delivery)
        const addrMatch = userMessage.match(/to\s(.+)$/i);
        const address = addrMatch ? addrMatch[1].trim() : "Not Provided";

        // ✅ Step 1: Fetch restaurant
        const restaurant = await Restaurant.findOne({
          name: { $regex: new RegExp("^" + restaurantName + "$", "i") },
        });

        if (!restaurant) {
          return res.json({
            reply: `Restaurant "${restaurantName}" not found.`,
          });
        }

        // ✅ Step 2: Fetch menu items of that restaurant
        const allItems = await MenuItem.find({ restaurantId: restaurant._id });
        console.log(
          "🍽 Menu items in DB:",
          allItems.map((i) => i.name)
        );

        // ✅ Step 3: Extract items from user message
        const itemMatches = [...userMessage.matchAll(/(\d+)\s([a-zA-Z\s]+)/g)];
        console.log(
          "🧠 Extracted from user message:",
          itemMatches.map((m) => m[1] + " " + m[2])
        );

        const itemsToOrder = [];

        for (const match of itemMatches) {
          const qty = parseInt(match[1]);
          const itemName = match[2].trim().toLowerCase();

          const menuItem = allItems.find(
            (i) =>
              itemName.includes(i.name.trim().toLowerCase()) ||
              i.name.trim().toLowerCase().includes(itemName)
          );

          console.log(
            "🔍 Looking for:",
            itemName,
            "➡️ Found:",
            menuItem?.name || "Not Found"
          );

          if (menuItem) {
            itemsToOrder.push({ itemId: menuItem._id, quantity: qty });
          }
        }
          

        // ✅ Step 4: Respond or reject
        if (itemsToOrder.length === 0) {
          return res.json({
            reply: "No matching menu items found. Please check item names.",
          });
        }

        const order = new Order({
          restaurantId: restaurant._id,
          items: itemsToOrder,
          deliveryType: deliveryMatch,
          address,
          status: "Confirmed",
        });

        await order.save();

        return res.json({
          reply: `✅ Your order from *${restaurant.name}* has been placed successfully! Order ID: ${order._id}`,
        });
      } catch (error) {
        console.error("❌ Order error:", error);
        return res.json({
          reply: "There was an error while placing your order.",
        });
      }
    }   
    
    if (userMessage.includes("show my reservations")) {
      try {
        const reservations = await Reservation.find({
          name: "ChatUser",
        }).populate("restaurantId");

        if (!reservations.length) {
          return res.json({ reply: "You have no reservations at the moment." });
        }

        let reply = `📅 Your reservations:\n\n`;

        reservations.forEach((r) => {
          reply += `• 🏨 ${r.restaurantId?.name || "Unknown"} on ${r.date} at ${
            r.time
          } for ${r.partySize} people\nReservation ID: ${r._id}\n\n`;
        });

        return res.json({ reply });
      } catch (error) {
        console.error("❌ View reservations error:", error);
        return res.json({ reply: "Unable to fetch your reservations." });
      }
    }

    if (userMessage.includes("cancel reservation")) {
      try {
        const match = userMessage.match(/cancel reservation\s+([a-f0-9]{24})/i);
        const reservationId = match ? match[1] : null;

        if (!reservationId) {
          return res.json({ reply: "Please provide a valid Reservation ID." });
        }

        const result = await Reservation.findByIdAndDelete(reservationId);

        if (!result) {
          return res.json({
            reply: `No reservation found with ID: ${reservationId}`,
          });
        }

        return res.json({
          reply: `✅ Reservation ${reservationId} has been cancelled.`,
        });
      } catch (error) {
        console.error("❌ Cancel reservation error:", error);
        return res.json({
          reply: "There was an error cancelling the reservation.",
        });
      }
    }


    // 🧠 Default fallback
    return res.json({
      reply:
        "I'm here to help you find restaurants, book tables, and order food!",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ reply: "Something went wrong. Please try again." });
  }
};
  
