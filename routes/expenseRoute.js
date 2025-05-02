import express from "express";
import { Expense } from "../models/expenseModel.js";
import { User } from "../models/userModel.js";
import { verifyToken } from "../authMiddleware.js";

const router = express.Router();

// Create a new expense
router.post("/", verifyToken, async (req, res) => {
  const { category, amount, date, description } = req.body;
  const userId = req.user.userId;

  if (!category || !amount || !date) {
    return res.status(400).json({
      message: "Category, amount, and date are required.",
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Initialize expenses array if missing
    if (!user.expenses || !Array.isArray(user.expenses)) {
      user.expenses = [];
    }

    const expenseAmount = Number(amount);
    const totalIncome = Number(user.totalIncome);

    // Calculate remaining income using stored total expenses
    const remainingIncome = totalIncome - user.totalExpenses;

    if (expenseAmount > remainingIncome) {
      return res.status(400).json({
        message: "Cannot create expense: this exceeds your remaining income.",
      });
    }

    const newExpense = new Expense({
      userId,
      category,
      amount: expenseAmount,
      date: new Date(date),
      description,
    });

    await newExpense.save();

    // Update user document
    user.expenses.push(newExpense._id);
    user.totalExpenses += expenseAmount;
    await user.save();

    return res.status(201).json({
      message: "Expense created successfully",
      expense: newExpense,
      remainingIncome: totalIncome - user.totalExpenses,
    });
  } catch (error) {
    console.error("Error creating expense:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all expenses for a user
router.get("/", verifyToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId).populate({
      path: "expenses",
      options: { sort: { date: -1 } }, // Sort by most recent first
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Format dates and calculate total
    const expensesWithFormattedDates = user.expenses.map((expense) => ({
      ...expense.toObject(),
      date: expense.date.toISOString().split("T")[0], // YYYY-MM-DD format
    }));

    return res.status(200).json({
      expenses: expensesWithFormattedDates,
      totalExpenses: user.totalExpenses,
      remainingIncome: user.totalIncome - user.totalExpenses,
    });
  } catch (error) {
    console.error("Error fetching expenses:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Get an expense by ID
router.get("/:expenseId", verifyToken, async (req, res) => {
  const { expenseId } = req.params;
  const userId = req.user.userId;

  try {
    const expense = await Expense.findOne({
      _id: expenseId,
      userId,
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    return res.status(200).json({
      ...expense.toObject(),
      date: expense.date.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Error fetching expense:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Update an expense by ID
router.put("/:expenseId", verifyToken, async (req, res) => {
  const { expenseId } = req.params;
  const { category, amount, date, description } = req.body;
  const userId = req.user.userId;

  if (!category || !amount || !date) {
    return res.status(400).json({
      message: "Category, amount, and date are required.",
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const expense = await Expense.findOne({
      _id: expenseId,
      userId,
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    const oldAmount = expense.amount;
    const newAmount = Number(amount);
    const amountDifference = newAmount - oldAmount;

    // Check if update would exceed income
    if (user.totalExpenses + amountDifference > user.totalIncome) {
      return res.status(400).json({
        message: "Cannot update expense: this would exceed your total income.",
      });
    }

    // Update expense
    expense.category = category;
    expense.amount = newAmount;
    expense.date = new Date(date);
    expense.description = description;
    await expense.save();

    // Update user totals
    user.totalExpenses += amountDifference;
    await user.save();

    return res.status(200).json({
      message: "Expense updated successfully",
      expense: {
        ...expense.toObject(),
        date: expense.date.toISOString().split("T")[0],
      },
      remainingIncome: user.totalIncome - user.totalExpenses,
    });
  } catch (error) {
    console.error("Error updating expense:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete an expense by ID
router.delete("/:expenseId", verifyToken, async (req, res) => {
  const { expenseId } = req.params;
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const expense = await Expense.findOneAndDelete({
      _id: expenseId,
      userId,
    });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    // Update user document
    user.expenses.pull(expenseId);
    user.totalExpenses -= expense.amount;
    await user.save();

    return res.status(200).json({
      message: "Expense deleted successfully",
      remainingIncome: user.totalIncome - user.totalExpenses,
    });
  } catch (error) {
    console.error("Error deleting expense:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
