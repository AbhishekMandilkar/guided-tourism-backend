const express = require("express");
const app = express();
var distance = require("google-distance-matrix");
const fs = require("firebase-admin");
require("dotenv").config();
const serviceAccount = require("./tour-guide-9de5c-firebase-adminsdk-awiyw-b02307e3ad.json");

fs.initializeApp({
  credential: fs.credential.cert(serviceAccount),
});
const db = fs.firestore();
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
  var origins = [`${org?.latitude},${org?.longitude}`];
  var destinations = [`${dst?.latitude},${dst?.longitude}`];

  distance.matrix(origins, destinations, function (err, distances) {
    if (!err) {
      let distance = distances?.rows[0]?.elements[0]?.distance.text;
      let time = distances?.rows[0]?.elements[0]?.duration.text;
      // console.log(distances);
      res.json({ distance, time });
    }
  });
});
app.get("/get-hotels", (req, res) => {
  // console.log(req.body);
  res.send("API Hit");
});
app.post("/get-hotels", async (req, res) => {
  let { uid } = req.body;
  const trip = await db.collection("trips").doc(uid).get();
  const { days, budget } = trip.data();
  const hotels = await db.collection("hotels").get();
  let data = [];
  for (const hotel of hotels.docs) {
    data.push(hotel.data());
  }
  hotelsData = data.filter((hotel) => {
    if (budget >= hotel.cost * days) {
      return hotel;
    }
  });
  res.json(hotelsData);
});

const server = app.listen(process.env.PORT || 3000, () => {
  const port = server.address().port;
  console.log(`Express is working on port ${port}`);
});
