const express = require("express");
var router = express.Router();
var path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
var swagger_path = path.resolve(__dirname, "..", "./swagger.yaml");
const swaggerDocument = YAML.load(swagger_path);
router.get("/", (req, res) => {
  res.json({ goto: "http://localhost:3000/api-docs" });
});
router.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
module.exports = router;
