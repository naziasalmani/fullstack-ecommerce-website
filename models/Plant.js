import mongoose from "mongoose";

const plantSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    category: String,
    description: String,
    image: String,
    stock: Number
  },
  { timestamps: true }
);

const Plant = mongoose.model("Plant", plantSchema);
export default Plant;