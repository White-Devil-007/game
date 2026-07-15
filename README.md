# 🎮 Simulation Zero: The Cosmic Sandbox

An AI-powered interactive universe simulator where you design civilizations by adjusting human behavioral traits and rules, then watch how different societies evolve across centuries. Powered by Google Gemini in Gemini-only mode.

## ✨ Features

- **Interactive Trait Sliders** - Morality, Empathy, Curiosity, Greed, Aggression
- **Five Distinct Archetypes** - Utopia, Warworld, Hivemind, Dreamers, Dystopia
- **AI-Powered Narratives** - Google Gemini generates rich sci-fi worldbuilding
- **Timeline Generation** - Watch your civilization evolve through 4+ eras
- **Custom Rules** - Override defaults with your own societal directives
- **Cyberpunk UI** - CRT scanline effects, glowing terminals, immersive aesthetic

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** (for frontend)
- **Google Gemini API Key** (get one free at [ai.google.dev](https://ai.google.dev))

### Installation & Running

#### Option 1: Automated Setup (Recommended)

```bash
# Navigate to project
cd "d:\New folder (4)\new game"

# Run both backend and frontend
python main.py
```

The script will:
- Start FastAPI backend on http://localhost:8000
- Start Vite dev server on http://localhost:5173
- Open the game in your browser automatically

Then navigate to: **http://localhost:5173**

#### Option 2: Manual Setup

**Backend (Terminal 1):**
```bash
cd "d:\New folder (4)\new game"

# Activate Python virtual environment
game\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend (Terminal 2):**
```bash
cd "d:\New folder (4)\new game\frontend"

# Install dependencies
npm install

# Start dev server
npm run dev
```

Then open: **http://localhost:5173**

### Configuration

Create a .env file in the project root:

```env
# Google Gemini API Keys (at least one required)
GEMINI_API_KEY=your_api_key_here

# Optional: Add multiple keys for fallback/rotation
GEMINI_API_KEY_1=first_key_here
GEMINI_API_KEY_2=second_key_here
GEMINI_API_KEY_3=third_key_here
```

**Getting API Keys:**
1. Visit Google AI Studio at https://makersuite.google.com/app/apikey
2. Create an API key
3. Paste into .env file
4. Restart the server

---

## 🎯 How to Play

### 1. Configure Your Civilization
Adjust the five trait sliders (0-100%):
- **Morality** - Ethical compassion vs. amorality
- **Empathy** - Social connection vs. isolation
- **Curiosity** - Scientific advancement vs. stagnation
- **Greed** - Resource competition vs. abundance mindset
- **Aggression** - Violence level vs. pacifism

### 2. Add Custom Rules (Optional)
Insert directives like:
- "Society values art above profit"
- "Technology is forbidden"
- "All resources are shared equally"

### 3. Generate Timeline
Click "Simulate" to create a 4-era civilization evolution from 2030+ AD.

### 4. Explore Results
View:
- **Timeline** - Major events and societal shifts
- **Governance** - How power structures form
- **Architecture** - What cities look like
- **Language** - How communication evolves
- **Unique Badges** - Civilization archetype markers

### 5. Ask Questions
Chat with your universe: "What happened to music?", "Do they reach space?", etc.

---

## 🏛️ Civilization Archetypes

| Archetype | Traits | Outcome |
|-----------|--------|---------|
| 🌸 Utopia | High Empathy + Morality | Post-capitalist paradise, cooperation, bioluminescent cities |
| 💀 Warworld | High Aggression + Greed | Corporate feudalism, orbital warfare, resource scarcity |
| 🤖 Hivemind | High Curiosity - Empathy | Global consciousness network, silicon planets, post-human |
| 🎨 Dreamers | High Curiosity + Empathy | Artistic societies, virtual worlds, floating sanctuaries |
| 🔥 Dystopia | Balanced but dark traits | Surveillance states, environmental collapse, survivalism |

---

## 📁 Project Structure

```
new game/
├── main.py                          # FastAPI backend server
├── requirements.txt                 # Python dependencies
├── README.md                        # This file
├── .env                            # API keys (add manually)
├── .env.example                    # Template for .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # React root component
│   │   ├── Dashboard.jsx           # Main UI & game logic
│   │   ├── App.css                 # Global styles
│   │   ├── index.css               # Base styles
│   │   └── main.jsx                # React entry point
│   ├── package.json                # Frontend dependencies
│   ├── vite.config.js              # Build configuration
│   ├── tailwind.config.js          # Tailwind CSS config
│   └── index.html                  # HTML template
└── game/                           # Python virtual environment
```

---

## 🔧 API Endpoints

Backend runs on: http://localhost:8000

API Docs: http://localhost:8000/docs (auto-generated Swagger UI)

Key Endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /simulate | POST | Generate full civilization timeline |
| /era | POST | Generate single era evolution |
| /chat | POST | Ask questions about the simulation |
| /docs | GET | Interactive API documentation |

---

## 🛠️ Development

### Frontend Development

```bash
cd frontend

# Start dev server (auto-reload)
npm run dev

# Build for production
npm build

# Lint code
npm run lint
```

### Backend Development

```bash
# The main.py runs with --reload flag by default, auto-reloads on changes
uvicorn main:app --reload
```

---

## 📦 Dependencies

**Backend:**
- fastapi - Web framework
- uvicorn - ASGI server
- google-generativeai - Gemini API client
- pydantic - Data validation
- python-dotenv - Environment variables

**Frontend:**
- react - UI framework
- vite - Build tool
- tailwindcss - Styling
- lucide-react - Icons
- @vitejs/plugin-react - React support

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Verify Python virtual environment is activated
game\Scripts\activate

# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Check port 8000 isn't in use
netstat -ano | findstr :8000
```

### Frontend won't load
```bash
# Clear cache and reinstall
cd frontend
rm -r node_modules package-lock.json
npm install

# Check port 5173 isn't in use
netstat -ano | findstr :5173
```

### "No Gemini API keys found"
- The server requires Gemini API keys and will return 503 responses without them.
- Add API keys to .env and restart the backend.

### CORS/Network errors
- Ensure backend is running on http://localhost:8000
- Check frontend proxy settings in vite.config.js
- Clear browser cache (Ctrl+Shift+Delete)

---

## 🚀 Deployment

### Deploy Backend (Python/FastAPI)
- **Heroku:** git push heroku main
- **Fly.io:** flyctl deploy
- **Railway:** Push to GitHub, auto-deploys
- **Azure:** Use App Service + GitHub Actions

### Deploy Frontend (React/Vite)
- **Vercel:** vercel deploy
- **Netlify:** Push to GitHub, auto-deploys
- **GitHub Pages:** npm run build, then push dist/ folder

---

## 📝 License

MIT License - Feel free to use, modify, and distribute.

---

## 🤝 Contributing

Found a bug or have an idea? Contributions welcome!

1. Create a feature branch: git checkout -b feature/your-idea
2. Commit changes: git commit -am 'Add feature'
3. Push to GitHub: git push origin feature/your-idea
4. Create a Pull Request

---

## 🎨 Credits

- **AI Engine:** Google Gemini API
- **Frontend:** React 19 + Vite + Tailwind CSS
- **Backend:** FastAPI + Python
- **Cyberpunk Aesthetic:** CRT effects inspired by synthwave era

---

**Ready to build your universe? Start with python main.py and watch civilizations unfold!** 🌌
