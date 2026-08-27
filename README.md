# 🎂 Cake Menu — Handcrafted Home Bakery

A modern, mobile-first web application for **Cake Menu**, an artisanal home bakery run by **Priyanka** in **Sirsi, Karnataka**. The website showcases handcrafted, 100% eggless cakes, cupcakes, and brownies, enables direct WhatsApp and online ordering, and features an integrated owner management dashboard.

---

## ✨ Features

### 🛍️ Customer Storefront
- **Artisanal Design & Aesthetics**: Warm, boutique bakery theme with smooth animations, custom Google Fonts (*Playfair Display*, *Inter*, *Dancing Script*), and responsive layouts.
- **2-Column Mobile Menu**: Optimized side-by-side grid layout for mobile devices for effortless browsing.
- **Categorized Catalog & Filtering**: Easily explore **Cakes**, **Cupcakes**, **Brownies**, and **Seasonal Specials**.
- **Dietary & Feature Badges**:
  - 🟢 **100% Eggless / Pure Veg** tags on every item.
  - ⭐ **Bestseller** highlights.
  - 🎨 **Customizable** indicators.
  - 🎉 **Seasonal / Festival** specials.
- **Trust & Storytelling**:
  - Priyanka's baking story & hygiene standards.
  - Comprehensive **Allergen Guide** (Dairy, Nuts, Gluten).
  - Customer review carousel & FSSAI license information.

### 🎨 Interactive Product Customizer
- **Size & Weight Selector**: Live weight selection (0.5 kg, 1.0 kg, 1.5 kg, 2.0 kg / 6-pack, 12-pack).
- **Flavor Customization**: Dynamic selection of premium flavors (Belgian Chocolate, Dutch Truffle, Rasmalai Fusion, Red Velvet, etc.).
- **Live Price Updates**: Instant recalculation as sizes and add-ons are chosen.
- **Message on Cake**: Free-text custom message input with real-time character limit.
- **Lead Time Indicator**: Displays preparation notice requirements (e.g. *Requires 24h notice*) and computes earliest delivery date.

### 🛒 Cart & Localized Checkout
- **Persistent Cart**: Session storage with real-time item count and subtotal calculations.
- **Smart Date Picker**: Calendar with lead-time validation (prevents impossible same-day bookings for 24–48h custom cakes and blocks owner-disabled dates).
- **Time Slot Selector**: Morning (10 AM – 1 PM), Afternoon (2 PM – 5 PM), and Evening (5 PM – 8 PM) with past-hour protection for today.
- **Sirsi Delivery Address**: Tailored for single-town delivery with flat-rate delivery logic and free delivery above ₹500.
- **Dual Ordering Pathways**:
  - 📱 **One-Tap WhatsApp Order (`wa.me`)**: Generates formatted order details, date, time slot, address, and pricing sent directly to Priyanka's WhatsApp (`+91 84314 41492`).
  - 🛍️ **Online Cash-on-Delivery (COD)**: Places an on-site order with a receipt confirmation.

### 👩‍🍳 Owner Management Dashboard
- **PIN-Protected Access**: Secure login for the owner (Default PIN: `1234`).
- **Live Order Pipeline**: Track and advance orders (`Placed` ➔ `Confirmed` ➔ `Preparing` ➔ `Out for Delivery` ➔ `Delivered`).
- **Capacity & Date Blocker**: Block holidays or fully booked days with one tap, and adjust daily maximum order limits.
- **Menu & Stock Controls**: Toggle item availability (In Stock / Out of Stock) instantly without deleting products.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Vanilla CSS Design System with custom design tokens, CSS variables, and fluid typography
- **State Management**: React Context API with `localStorage` persistence

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or above recommended)
- `npm` or `yarn`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rohan-2510/Cake-Menu.git
   cd Cake-Menu
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:5173/`

---

## 📁 Project Structure

```
Cake-Menu/
├── public/
│   └── favicon.svg             # Bakery emoji SVG favicon
├── src/
│   ├── assets/                 # Static assets & images
│   ├── components/             # Reusable UI components
│   │   ├── Header.jsx          # Navigation header with cart badge & WhatsApp CTA
│   │   ├── Header.css
│   │   ├── Hero.jsx            # Hero section with brand story & stats
│   │   ├── Hero.css
│   │   ├── ProductCard.jsx     # Product card with responsive 2-column mobile layout
│   │   ├── ProductCard.css
│   │   ├── ProductModal.jsx    # Customizer modal (weights, flavors, messages)
│   │   ├── ProductModal.css
│   │   ├── Testimonials.jsx    # Customer review carousel
│   │   ├── Testimonials.css
│   │   ├── Footer.jsx          # Contact info, social links & FSSAI details
│   │   └── Footer.css
│   ├── data/
│   │   └── products.js         # Menu items, sizes, allergens, config
│   ├── pages/
│   │   ├── HomePage.jsx        # Landing page with bestsellers & full menu
│   │   ├── HomePage.css
│   │   ├── CartPage.jsx        # Persistent cart with subtotal calculation
│   │   ├── CartPage.css
│   │   ├── CheckoutPage.jsx    # Date/slot calendar picker & dual checkout
│   │   ├── CheckoutPage.css
│   │   ├── AdminPage.jsx       # Owner order pipeline & capacity manager
│   │   └── AdminPage.css
│   ├── store/
│   │   └── StoreContext.jsx    # Centralized state & localStorage sync
│   ├── utils/
│   │   └── helpers.js          # Price formatters, lead time & WhatsApp URL generator
│   ├── App.jsx                 # App root & routing setup
│   ├── App.css
│   ├── index.css               # Global design tokens, typography, and reset
│   └── main.jsx                # Application entry point
├── index.html                  # HTML template with Google Fonts & SEO meta tags
├── package.json
└── README.md
```

---

## ⚙️ Configuration

- **WhatsApp Number**: To change the business WhatsApp number, update `OWNER_PHONE` in `src/data/products.js`.
- **Owner Admin PIN**: Default PIN is set to `1234` in `src/store/StoreContext.jsx`.
- **Delivery Fee**: Configurable via `DELIVERY_FEE` and `FREE_DELIVERY_ABOVE` in `src/data/products.js`.

---

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 📄 License

This project is created for **Cake Menu** by Priyanka. All rights reserved.
