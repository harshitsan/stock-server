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

router.get("/symbols", function (req, res, next) {
  var response = [];
  const industry = req.query.industry;
    if( !industry ){
        if ( Object.keys(req.query).length > 0 ){
            res.status(400).send({ error : true, message : "Invalid query parameter: only 'industry is permitted'" })
        }
    }
  if(industry){
      krex
        .select("*")
        .from("stocks")
        .where("industry", industry)
          .then( rows => {
              if( rows.length == 0 )
                  res.send(404).send({ error : true, message : "Industry selector not found" })
          } ).catch();
      krex
        .select("name", "symbol", "industry")
        .from("stocks")
        .distinct()
        .where("industry", industry)
        .then((rows) => {
            res.status(200).send(JSON.parse(JSON.stringify(rows)))
        })
        .catch();
  }else{
      krex
        .select("symbol")
        .from("stocks")
        .distinct()
        .then((rows) => res.status(200).send(JSON.parse(JSON.stringify(rows))))
        .catch();
    }
})

router.get("/:symbol([A-Z]+)", function (req, res, next) {
    if( Object.keys(req.query).length > 0 ){
        res.send({ error : true, message : "Data parameters only available on authenticated route /stocks/authed" })
    }
  krex
    .select("*")
    .from("stocks")
    .where({ symbol: req.params.symbol })
    .orderBy("timestamp")
    .first()
        .then((row) => {
            if( !row ){
                res.send(404).send({ error : true, message : "No entry for symbol in stocks database" });
            }
            res.send(JSON.parse(JSON.stringify(row)))
        })
    .catch((err) => res.send(err));
});

router.get("/authed/:symbol([A-Z]+)", function (req, res, next) {
  jwt.verify(req.header["user-token"], SECRET_KEY, (err, decoded) => {
      if (err){
          res.status(403).send({ error : true, message : "Authorization header not found" });
      }
    if (!err) {
      krex
        .select("*")
        .from("stocks")
        .where({ symbol: req.params.symbol })
        .orderBy("timestamp")
            .then((rows) => {
                if ( rows.lenght > 0 ){
                    res.send(JSON.parse(JSON.stringify(rows)))
                }
                res.status(404).send()
            })
        .catch((err) => res.send(err));
    }
  });
});

module.exports = router;
