var express = require("express");
var router = express.Router({ caseSensitive: true });
const knex = require(".././services/db");
const jwt = require("jsonwebtoken");
require("dotenv").config();
router.get("/symbols", function (req, res, next) {
  try {
    const { industry } = req.query;
    if (!industry && Object.keys(req.query).length > 0) {
      return res.status(400).send({
        error: true,
        message: "Invalid query parameter: only 'industry is permitted'",
      });
    } else {
      if (industry) {
        knex
          .select("*")
          .from("stocks")
          .where("industry", industry)
          .then((rows) => {
            if (rows.length)
              return res.status(200).send(JSON.parse(JSON.stringify(rows)));
            else
              return res
                .status(404)
                .send({ error: true, message: "Industry selector not found" });
          })
          .catch((e) => {
            return res
              .status(500)
              .send({ error: true, message: "Server Error" });
          });
      } else
        knex
          .select("name", "symbol", "industry")
          .from("stocks")
          .distinct()
          .then((rows) => {
            res.status(200).send(JSON.parse(JSON.stringify(rows)));
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

router.get("/:symbol([A-Z]+)", function (req, res, next) {
  try {
    if (Object.keys(req.query).length > 0) {
      res.status(400).send({
        error: true,
        message:
          "Date parameters only available on authenticated route /stocks/authed",
      });
    }
    knex
      .select("*")
      .from("stocks")
      .where({ symbol: req.params.symbol })
      .orderBy("timestamp")
      .first()
      .then((row) => {
        if (!row) {
          res.send(404).send({
            error: true,
            message: "No entry for symbol in stocks database",
          });
        }
        res.status(200).send(JSON.parse(JSON.stringify(row)));
      })
      .catch((err) => res.send(err));
  } catch (e) {
    return res.status(500).send({ error: true, message: "Server Error" });
  }
});
router.get("/authed/:symbol([A-Z]+)", function (req, res, next) {
  try {
    const from = Date.parse(req.query.from);
    const to = Date.parse(req.query.to || new Date());
    if (isNaN(from) || isNaN(to)) {
      return res.status(400).send({
        error: true,
        messgae:
          "Parameters allowed are 'from' and 'to', example: /stocks/authed/AAL?from=2020-03-15",
      });
    }
    let token = req.headers["x-access-token"] || req.headers["authorization"];
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft();
    }
    if (token) {
      jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
          return res
            .status(403)
            .send({ error: true, message: "Authorization header not found" });
        }
        if (!err) {
          let data = knex
            .select("*")
            .from("stocks")
            .where({ symbol: req.params.symbol });
          if (from) {
            data = data.where("timestamp", ">=", from);
          }
          if (to) {
            data = data.where("timestamp", "<=", to);
          }
          data
            .orderBy("timestamp")
            .then((rows) => {
              if (rows.length > 0) {
                res.send(JSON.parse(JSON.stringify(rows)));
              }
              return res.status(404).send({
                error: true,
                message:
                  "No entries available for query symbol for supplied date range",
              });
            })
            .catch((err) => res.send(err));
        }
      });
    } else return res.status(403).send({ error: true, message: "Authorization header not found" });
  } catch (e) {
    return res.status(500).send({ error: true, message: "Server Error" });
  }
});

module.exports = router;
