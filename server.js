require("dotenv").config();
const express = require("express");
const app = express();

const mongoose = require("mongoose");
const methodOverride = require("method-override");
const morgan = require("morgan");
const session = require("express-session");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const passUserToView = require('./middleware/pass-user-to-view');
const isSignedIn = require('./middleware/is-signed-in');

const port = process.env.PORT || "3000";

mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on("connected", () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
app.use(morgan('dev'));
app.use(express.static('public'));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passUserToView);

app.get("/", (req, res) => {
  res.render("index.ejs");
});

const authRouter = require("./controllers/auth");
const medicationsRouter = require("./controllers/medications");
const transactionsRouter = require("./controllers/transactions");
const expiryRouter = require("./controllers/expiry");
const catalogImportRouter = require("./controllers/catalogImport");
const transactionImportRouter = require("./controllers/transactionImport");
const usersController = require("./controllers/users");


app.use("/auth", authRouter);
app.use("/", medicationsRouter);
app.use("/", transactionsRouter);
app.use("/", expiryRouter);
app.use("/", catalogImportRouter);
app.use("/", transactionImportRouter);
app.use("/users", isSignedIn, usersController);


app.listen(port, () => {
  console.log(`The express app is ready on port ${port}!`);
});