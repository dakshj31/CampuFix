# CampusFix – AI-Powered College Complaint & Service Management App

**Team:** CampusFix | KIET University | MCA – AI Fundamentals & Python Programming  
**Members:** Ayush Malik (Lead), Dhruv Kumar Singh, Daksh Joshi, Honey Choudhary

---

## 🏗 Architecture

```
campusfix/
├── frontend/        → React app (port 3000)
├── backend/         → Node.js + Express API (port 4000)
└── ai_service/      → Python Flask AI classifier (port 5001)
```

### Flow
```
React UI → Node.js Backend (4000) → Python AI Service (5001)
                                  → In-Memory DB
```

---

## 🚀 Quick Start

### Step 1: AI Service (Python)
```bash
cd ai_service
pip install -r requirements.txt
python app.py
# Running at http://localhost:5001
```

### Step 2: Backend (Node.js)
```bash
cd backend
npm install
node index.js
# Running at http://localhost:4000
```

### Step 3: Frontend (React)
```bash
cd frontend
npm install
npm start
# Opens at http://localhost:3000
```

---

## 🔑 Demo Accounts

| Role    | Email                 | Password    |
|---------|-----------------------|-------------|
| Student | student@kiet.edu      | student123  |
| Staff   | staff@kiet.edu        | staff123    |
| Admin   | admin@kiet.edu        | admin123    |

---

## ✅ Features (Prototype)

| Feature | Description |
|---------|-------------|
| 🔐 Auth | Register/Login with JWT, role-based (student/staff/admin) |
| ➕ New Complaint | Free-text + location picker, AI classification |
| 🤖 AI Classification | Category, priority, department auto-detection |
| 📋 Complaint Tracking | Submitted → In Progress → Resolved status flow |
| 🔔 Notifications | In-app alerts on status changes |
| ⭐ Feedback | Rate resolved complaints (1-5 stars) |
| 📊 Analytics | Charts: by category, status, priority, department |
| 🛡 Admin Panel | Filter, view, assign, override AI routing |

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, receive JWT |
| GET | `/api/complaints` | JWT | List complaints |
| POST | `/api/complaints` | JWT | Submit complaint |
| GET | `/api/complaints/:id` | JWT | Complaint details + history |
| PATCH | `/api/complaints/:id/status` | Staff/Admin | Update status |
| PATCH | `/api/complaints/:id/assign` | Admin | Override AI routing |
| POST | `/api/complaints/:id/feedback` | Student | Submit rating |
| GET | `/api/notifications` | JWT | List notifications |
| GET | `/api/analytics` | Staff/Admin | Analytics data |
| GET | `/api/locations` | JWT | Campus locations |

## 🤖 AI Service Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/classify` | Classify complaint text |

**Request:**
```json
{ "text": "WiFi not working in lab", "location": "Block A Lab" }
```

**Response:**
```json
{
  "category": "Wi-Fi / Network",
  "priority": "High",
  "department": "IT Department",
  "confidence": 0.87,
  "needs_manual_routing": false
}
```

## 🏷 AI Categories

| Category | Department |
|----------|------------|
| Wi-Fi / Network | IT Department |
| Projector / AV | IT Department |
| AC / Cooling | Maintenance |
| Electrical | Maintenance |
| Furniture | Maintenance |
| Water / Plumbing | Maintenance |
| Cleanliness | Administration |
| Other | Administration |
