var express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
var router = express.Router();
require("dotenv").config();
const knex = require(".././services/db");

router.post(
  "/register",
  [check("email").isEmail(), check("password").isLength()],
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
          if (rows.length > 0) {
            return res.send({ error: true, message: "User already exists!" });
          }

          bcrypt.hash(req.body.password, 10, (err, hashvalue) => {
            knex
              .insert({ email: req.body.email, password: hashvalue })
              .into("users")
              .then((result) => {
                return res
                  .status(201)
                  .send({ success: true, message: "User created" });
              })
              .catch((e) => {
                return res
                  .status(500)
                  .send({ error: true, message: "Server Error" });
              });
          });
        })
        .catch((e) => {
          return res.status(500).send({ error: true, message: "Server Error" });
        });
    } catch (exp) {
      return res.status(500).send({ error: true, message: "Server Error" });
    }
  }
);

router.post(
  "/login",
  [check("email").isEmail(), check("password").isLength()],
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: true,
        message: "Request body incomplete - email and password needed",
      });
    }

    knex
      .select("email", "password")
      .from("users")
      .where({ email: req.body.email })
      .first()
      .then((row) => {
        if (!row) {
          return res
            .send(401)
            .send({ error: true, message: "User Not Registered" });
        }
        if (bcrypt.compareSync(req.body.password, row["password"])) {
          jwt.sign(
            {
              exp: Math.floor(Date.now() / 1000) + 86400,
              data: req.body.email,
            },
            process.env.SECRET,
            { algorithm: "HS256" },
            (error, token) => {
              return res.status(200).send({
                token: token,
                token_type: "Bearer",
                expires: 86400,
              });
            }
          );
        } else {
          return res
            .status(401)
            .send({ error: true, message: "Incorrect password" });
        }
      })
      .catch((err) => {
        res.status(404).send({ error: true, message: "Server Error" });
      });
  }
);

module.exports = router;
