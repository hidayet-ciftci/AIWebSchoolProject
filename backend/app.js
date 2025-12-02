require("dotenv").config();

const express = require("express");
const path = require("path");
const connectDB = require("./src/config/db");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//routes and Middlewares
const authRouter = require("./src/routes/authRoutes");
const errorHandler = require("./src/middlewares/errorHandler");
const logger = require("./src/middlewares/logger");

app.use(logger);
app.use("/api/auth", authRouter);
app.use(errorHandler);

connectDB().then(() => {
  app.listen(3000, () => console.log("Sunucu Yayında"));
});
