const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();

// Vercel provides PORT automatically
const PORT = process.env.PORT || 3000;

// Ensure correct views path
app.set("views", path.join(__dirname, "..", "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "..", "public")));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: "secret-key", resave: false, saveUninitialized: true }));

// Simple JSON DB
const dbPath = path.join(__dirname, "..", "data", "db.json");
let db = { admin: { username: "admin", password: "password123" }, items: [] };
if (fs.existsSync(dbPath)) db = JSON.parse(fs.readFileSync(dbPath));

function saveDB() {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// Routes
app.get("/", (req, res) => res.render("index"));
app.get("/tracking", (req, res) => res.render("tracking", { item: null }));
app.post("/tracking", (req, res) => {
  const tracking = req.body.tracking?.trim();
  const item = db.items.find(i => i.tracking === tracking);
  res.render("tracking", { item });
});

// Admin login
app.get("/admin", (req, res) => res.render("admin-login", { error: null }));
app.post("/admin", (req, res) => {
  const { username, password } = req.body;
  if (username === db.admin.username && password === db.admin.password) {
    req.session.admin = true;
    res.redirect("/dashboard");
  } else {
    res.render("admin-login", { error: "Invalid credentials" });
  }
});

// Admin dashboard
app.get("/dashboard", (req, res) => {
  if (!req.session.admin) return res.redirect("/admin");
  res.render("admin-dashboard", { items: db.items });
});

app.post("/dashboard/add", (req, res) => {
  if (!req.session.admin) return res.redirect("/admin");
  const { name, department, tracking, status } = req.body;
  db.items.push({ name, department, tracking, status });
  saveDB();
  res.redirect("/dashboard");
});

// Invoice
app.get("/invoice/:tracking", (req, res) => {
  const item = db.items.find(i => i.tracking === req.params.tracking);
  if (!item) return res.status(404).send("Not found");
  res.render("invoice", { item });
});

// Export for Vercel serverless
module.exports = app;
