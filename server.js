const express = require("express");
const app = express();
var distance = require("google-distance-matrix");
distance.key(process.env.GOOGLE_API_KEY);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from server");
});
app.get("/get-metrics", (req, res) => {
  res.send("Hi");
});
app.post("/get-metrics", (req, res) => {
  let { org, dst } = req.body;
  var origins = [`${org.latitude},${org.longitude}`];
  var destinations = [`${dst.latitude},${dst.longitude}`];

  distance.matrix(origins, destinations, function (err, distances) {
    if (!err) {
      let distance = distances?.rows[0]?.elements[0]?.distance.text;
      let time = distances?.rows[0]?.elements[0]?.duration.text;
      res.send({ distance, time });
      // console.log(distance, time);
    }
  });
});
app.get("/get-hotels", (req, res) => {
  // console.log(req.body);
  res.send("API Hit");
});
app.post("/get-hotels", (req, res) => {
  // console.log(req.body);
  res.send("API Hit");
});

const server = app.listen(process.env.PORT || 3000, () => {
  const port = server.address().port;
  console.log(`Express is working on port ${port}`);
});
