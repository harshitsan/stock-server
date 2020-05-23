var express = require("express");
var router = express.Router({ caseSensitive: true });
const krex = require("knex")({
  client: "mysql",
  connection: {
    host: "127.0.0.1",
    user: "abhinav",
    password: "password",
    database: "webcomputing",
  },
});

router.get("/symbols/:industry?", function (req, res, next) {
  var response = [];
  const industry = req.params.industry;
  industry
    ? krex
        .select("symbol")
        .from("stocks")
        .distinct()
        .where("industry", industry)
        .then((rows) => res.send(JSON.parse(JSON.stringify(rows))))
        .catch()
    : krex
        .select("symbol")
        .from("stocks")
        .distinct()
        .then((rows) => res.send(JSON.parse(JSON.stringify(rows))))
        .catch();
});

router.get("/:symbol([A-Z]+)", function (req, res, next) {
  krex
    .select("*")
    .from("stocks")
    .where({ symbol: req.params.symbol })
    .orderBy("timestamp")
    .first()
    .then((rows) => res.send(JSON.parse(JSON.stringify(rows))))
    .catch((err) => res.send(err));
});

router.get("/authed/:symbol([A-Z]+)", function (req, res, next) {
  jwt.verify(req.header["user-token"], SECRET_KEY, (err, decoded) => {
    if (!err) {
      krex
        .select("*")
        .from("stocks")
        .where({ symbol: req.params.symbol })
        .orderBy("timestamp")
        .then((rows) => res.send(JSON.parse(JSON.stringify(rows))))
        .catch((err) => res.send(err));
    }
  });
});

module.exports = router;
