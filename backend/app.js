require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// connection of the mongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("connected"))
  .catch((error) => console.log("error: ", error));

//routes and Middlewares
const apiRouter = require("./src/routes/getUser");
const authRouter = require("./src/routes/authRoutes");
const courseRouter = require("./src/routes/getCourses");
const examRouter = require("./src/routes/examRoutes");
const errorHandler = require("./src/middlewares/errorHandler");
const logger = require("./src/middlewares/logger");

app.use(logger);
app.use("/auth", authRouter);
app.use("/api/users", apiRouter);
app.use("/api/courses", courseRouter);
app.use("/api/exams", examRouter);
app.use(errorHandler);

app.listen(process.env.PORT);
