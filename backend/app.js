require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// connection of the mongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("connected"))
  .catch((error) => console.log("error: ", error));

//routes and Middlewares
const apiRouter = require("./src/routes/getApi");
const authRouter = require("./src/routes/authRoutes");
const errorHandler = require("./src/middlewares/errorHandler");
const logger = require("./src/middlewares/logger");

app.use(logger);
app.use("/auth", authRouter);
app.use("/api", apiRouter);
app.use(errorHandler);

app.listen(process.env.PORT);
