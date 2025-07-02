require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const methodOverride = require("method-override");
const morgan = require("morgan");

const passUserToView = require("./middleware/pass-user-to-view");
const isSignedIn = require("./middleware/is-signed-in");

const authController = require("./controllers/auth");
const medicationsController = require("./controllers/medications");
const transactionsController = require("./controllers/transactions");
const expiryController = require('./controllers/expiry');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on("connected", () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(morgan("dev"));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
  })
);

app.use(passUserToView);

app.get("/", (req, res) => res.render("index.ejs"));

app.use("/auth", authController);

app.get('/medications', isSignedIn, medicationsController.index);
app.get('/medications/new', isSignedIn, medicationsController.newForm);
app.post('/medications', isSignedIn, medicationsController.create);
app.get('/medications/:id', isSignedIn, medicationsController.show);

app.get('/medications/:id/transactions/new', isSignedIn, transactionsController.newForm);
app.post('/medications/:id/transactions', isSignedIn, transactionsController.create);
app.get('/transactions/:id/edit', isSignedIn, transactionsController.editForm);
app.put('/transactions/:id', isSignedIn, transactionsController.update);
app.delete('/transactions/:id', isSignedIn, transactionsController.remove);

app.get('/expiry-check', isSignedIn, expiryController.form);
app.post('/expiry-check', isSignedIn, expiryController.search);

app.listen(port, () => {
  console.log(`The express app is ready on port ${port}!`);
});