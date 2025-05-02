import express from "express";
import { Expense } from "../models/expenseModel.js";
import { User } from "../models/userModel.js";
import { verifyToken } from "../authMiddleware.js";

const router = express.Router();

// Create a new expense
// Create a new expense
router.post("/", verifyToken, async (req, res) => {
  const { category, amount, date, description } = req.body;
  const userId = req.user.userId;

  // Validation
  if (!category || !amount || !date) {
    return res.status(400).json({
      message: "Category, amount, and date are required."
    });
  }

  try {
    // Find user with session locking
    const user = await User.findById(userId).session(req.session);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Ensure expenses array exists
    if (!user.expenses) user.expenses = [];

    // Convert and validate amount
    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      return res.status(400).json({
        message: "Invalid amount value"
      });
    }

    // Calculate remaining income using stored values
    const remainingIncome = user.totalIncome - user.totalExpenses;

    // Validate against remaining income
    if (expenseAmount > remainingIncome) {
      return res.status(400).json({
        message: "Expense exceeds remaining income",
        remainingIncome,
        currentTotalExpenses: user.totalExpenses
      });
    }

    // Create new expense
    const newExpense = await Expense.create([{
      userId,
      category,
      amount: expenseAmount,
      date: new Date(date),
      description
    }], { session: req.session });

    // Update user document atomically
    await User.findByIdAndUpdate(
      userId,
      {
        $push: { expenses: newExpense[0]._id },
        $inc: { totalExpenses: expenseAmount }
      },
      { session: req.session }
    );

    // Commit transaction
    await req.session.commitTransaction();

    return res.status(201).json({
      message: "Expense created successfully",
      expense: newExpense[0],
      remainingIncome: user.totalIncome - (user.totalExpenses + expenseAmount)
    });

  } catch (error) {
    await req.session.abortTransaction();
    console.error("Error creating expense:", error.message);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
});

// Get all expenses for a user
router.get("/", verifyToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId).populate("expenses");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const expensesWithFormattedDates = user.expenses.map((expense) => ({
      ...expense.toObject(),
      date: expense.date.toISOString(), // Convert date to ISO string
    }));

    const calculatedTotalExpenses = expensesWithFormattedDates.reduce(
      (total, expense) => total + expense.amount,
      0
    );

    return res.status(200).json({
      expenses: expensesWithFormattedDates,
      totalExpenses: calculatedTotalExpenses,
    });
  } catch (error) {
    console.error("Error fetching expenses:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});// Get an expense by ID
router.get("/:expenseId", verifyToken, async (req, res) => {
  const { expenseId } = req.params;
  const userId = req.user.userId;

  try {
    const expense = await Expense.findOne({ _id: expenseId, userId });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    return res.status(200).json(expense);
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
    return res
      .status(400)
      .json({ message: "Category, amount, and date are required." });
  }

  try {
    const updatedExpense = await Expense.findById(expenseId);
    if (!updatedExpense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const currentExpenseAmount = updatedExpense.amount;
    const expenseAmount = Number(amount);

    const currentTotalExpenses = await Expense.find({ userId }).then(
      (expenses) =>
        expenses.reduce((total, expense) => total + expense.amount, 0)
    );

    const newTotalExpenses =
      currentTotalExpenses - currentExpenseAmount + expenseAmount;

    console.log(
      `Before Update - Current Total Expenses: ${currentTotalExpenses}, New Total Expenses would be: ${newTotalExpenses}`
    );

    if (newTotalExpenses > user.totalIncome) {
      return res
        .status(400)
        .json({
          message: "Cannot update expense: this exceeds your total income.",
        });
    }

    updatedExpense.category = category;
    updatedExpense.amount = expenseAmount;
    updatedExpense.date = new Date(date); 
    updatedExpense.description = description;
    await updatedExpense.save();

    user.totalExpenses = newTotalExpenses;
    await user.save();

    console.log(`After Update - Updated Total Expenses: ${user.totalExpenses}`);

    return res.status(200).json({
      message: "Expense updated successfully",
      expense: updatedExpense,
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
    const deletedExpense = await Expense.findByIdAndDelete(expenseId);
    if (!deletedExpense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    const user = await User.findById(userId);
    if (user) {
      const currentTotalExpenses = await Expense.find({ userId }).then(
        (expenses) =>
          expenses.reduce((total, expense) => total + expense.amount, 0)
      );

      user.totalExpenses = currentTotalExpenses;
      user.expenses.pull(expenseId);
      await user.save();

      console.log(
        `After Deletion - Updated Total Expenses: ${user.totalExpenses}`
      );
    }

    return res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
