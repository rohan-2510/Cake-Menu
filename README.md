# Cake Menu — Bakery Catalogue & Showcase

Cake Menu is a responsive public-facing bakery catalogue and showcase website for Priyanka's home bakery in Sirsi, Uttara Kannada. Visitors can freely browse freshly baked cakes, cupcakes, brownies, and seasonal specials with real-time updates and an admin-only content management system.

## Highlights

- **Public Bakery Catalogue:** Browse cakes, cupcakes, brownies, and seasonal products without any registration or login required.
- **Informational Product Details:** View available sizes, prices, flavour choices, preparation options (Eggless / With Egg), and allergen information.
- **Direct WhatsApp Enquiry:** Connect directly with Priyanka via WhatsApp to enquire about products.
- **Customer Testimonials:** Read real customer reviews in a carousel with real-time updates.
- **Dedicated Admin Portal (`/admin/login` & `/admin`):** Only the bakery administrator (`admin@cakemenu.com`) can log in to manage products and reviews.
- **Product Management CMS:** Add, edit, delete, mark in/out of stock, set prices, and manage sizes/flavours.
- **Testimonial Management CMS:** Add, edit, delete, and toggle visibility of customer reviews on the website.
- **Firestore Real-time Subscriptions:** Immediate synchronization for products and testimonials.
- **Firestore Security Rules:** Server-side access control restricting all writes to the authorized administrator while providing public read-only access.

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
- A Firebase project for cloud authentication and data sync

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

Deploy Firestore security rules using Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

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
├── components/  # Header, footer, product card, product modal, testimonials
├── data/        # Shop info, categories, default sizes, allergen info
├── pages/       # HomePage, AdminLoginPage, AdminPage
├── services/    # Firebase Auth & Firestore CRUD operations
├── store/       # Global StoreContext with real-time Firestore sync
└── utils/       # Price and date formatting helpers
```

## Routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Bakery catalogue, menu, story, testimonials | Public |
| `/admin/login` | Administrator sign-in portal | Public / Admin |
| `/admin` | Bakery CMS (Product & Testimonial management) | Protected (Admin only) |

## Configuration

Business settings such as the owner phone number, shop location, and admin email are configured in `src/data/products.js`. The Firebase account matching `admin@cakemenu.com` is granted administrator privileges.

## License

Created for Priyanka's Cake Menu. All rights reserved.
