var express = require("express");
var router = express.Router({ caseSensitive: true });
const knex = require("../services/db");
const jwt = require("jsonwebtoken");
require("dotenv").config(); // credentials

// '/symbols' route handler
router.get("/symbols", function (req, res, next) {
  try {
    const { industry } = req.query;
    if (!industry && Object.keys(req.query).length > 0) {
      return res.status(400).json({
        error: true,
        message: "Invalid query parameter: only 'industry is permitted'",
      });
    } // filter the stocks by industry
    else {
      if (industry) {
        knex
          .select("name", "symbol", "industry")
          .from("stocks")
          .where("industry", "like", `%${industry}%`)
          .then((rows) => {
            if (rows.length)
              return res.status(200).json(JSON.parse(JSON.stringify(rows)));
            else
              return res
                .status(404)
                .json({ error: true, message: "Industry selector not found" });
          })
          .catch((e) => {
            throw e;
          });
      } // handling request if no industry filter is appplied
      else
        knex
          .select("name", "symbol", "industry")
          .from("stocks")
          .distinct()
          .then((rows) => {
            return res.status(200).json(JSON.parse(JSON.stringify(rows)));
          })
          .catch((e) => {
            throw e;
          });
    }
  } catch (e) {
    return res.status(500).json({ error: true, message: "Server Error" });
  }
});

// '{symbol}' route handler
router.get("/:symbol", function (req, res, next) {
  try {
    // checking additional query parameter
    if (Object.keys(req.query).length > 0) {
      return res.status(400).json({
        error: true,
        message:
          "Date parameters only available on authenticated route /stocks/authed",
      });
    }
    if (req.params.symbol) {
      // fetching latest stock data according to timestamp
      knex
        .select("*")
        .from("stocks")
        .where({ symbol: req.params.symbol })
        .first()
        .then((row) => {
          // if no such symbol exist return error
          if (!row) {
            return res.status(404).json({
              error: true,
              message: "No entry for symbol in stocks database",
            });
          }
          return res.status(200).json(JSON.parse(JSON.stringify(row)));
        })
        .catch((err) => {
          throw e;
        });
    } else throw "Invalid Request";
  } catch (e) {
    //handling server error
    return res.status(500).json({ error: true, message: "Server Error" });
  }
});

// '/authed/{symbol}' route handler
router.get("/authed/:symbol", function (req, res, next) {
  try {
    // validating query parameters
    const { from, to } = req.query;
    if (isNaN(Date.parse(from)) || isNaN(Date.parse(to || new Date()))) {
      return res.status(400).json({
        error: true,
        message:
          "Parameters allowed are 'from' and 'to', example: /stocks/authed/AAL?from=2020-03-15",
      });
    }
    // fetching "authorization" header for authorization
    let token = req.headers["authorization"];
    if (token && token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
      // validating token
      jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
          return res
            .status(403)
            .json({ error: true, message: "Authorization header not found" });
        }
        if (!err) {
          knex
            .select("*")
            .from("stocks")
            .where({ symbol: req.params.symbol })
            .where("timestamp", ">=", from)
            .where("timestamp", "<=", to || new Date())
            .then((rows) => {
              if (rows.length > 0) {
                // send filtered data
                return res.json(JSON.parse(JSON.stringify(rows)));
              }
              return res.status(404).json({
                error: true,
                message:
                  "No entries available for query symbol for supplied date range",
              });
            })
            .catch((err) => {
              throw err;
            });
        }
      });
    } else return res.status(403).json({ error: true, message: "Authorization header not found" }); // if no token in header is available'
  } catch (e) {
    // handling server error
    return res.status(500).json({ error: true, message: "Server Error" });
  }
});

module.exports = router;
