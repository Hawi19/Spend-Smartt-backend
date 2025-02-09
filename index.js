import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { PORT, mongoDBURL } from "./config.js";
import expenseRoute from './routes/expenseRoute.js'
import userRoute from "./routes/userRoute.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  console.log(req);
  return res.status(234).send("Welcome To MERN Stack Tutorial");
});
app.use("/api/expense", expenseRoute);
app.use("/api/user", userRoute);

mongoose
  .connect(mongoDBURL)
  .then(() => {
    console.log("Database Connected");
    app.listen(PORT, () => {
      console.log(`listening to port ${PORT}...`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
