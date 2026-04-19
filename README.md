# Lanka Odyssey Web MVP

This repository now includes a production-style MVP website for Lanka Odyssey with:

- Story-led landing page aligned with the build brief
- Registration and add-on payment actions
- Stripe Checkout Session backend endpoint
- Success and cancel return pages

## Stack

- Node.js
- Express
- Stripe API
- HTML/CSS/Vanilla JavaScript frontend

## Files

- `server.js`: Express server and Stripe checkout session endpoint
- `public/index.html`: Main webpage
- `public/styles.css`: Site styles and responsive layout
- `public/app.js`: Frontend checkout submit logic
- `public/success.html`: Stripe success return page
- `public/cancel.html`: Stripe cancel return page
- `.env.example`: Required environment variables template

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Update `.env` with your Stripe secret key:

```env
STRIPE_SECRET_KEY=sk_live_or_test_key
BASE_URL=http://localhost:3000
```

4. Start server:

```bash
npm run dev
```

5. Open:

- `http://localhost:3000`

## Stripe Notes

The checkout endpoint supports two approaches:

- Use Stripe Price IDs by setting:
	- `STRIPE_PRICE_REGISTRATION`
	- `STRIPE_PRICE_TRACKER_RENTAL`
	- `STRIPE_PRICE_GALLE_TRANSFER`
- Or leave those empty and use inline `price_data` values in `server.js`

Current default inline prices:

- Registration: USD 250
- Tracker rental: USD 50
- Galle transfer: USD 70

## Next Recommended Build Steps

- Add application form persistence (save draft + review workflow)
- Add rider/admin dashboards
- Add Stripe webhook endpoint for payment confirmation and status updates
- Add database models for riders, applications, orders, and payments
- Add email notifications after acceptance and payment

## Hosting Options

This app is a simple Node.js server (`server.js`) that serves static files and calls Stripe APIs, so it deploys well on most Node-friendly hosts.

### Option 1: Render (easy)

1. Push this repo to GitHub.
2. In Render, create a **Web Service** from the repo.
3. Use:
	- Build command: `npm install`
	- Start command: `npm start`
4. Set environment variables in Render dashboard:
	- `STRIPE_SECRET_KEY`
	- `STRIPE_CURRENCY` (optional, default `usd`)
	- `BASE_URL` (your Render app URL, e.g. `https://lankaodyssey.onrender.com`)
5. Deploy and test checkout flow.

### Option 2: Railway (easy)

1. Create a new Railway project from this repo.
2. Railway auto-detects Node and installs dependencies.
3. Set env vars:
	- `STRIPE_SECRET_KEY`
	- `BASE_URL` (your Railway domain)
4. Ensure service exposes the default `PORT` provided by Railway.
5. Deploy and verify `/health` returns JSON.

### Option 3: Fly.io (global + stable)

1. Install Fly CLI and run `fly launch` in the repo.
2. Set secrets:
	- `fly secrets set STRIPE_SECRET_KEY=...`
	- `fly secrets set BASE_URL=https://<your-app>.fly.dev`
3. Deploy with `fly deploy`.
4. Confirm app health and Stripe redirect URLs.

### Option 4: VPS (DigitalOcean/AWS EC2) with Nginx + PM2

1. Install Node.js LTS, Nginx, and PM2.
2. Copy repo to server and run `npm install`.
3. Create `.env` with production values.
4. Start app with PM2: `pm2 start server.js --name lankaodyssey`.
5. Reverse proxy with Nginx to `localhost:3000`.
6. Add TLS via Let's Encrypt.

## Stripe Production Checklist

- Use live Stripe keys in production.
- Set `BASE_URL` to your exact production domain.
- In Stripe dashboard, add allowed redirect URLs if needed.
- Test success/cancel redirects after deploy.
- Do not commit `.env`.