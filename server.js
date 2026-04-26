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
  registrationWithTracker: {
    name: "Lanka Odyssey 2026 – Registration + GPS Tracker",
    description: "Event entry for the Ancient Kingdoms Edition. GPS tracker rental is mandatory and included. This is an unsupported event — no crew or outside assistance permitted.",
    amountCents: 30000,
    envPriceKey: "STRIPE_PRICE_REGISTRATION"
  },
  galleTransfer: {
    name: "Galle to Airport Transfer",
    description: "Rider + bike + luggage transfer from Galle Fort to Bandaranaike International Airport after the event.",
    amountCents: 7000,
    envPriceKey: "STRIPE_PRICE_GALLE_TRANSFER"
  },
  accomPackage: {
    name: "Event Accommodation Package",
    description: "4–5 star accommodation + 3 meals/day for all 7 nights. Managed bookings at or near each checkpoint.",
    amountCents: 100000,
    envPriceKey: "STRIPE_PRICE_ACCOM"
  },
  airportTransfer: {
    name: "Airport Transfers (Colombo ↔ Negombo & Galle → Airport)",
    description: "Arrival pickup + post-event return transfer with cycle and luggage.",
    amountCents: 30000,
    envPriceKey: "STRIPE_PRICE_AIRPORT_TRANSFER"
  },
  afterParty: {
    name: "Finisher After-Party (Galle Fort)",
    description: "Celebration dinner and awards ceremony at a venue inside Galle Fort on Day 7 evening.",
    amountCents: 30000,
    envPriceKey: "STRIPE_PRICE_AFTER_PARTY"
  }
};

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { productKey, riderName, riderEmail, optionalKeys } = req.body || {};

    if (productKey !== "registrationWithTracker") {
      return res.status(400).json({ error: "Invalid product key." });
    }

    const mandatoryProduct = catalog.registrationWithTracker;
    const configuredPriceId = process.env[mandatoryProduct.envPriceKey];

    const lineItems = [
      configuredPriceId
        ? { price: configuredPriceId, quantity: 1 }
        : {
            price_data: {
              currency,
              product_data: {
                name: mandatoryProduct.name,
                description: mandatoryProduct.description
              },
              unit_amount: mandatoryProduct.amountCents
            },
            quantity: 1
          }
    ];

    if (Array.isArray(optionalKeys)) {
      for (const key of optionalKeys) {
        const addonProduct = catalog[key];
        if (!addonProduct) continue;
        const addonPriceId = process.env[addonProduct.envPriceKey];
        lineItems.push(
          addonPriceId
            ? { price: addonPriceId, quantity: 1 }
            : {
                price_data: {
                  currency,
                  product_data: {
                    name: addonProduct.name,
                    description: addonProduct.description
                  },
                  unit_amount: addonProduct.amountCents
                },
                quantity: 1
              }
        );
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: riderEmail || undefined,
      metadata: {
        productKey,
        riderName: riderName || "",
        riderEmail: riderEmail || "",
        optionalKeys: Array.isArray(optionalKeys) ? optionalKeys.join(",") : ""
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
