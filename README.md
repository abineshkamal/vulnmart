# VulnMart — Vulnerable Web Application for Security Practice

VulnMart is a **deliberately vulnerable** full-stack e-commerce application built for security researchers, penetration testers, and anyone learning web application security. It is intentionally insecure — do **not** deploy it in a production environment.

The application covers all **OWASP Top 10 (2025)** vulnerability categories embedded into realistic, real-world-looking features so that practitioners can discover and exploit them without guided hints.

---

## Why VulnMart?

Most vulnerable-by-design apps come with labels, banners, or comments that tell you exactly where each vulnerability is. VulnMart removes all of that — the code looks like a normal developer wrote it carelessly. You have to find the weaknesses yourself, just like in a real engagement.

Great for:
- Penetration testing practice
- Bug bounty warm-up
- Security training and workshops
- CTF preparation
- Learning secure vs insecure coding patterns

---

## Tech Stack

| Layer    | Technology                         |
|----------|------------------------------------|
| Frontend | React 18, React Router, Vite       |
| Backend  | Node.js, Express                   |
| Database | SQLite (via sql.js)                |
| Auth     | JWT (jsonwebtoken)                 |
| Upload   | Multer                             |

---

## Features

- User registration and login
- Product catalog with search and categories
- Product reviews
- Order management with coupon codes
- User profile management
- Admin panel (users, orders, config, logs, broadcast)
- File upload and management
- Developer tools (ping, URL fetcher, XML import, template engine, expression evaluator)
- Password reset flow

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

### 1. Clone the repository

```bash
git clone https://github.com/abineshkamal/vulnmart.git
cd vulnmart
```

### 2. Set up the backend

```bash
cd backend
npm install
npm run seed      # populates the database with sample data
npm run dev       # starts the API server on http://localhost:4000
```

### 3. Set up the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev       # starts the UI on http://localhost:3000
```

### 4. Open the app

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Default Accounts

| Username | Password    | Role    |
|----------|-------------|---------|
| admin    | admin123    | admin   |
| alice    | password1   | user    |
| bob      | bob123      | user    |
| charlie  | charlie     | user    |
| manager  | manager123  | manager |

---

## Project Structure

```
vulnmart/
├── backend/
│   ├── .env                   # Environment config (intentionally committed)
│   ├── package.json
│   └── src/
│       ├── app.js             # Express app entry point
│       ├── db/
│       │   ├── database.js    # SQLite wrapper
│       │   └── seed.js        # Sample data seeder
│       ├── middleware/
│       │   └── auth.js        # JWT authentication middleware
│       └── routes/
│           ├── auth.js        # Registration, login, profile, password reset
│           ├── products.js    # Products, reviews, orders
│           ├── admin.js       # Admin panel endpoints
│           ├── files.js       # File upload/download/view
│           └── utils.js       # Utility endpoints
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── ProductsPage.jsx
            ├── ProductDetail.jsx
            ├── OrdersPage.jsx
            ├── ProfilePage.jsx
            ├── AdminPage.jsx
            ├── FilesPage.jsx
            └── ToolsPage.jsx
```

---

## Security Notice

> **This application is intentionally insecure.**
>
> - Run it only on `localhost` or an isolated lab network.
> - Never expose it to the internet or a shared network.
> - The `.env` file contains weak credentials by design.
> - No real user data should ever be entered into this application.

---

## OWASP Coverage

VulnMart covers all 10 categories from the OWASP Top 10 (2025). The vulnerabilities are embedded naturally into application features — finding them is part of the exercise.

| Category | Description |
|----------|-------------|
| A01:2025 | Broken Access Control |
| A02:2025 | Security Misconfiguration |
| A03:2025 | Software Supply Chain Failures |
| A04:2025 | Cryptographic Failures |
| A05:2025 | Injection |
| A06:2025 | Insecure Design |
| A07:2025 | Authentication Failures |
| A08:2025 | Software or Data Integrity Failures |
| A09:2025 | Security Logging & Alerting Failures |
| A10:2025 | Mishandling of Exceptional Conditions |

---

## Contributing

Contributions are welcome! Ideas for improvement:

- Add new vulnerable features or routes
- Improve the UI or add new pages
- Write a companion solution guide (as a separate repo)
- Add Docker support for easier setup
- Translate the app for non-English speaking learners

Please open an issue or submit a pull request.

---

## License

MIT License — free to use, share, and modify. See [LICENSE](LICENSE) for details.

---

## Acknowledgements

Inspired by projects like [DVWA](https://github.com/digininja/DVWA), [WebGoat](https://github.com/WebGoat/WebGoat), and [Juice Shop](https://github.com/juice-shop/juice-shop). VulnMart aims to be simpler to set up and closer to what real-world code looks like.
