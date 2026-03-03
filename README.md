# Vorton Fashion

Website for Vorton Fashion clothing brand, matching the design of the mobile app (dark theme, orange accents, product cards, shop, cart).

## Environment (MongoDB + Cloudinary)

Copy `.env.example` to `.env` and set your credentials:

- **VITE_API_URL** — Your backend base URL (e.g. `https://vorton-mob-app.onrender.com`). The app fetches products from `VITE_API_URL` + `VITE_PRODUCTS_PATH` (default `/api/products`).
- **VITE_CLOUDINARY_CLOUD_NAME** — Your Cloudinary cloud name (required for product images).
- **VITE_CLOUDINARY_FOLDER** — Folder in Cloudinary where product images live (default `vorton-products`).

Product images are resolved by **skuColor**: each API document has `skuColor` (e.g. `HLF-3TR-G-317-Grey`) and `image`/`images` filenames (e.g. `HLF-3TR-G-317-Grey-1.jpeg`). The app builds Cloudinary URLs as `https://res.cloudinary.com/{cloudName}/image/upload/{folder}/{filename}`. Documents with the same **SKU** are shown as one product with color variations; only products that have at least one image are shown (no empty cards).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
```

Output is in `dist/`. Preview with `npm run preview`.

## Pages

- **Home** — Hero, Men/Women/About CTAs, New collections, Discounted items, Vorton line, Media (2 videos), Articles (2)
- **Shop** — 4 product cards per row, filter by Men/Women via query `?category=men` or `?category=women`
- **Product detail** — Gallery, SKU, color/size/quantity, Add to Cart (₼)
- **Cart** — Line items, quantity, remove, subtotal
- **About** — Brand story and contact

Design uses the app’s dark background (`#1a1b23`), card surfaces, orange accent (`#e85d2c`), and green for sale prices. Currency: ₼ (Azerbaijani Manat).
