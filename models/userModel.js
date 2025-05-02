import mongoose from "mongoose";

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
      default: 0, 
    },
    totalExpenses: {
       type: Number, 
       default: 0 },
       
  expenses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense",
    },],
  
      isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: { type: String },
  },

  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", userSchema);
