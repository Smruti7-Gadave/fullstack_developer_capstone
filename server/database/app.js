const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const app = express();
const port = Number(process.env.PORT || 3030);
const mongoUrl = process.env.MONGO_URL || "mongodb://mongo_db:27017/dealershipsDB";

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

const Reviews = require("./review");
const Dealerships = require("./dealership");

function readSeed(filename, key) {
  const filePath = path.join(__dirname, "data", filename);
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return parsed[key] || [];
}

async function seedIfEmpty(Model, records) {
  const count = await Model.estimatedDocumentCount();
  if (count === 0 && records.length > 0) {
    await Model.insertMany(records);
    console.log(`Seeded ${records.length} documents into ${Model.collection.name}`);
  } else {
    console.log(`${Model.collection.name} already contains ${count} documents; keeping existing data`);
  }
}

app.get("/", (_req, res) => {
  res.json({ message: "Welcome to the Dealership Mongoose API" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.get("/fetchReviews", async (_req, res) => {
  try {
    res.json(await Reviews.find().lean());
  } catch (error) {
    console.error("Fetch reviews failed:", error);
    res.status(500).json({ error: "Error fetching reviews" });
  }
});

app.get("/fetchReviews/dealer/:id", async (req, res) => {
  try {
    const dealerId = Number(req.params.id);
    if (!Number.isInteger(dealerId)) return res.status(400).json({ error: "Invalid dealer ID" });
    res.json(await Reviews.find({ dealership: dealerId }).lean());
  } catch (error) {
    console.error("Fetch dealer reviews failed:", error);
    res.status(500).json({ error: "Error fetching dealer reviews" });
  }
});

app.get("/fetchDealers", async (_req, res) => {
  try {
    res.json(await Dealerships.find().sort({ id: 1 }).lean());
  } catch (error) {
    console.error("Fetch dealers failed:", error);
    res.status(500).json({ error: "Error fetching dealerships" });
  }
});

app.get("/fetchDealers/:state", async (req, res) => {
  try {
    const state = req.params.state;
    const dealers = state.toLowerCase() === "all"
      ? await Dealerships.find().sort({ id: 1 }).lean()
      : await Dealerships.find({ state: new RegExp(`^${state}$`, "i") }).sort({ id: 1 }).lean();
    res.json(dealers);
  } catch (error) {
    console.error("Fetch dealers by state failed:", error);
    res.status(500).json({ error: "Error filtering dealerships" });
  }
});

app.get("/fetchDealer/:id", async (req, res) => {
  try {
    const dealerId = Number(req.params.id);
    if (!Number.isInteger(dealerId)) return res.status(400).json({ error: "Invalid dealer ID" });
    const dealer = await Dealerships.findOne({ id: dealerId }).lean();
    if (!dealer) return res.status(404).json({ error: "Dealership not found" });
    res.json([dealer]);
  } catch (error) {
    console.error("Fetch dealer failed:", error);
    res.status(500).json({ error: "Error fetching dealership" });
  }
});

app.post("/insert_review", async (req, res) => {
  try {
    const data = req.body || {};
    const required = ["name", "dealership", "review", "purchase", "purchase_date", "car_make", "car_model", "car_year"];
    const missing = required.filter((key) => data[key] === undefined || data[key] === null || data[key] === "");
    if (missing.length) return res.status(400).json({ error: "Missing fields", missing });

    const dealerId = Number(data.dealership);
    const year = Number(data.car_year);
    if (!Number.isInteger(dealerId) || !Number.isInteger(year)) {
      return res.status(400).json({ error: "Dealership and car year must be valid integers" });
    }

    const normalized = {
      name: String(data.name).trim(),
      dealership: dealerId,
      review: String(data.review).trim(),
      purchase: Boolean(data.purchase),
      purchase_date: String(data.purchase_date),
      car_make: String(data.car_make).trim(),
      car_model: String(data.car_model).trim(),
      car_year: year
    };

    // Treat an identical repeat submission as a retry, not a new review.
    const duplicate = await Reviews.findOne(normalized).lean();
    if (duplicate) {
      return res.status(200).json({ ...duplicate, duplicate: true });
    }

    const lastReview = await Reviews.findOne().sort({ id: -1 }).select("id").lean();
    const newReview = new Reviews({
      id: lastReview ? lastReview.id + 1 : 1,
      ...normalized
    });

    const saved = await newReview.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Insert review failed:", error);
    res.status(500).json({ error: "Error inserting review" });
  }
});

async function start() {
  try {
    const dealerships = readSeed("dealerships.json", "dealerships");
    const reviews = readSeed("reviews.json", "reviews");
    await mongoose.connect(mongoUrl);
    await seedIfEmpty(Dealerships, dealerships);
    await seedIfEmpty(Reviews, reviews);
    app.listen(port, "0.0.0.0", () => {
      console.log(`Dealership API listening on port ${port}`);
    });
  } catch (error) {
    console.error("Unable to start dealership API:", error);
    process.exit(1);
  }
}

start();

module.exports = app;
