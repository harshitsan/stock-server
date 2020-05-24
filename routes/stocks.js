var express = require("express");
var router = express.Router({ caseSensitive: true });
const krex = require("knex")({
  client: "mysql",
  connection: {
    host: "localhost",
    user: "newuser",
    password: "abc123abc",
    database: "webcomputing",
  },
});

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
        console.log(industry);
        krex
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
            console.log(e);
            return res
              .status(500)
              .send({ error: true, message: "Server Error" });
          });
      } else
        krex
          .select("name", "symbol", "industry")
          .from("stocks")
          .distinct()
          .then((rows) => {
            res.status(200).send(JSON.parse(JSON.stringify(rows)));
          })
          .catch((e) => {
            console.log(e);
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
    krex
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
  jwt.verify(req.header["user-token"], SECRET_KEY, (err, decoded) => {
    if (err) {
      res
        .status(403)
        .send({ error: true, message: "Authorization header not found" });
    }
    if (!err) {
      krex
        .select("*")
        .from("stocks")
        .where({ symbol: req.params.symbol })
        .orderBy("timestamp")
        .then((rows) => {
          if (rows.lenght > 0) {
            res.send(JSON.parse(JSON.stringify(rows)));
          }
          res.status(404).send();
        })
        .catch((err) => res.send(err));
    }
  });
});

module.exports = router;
