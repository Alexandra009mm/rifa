# Collaborative Raffle Management Web App

A production-ready, modular web application for managing a 100-number raffle (00 to 99) with persistent data storage across multiple devices powered by PostgreSQL and Docker.

---

## Features

1. **Multi-device Persistence**:
   - Backed by PostgreSQL 16.
   - Any device (mobile phones, tablets, PCs) connected to the local network or domain accesses the same real-time synchronized data.
   - Automatic polling keeps client views updated without manual page reloads.

2. **Active Participant Preservation & Pre-seeding**:
   - The active 62 participants are automatically seeded upon first database startup without data loss.
   - Numbers previously marked with checkmarks (`05`, `12`, `14`, `29`, `55`) are initialized with `pagado` status ($10,000 paid).
   - All other existing participants are initialized with `pendiente` status ($0 paid).

3. **Payment Status Tracking**:
   - **Pagado (Fully Paid)**: Marked with a green badge, checkmark, and a visual strikethrough effect across the buyer's name.
   - **Abonó (Partial Deposit)**: Stores the specific amount deposited (e.g., $5,000) and displays both the deposited amount and remaining balance.
   - **Pendiente (Pending)**: Indicates buyer reservation awaiting payment.
   - Fast filter chips: "Todos", "Vendidos", "✅ Pagados", "💳 Con Abono", "⏳ Pendientes", and "Disponibles".

4. **Accidental Reset Protection**:
   - The "Reiniciar todo" button is protected by a dedicated security confirmation dialog.
   - Users are required to explicitly type `REINICIAR` to unlock the reset action, eliminating accidental clicks on touchscreens or misclicks.
   - Backend API rejects reset attempts without the matching security confirmation.

5. **Modular Architecture & Micro-animations**:
   - Separated into layered modules: Config, Constants, Repositories, Services, Controllers, and Routes.
   - Frontend separated into modular CSS (base and micro-animations) and JavaScript modules (API, UI, ModalManager, App).
   - Micro-animations for button interactions, status transitions, modal dialogs, and toast alerts.

---

## Project Structure

```text
├── Dockerfile                  # Multi-stage production-ready container definition
├── docker-compose.yml          # PostgreSQL 16 + Node.js application orchestration
├── package.json                # Project dependencies and operational scripts
├── .env.example                # Environment variables template
├── public/                     # Static frontend assets
│   ├── css/
│   │   ├── style.css           # Design system and layout styles
│   │   └── animations.css      # Keyframes, transitions, and micro-interactions
│   ├── js/
│   │   ├── api.js              # REST client wrapper
│   │   ├── ui.js               # DOM rendering, badges, and toasts
│   │   ├── modal.js            # Edit and reset modal controller
│   │   └── app.js              # App orchestration and auto-sync
│   ├── img/                    # Raffle images (prize and flyer)
│   └── index.html              # Modern semantic web interface
├── src/                        # Backend application source code
│   ├── config/
│   │   └── db.js               # PostgreSQL pool connection and table init
│   ├── constants/
│   │   └── initialData.js      # Active participant dataset (00-99)
│   ├── controllers/
│   │   └── ticketController.js # HTTP route controllers
│   ├── repositories/
│   │   └── ticketRepository.js # SQL data access queries
│   ├── routes/
│   │   └── ticketRoutes.js     # Express API routes
│   ├── services/
│   │   └── ticketService.js    # Business logic, validations, calculations
│   ├── app.js                  # Express app setup and middleware
│   └── server.js               # Server bootstrapping and graceful shutdown
└── tests/
    ├── ticketLogic.test.js     # Unit test suite
    └── apiIntegration.test.js  # Integration test suite
```

---

## Quick Start with Docker

### Prerequisites
- Docker & Docker Compose installed.

### 1. Launch Services
Run the following command to build and launch both PostgreSQL and the web application:
```bash
docker compose up -d --build
```

### 2. Access the Application
- Open your browser at: `http://localhost:3000`
- To access from a mobile phone on the same Wi-Fi network, navigate to: `http://<YOUR_LOCAL_IP>:3000`

### 3. Check Service Logs
```bash
docker compose logs -f
```

### 4. Stop Services
```bash
docker compose down
```

---

## Running Locally (Without Docker)

### Prerequisites
- Node.js >= 18
- Running PostgreSQL database instance

### Steps
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env`:
   ```bash
   cp .env.example .env
   # Update DATABASE_URL or DB_HOST, DB_USER, DB_PASSWORD
   ```
3. Run tests:
   ```bash
   npm test
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

---

## REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/tickets` | List all tickets (supports `?query=` and `?status=`) |
| `GET` | `/api/tickets/stats` | Aggregated sales and funds statistics |
| `GET` | `/api/tickets/export` | Formatted plain-text export for clipboard sharing |
| `GET` | `/api/tickets/:number` | Retrieve details for a single number |
| `PUT` | `/api/tickets/:number` | Update buyer name, status (`pendiente`, `abono`, `pagado`), and amount |
| `POST` | `/api/tickets/:number/release` | Release number back to available |
| `POST` | `/api/tickets/reset` | Safe reset all tickets (requires `{ "confirmation": "REINICIAR" }`) |
