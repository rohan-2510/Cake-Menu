# 🎂 Cake Menu — Handcrafted Home Bakery

A modern, full-stack web application for **Cake Menu**, an artisanal home bakery run by **Priyanka** in **Sirsi, Karnataka**. The platform showcases handcrafted, 100% eggless cakes, cupcakes, and brownies, enables direct WhatsApp and online ordering, real-time order tracking, and features a cloud-synced **Admin Management Dashboard** powered by **Firebase**.

---

## ✨ Features

### 🛍️ Customer Storefront
- **Artisanal Boutique Design**: Warm terracotta and cream bakery aesthetic with fluid typography (*Playfair Display*, *Inter*, *Dancing Script*) and responsive micro-animations.
- **2-Column Mobile Menu**: Optimized side-by-side grid layout for seamless browsing on mobile screens.
- **Categorized Catalog & Filtering**: Browse **Cakes**, **Cupcakes**, **Brownies**, and **Seasonal Specials**.
- **Dietary & Feature Badges**:
  - 🟢 **100% Eggless / Pure Veg** indicators on all items.
  - ⭐ **Bestseller** highlights.
  - 🎨 **Customizable** options.
  - 🎉 **Seasonal / Festival** specials.
- **Trust & Storytelling**:
  - Priyanka's baking journey, hygiene standards, and FSSAI license information.
  - Comprehensive **Allergen Guide** (Dairy, Nuts, Gluten).
  - Dynamic customer testimonials carousel.

### 🎨 Interactive Product Customizer
- **Size & Weight Selector**: Live weight and quantity selection (0.5 kg, 1.0 kg, 1.5 kg, 2.0 kg / 6-pack, 12-pack).
- **Flavor Customization**: Dynamic selection of premium flavors (Belgian Chocolate, Dutch Truffle, Rasmalai Fusion, Red Velvet, etc.).
- **Real-Time Price Updates**: Automatic price recalculation based on size multiplier and base price.
- **Message on Cake**: Free-text custom greeting with character limit.
- **Lead Time Indicator**: Displays preparation notice requirements (e.g. *Requires 24h notice*) and earliest delivery date computation.

### 🛒 Cart & Localized Checkout
- **Persistent Cart**: Session storage with real-time item count and subtotal calculation.
- **Smart Calendar Date Picker**: Calendar with lead-time validation (prevents impossible same-day bookings for custom cakes and blocks owner-disabled dates).
- **Time Slot Selector**: Morning (10 AM – 1 PM), Afternoon (2 PM – 5 PM), and Evening (5 PM – 8 PM) with past-hour protection for same-day delivery.
- **Sirsi Delivery Address**: Tailored for local town delivery with flat-rate delivery logic and free delivery above ₹500.
- **Dual Ordering Pathways**:
  - 📱 **One-Tap WhatsApp Order (`wa.me`)**: Generates pre-formatted order details, delivery address, time slot, and pricing sent directly to Priyanka's WhatsApp (`+91 84314 41492`).
  - 🛍️ **Online Cash-on-Delivery (COD)**: Places an on-site order saved to Firebase Firestore with instant popup receipt and Order ID.

### 📍 Real-Time Order Tracking
- **Order Tracker (`/track/:orderId`)**: Customers can look up and track order status in real time (`Placed` ➔ `Confirmed` ➔ `Preparing` ➔ `Out for Delivery` ➔ `Delivered`).
- **Cancellation Window**: Customers can self-cancel orders within 15 minutes of placement directly from the tracking page.
- **WhatsApp Support Link**: Direct WhatsApp chat link pre-filled with the specific Order ID for quick assistance.

### 👑 Cloud-Synced Admin Dashboard (`/admin`)
- **Secure Firebase Authentication**: Email & password authentication restricted to the authorized administrator (`admin@cakemenu.com`).
- **Live Order Pipeline**: Real-time Firestore sync to update order statuses (`Confirmed`, `Preparing`, `Out for Delivery`, `Delivered`, `Cancelled`) with direct customer WhatsApp contact buttons.
- **Menu Catalog CRUD**:
  - Add new products and cakes via a modal dialog with custom size variations, multiplier pricing, flavors, and image URL preview.
  - Edit existing items, adjust base prices, update descriptions, and toggle item availability (In Stock / Out of Stock).
  - Delete products from the menu catalog.
- **Customer Testimonials Management**: Add, edit, or remove customer reviews and toggle their visibility on the home page carousel.
- **Interactive Calendar & Capacity Manager**:
  - Visual 7-day grid calendar showing blocked dates and booking status.
  - One-tap date blocking/unblocking for holidays or kitchen capacity limits.
  - Configurable maximum orders allowed per day.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Backend & Database**: [Firebase Cloud Firestore](https://firebase.google.com/products/firestore) (Realtime Database & Persistence)
- **Authentication**: [Firebase Auth](https://firebase.google.com/products/auth) (Admin & User Sessions)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Vanilla CSS Design System with custom design tokens, responsive breakpoints, and CSS variables
- **State Management**: React Context API (`StoreContext`) synchronized with Firebase Firestore & `localStorage` fallback

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or above recommended)
- `npm` or `yarn`
- A [Firebase](https://firebase.google.com/) project with **Authentication** (Email/Password) and **Cloud Firestore** enabled

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

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your Firebase project credentials:
   ```bash
   cp .env.example .env
   ```

   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the local development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   Navigate to `http://localhost:5173/`

---

## 📁 Project Structure

```
Cake-Menu/
├── public/
│   └── favicon.svg             # Bakery cake SVG favicon
├── src/
│   ├── assets/                 # Static assets & illustrations
│   ├── components/             # Reusable UI components
│   │   ├── icons/              # Custom SVG social icons (WhatsApp, Instagram)
│   │   ├── Header.jsx          # Top navigation, cart counter, auth status
│   │   ├── Header.css
│   │   ├── Hero.jsx            # Hero banner with storytelling & quick stats
│   │   ├── Hero.css
│   │   ├── ProductCard.jsx     # Responsive 2-column product card
│   │   ├── ProductCard.css
│   │   ├── ProductModal.jsx    # Interactive product customization modal (portaled)
│   │   ├── ProductModal.css
│   │   ├── Testimonials.jsx    # Customer review carousel
│   │   ├── Testimonials.css
│   │   ├── Footer.jsx          # Quick links, store admin link & FSSAI details
│   │   └── Footer.css
│   ├── data/
│   │   └── products.js         # Initial catalog, sizing presets, allergens & config
│   ├── pages/
│   │   ├── HomePage.jsx        # Storefront landing page & menu categories
│   │   ├── HomePage.css
│   │   ├── CartPage.jsx        # Cart management & order summary
│   │   ├── CartPage.css
│   │   ├── CheckoutPage.jsx    # Delivery details, date/slot picker & COD confirmation
│   │   ├── CheckoutPage.css
│   │   ├── TrackOrderPage.jsx  # Live order tracking pipeline & 15-min cancellation
│   │   ├── TrackOrderPage.css
│   │   ├── AuthPage.jsx        # Customer sign-in / registration / guest portal
│   │   ├── AuthPage.css
│   │   ├── AdminPage.jsx       # Owner dashboard (Orders, Menu CRUD, Reviews, Calendar)
│   │   └── AdminPage.css
│   ├── services/
│   │   └── firebase.js         # Firebase SDK initialization, Auth, & Firestore CRUD
│   ├── store/
│   │   └── StoreContext.jsx    # Global state management & real-time Firestore listeners
│   ├── utils/
│   │   └── helpers.js          # Currency formatters, date helpers & WhatsApp generator
│   ├── App.jsx                 # Route configurations, code splitting & error boundaries
│   ├── App.css
│   ├── index.css               # Design tokens, typography & CSS reset
│   └── main.jsx                # Application root entry point
├── .env.example                # Sample environment variables for Firebase
├── package.json
└── README.md
```

---

## ⚙️ Configuration & Credentials

| Setting | Location | Description |
|---|---|---|
| **Admin Email** | `src/data/products.js` (`ADMIN_EMAIL`) | Authorized email for dashboard access (`admin@cakemenu.com`) |
| **Owner WhatsApp** | `src/data/products.js` (`OWNER_PHONE`) | Business WhatsApp number for orders (`+91 84314 41492`) |
| **Delivery Fee** | `src/data/products.js` (`DELIVERY_FEE`) | Standard delivery fee (default: ₹40) |
| **Free Delivery Limit** | `src/data/products.js` (`FREE_DELIVERY_ABOVE`) | Order amount for free delivery (default: ₹500) |
| **Default Max Orders** | `src/data/products.js` (`DEFAULT_MAX_ORDERS_PER_DAY`) | Daily booking limit cap (default: 8) |

---

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
```

To preview the production bundle locally:

```bash
npm run preview
```

To check for code quality and lint issues:

```bash
npm run lint
```

---

## 📄 License

This project is created for **Cake Menu** by Priyanka. All rights reserved.
