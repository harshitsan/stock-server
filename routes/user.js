var express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
var router = express.Router();
const knex = require("knex")({
  client: "mysql",
  connection: {
    host: "localhost",
    user: "newuser",
    password: "abc123abc",
    database: "webcomputing",
  },
});

router.post(
  "/register",
  [check("email").isEmail(), check("password").isLength({ min: 8 })],
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: true,
        message: "Request body incomplete - email and password needed",
      });
    }
    try {
      knex
        .select("email")
        .from("users")
        .where({ email: req.body.email })
        .then((rows) => {
          console.log(rows);
          if (rows.length > 0) {
            return res.send({ error: true, message: "User already exists!" });
          }

          bcrypt.hash(req.body.password, 10, (err, hashvalue) => {
            console.log(hashvalue);
            knex
              .insert({ email: req.body.email, password: hashvalue })
              .into("users")
              .then((result) => {
                console.log(result, "rrrrrrr");
                return res
                  .status(201)
                  .send({ success: true, message: "User created" });
              })
              .catch((e) => {
                console.log(e);
                return res
                  .status(500)
                  .send({ error: true, message: "Server Error" });
              });
          });
        })
        .catch((e) => {
          console.log(e);
          return res.status(500).send({ error: true, message: "Server Error" });
        });
    } catch (exp) {
      return res.status(500).send({ error: true, message: "Server Error" });
    }
  }
);

router.post("/login", function (req, res, next) {
  knex
    .select("email", "password")
    .from("users")
    .where({ email: req.body.email })
    .first()
    .then((row) => {
      if (!row) {
        res.send(401).send({ error: true, message: "Incorrect password" });
      }
      if (bcrpyt.compareSync(req.body.password, row["password"])) {
        jwt.sign(
          { email: req.body.password },
          privatKey,
          { expiresIn: "24h" },
          (token) =>
            res.status(200).send({
              token: token,
              token_type: "Bearer",
              expires: 86400,
            })
        );
      } else {
        res.send(401).send({ error: true, message: "Incorrect password" });
      }
    })
    .catch((err) => {
      res.send("error");
    });
});

module.exports = router;
