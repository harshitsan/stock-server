var express = require("express");
var router = express.Router({ caseSensitive: true }); // use to make stocks params case sensitive
const knex = require(".././services/db");
const jwt = require("jsonwebtoken");
require("dotenv").config(); // use to store credentials at one place

// '/symbols' route handler
router.get("/symbols", function (req, res, next) {
  try {
    const { industry } = req.params;
    // check if additional query parameter is other than industry and return error
    if (!industry && Object.keys(req.params).length > 0) {
      return res.status(400).send({
        error: true,
        message: "Invalid query parameter: only 'industry is permitted'",
      });
    } // if addition parameter is industry filter the stocks by industry and return
    else {
      if (industry) {
        knex
          .select("*")
          .from("stocks")
          .where("industry", industry)
          .then((rows) => {
            if (rows.length)
              return res.status(200).send(JSON.parse(JSON.stringify(rows)));
            // if there is no such row then return error
            else
              return res
                .status(404)
                .send({ error: true, message: "Industry selector not found" });
          })
          .catch((e) => {
            // handling server error
            return res
              .status(500)
              .send({ error: true, message: "Server Error" });
          });
      } // handling request if no industry filter is appplied
      else
        knex
          .select("name", "symbol", "industry")
          .from("stocks")
          .distinct()
          .then((rows) => {
            return res.status(200).send(JSON.parse(JSON.stringify(rows)));
          })
          .catch((e) => {
            return res
              .status(500)
              .send({ error: true, message: "Server Error" });
          });
    }
  } catch (e) {
    return res.status(500).send({ error: true, message: "Server Error" });
  }
});

// '{symbol}' route handler
router.get("/:symbol", function (req, res, next) {
  try {
    // checking additional query parameter
    if (Object.keys(req.query).length > 0) {
      return res.status(400).send({
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
        .orderBy("timestamp")
        .first()
        .then((row) => {
          // if no such symbol exist return error
          if (!row) {
            return res.status(404).send({
              error: true,
              message: "No entry for symbol in stocks database",
            });
          }
          // return fetched data
          return res.status(200).send(JSON.parse(JSON.stringify(row)));
        })
        .catch((err) => res.send(err));
    } else throw "Invalid Request";
  } catch (e) {
    //handling server error
    return res.status(500).send({ error: true, message: "Server Error" });
  }
});

// '/authed/{symbol}' route handler
router.get("/authed/:symbol", function (req, res, next) {
  try {
    // validating query parameters
    const { from, to } = req.query;
    if (isNaN(Date.parse(from)) || isNaN(Date.parse(to || new Date()))) {
      return res.status(400).send({
        error: true,
        messgae:
          "Parameters allowed are 'from' and 'to', example: /stocks/authed/AAL?from=2020-03-15",
      });
    }
    console.log(from, to);

    // fetching "authorization" header for authorization
    let token = req.headers["authorization"];
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }
    if (token) {
      // validating token
      jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
          // if token is invalid send error
          return res
            .status(403)
            .send({ error: true, message: "Authorization header not found" });
        }
        if (!err) {
          // if token is valid send required data
          let data = knex
            .select("*")
            .from("stocks")
            .where({ symbol: req.params.symbol })
            .where("timestamp", ">=", from)
            .where("timestamp", "<=", to || new Date())
            .orderBy("timestamp")
            .then((rows) => {
              console.log(rows);
              if (rows.length > 0) {
                // send filtered data
                return res.send(JSON.parse(JSON.stringify(rows)));
              }
              // if no data available send error
              return res.status(404).send({
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
    } else return res.status(403).send({ error: true, message: "Authorization header not found" }); // if no 'x-access-token header is available'
  } catch (e) {
    // handling server error
    console.error(e);

    return res.status(500).send({ error: true, message: "Server Error" });
  }
});

module.exports = router;
