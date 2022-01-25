const express = require("express");
const app = express();
var distance = require("google-distance-matrix");
distance.key(process.env.GOOGLE_API_KEY);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from server");
});
app.get("/getMetrics", (req, res) => {
  res.send("Hi");
});
app.post("/getMetrics", (req, res) => {
  let { org, dst } = req.body;
  var origins = [`${org.latitude},${org.longitude}`];
  var destinations = [`${dst.latitude},${dst.longitude}`];

  distance.matrix(origins, destinations, function (err, distances) {
    if (!err) {
      let distance = distances.rows[0].elements[0].distance.text;
      let time = distances.rows[0].elements[0].duration.text;
      res.send({ distance, time });
      // console.log(distance, time);
    }
  });
});

app.post("/getHotels", (req, res) => {
  console.log(req.body);
  res.send("API Hit");
});

app.listen(3000, () => {
  console.log(`Server running at 3000`);
});
