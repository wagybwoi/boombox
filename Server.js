const express = require("express");
const app = express();
const path = require("path");

app.use(express.static('public/dist/'));

app.listen(3000);

console.log("Running at Port 3000");