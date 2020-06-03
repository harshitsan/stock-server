var express = require("express");
const bcrypt = require("bcryptjs"); // use to encrypt(hash) password
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator"); // use to validate email and password
var router = express.Router();
require("dotenv").config(); // to store db credentials and other configuration values
const knex = require(".././services/db"); // used to connect to db

// 'register' route handler
router.post(
  "/register",
  [check("email").isEmail(), check("password").isLength()], // checking email and password
  function (req, res, next) {
    const errors = validationResult(req); // checking if email and password value is acceptable
    if (!errors.isEmpty()) {
      // if email and password value is not acceptable
      return res.status(400).json({
        error: true,
        message: "Request body incomplete - email and password needed",
      });
    }
    try {
      // checking if username is available and isn't alredy taken by another person
      knex
        .select("email")
        .from("users")
        .where({ email: req.body.email })
        .then((rows) => {
          if (rows.length > 0) {
            // if username is already taken send error
            return res.send({ error: true, message: "User already exists!" });
          }

          // if username is  available hash the password and store it in db
          bcrypt.hash(req.body.password, 10, (err, hashvalue) => {
            knex
              .insert({ email: req.body.email, password: hashvalue })
              .into("users")
              .then((result) => {
                // data stored in db send 'user created'
                return res
                  .status(201)
                  .send({ success: true, message: "User created" });
              })
              .catch((e) => {
                // handling server error
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

// 'login' route handler
router.post(
  "/login",
  [check("email").isEmail(), check("password").isLength({ min: 1 })], // checking email and password values
  function (req, res, next) {
    const errors = validationResult(req); // checking if email and password value is acceptable
    if (!errors.isEmpty()) {
      // if email and password value is not acceptable return error
      return res.status(400).json({
        error: true,
        message: "Request body incomplete - email and password needed",
      });
    }

    // if email and password value is acceptable check if user exists
    knex
      .select("email", "password")
      .from("users")
      .where({ email: req.body.email })
      .first()
      .then((row) => {
        if (!row) {
          console.log(row);
          return res
            .send(401)
            .send({ error: true, message: "User Not Registered" });
        }
        // if user exists check if password is correct
        if (bcrypt.compareSync(req.body.password, row["password"])) {
          // if password is correct create jwt token and return token
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
          // if password is incorrect
          return res
            .status(401)
            .send({ error: true, message: "Incorrect email or password" });
        }
      })
      .catch((err) => {
        //handling server error
        res.status(404).send({ error: true, message: "Server Error" });
      });
  }
);

module.exports = router;
