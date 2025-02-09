import mongoose from "mongoose";
const expenseSchema = mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
},
  {
    timestamps: true, // create time and last update time
  }
);
export const Expense = mongoose.model("Expense", expenseSchema)
