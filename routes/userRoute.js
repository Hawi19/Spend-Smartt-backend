import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../authMiddleware.js";
import { User } from "../models/userModel.js";
import { verifyToken } from "../authMiddleware.js";

const router = express.Router();

// Signup Route
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "This username or email already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashPassword,
    });

    return res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

      const token = jwt.sign(
        { userId: user._id, type: "auth", isLogged: true },
        SECRET_KEY,
        {
          expiresIn: "1h",
        }
      );

    return res.status(200).json({ token, username: user.username });
  } catch (error) {
    console.error("Login error:", error); // Log the full error
    return res.status(500).json({ message: "Server error" });
  }
});

// Assuming you're using Express
router.put("/income", verifyToken, async (req, res) => {
  const { totalIncome } = req.body;
  const userId = req.user.userId; // Extract userId from token

  console.log("Updating income for user:", userId, "with totalIncome:", totalIncome);

  try {
    if (typeof totalIncome !== 'number' || totalIncome < 0) {
      return res.status(400).json({ message: "Invalid income value." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.totalIncome = totalIncome;
    await user.save();

    return res.status(200).json({
      message: "User income updated successfully.",
      user: {
        username: user.username,
        totalIncome: user.totalIncome,
      },
    });
  } catch (error) {
    console.error("Update income error:", error.message);
    return res.status(500).json({ message: "Server error while updating income." });
  }
});
// Fetch Income Route
router.get("/income", verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.status(200).json({ totalIncome: user.totalIncome });
    } catch (error) {
        console.error("Error fetching user income:", error);
        return res.status(500).json({ message: "Server error while fetching income." });
    }
});

export default router;
