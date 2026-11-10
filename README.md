# NutriScan 🥗

An AI-powered food calorie and nutrition tracker built with the MERN stack.

## ⚠️ Accuracy Disclaimer

NutriScan uses AI to identify foods in images. **AI estimates of portion size, weight, hidden ingredients and cooking method cannot be verified from a single photograph.** Nutrition values shown are calculated from your confirmed portions and an authoritative nutrition database, not directly from the image. All results are estimates and are **not medical advice**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + bcryptjs |
| AI | Google Gemini Vision |
| Nutrition | USDA FoodData Central |

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB Atlas account (free tier is fine)
- Google AI Studio API key (Gemini)
- USDA FoodData Central API key (free)

### 1. Clone & install

```bash
git clone <your-repo-url>
cd NutriScan
```

### 2. Configure the server

```bash
cd server
cp .env.example .env
# Open .env and fill in your MONGO_URI, JWT_SECRET, GEMINI_API_KEY, USDA_API_KEY
```

### 3. Install server dependencies

```bash
cd server
npm install
```

### 4. Install client dependencies

```bash
cd ../client
npm install
```

### 5. Run both servers (open two terminals)

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# Client starts on http://localhost:5173
```

---

## Environment Variables

See `server/.env.example` for all required variables.

---

## API Documentation

| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |
| GET | /api/profile | Get user profile |
| PUT | /api/profile | Update profile |
| POST | /api/food/analyze | AI image analysis |
| GET | /api/food/search | Search nutrition DB |
| GET | /api/food/:id/nutrition | Get nutrition by food ID |
| POST | /api/meals | Save a meal |
| GET | /api/meals | List user meals |
| GET | /api/meals/:id | Get one meal |
| PUT | /api/meals/:id | Update meal |
| DELETE | /api/meals/:id | Delete meal |
| GET | /api/dashboard/daily | Daily summary |
| GET | /api/dashboard/weekly | Weekly chart data |
| GET | /api/dashboard/monthly | Monthly chart data |

---

## Project Structure

See `NutriScan-Architecture.md` for the full architecture diagram and folder structure.

---

*Built as an MCA final project. For educational and demonstration purposes.*

