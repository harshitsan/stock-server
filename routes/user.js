var express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
var router = express.Router();
const knex = require("knex")({
  client: "mysql",
  connection: {
    host: "127.0.0.1",
    user: "abhinav",
    password: "password",
    database: "users",
  },
});

router.post(
  "/register",
  [check("email").isEmail(), check("password").isLength({ min: 8 })],
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    knex
      .select("email")
      .from("users")
      .where({ email: req.body.email })
      .then((rows) => {
        if (rows.length > 0) {
          return res.send({ error: true, message: "User already exists!" });
        }
      });
    try {
      bcrypt.hash(req.body.password, 10, (err, hashvalue) => {
        knex
          .insert({ email: req.body.email, password: hashvalue })
          .into("users");
      });
      return res.send({ success: true, message: "User created" });
    } catch (exp) {
      return res.status(500).send({ error: true, message: "Server Error" });
    }
  }
);

router.post("/login", function (req, res, next) {
  try {
    knex
      .select("email", "password")
      .from("users")
      .where({ email: req.body.email })
      .first()
      .then((row) => {
        if (bcrpyt.compareSync(req.body.password, row["password"])) {
          jwt.sign(
            { email: req.body.password },
            privatKey,
            { expiresIn: "1h" },
            (token) => res.send(token)
          );
        }
      })
      .catch((err) => {
        res.send("error");
      });
  } catch (e) {
    console.error(e);
    res.send("error");
  }
});

module.exports = router;
