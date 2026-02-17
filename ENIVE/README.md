# BossUp - African Business Crowdfunding Platform

A production-ready MVP for connecting investors with African businesses.

## 🏗️ Architecture

**Security-First Design:**
- Firebase = Auth + Database (backend-only)
- FastAPI = Authority + Logic
- Frontend NEVER touches Firebase directly
- Custom JWT issued by backend

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│    FastAPI      │────▶│    Firebase     │
│   (HTML/JS)     │     │    Backend      │     │   (Firestore)   │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │    Custom JWT         │   Firebase Admin SDK
        └───────────────────────┘
```

## 📁 Project Structure

```
ENIVE/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── core/
│   │   │   ├── firebase.py      # Firebase Admin SDK
│   │   │   └── security.py      # JWT & role enforcement
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── campaign_service.py
│   │   │   └── payment_service.py
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── campaigns.py
│   │       ├── payments.py
│   │       └── admin.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── marketplace.html
│   ├── campaign.html
│   ├── investor-dashboard.html
│   ├── business-dashboard.html
│   ├── admin.html
│   └── assets/
│       ├── css/
│       └── js/
│
└── README.md
```

## 🚀 Quick Start

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Enable **Firestore Database**
4. Go to Project Settings → Service Accounts
5. Click "Generate new private key"
6. Save as `firebase-credentials.json` in `/backend/`

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env

# Edit .env with your settings
# IMPORTANT: Set a strong JWT_SECRET_KEY for production!

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Option 1: VS Code Live Server extension
# Right-click index.html → "Open with Live Server"

# Option 2: Python HTTP server
python -m http.server 5500

# Option 3: Node.js serve
npx serve -l 5500
```

### 4. Access the Application

- **Frontend:** http://localhost:5500
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

## 👥 User Roles

| Role | Access |
|------|--------|
| **INVESTOR** | Browse campaigns, invest, view portfolio |
| **BUSINESS_OWNER** | Create campaigns, track funding |
| **ADMIN** | Approve/reject campaigns, manage users, view audit logs |

## 🔐 Security Features

- ✅ Firebase Admin SDK (backend-only)
- ✅ Custom JWT with role claims
- ✅ Role-based access control
- ✅ Ownership verification
- ✅ Audit logging
- ✅ No secrets in frontend

## 📊 Firestore Data Model

### users/{userId}
```json
{
  "email": "user@example.com",
  "role": "INVESTOR | BUSINESS_OWNER | ADMIN",
  "country": "NG",
  "kyc_status": "PENDING | VERIFIED | REJECTED",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### campaigns/{campaignId}
```json
{
  "owner_id": "userId",
  "title": "Campaign Title",
  "description": "...",
  "country": "NG",
  "target_amount": 50000,
  "raised_amount": 12500,
  "status": "PENDING | LIVE | REJECTED | COMPLETED"
}
```

### transactions/{txId}
```json
{
  "user_id": "investorId",
  "campaign_id": "campaignId",
  "amount": 1000,
  "status": "PENDING | COMPLETED | FAILED",
  "created_at": "2024-01-01T00:00:00Z"
}
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Authenticate & get JWT
- `GET /auth/me` - Get current user profile

### Campaigns
- `GET /campaigns` - List live campaigns
- `GET /campaigns/{id}` - Get campaign details
- `POST /campaigns` - Create campaign (Business Owner)
- `PUT /campaigns/{id}` - Update campaign (Owner)

### Payments
- `POST /payments/initiate` - Start payment (Investor)
- `POST /payments/confirm` - Confirm payment (Webhook)
- `GET /payments/my` - Get user transactions

### Admin
- `GET /admin/campaigns/pending` - List pending approvals
- `POST /admin/campaigns/{id}/approve` - Approve campaign
- `POST /admin/campaigns/{id}/reject` - Reject campaign
- `GET /admin/users` - List users
- `GET /admin/audit-logs` - View audit logs

## ⚠️ Production Checklist

- [ ] Set strong `JWT_SECRET_KEY`
- [ ] Configure Firestore security rules
- [ ] Set up proper CORS origins
- [ ] Implement rate limiting
- [ ] Add HTTPS
- [ ] Replace payment stub with real gateway
- [ ] Implement proper password verification
- [ ] Set up monitoring & alerts

## 📝 Development Notes

### Payment Integration

The payment system uses a stub gateway for development. To integrate a real provider:

1. Create a new class implementing `PaymentGateway`
2. Implement `create_session()` and `verify_payment()`
3. Update `PaymentService` initialization
4. Add webhook endpoint for gateway callbacks

### Firebase Rules (Defensive)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default: deny all direct access
    // All access should go through backend
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 📄 License

MIT License - See LICENSE file

---

Built with ❤️ for African entrepreneurs
