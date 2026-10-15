# Cake Menu

Cake Menu is a responsive ordering web app for Priyanka's home bakery in Sirsi, Uttara Kannada. Customers can browse the live menu, customise cakes and treats, submit pickup requests, and track each order as it is approved and prepared.

## Highlights

- Browse cakes, cupcakes, brownies, and seasonal products.
- Customise product size, flavour, quantity, and a message on the cake.
- Keep a persistent cart and select an available pickup date and time slot.
- Submit an order through WhatsApp or as an online order request.
- Pay on pickup using cash or UPI.
- Create an account, sign in, or continue as a guest.
- Track customer orders in real time, including approval, preparation, ready-for-pickup, and completion states.
- Cancel an order while it is still awaiting baker approval.
- Manage orders, menu items, testimonials, availability, and blocked dates from the admin dashboard.
- Use Firebase Authentication and Cloud Firestore when configured, with local browser storage as a development fallback.

## Tech stack

- React 19
- Vite 8
- React Router 7
- Firebase Authentication and Cloud Firestore
- Lucide React
- Vanilla CSS

## Getting started

### Prerequisites

- Node.js 18 or later
- npm
- A Firebase project, if you want cloud authentication and data sync

### Install and run

```bash
git clone https://github.com/rohan-2510/Cake-Menu.git
cd Cake-Menu
npm install
npm run dev
```

Open the local URL shown by Vite (normally `http://localhost:5173`).

## Firebase setup

Copy `.env.example` to `.env`, then provide your Firebase web-app credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

In Firebase, enable Email/Password authentication and create a Cloud Firestore database. When the Firebase variables are absent, the app remains usable with local storage, but cloud sync and authenticated order management are unavailable.

## Available scripts

```bash
npm run dev      # Start the Vite development server
npm run build    # Create a production build
npm run preview  # Preview the production build
npm run lint     # Run Oxlint
```

## Project structure

```text
src/
├── components/  # Shared UI: header, footer, product modal, testimonials
├── data/        # Shop settings, categories, product and order definitions
├── pages/       # Home, cart, checkout, auth, tracking, and admin pages
├── services/    # Firebase setup and Firestore/Auth operations
├── store/       # Global store, cart state, and real-time subscriptions
└── utils/       # Pricing, date, and WhatsApp helpers
```

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Menu and storefront |
| `/cart` | Shopping cart |
| `/checkout` | Pickup details and order submission |
| `/track` | Customer order tracking |
| `/track/:orderId` | A specific order |
| `/admin` | Bakery administration dashboard |

## Configuration

Business settings such as the owner phone number, shop location, admin email, order capacity, product sizes, and order statuses are maintained in `src/data/products.js`.

The Firebase email that matches the configured admin email receives administrator privileges in the app. Protect production data further with appropriate Firebase Authentication and Firestore security rules.

## Deployment

Run `npm run build` to generate the production files in `dist/`. The repository includes a Vercel rewrite configuration for client-side routing and Firebase hosting configuration.

## License

Created for Cake Menu. All rights reserved.
