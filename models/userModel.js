import mongoose from "mongoose";

const expenseSchema = mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    totalIncome: {
      type: Number,
      default: 0, // Default to 0 if not set
    },
    totalExpenses: {
       type: Number, 
       default: 0 },
       
    expenses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Expense" }],
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", userSchema);
