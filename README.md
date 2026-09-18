# 🛒 ShopSphere — Full-Stack E-Commerce Platform

> A production-structured e-commerce platform where customers browse, cart, and check out, and admins manage the full catalog and order lifecycle — built with a modular, scale-ready architecture from day one.

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white)](#)
[![DRF](https://img.shields.io/badge/Django_REST_Framework-A30000?style=for-the-badge&logo=django&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](#)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](#)
[![Tailwind](https://img.shields.io/badge/TailwindCSS-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](#)

<!--
  🔴 ADD A DEMO GIF OR SCREENSHOT HERE — highest-impact addition you can make.
  Show: browse → add to cart → checkout → order history, plus the admin panel updating order status
-->

**[🚀 Live Demo](#)** · **[📘 API Docs (Swagger)](#)** · **[📋 Full PRD](#)**

---

## Overview

ShopSphere is a full-stack e-commerce platform that lets customers discover products, manage a cart, place orders, and track order history — while giving admins full control over the product catalog, inventory, and order fulfillment. It's built from a proper Product Requirements Document, not scoped ad hoc, with a data model and API contract designed to support payments, multi-seller, and recommendations post-MVP without a rewrite.

## Key Engineering Highlights

- **Requirements-Driven Build** — scoped from a full PRD with prioritized (P0/P1/P2) functional requirements, explicit edge cases, and a documented Definition of Done, not an ad hoc feature list
- **Modular Backend** — five self-contained Django apps (`users`, `catalog`, `cart`, `orders`, `reviews`), each exposing its own DRF viewset, so new capabilities (payments, multi-seller) can be added without touching existing modules
- **Data Integrity by Design** — orders snapshot product name and price at time of purchase, so later catalog edits never alter historical order records
- **JWT-Based Auth with Role Separation** — access/refresh token flow, with a distinct permission layer gating admin-only endpoints (403 for non-admins)
- **Fully Documented API** — OpenAPI schema with interactive Swagger UI, covering every customer and admin endpoint
- **Test-Covered Core Flows** — automated API tests (pytest / DRF test client) across auth, catalog, cart, and order endpoints

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React.js, Tailwind CSS (mobile-first, responsive) |
| **Backend** | Django, Django REST Framework |
| **Auth** | JWT (access + refresh token pair) |
| **Database** | PostgreSQL |
| **API Docs** | OpenAPI / Swagger UI |
| **Testing** | pytest, DRF test client |
| **Version Control** | Git + GitHub, feature-branch workflow |

## System Architecture

The backend is split into independent, self-contained Django apps rather than one monolithic codebase — each owns its own models, views, and DRF viewset:

```
┌─────────────────────────────────────────────┐
│              React + Tailwind UI             │
│   (customer storefront · admin dashboard)    │
└────────────────────┬──────────────────────────┘
                      │  REST (JWT-authenticated)
┌────────────────────▼──────────────────────────┐
│               Django REST Framework            │
│  ┌────────┐ ┌─────────┐ ┌──────┐ ┌──────┐ ┌───────┐
│  │ users  │ │ catalog │ │ cart │ │orders│ │reviews│
│  └────────┘ └─────────┘ └──────┘ └──────┘ └───────┘
└────────────────────┬──────────────────────────┘
                      │
              ┌───────▼────────┐
              │  PostgreSQL     │
              └─────────────────┘
```

Each module is independently extensible — payment processing, multi-seller support, and recommendations can be added as new apps without modifying existing ones.

## Data Model

```
User ──< CartItem >── Product ──> Category
User ──< Order ──< OrderItem >── Product
User ──< Review >── Product
```

Orders store a **price and name snapshot** on each `OrderItem` at the moment of purchase — a deliberate design choice so historical orders remain accurate even if a product is later edited, repriced, or deleted.

## Features

| Feature | Description |
|---|---|
| **Product Discovery** | Paginated browsing with search, category/price filtering, and sort (price, newest) |
| **Cart Management** | Add/update/remove items with live stock validation and stale-stock warnings |
| **Checkout & Orders** | Cart-to-order conversion with stock validation, inventory decrement, and price snapshotting |
| **Order Tracking** | Full order history and per-order line-item detail for customers |
| **Admin Catalog Control** | Full CRUD on products and categories, inventory management |
| **Admin Order Management** | View all orders, enforce valid status transitions (Pending → Processing → Shipped → Delivered / Cancelled) |
| **Reviews & Ratings** | One review per customer per product, surfaced with average rating on product pages |

## API Reference

Full interactive spec published via OpenAPI/Swagger at `/api/docs/`. Highlights:

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | — | Create customer account |
| `POST` | `/api/v1/auth/login` | — | Obtain access + refresh token |
| `GET` | `/api/v1/products` | — | List products (`?search=&category=&sort=&min_price=&max_price=&page=`) |
| `POST` | `/api/v1/cart/items` | Customer | Add item to cart |
| `POST` | `/api/v1/orders/checkout` | Customer | Create order from cart |
| `GET` | `/api/v1/orders` | Customer | List own orders |
| `POST` | `/api/v1/admin/products` | Admin | Create product |
| `PATCH` | `/api/v1/admin/orders/{id}/status` | Admin | Update order status |

*(See Swagger docs for the complete contract, including reviews and category management endpoints.)*

## Non-Functional Requirements

- **Security** — JWT auth, role-based permissions, all mutating endpoints protected
- **Performance** — indexed queries on search/filter fields, paginated list endpoints
- **Scalability** — modular app structure, stateless API for horizontal scaling
- **Maintainability** — clear module boundaries by domain (users, catalog, cart, orders, reviews)

## Roadmap (Post-MVP)

- [ ] Stripe/PayPal payment integration
- [ ] Cloudinary-based product image storage
- [ ] Discount / coupon system
- [ ] Wishlist
- [ ] Email notifications (order confirmation, status updates)
- [ ] Product recommendations
- [ ] Multi-seller marketplace support
- [ ] Analytics dashboard

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL

### Clone the Repository
```bash
git clone https://github.com/MHuzaifaAlam/ShopSphere.git
cd ShopSphere
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

API documentation available at `http://localhost:8000/api/docs/` once the backend is running.

<!-- 🔴 Add .env / environment variable setup here if your config requires it -->

## Author

**Muhammad Huzaifa Alam**
Full-Stack Software Engineer · React.js, Django, FastAPI

[GitHub](https://github.com/MHuzaifaAlam) · [LinkedIn](https://www.linkedin.com/in/m-huzaifa-alam/) · [Portfolio](https://huzaifa-at-work.framer.website/) · [Email](mailto:mhuzaifaalam7@gmail.com)

---

<p align="center"><i>Built from a full PRD — see the Definition of Done in the project docs for MVP completion criteria.</i></p>
