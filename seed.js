import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import Plant from "./models/Plant.js";

dotenv.config();

// Read JSON manually
const plantsData = JSON.parse(
  fs.readFileSync("./data/plants.json", "utf-8")
);

const seedPlants = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    await Plant.deleteMany();
    await Plant.insertMany(plantsData);

    console.log("✅ Plants seeded successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

seedPlants();