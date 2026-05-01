# 🏠 Hostel Gate Pass System (PWA)

A full-stack Progressive Web App for managing hostel gate passes with JWT authentication, MongoDB storage, and mobile-first design.

---

## 📁 Project Structure

```
hostel-gatepass/
├── backend/
│   ├── server.js           # Express server entry
│   ├── .env                # Environment variables
│   ├── middleware/
│   │   └── auth.js         # JWT middleware
│   ├── models/
│   │   ├── User.js         # User schema
│   │   └── GatePass.js     # GatePass schema
│   └── routes/
│       ├── auth.js         # /signup /login /me
│       └── gatepass.js     # CRUD gate pass
├── frontend/
│   ├── login.html          # Login page
│   ├── signup.html         # Signup page
│   ├── index.html          # Dashboard
│   ├── app.js              # Shared utilities
│   └── dashboard.js        # Dashboard logic
└── public/
    ├── styles.css           # All styles
    ├── manifest.json        # PWA manifest
    ├── service-worker.js    # Offline support
    ├── assets/              # Gate pass icons
    └── icons/               # PWA icons (192, 512)
```

---

## 🚀 Setup & Run

### Prerequisites
- Node.js v18+
- MongoDB running locally OR MongoDB Atlas connection string

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
Edit `backend/.env`:
```
PORT=3000
MONGO_URI=mongodb://localhost:27017/hostel_gatepass
JWT_SECRET=your_super_secret_key
```

### 3. Start the server
```bash
cd backend
npm start
```

### 4. Open the app
Visit: `http://localhost:3000/login.html`

---

## 🔐 Auth Flow

- **Signup** → creates user, stores hashed password, returns JWT (7 days)
- **Login** → verifies credentials, returns JWT
- **Dashboard** → verifies token, auto-fills Name from `/api/me`
- **Token** stored in `localStorage`

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/signup` | ❌ | Create account |
| POST | `/api/login` | ❌ | Login |
| GET | `/api/me` | ✅ | Get current user |
| GET | `/api/gatepass` | ✅ | Get latest gate pass |
| GET | `/api/gatepass/all` | ✅ | Get all recent passes |
| POST | `/api/gatepass` | ✅ | Create gate pass |
| PUT | `/api/gatepass/:id` | ✅ | Update gate pass |

---

## 📱 PWA Features

- Installable on mobile/desktop
- Offline support (static assets cached)
- Network-first strategy for API calls
- Custom VM icon (192x192, 512x512)

---

## 🛡️ Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens expire in 7 days
- All dashboard routes protected via middleware
- CORS enabled
