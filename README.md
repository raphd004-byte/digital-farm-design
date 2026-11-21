# 🌾 Digital Farm Design — Farm Management System

**Complete digital farm management system** with Node.js+Express backend, public website, and admin panel.

> 🏷️ **Branch:** `main`  
> 👤 **Maintainer:** raphd004-byte | Last commit: 2 months ago

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Architecture](#-architecture)
3. [Key Features](#-key-features)
4. [Tech Stack](#-tech-stack)
5. [Getting Started](#-getting-started)
6. [API Endpoints](#-api-endpoints)
7. [File Structure](#-file-structure)
8. [Admin Panel](#-admin-panel)
9. [Public Website](#-public-website)
10. [Contributing](#-contributing)
11. [License](#-license)

---

## 🌾 Project Overview

Digital Farm Design is a **smart farm management system** that helps farm owners manage their operations digitally. It includes a public-facing website (for customers) and a secure admin panel (for farm management), with full CRUD operations for fruits, harvests, sales, workers, and costs.

Features:
- **Fruits management** — catalog, pricing, inventory
- **Harvest tracking** — record and track harvests
- **Sales management** — track sales and revenue
- **Worker management** — employee records, notes, performance flags
- **Cost management** — track costs, add/edit/delete
- **Dashboard notes** — customizable admin dashboard tiles
- **SEO optimized website** — story, catalog, contact pages

---

## 🏗️ Architecture

```
digital-farm-design/
├── backend/                     # Node.js + Express API
│   ├── server.js               # Main Express server
│   ├── routes.js               # All API routes
│   └── data/                   # JSON file storage
│       └── farm-data.json      # Farm data store
└── public/                      # Public website + Admin panel
    ├── index.html              # Public website homepage
    ├── admin.html              # Admin panel
    ├── admin-login.html        # Admin login page
    ├── assets/
    │   ├── css/
    │   │   └── admin.css       # Admin styles
    │   └── js/
    │       ├── admin.js        # Admin panel logic
    │       └── app.js          # Public site JS
    └── package.json             # npm config
```

---

## ✨ Key Features

### 🍎 Fruits Management
- **Full CRUD** — add, read, update, delete fruits
- **Catalog display** — public website shows all fruits
- **Pricing & inventory** — track stock and pricing

### 🌱 Harvests
- **Record harvests** — when crops are ready
- **Auto-sync** — harvest data feeds into sales calculations

### 💰 Sales & Revenue
- **Track sales** — record each sale
- **Auto-calculate totals** — total revenue, costs, profit, best seller
- **Dashboard totals** — see key metrics at a glance

### 👥 Workers
- **Worker records** — name, role, notes
- **Performance flags** — mark workers as "hardworking" or "trustworthy"
- **Employee recognition** — dedicated section in admin panel

### 💰 Costs
- **Add costs** — track expenses
- **Edit/Delete** — full CRUD for costs

### 🎨 Admin Dashboard
- **Editable dashboard notes** — add/edit/delete custom tiles
- **Full CRUD** — manage all entities (fruits, harvests, sales, workers, costs, site content)
- **Login required** — secure admin access (admin/farm2026)
- **Stock management** — +/− adjustment buttons
- **Stock auto-updates** — from harvests and sales

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js, Express.js |
| **Database** | JSON file storage (no database required) |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Admin Panel** | Full CRUD SPA |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (recommended)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/raphd004-byte/digital-farm-design.git
   cd digital-farm-design
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   # or
   node server.js
   ```

4. **Access the application**
   - **Public website:** http://localhost:3000/
   - **Admin panel:** http://localhost:3000/admin
   - **Admin login:** `admin` / `farm2026`

### Running Tests

```bash
npm test
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/fruits` | Get all fruits |
| `GET` | `/api/fruits/:id` | Get a fruit by ID |
| `POST` | `/api/fruits` | Add a new fruit |
| `PUT` | `/api/fruits/:id` | Update a fruit |
| `DELETE` | `/api/fruits/:id` | Delete a fruit |
| `GET` | `/api/harvests` | Get all harvests |
| `POST` | `/api/harvests` | Add a harvest |
| `GET` | `/api/sales` | Get all sales |
| `POST` | `/api/sales` | Add a sale |
| `GET` | `/api/workers` | Get all workers |
| `POST` | `/api/workers` | Add a worker |
| `PUT` | `/api/workers/:id` | Update a worker |
| `GET` | `/api/costs` | Get all costs |
| `POST` | `/api/costs` | Add a cost |
| `PUT` | `/api/costs/:id` | Update a cost |
| `GET` | `/api/site-content` | Get site content |
| `PUT` | `/api/site-content` | Update site content |
| `GET` | `/api/dashboard-notes` | Get dashboard notes |
| `POST` | `/api/dashboard-notes` | Add a note |
| `PUT` | `/api/dashboard-notes/:id` | Update a note |
| `DELETE` | `/api/dashboard-notes/:id` | Delete a note |

---

## 📁 File Structure

```
digital-farm-design/
├── .gitignore
├── package.json                  # npm config & scripts
├── package-lock.json
├── backend/
│   ├── server.js                 # Main Express server (port 3000)
│   ├── routes.js                 # All API routes
│   └── data/
│       ├── farm-data.json        # Main data store (JSON)
│       └── logs/                 # Server logs (if enabled)
└── public/
    ├── index.html                # Public website homepage
    ├── admin.html                # Admin dashboard
    ├── admin-login.html          # Admin login page
    ├── assets/
    │   ├── css/
    │   │   ├── admin.css         # Admin panel styles
    │   │   └── style.css         # Public site styles
    │   └── js/
    │       ├── admin.js          # Admin panel logic
    │       └── app.js            # Public site JS
    └── README.md
```

---

## 👨‍🌾 Admin Panel

### Login
- **URL:** `/admin`
- **Credentials:** `admin` / `farm2026`

### Features
- **Fruits CRUD** — manage fruit catalog
- **Harvests** — record and track harvests
- **Sales** — manage sales records
- **Workers** — employee records + performance flags
- **Costs** — track and manage costs
- **Site Content** — edit public website content
- **Dashboard Notes** — customizable dashboard tiles

### Stock Management
- **+** button — increase stock
- **−** button — decrease stock
- **Auto-updates** — from harvests and sales

---

## 🌐 Public Website

The public website is a responsive, single-page application:
- **Homepage** — overview, story, call-to-action
- **Fruit Catalog** — browse all fruits
- **Contact** — contact form
- **SEO** — meta tags, sitemap, robots.txt, SEO optimization

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 📬 Contact

**raphd004-byte** — [GitHub](https://github.com/raphd004-byte)
