var createError = require("http-errors");
var express = require("express"); // to create server
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var helmet = require("helmet");

var stocksRouter = require("./routes/stocks"); // 'stocks' route handlers
var userRouter = require("./routes/user"); // 'user' route handlers
var indexRouter = require("./routes/index"); // 'index' route handlers

var app = express(); // create express app

// view engine setup
app.use(helmet());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public"))); // to serve static files

app.use("/stocks", stocksRouter); // '/stocks' requets to be handled by stocksRouter
app.use("/user", userRouter); // '/user' requests to be handled by userRouter
app.use("/", indexRouter); // '/index' requests to be handled by indexRouter

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send("error");
});

module.exports = app;
