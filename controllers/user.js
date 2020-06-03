var express = require("express");
const bcrypt = require("bcryptjs"); // use to encrypt(hash) password
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator"); // use to validate email and password
var router = express.Router();
require("dotenv").config(); // to store db credentials and other configuration values
const knex = require("../services/db"); // used to connect to db
// 'register' route handler
router.post(
  "/register",
  [check("email").isEmail(), check("password").isLength({ min: 1 })], // checking email and password
  function (req, res, next) {
    const errors = validationResult(req); // checking if email and password value is acceptable
    if (!errors.isEmpty()) {
      //  value is not acceptable
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
            // email already there
            return res
              .status(409)
              .json({ error: true, message: "User already exists!" });
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
                  .json({ success: true, message: "User created" });
              })
              .catch((e) => {
                throw e;
              });
          });
        })
        .catch((e) => {
          throw e;
        });
    } catch (exp) {
      return res.status(500).json({ error: true, message: "Server Error" });
    }
  }
);

// 'login' route handler
router.post(
  "/login",
  [check("email").isEmail(), check("password").isLength({ min: 1 })],
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: true,
        message: "Request body invalid - email and password are required",
      });
    } else {
      knex
        .select("email", "password")
        .from("users")
        .where({ email: req.body.email })
        .first()
        .then((row) => {
          if (!row) {
            return res
              .status(401)
              .json({ error: true, message: "User Not Registered" });
          } else if (bcrypt.compareSync(req.body.password, row["password"])) {
            // create jwt token and return token
            jwt.sign(
              {
                exp: Math.floor(Date.now() / 1000) + 86400,
                data: req.body.email,
              },
              process.env.SECRET,
              { algorithm: "HS256" },
              (error, token) => {
                return res.status(200).json({
                  token: token,
                  token_type: "Bearer",
                  expires_in: 86400,
                });
              }
            );
          } else {
            return res
              .status(401)
              .json({ error: true, message: "Incorrect email or password" });
          }
        })
        .catch((err) => {
          //handling server error
          return res.status(404).json({ error: true, message: "Server Error" });
        });
    }
  }
);

module.exports = router;
