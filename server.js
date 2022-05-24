require("dotenv").config();
const express = require("express");
const app = express();
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const cors = require("cors");
var distance = require("google-distance-matrix");
const fs = require("firebase-admin");
const serviceAccount = require("./tour-guide-9de5c-firebase-adminsdk-awiyw-b02307e3ad.json");

fs.initializeApp({
  credential: fs.credential.cert(serviceAccount),
});
const db = fs.firestore();
distance.key(process.env.GOOGLE_API_KEY);
app.use(express.json());
app.use(require("body-parser").raw({ type: "*/*" }));
app.use(cors());
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

app.post("/payment", async (req, res) => {
  try {
    // Getting data from client
    let { amount, name, authUserId, date } = req.body;
    // Simple validation
    if (!amount || !name)
      return res.status(400).json({ message: "All fields are required" });
    // amount = parseInt(amount);
    // Initiate payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "INR",
      payment_method_types: ["card"],
      metadata: { name, authUserId, date },
    });
    // Extracting the client secret
    const clientSecret = paymentIntent.client_secret;
    // Sending the client secret as response
    res.json({ message: "Payment initiated", clientSecret });
  } catch (err) {
    // Catch any error and send error 500 to client
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const server = app.listen(process.env.PORT || 3000, () => {
  const port = server.address().port;
  console.log(`Express is working on port ${port}`);
});

//WEB HOOKS
app.post("/stripe", async (req, res) => {
  // Get the signature from the headers
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    // Check if the event is sent from Stripe or a third party
    // And parse the event
    event = await stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    // Handle what happens if the event is not from Stripe
    console.log(err);
    return res.status(400).json({ message: err.message });
  }
  // Event when a payment is initiated
  if (event.type === "payment_intent.created") {
    console.log(`${event.data.object.metadata.name} initated payment!`);
  }
  // Event when a payment is succeeded
  if (event.type === "payment_intent.succeeded") {
    console.log(
      `${event.data.object.metadata.name} succeeded payment! with id ${event.data.object.metadata.authUserId}`
    );
    // fulfilment
  }
  res.json({ ok: true });
});
