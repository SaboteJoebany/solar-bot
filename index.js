import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PAGE_TOKEN = "YOUR_PAGE_TOKEN";

function calculateSolar(monthlyKwh, sunHours=5){
  let daily = monthlyKwh / 30;
  let size = (daily / sunHours) * 1.2;
  let costLow = size * 55000;
  let costHigh = size * 70000;

  return {
    size: size.toFixed(1),
    costLow: Math.round(costLow),
    costHigh: Math.round(costHigh)
  };
}

app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "solar123";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook", async (req, res) => {
  const msg = req.body.entry?.[0]?.messaging?.[0];

  if (msg?.message?.text) {
    const text = msg.message.text;
    const sender = msg.sender.id;

    // Extract number (kWh)
    let kwh = parseInt(text);

    let reply = "Please send your monthly kWh (e.g. 300)";

    if (!isNaN(kwh)) {
      let result = calculateSolar(kwh);

      reply = `⚡ Estimated System: ${result.size} kW
💰 Cost: ₱${result.costLow} – ₱${result.costHigh}
📉 Savings: up to 90%`;
    }

    await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_TOKEN}`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        recipient: { id: sender },
        message: { text: reply }
      })
    });
  }

  res.sendStatus(200);
});

app.listen(3000);
