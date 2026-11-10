# NutriScan — AI-Powered Food Calorie & Nutrition Tracker
## Master Technical Documentation & MCA Project Viva Guide

---

## 1. Project Overview & Objectives
**NutriScan** is a full-stack MERN application (MongoDB, Express.js, React.js, Node.js) with Google Gemini Vision integration designed to track daily calorie and macronutrient intake.

### Key Objectives:
1. **AI Food Identification:** Detect multiple visible food items in a meal photograph with ingredient suggestions, preparation methods, and realistic portion ranges.
2. **User Confirmation & Integrity:** Enforce human-in-the-loop review. A single photograph cannot determine exact weight, hidden cooking oil, or butter. Users confirm/edit grams and matched foods before any nutrition calculation occurs.
3. **Verified Nutrition Provenance:** Nutrition data is sourced from an authoritative nutrition database (USDA FoodData Central) combined with a curated Indian foods database for foods poorly represented by USDA.
4. **Server-Side Recalculation:** All calories and macronutrients are strictly calculated on the backend to avoid tampering using the formula:
   $$\text{Nutrient Amount} = \frac{\text{Confirmed Grams} \times \text{Nutrient Per 100g}}{100}$$
5. **Calorie Target Engine:** BMR is calculated using the scientifically validated **Mifflin-St Jeor equation**, adjusted for physical activity level (PAL) and dietary goals, with biological safety floors.
6. **Analytics & Diary:** Daily meal logging, 7-day trend visualizations with Recharts, and one-click CSV export.

---

## 2. Technology Stack & Justification

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend** | React 18 (.jsx), Vite | Component-based UI, declarative state, and ultra-fast HMR with Vite |
| **Styling** | Custom Modern CSS | Design tokens, variables, responsive breakpoints without heavy external UI dependencies |
| **State Management** | Context API (`AuthContext`) | Clean global state for user session without Redux boilerplate |
| **Visualizations** | Recharts (SVG based) | Responsive, animated calorie trend charts |
| **Icons** | Lucide React | Modern, accessible SVG icon set |
| **Backend** | Node.js + Express.js | Asynchronous, non-blocking I/O ideal for RESTful API services |
| **Database** | MongoDB Atlas + Mongoose | Schema validation, compound indexing, fast document retrieval |
| **AI Vision** | Google Gemini 1.5 Flash (`@google/generative-ai`) | Vision-capable LLM delivering structured JSON output contracts |
| **Security** | Helmet, CORS, Rate-Limit, bcryptjs, JWT | Hardened HTTP headers, password salt hashing, protected endpoints |
| **File Storage** | Multer | MIME-type filtered, size-limited image upload pipeline |

---

## 3. Database Schema Architecture

```
User (Collection)
├── _id: ObjectId
├── name: String
├── email: String (Unique, Lowercased, Indexed)
├── passwordHash: String (select: false)
├── profile:
│   ├── age: Number (10–120)
│   ├── sex: String ('male' | 'female')
│   ├── heightCm: Number (100–250)
│   ├── weightKg: Number (20–300)
│   ├── activityLevel: String ('sedentary'|'light'|'moderate'|'active'|'extra_active')
│   └── goal: String ('lose'|'maintain'|'gain')
├── calorieGoal: Number (Default: 2000)
├── macroGoals:
│   ├── proteinGrams: Number
│   ├── carbsGrams: Number
│   └── fatGrams: Number
└── timestamps: true

Meal (Collection)
├── _id: ObjectId
├── userId: ObjectId (Ref: User, Indexed)
├── mealType: String ('Breakfast'|'Lunch'|'Dinner'|'Snacks')
├── consumedAt: Date (Indexed)
├── imageUrl: String (URL reference only, never raw binary)
├── foods: Array [
│   ├── name: String
│   ├── databaseFoodId: String
│   ├── source: String ('usda'|'indian_db'|'custom_entry')
│   ├── confirmedGrams: Number (Required)
│   ├── nutrientsPer100g: { energy, protein, carbs, fat, fiber }
│   ├── calculatedNutrients: { energy, protein, carbs, fat, fiber }
│   └── userConfirmed: Boolean
│ ]
├── totals: { energy, protein, carbs, fat, fiber }
├── notes: String
└── timestamps: true
[Compound Index: { userId: 1, consumedAt: -1 }]
```

---

## 4. Key viva Questions & Answers for MCA Exam

### Q1: Why not let the AI directly output the final calories?
**Answer:** An AI model analyzing a 2D image cannot accurately determine weight, oil volume, or hidden sugar. If the AI hallucinates nutrition numbers, it can lead to dangerous dietary guidance. NutriScan uses AI **only for computer vision food identification**. Final calories are calculated by querying verified nutritional databases and multiplying by user-confirmed gram weights.

### Q2: What formula is used for daily calorie recommendations?
**Answer:** The **Mifflin-St Jeor equation**:
- $\text{BMR}_{\text{male}} = 10 \times \text{weight} + 6.25 \times \text{height} - 5 \times \text{age} + 5$
- $\text{BMR}_{\text{female}} = 10 \times \text{weight} + 6.25 \times \text{height} - 5 \times \text{age} - 161$
- $\text{TDEE} = \text{BMR} \times \text{Activity Multiplier}$
- Target = $\text{TDEE} + \text{Goal Adjustment}$ (Loss: $-400\text{ kcal}$, Gain: $+350\text{ kcal}$)
- Hard safety floor: $\ge 1200\text{ kcal}$ for females, $\ge 1500\text{ kcal}$ for males.

### Q3: Why don't you store images in MongoDB?
**Answer:** MongoDB has a 16MB document size limit. Storing raw binary files exhausts RAM, slows down query execution, and inflates database backups. Instead, NutriScan saves images on the server storage and records only the clean URL reference in MongoDB.

### Q4: How is security handled for the APIs?
**Answer:**
- Passwords are salted and hashed using `bcryptjs` with cost factor 10.
- Protected endpoints require a signed JSON Web Token (JWT) sent via `Authorization: Bearer <token>`.
- Strict ownership checks: users can only view, edit, or delete their own meal records (`userId: req.user._id`).
- Rate limiting prevents brute force attacks on the login endpoint.
- File uploads are validated for MIME type (`image/jpeg`, `image/png`, `image/webp`) with a 10 MB maximum size limit.

---

## 5. Running the Application

### Backend:
```bash
cd server
npm run dev
# Running on http://localhost:5000
```

### Frontend:
```bash
cd client
npm run dev
# Running on http://localhost:5173
```

