const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");
const folderRoutes = require("./routes/folderRoutes");
require("dotenv").config();

const app = express();

// Middleware

// Dynamic CORS configuration - allows all origins but supports credentials
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, etc.) or any origin
      callback(null, true); 
    },
    credentials: true, // Set this to true to allow credentials (cookies, auth headers, etc.)
  })
);

app.use(express.urlencoded({ extended: false })); // For parsing application/x-www-form-urlencoded
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/folders", folderRoutes);

// Handle unhandled routes
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
