require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const TWOCHECKOUT_MERCHANT_CODE = process.env.TWOCHECKOUT_MERCHANT_CODE || '';
const TWOCHECKOUT_MODE = (process.env.TWOCHECKOUT_MODE || 'SANDBOX').toUpperCase();
const checkoutConfigured = !!TWOCHECKOUT_MERCHANT_CODE;

const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'products.json'), 'utf-8'));
const storeConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'store-config.json'), 'utf-8'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/config', (req, res) => {
  res.json({
    ...storeConfig,
    checkoutConfigured,
    checkoutMode: TWOCHECKOUT_MODE
  });
});

// Builds a 2Checkout / Verifone ConvertPlus hosted checkout link server-side,
// so prices always come from data/products.json and can't be tampered with client-side.
app.post('/api/checkout', (req, res) => {
  if (!checkoutConfigured) {
    return res.status(503).json({
      error: 'Card checkout is not configured yet. Please order via WhatsApp for now.'
    });
  }

  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) {
    return res.status(400).json({ error: 'Cart is empty.' });
  }

  const lineParams = [];
  let count = 0;
  items.forEach((item) => {
    const product = products.find(p => p.id === item.id);
    if (!product) return;
    const qty = Math.max(1, Math.min(20, Number(item.qty) || 1));
    lineParams.push(`li_${count}_type=product`);
    lineParams.push(`li_${count}_name=${encodeURIComponent(product.name)}`);
    lineParams.push(`li_${count}_price=${product.priceUSD.toFixed(2)}`);
    lineParams.push(`li_${count}_quantity=${qty}`);
    lineParams.push(`li_${count}_tangible=Y`);
    count += 1;
  });

  if (!count) {
    return res.status(400).json({ error: 'No valid items found.' });
  }

  const base = TWOCHECKOUT_MODE === 'PRODUCTION'
    ? 'https://secure.2checkout.com/checkout/buy'
    : 'https://sandbox.2checkout.com/checkout/buy';

  const returnUrl = typeof req.body.returnUrl === 'string' ? req.body.returnUrl : '';

  const url = `${base}?merchant=${encodeURIComponent(TWOCHECKOUT_MERCHANT_CODE)}`
    + `&dynamic=1&currency=USD&${lineParams.join('&')}`
    + (returnUrl ? `&return-url=${encodeURIComponent(returnUrl)}&return-type=redirect` : '');

  res.json({ url });
});

app.listen(PORT, () => {
  console.log(
    `Hayacare store running at http://localhost:${PORT} ` +
    `(card checkout: ${checkoutConfigured ? TWOCHECKOUT_MODE : 'not configured, WhatsApp fallback only'})`
  );
});
