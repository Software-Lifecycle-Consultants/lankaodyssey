const path = require("path");
const express = require("express");
const Stripe = require("stripe");
require("dotenv").config();

const app = express();
const port = Number(process.env.PORT || 3000);

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Missing STRIPE_SECRET_KEY. Stripe checkout endpoint will fail until it is configured.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");
const currency = (process.env.STRIPE_CURRENCY || "usd").toLowerCase();
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

const catalog = {
  registration: {
    name: "Lanka Odyssey 2026 Registration",
    description: "Ancient Kingdoms Edition base registration",
    amountCents: 25000,
    envPriceKey: "STRIPE_PRICE_REGISTRATION"
  },
  trackerRental: {
    name: "Tracker Rental",
    description: "Mandatory GPS tracker rental",
    amountCents: 5000,
    envPriceKey: "STRIPE_PRICE_TRACKER_RENTAL"
  },
  galleTransfer: {
    name: "Galle to Airport Transfer",
    description: "Rider + bike + luggage transfer",
    amountCents: 7000,
    envPriceKey: "STRIPE_PRICE_GALLE_TRANSFER"
  }
};

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { productKey, riderName, riderEmail } = req.body || {};
    const product = catalog[productKey];

    if (!product) {
      return res.status(400).json({ error: "Invalid product key." });
    }

    const configuredPriceId = process.env[product.envPriceKey];
    const lineItems = configuredPriceId
      ? [{ price: configuredPriceId, quantity: 1 }]
      : [{
          price_data: {
            currency,
            product_data: {
              name: product.name,
              description: product.description
            },
            unit_amount: product.amountCents
          },
          quantity: 1
        }];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: riderEmail || undefined,
      metadata: {
        productKey,
        riderName: riderName || "",
        riderEmail: riderEmail || ""
      },
      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel.html`
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout session error:", error);
    return res.status(500).json({ error: "Unable to start checkout session." });
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "lankaodyssey-web" });
});

app.listen(port, () => {
  console.log(`Lanka Odyssey site running at http://localhost:${port}`);
});
