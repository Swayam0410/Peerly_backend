// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import postRoutes from "./routes/postRoutes.js";
const username = encodeURIComponent("anshujatni22");
const password = encodeURIComponent("swayamag22");
dotenv.config();
const url=`mongodb+srv://${username}:${password}@storedlearning.bpfmg5r.mongodb.net/?retryWrites=true&w=majority&appName=StoredLearning`;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/posts", postRoutes);

mongoose.connect(url)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch((err) => console.error("MongoDB connection error:", err));
