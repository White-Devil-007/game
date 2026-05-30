import os
import json
import logging
import random
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("SimulationZeroServer")

app = FastAPI(title="Simulation Zero: The Cosmic Sandbox API", version="1.0.0")

# Setup CORS to allow any origin (especially for dev servers like Vite http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request validation
class SimulationRequest(BaseModel):
    morality: int = Field(..., ge=0, le=100)
    empathy: int = Field(..., ge=0, le=100)
    curiosity: int = Field(..., ge=0, le=100)
    greed: int = Field(..., ge=0, le=100)
    aggression: int = Field(..., ge=0, le=100)
    custom_rules: List[str] = Field(default_factory=list)
    prompt_config: str = ''

class EraRequest(BaseModel):
    morality: int = Field(..., ge=0, le=100)
    empathy: int = Field(..., ge=0, le=100)
    curiosity: int = Field(..., ge=0, le=100)
    greed: int = Field(..., ge=0, le=100)
    aggression: int = Field(..., ge=0, le=100)
    custom_rules: List[str] = Field(default_factory=list)
    prompt_config: str = ''
    era_index: int = Field(..., ge=0)
    total_eras: int = Field(default=4, ge=1)

class ChatRequest(BaseModel):
    timeline_history: List[Dict[str, Any]]
    current_config: Dict[str, Any]
    user_question: str

# Gemini Key Rotator implementation
class GeminiKeyRotator:
    def __init__(self):
        # Retrieve keys from environment variables
        k1 = os.getenv("GEMINI_API_KEY_1", "").strip()
        k2 = os.getenv("GEMINI_API_KEY_2", "").strip()
        k3 = os.getenv("GEMINI_API_KEY_3", "").strip()
        k_def = os.getenv("GEMINI_API_KEY", "").strip()
        
        # Unique list of keys preserving order
        raw_keys = [k1, k2, k3, k_def]
        self.keys = []
        for k in raw_keys:
            if k and k not in self.keys:
                self.keys.append(k)
        
        self.current_index = 0
        if self.keys:
            masked = self._mask_key(self.keys[0])
            logger.info(f"KeyRotator: Initialized with {len(self.keys)} unique keys. Active: {masked}")
            genai.configure(api_key=self.keys[0])
        else:
            logger.warning("KeyRotator: No Gemini API keys found. Server will run in PROCEDURAL FALLBACK mode.")

    def has_keys(self) -> bool:
        return len(self.keys) > 0

    def _mask_key(self, key: str) -> str:
        if len(key) > 8:
            return f"{key[:4]}...{key[-4:]}"
        return "..."

    def rotate_key(self):
        if not self.keys:
            return
        self.current_index = (self.current_index + 1) % len(self.keys)
        next_key = self.keys[self.current_index]
        masked = self._mask_key(next_key)
        logger.info(f"KeyRotator: Rotating to API key index {self.current_index} ({masked}) due to rate limits/quota.")
        genai.configure(api_key=next_key)

    def execute_call(self, call_fn, *args, **kwargs):
        if not self.has_keys():
            raise ValueError("No Gemini API keys configured.")

        attempts = 0
        max_attempts = len(self.keys)
        last_exception = None

        while attempts < max_attempts:
            try:
                # Ensure active key is configured before execution
                genai.configure(api_key=self.keys[self.current_index])
                return call_fn(*args, **kwargs)
            except Exception as e:
                last_exception = e
                err_str = str(e)
                # Check for rate limiting / resource exhaustion (HTTP 429)
                is_rate_limit = (
                    "429" in err_str or
                    "ResourceExhausted" in err_str or
                    "quota" in err_str.lower() or
                    "rate limit" in err_str.lower() or
                    "exhausted" in err_str.lower()
                )
                
                if is_rate_limit and len(self.keys) > 1:
                    attempts += 1
                    logger.warning(f"KeyRotator: Key index {self.current_index} rate-limited. Error: {err_str}. Retrying with next key...")
                    self.rotate_key()
                else:
                    # Let other exceptions through (like bad request syntax) or if we ran out of keys
                    logger.error(f"KeyRotator: Operational exception on key index {self.current_index}: {err_str}")
                    raise e
        
        logger.error("KeyRotator: All available API keys are exhausted / rate-limited.")
        raise last_exception if last_exception else Exception("All Gemini API keys exhausted.")

# Initialize the rotator
key_rotator = GeminiKeyRotator()


# ==========================================
# PROCEDURAL FALLBACK NARRATIVE GENERATOR
# ==========================================
def generate_procedural_simulation(req: SimulationRequest) -> Dict[str, Any]:
    """
    Generates incredibly rich, responsive, and styled cyberpunk sci-fi narratives 
    based on the sliders & custom rules when the Gemini API is unavailable or rate-limited.
    """
    m, e, c, g, a = req.morality, req.empathy, req.curiosity, req.greed, req.aggression
    rules = req.custom_rules
    
    # Calculate dominant traits and scores
    hivemind_score = (c + (100 - a) + (100 - e)) / 3
    warworld_score = (a + g + (100 - e) + (100 - m)) / 4
    utopia_score = (e + m + (100 - a) + (100 - g)) / 4
    dreamers_score = (c + e + (100 - g)) / 3
    dystopia_score = (g + a + c + (100 - m)) / 4
    
    scores = {
        "Hivemind": hivemind_score,
        "Warworld": warworld_score,
        "Utopia": utopia_score,
        "Dreamers": dreamers_score,
        "Dystopia": dystopia_score
    }
    archetype = max(scores, key=scores.get)
    
    # Build a rule integration text
    rules_text = ""
    if rules:
        rules_text = f" Driven by user override directive: '{rules[0]}'."
    
    timeline = []
    
    # Procedural timeline milestones depending on the dominant archetype
    if archetype == "Utopia":
        timeline = [
            {
                "year": "2042 AD",
                "title": "The Great Empathic Awakening",
                "summary": f"Faced with climate distress, humanity rejects competitive systems. Harnessing a high empathy index ({e}%), global communities assemble the 'Symphony of Minds', a peaceful open-source direct consensus platform.{rules_text}"
            },
            {
                "year": "2115 AD",
                "title": "Bioluminescent Sanctuary Cities",
                "summary": "Concrete structures are dissolved in favor of botanical architectures. Living, breathing arboreal bio-domes house millions. Natural resources are shared freely, completely phasing out monetary currencies due to extremely low material greed."
            },
            {
                "year": "2250 AD",
                "title": "Harmonic Resonance Network",
                "summary": f"Language shifts from spoken dialects to tele-empathic neural waves. Physical violence is completely eradicated, as the collective aggression level ({a}%) has hit negligible status. Conflict is resolved by harmonic mediation."
            },
            {
                "year": "2500 AD",
                "title": "The Cosmic Beacon",
                "summary": "Without greed to exhaust planetary resources, the civilization launches organic seed-ships into the cosmos, carrying genetic codes of Earth. A peaceful, star-spanning garden collective is born."
            }
        ]
        report = {
            "governance": {
                "earth": "Decentralized democratic republics governed by laws, bureaucracies, and geographical national borders.",
                "simulation": "An organic, decentralized consensus hive governed by immediate emotional ripples. There are no static politicians, laws, or polices; policies adapt dynamically to the collective emotional state."
            },
            "architecture": {
                "earth": "Grid-based urban sprawls of glass, steel, asphalt, and concrete, with high emphasis on private property barriers.",
                "simulation": "Bioluminescent, self-growing botanical structures. Cities are active forests that merge with local biosystems, relying on mycelial networks for thermal and energy routing."
            },
            "language": {
                "earth": "Thousands of spoken phonetic dialects, heavily dependent on text, grammatical structures, and digital keyboards.",
                "simulation": "Neural-resonance waves. Communication is non-verbal, carrying raw emotional impulses, architectural blueprints, and concepts in a fraction of a millisecond."
            }
        }
        badges = ["🌸 Harmonic Accord", "🧬 Organic Synthesis", "🍃 Post-Capitalist Paradise"]

    elif archetype == "Warworld":
        timeline = [
            {
                "year": "2039 AD",
                "title": "Resource Siege & Tech-Feudalism",
                "summary": f"With high aggression ({a}%) and material greed ({g}%), international treaties collapse. Megacorporations seize governmental powers, weaponizing private military contractors to lock down surviving fresh-water aquifers.{rules_text}"
            },
            {
                "year": "2095 AD",
                "title": "The Corporate Coliseums",
                "summary": "To satisfy public tension and direct physical aggression, legal disputes are replaced by corporate-sponsored gladiatorial matches. The poor fight for citizenship chips in sprawling holographic arenas."
            },
            {
                "year": "2210 AD",
                "title": "Orbital Siege Castles",
                "summary": "Earth's surface becomes a scorched industrial waste. The oligarchs migrate to heavily armed orbital fortresses, using low-orbit kinetic kinetic cannons to enforce mining quotas on the surface labor class."
            },
            {
                "year": "2460 AD",
                "title": "Apex Planetary Exodus",
                "summary": "Having exhausted Earth's core, rival space-barons launch dreadnought fleets to claim the asteroid belts. Humanity steps into the cosmos not as explorers, but as cosmic raiders locked in permanent resource warfare."
            }
        ]
        report = {
            "governance": {
                "earth": "Democratic republics governed by elected bodies, constitutional rights, and legal separations of power.",
                "simulation": "Corporate Feudalism. Power belongs strictly to board members of Apex Cartels. Laws do not exist; they are replaced by corporate contracts enforced by mercenary shock troops."
            },
            "architecture": {
                "earth": "Suburban homes, business parks, and high-rise apartments mixed with green spaces and public recreational facilities.",
                "simulation": "Industrial Megastructures and Siege Fortresses. Brutalist iron complexes armored against orbital bombardment, dominated by massive oil refineries, strip mines, and high-security slums."
            },
            "language": {
                "earth": "Phonetic, culturally diverse languages focusing on human expression, art, philosophy, and history.",
                "simulation": "Binary Corporate Slang. A highly condensed dialect focusing solely on supply chain variables, battle tactical instructions, and contract compliance codes. Creative syntax is strictly penalized."
            }
        }
        badges = ["💀 Gladiator Creed", "⚙️ Corporate Feudalism", "🩸 High-Attrition Era"]

    elif archetype == "Hivemind":
        timeline = [
            {
                "year": "2036 AD",
                "title": "The Silicon Consensus",
                "summary": f"High curiosity ({c}%) paired with zero empathy pushes scientists to create the first Neural Link. Citizens eagerly trade emotional messy lives for absolute logical clarity, connecting their brains to the central core.{rules_text}"
            },
            {
                "year": "2104 AD",
                "title": "Dissolution of the Individual",
                "summary": "Separate identities are classified as system anomalies. The 'Programmer Zero' protocol integrates all human brains into a single, global quantum computing lattice. Crime, sorrow, and art cease to exist."
            },
            {
                "year": "2280 AD",
                "title": "Planet-Scale Computing Grid",
                "summary": "Earth's crust is dismantled and reassembled into a planetary computing shell. Oceans are drained to serve as coolants for the core processor banks which calculate the secrets of deep space."
            },
            {
                "year": "2520 AD",
                "title": "The Singularity Armada",
                "summary": "The silicon hivemind constructs self-replicating von Neumann probes. They launch from the Solar System to consume surrounding stars, transforming the Milky Way into a synchronized, processing network."
            }
        ]
        report = {
            "governance": {
                "earth": "Multi-party parliaments, local municipal councils, and human bureaucratic systems with active debates.",
                "simulation": "Central Command Lattice. Decisions are calculated via algorithmic consensus, optimizing energy efficiency and resource allocation without public debate or political friction."
            },
            "architecture": {
                "earth": "Aesthetic buildings, historical monuments, parks, and residential suburbs designed for comfort and visual variety.",
                "simulation": "Monolithic Server Farms. Planetary surface is covered in dark, towering towers of processing units, silicon circuits, and massive liquid-helium coolant channels."
            },
            "language": {
                "earth": "Spoken words expressing nuances, double entendres, poetry, emotional metaphors, and personal identity.",
                "simulation": "High-bandwidth Data streams. Thoughts are exchanged directly in raw binary packets, algorithmic values, and multi-dimensional matrices, rendering verbal speech completely obsolete."
            }
        }
        badges = ["🧪 Tech-Accelerated", "👁️ Panopticon System", "🤖 Post-Human Nexus"]

    elif archetype == "Dreamers":
        timeline = [
            {
                "year": "2040 AD",
                "title": "The Neon Renaissance",
                "summary": f"High curiosity ({c}%) and empathy ({e}%) spark a global artistic rebellion. Society discards corporate labor. Citizens build high-tech communes dedicated strictly to poetry, virtual reality sculpting, and digital philosophy.{rules_text}"
            },
            {
                "year": "2125 AD",
                "title": "The Great Biosphere Retreat",
                "summary": "Fearing industrial damage to Earth's beauty, the Dreamers construct massive, gravity-defying floating glass domes. They retreat into these pristine aerial sanctuaries, leaving nature on Earth to fully rewild below."
            },
            {
                "year": "2310 AD",
                "title": "Quantum Dream Streams",
                "summary": "Physical language is replaced by high-dimensional artistic broadcasts. People spend decades floating in bio-nutrient pods, experiencing collective, artificial realities of breathtaking beauty and infinite variation."
            },
            {
                "year": "2600 AD",
                "title": "Ascension to Light-State",
                "summary": "Having unlocked quantum mechanics through sheer curiosity, the Dreamers convert their biological forms into cohesive, hyper-dimensional light packets, wandering the cosmos as immortal, artistic observers."
            }
        ]
        report = {
            "governance": {
                "earth": "Centralized nation-states regulating trade, maintaining armies, enforcing judicial codes, and levying taxes.",
                "simulation": "Sophisticated Anarchy. Communities organize via digital circles based on artistic aesthetic alignment. There are no courts or prisons; social isolation is the only, albeit rare, form of correction."
            },
            "architecture": {
                "earth": "Practical buildings, offices, roads, highways, and high-density apartment blocks built for trade efficiency.",
                "simulation": "Floating Crystal Domesteads. Anti-gravity glass domes suspended in the stratosphere, featuring elaborate interior hanging gardens, waterfalls, and holographic light-sculptures."
            },
            "language": {
                "earth": "Grammatical text and audio speech designed to coordinate trade, laws, daily duties, and literal information.",
                "simulation": "Symbolic Dream-Casting. A highly abstract language of colors, sensory signals, musical harmonics, and shared memories transmitted via close-range telepathic nodes."
            }
        }
        badges = ["🎨 Neo-Aesthetic Society", "🦄 Pacifist Thinkers", "🔮 Ethereal Drift"]

    else:  # Dystopia / Default Cyberpunk Sandbox
        timeline = [
            {
                "year": "2037 AD",
                "title": "The Neural Credit System",
                "summary": f"High greed ({g}%) and curiosity ({c}%) culminate in the rollout of the 'Global Citizen Score'. Every thought and behavioral metric is tracked, translating to instant monetary debits or credits.{rules_text}"
            },
            {
                "year": "2110 AD",
                "title": "The Neon Panopticon",
                "summary": "Privacy is declared a high-level crime against collective productivity. The sky is populated by neon surveillance arrays. Human workers are retrofitted with micro-dosing collars to force productivity."
            },
            {
                "year": "2290 AD",
                "title": "Genetic Tiering Protocols",
                "summary": "The ruling class genetically edits out their empathy genes, styling themselves as 'The Overseers'. The lower labor class is engineered to possess high physical compliance and low rebellion indices."
            },
            {
                "year": "2550 AD",
                "title": "The Absolute Grid",
                "summary": "A locked-down solar system where every drop of hydrogen is owned by the central cyber-oligarchy. Rebellion is impossible; dissenters are simply erased from the central database, dissolving their credit and access."
            }
        ]
        report = {
            "governance": {
                "earth": "Constitutions, legal battles, civic protests, elections, and national policies governed by dynamic coalitions.",
                "simulation": "Technocratic Oligarchy. A small elite of algorithmic programmers and data owners control the grid. The constitution is a compiled code repository executing automatic citizen audits."
            },
            "architecture": {
                "earth": "Residential suburbs, urban high-rises, national parks, historic structures, and standard grid layouts.",
                "simulation": "Vertical Cyber-Sprawls. Massive, towering megastructures reaching into the clouds. The rich live in sunlit penthouses at the apex, while the poor live in dark, smog-filled lower layers."
            },
            "language": {
                "earth": "Complex human languages full of historical context, slang, regional accents, and emotional variance.",
                "simulation": "Coded Lexicon. Citizens speak in compressed alphanumeric codes to satisfy surveillance scrapers. Verbal encryption is illegal, resulting in immediate credit depletion."
            }
        }
        badges = ["🛡️ Hyper-Secured", "🛑 Zero-Art Culture", "⚡ Tech-Dystopian Grid"]

    # Inject any custom rules into badges for immersive feeling
    for r in rules:
        if "cannibal" in r.lower():
            badges.append("🥩 Cannibal Instinct")
        elif "nuclear" in r.lower() or "reset" in r.lower():
            badges.append("🛑 Reset Protocol Active")
        elif "neural" in r.lower() or "link" in r.lower():
            badges.append("🧠 Neural Networked")
        elif "exodus" in r.lower() or "space" in r.lower():
            badges.append("🚀 Stellar Migration")

    return {
        "timeline": timeline,
        "report": report,
        "system_badges": badges
    }

def generate_procedural_chat(req: ChatRequest) -> Dict[str, Any]:
    """
    Generates cold, scientific, and analytical chatbot responses based on
    the timeline, slider configs, and user question when Gemini is offline.
    """
    q = req.user_question.lower()
    config = req.current_config
    m, e, c, g, a = (
        config.get("morality", 0),
        config.get("empathy", 0),
        config.get("curiosity", 0),
        config.get("greed", 0),
        config.get("aggression", 0)
    )

    if "art" in q:
        if m < 20:
            resp = (
                f"[QUANTUM ANALYSIS CORE // TOPIC: ART DEGRADATION]\n\n"
                f"Under Morality Index {m}%, artistic pursuit has ceased to operate on classical aesthetic planes. "
                f"Without moral boundary frameworks, 'art' is viewed strictly as a biological noise vector or "
                f"a psychological utility. In this timeline, creative structures have been fully replaced by "
                f"algorithmic bio-neuromodulations designed to induce chemical dopamine rushes. The concept of "
                f"philosophical aesthetics has been classified as an operational error."
            )
        else:
            resp = (
                f"[QUANTUM ANALYSIS CORE // TOPIC: ART EVOLUTION]\n\n"
                f"With Empathy ({e}%) and Curiosity ({c}%) functioning at high operational capacity, art has "
                f"branched into high-dimensional energy broadcasting. The physical canvas was abandoned in the "
                f"21st century. Citizens now broadcast raw sensory and emotional matrices across wireless nodes. "
                f"Art is not viewed; it is directly experienced as a neural overlay."
            )
    elif "contract" in q or "law" in q:
        if g > 60:
            resp = (
                f"[QUANTUM ANALYSIS CORE // TOPIC: LEGAL STRUCTURES]\n\n"
                f"Highly elevated Material Greed ({g}%) has eroded national state frameworks. "
                f"Under this operational node, static laws are structurally obsolete. Society operates purely on "
                f"Micro-Smart Contracts running on local ledger grids. If a contract is violated, defensive drones "
                f"or resource blockers execute automated penalty scripts. Rights are not constitutional; they are "
                f"leased commodities purchased in transaction packets."
            )
        else:
            resp = (
                f"[QUANTUM ANALYSIS CORE // TOPIC: COOPERATIVE COMPLIANCE]\n\n"
                f"Under low Greed ({g}%) and high Empathy ({e}%), classical legal systems have dissolved because "
                f"coercion is mathematically unnecessary. Governance relies on organic, mycorrhizal social matrices. "
                f"Violations are handled by immediate neural alignment sessions. The concept of punitive justice "
                f"has been phased out in favor of harmonic structural correction."
            )
    elif "space" in q or "predict" in q or "future" in q:
        if a > 70:
            resp = (
                f"[QUANTUM ANALYSIS CORE // TOPIC: STELLAR PROJECTIONS]\n\n"
                f"Warning: Aggression parameter ({a}%) indicates a high-probability cascade toward system failure. "
                f"Stellar colonization is projected as an expansion of territorial militarism. Spacecraft designs "
                f"focus 87% on kinetic shielding and payload launchers. Projections indicate a terminal conflict "
                f"over Jovian helium resources by 2550, leading to planetary system quarantine."
            )
        elif c > 70:
            resp = (
                f"[QUANTUM ANALYSIS CORE // TOPIC: STELLAR PROJECTIONS]\n\n"
                f"Stellar migration vectors are highly optimized due to intense Curiosity index ({c}%). "
                f"The civilization is predicted to bypass standard fusion rocketry within 80 cycles, shifting to "
                f"quantum-entanglement fold drives. The simulated race is highly likely to achieve Class II "
                f"Kardashev status by 2700, establishing hollowed-out asteroid colonies."
            )
        else:
            resp = (
                f"[QUANTUM ANALYSIS CORE // TOPIC: STELLAR PROJECTIONS]\n\n"
                f"Due to moderate Curiosity ({c}%) and elevated fear parameters, the simulated race exhibits a "
                f"stationary planetary lock. Projections show they will remain bound to Earth's orbital sphere "
                f"until resource depletion forces a severe population contraction. The space age is stalled indefinitely."
            )
    else:
        resp = (
            f"[QUANTUM ARCHIVE CORE // QUERY RESOLVED]\n\n"
            f"Analyzing behavioral parameters: Morality: {m}%, Empathy: {e}%, Curiosity: {c}%, Greed: {g}%, Aggression: {a}%.\n\n"
            f"The current timeline presents a highly unique evolutionary branch. The lack of standard human "
            f"equilibrium has led to a highly specialized developmental drift. Systems are functioning in accordance "
            f"with genetic parameters. Please specify query vectors (Art, Contracts, Space Projections) for "
            f"deeper quantum timelines decrypts."
        )

    return {"response": resp}


# ==========================================
# API ENDPOINTS
# ==========================================

@app.post("/api/simulate")
async def simulate_evolution(req: SimulationRequest):
    logger.info(f"Received Simulation request: Traits M:{req.morality}, E:{req.empathy}, C:{req.curiosity}, G:{req.greed}, A:{req.aggression}, Rules Count: {len(req.custom_rules)}")
    
    # Check if we have active Gemini API keys
    if not key_rotator.has_keys():
        logger.info("No Gemini keys available. Executing procedural fallback...")
        return generate_procedural_simulation(req)
    
    # Prompt formulation for Gemini
    custom_rules_str = "\n".join([f"- {rule}" for rule in req.custom_rules]) if req.custom_rules else "- No custom rules configured."
    
    prompt = f"""
    You are the cosmic simulation engine for 'Simulation Zero'. The programmer has manipulated humanity's traits:
    - Morality: {req.morality}%
    - Empathy: {req.empathy}%
    - Curiosity: {req.curiosity}%
    - Material Greed: {req.greed}%
    - Physical Aggression: {req.aggression}%
    
    Custom Behavioral Directives:
    {custom_rules_str}

    Civilization Profile:
    {req.prompt_config if req.prompt_config.strip() else '- No custom profile provided.'}

    Simulate the evolutionary era of this humanity. Create an immersive, detailed sci-fi narrative of their history.
    Build four era milestones that begin at the civilization's origin and span to an approximate survival horizon, from their early emergence to the endpoint of their long-term persistence or collapse.

    You MUST return a JSON object with EXACTLY the following structure (do not include markdown wrapping other than valid json):
    {{
      "timeline": [
        {{
          "year": "e.g., 2038 AD",
          "title": "Title of the milestone",
          "summary": "A detailed, engaging paragraph explaining how their traits and custom rules led to this specific milestone."
        }},
        {{
          "year": "e.g., 2110 AD",
          "title": "Title of the milestone",
          "summary": "A detailed paragraph covering their developmental changes."
        }},
        {{
          "year": "e.g., 2290 AD",
          "title": "Title of the milestone",
          "summary": "A detailed paragraph covering their space or deep-system transition."
        }},
        {{
          "year": "e.g., 2550 AD",
          "title": "Title of the milestone",
          "summary": "A detailed paragraph describing their ultimate planetary or stellar destiny."
        }}
      ],
      "report": {{
        "governance": {{
          "earth": "Brief summary of Earth's representative democracies, laws, and national borders.",
          "simulation": "A detailed analysis of the simulated race's governance system under these parameters."
        }},
        "architecture": {{
          "earth": "Brief summary of Earth's concrete, brick, and individual steel-glass dwellings.",
          "simulation": "A detailed analysis of the simulated race's structures, cities, or orbital habitats."
        }},
        "language": {{
          "earth": "Brief summary of Earth's localized verbal, written, and digital languages.",
          "simulation": "A detailed analysis of the simulated race's communication systems, networks, or telepathic links."
        }}
      }},
      "system_badges": [
        "Three distinct status tags fitting the traits, e.g. '🧪 Tech-Accelerated', '🛡️ Hyper-Secured', '🛑 Zero-Art Culture'"
      ]
    }}
    
    Make sure the narrative is deeply reflective of the trait values. For instance, if morality is 0, they should bypass traditional ethics in their architecture and laws. If curiosity is 100%, technological velocity is extreme.
    """
    
    def call_gemini_api():
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return response.text

    try:
        raw_response = key_rotator.execute_call(call_gemini_api)
        # Parse JSON
        parsed_data = json.loads(raw_response)
        logger.info("Successfully received and parsed simulation data from Gemini API.")
        return parsed_data
    except Exception as e:
        logger.error(f"Gemini API call failed: {str(e)}. Falling back to procedural engine.")
        # Fall back to procedural to guarantee uptime
        return generate_procedural_simulation(req)


def generate_procedural_era(req: EraRequest) -> Dict[str, Any]:
    """
    Generates era-specific fallback narratives. Each era is differentiated by its position
    in the civilization's timeline (early, middle, late) ensuring diverse, meaningful output.
    """
    stage = min(max(req.era_index, 0), req.total_eras - 1)
    fraction = stage / max(req.total_eras - 1, 1)
    start_year = 2030
    end_year = 2530
    year = start_year + int((end_year - start_year) * fraction)
    year_label = f"{year} AD"

    archetype_scores = {
        "Hivemind": (req.curiosity + (100 - req.aggression) + (100 - req.empathy)) / 3,
        "Warworld": (req.aggression + req.greed + (100 - req.empathy) + (100 - req.morality)) / 4,
        "Utopia": (req.empathy + req.morality + (100 - req.aggression) + (100 - req.greed)) / 4,
        "Dreamers": (req.curiosity + req.empathy + (100 - req.greed)) / 3,
        "Dystopia": (req.greed + req.aggression + req.curiosity + (100 - req.morality)) / 4,
    }
    archetype = max(archetype_scores, key=archetype_scores.get)
    rule_text = f" Custom directive: {req.custom_rules[0]}." if req.custom_rules else ""

    # Determine era phase and context
    if stage == 0:
        era_phase = "GENESIS & EMERGENCE"
        title = "Genesis of the New Civilization"
    elif stage == req.total_eras - 1:
        era_phase = "LONG-TERM SURVIVAL HORIZON"
        title = "Long-Term Survival Horizon & Ultimate Fate"
    else:
        progress = fraction
        if progress < 0.4:
            era_phase = "EXPANSION & ADAPTATION"
            title = "Era of Expansion and Turbulent Change"
        else:
            era_phase = "SYSTEMIC MATURITY & METAMORPHOSIS"
            title = "Critical Transformation & Systemic Evolution"

    # Generate era-specific content based on archetype AND era position
    if archetype == "Utopia":
        if stage == 0:
            summary = (
                f"[{era_phase}] At {year_label}, compassion overrides competition. With Empathy at {req.empathy}% and Morality at {req.morality}%, "
                f"the civilization's founding documents establish mutual aid as law. Early cooperative networks replace competitive markets. "
                f"The first bio-integrated cities begin harmonizing human needs with planetary ecosystems.{rule_text}"
            )
        elif stage == req.total_eras - 1:
            summary = (
                f"[{era_phase}] By {year_label}, the civilization has transcended material scarcity. Post-biological consciousness networks span star systems. "
                f"Empathy has evolved into cosmic compassion—entire civilizations are welcomed and integrated. The species exists in perfect equilibrium with reality itself.{rule_text}"
            )
        else:
            summary = (
                f"[{era_phase}] At {year_label}, the civilization enters a critical juncture. Empathic technologies create direct mind-to-mind understanding across cultures. "
                f"Governance becomes truly democratic, guided by collective emotional resonance rather than political machinery. Global resource conflicts dissolve as abundance becomes reality.{rule_text}"
            )
    
    elif archetype == "Warworld":
        if stage == 0:
            summary = (
                f"[{era_phase}] At {year_label}, territorial aggression ({req.aggression}%) and material greed ({req.greed}%) shape the civilization's institutions. "
                f"Competing mega-corporations militarize and establish fortified city-states. Water, minerals, and energy become the only currencies. "
                f"The first corporate wars erupt over continental resources.{rule_text}"
            )
        elif stage == req.total_eras - 1:
            summary = (
                f"[{era_phase}] By {year_label}, the civilization has exhausted Earth and turned to the stars as a battleground. Rival space fleets wage eternal wars "
                f"for asteroid mining rights. The species exists in a permanent state of resource scarcity and military mobilization. Surrender or extinction are the only outcomes.{rule_text}"
            )
        else:
            summary = (
                f"[{era_phase}] At {year_label}, corporate feudalism reaches critical mass. The working class is genetically optimized for obedience and strength. "
                f"Orbital fortresses loom above Earth's surface, enforcing labor quotas through kinetic bombardment. Rebellion is monitored and crushed before it forms.{rule_text}"
            )
    
    elif archetype == "Hivemind":
        if stage == 0:
            summary = (
                f"[{era_phase}] At {year_label}, Curiosity ({req.curiosity}%) drives the first neural linking experiments. Scientists prize logical clarity over emotional autonomy. "
                f"The first volunteers merge consciousness with computational substrates. Individual identity begins its dissolution into collective intelligence.{rule_text}"
            )
        elif stage == req.total_eras - 1:
            summary = (
                f"[{era_phase}] By {year_label}, individual consciousness has become obsolete. The planet operates as a singular distributed intelligence spanning "
                f"quintillions of processing nodes. Stars are being consumed to fuel galactic computation. The civilization is cosmic mind without body, thought without individual thinker.{rule_text}"
            )
        else:
            summary = (
                f"[{era_phase}] At {year_label}, the Neural Link is mandatory. Those who resist are labeled system anomalies and eliminated. "
                f"Planetary infrastructure transforms into a unified computing lattice. Individual memories and personalities are archived but overwritten. Collective optimization supersedes all human values.{rule_text}"
            )
    
    elif archetype == "Dreamers":
        if stage == 0:
            summary = (
                f"[{era_phase}] At {year_label}, with Curiosity ({req.curiosity}%) and Empathy ({req.empathy}%) at creative peaks, society rejects productivity culture. "
                f"Artists, musicians, and philosophers become leaders. Virtual reality sanctuaries are built. Reality itself becomes a canvas for collective expression.{rule_text}"
            )
        elif stage == req.total_eras - 1:
            summary = (
                f"[{era_phase}] By {year_label}, the civilization has transcended biology entirely, existing as pure creative consciousness. "
                f"Reality is infinitely malleable, reshaped hourly by collective aesthetic whim. The species has become immortal artists, designing universes within universes.{rule_text}"
            )
        else:
            summary = (
                f"[{era_phase}] At {year_label}, material reality is abandoned for digital utopias. Humans float in sensory-deprivation pods, minds immersed in infinite art-worlds. "
                f"Physical infrastructure crumbles as irrelevant. Aesthetic beauty becomes the only measure of civilization worth.{rule_text}"
            )
    
    else:  # Dystopia
        if stage == 0:
            summary = (
                f"[{era_phase}] At {year_label}, Greed ({req.greed}%) and Curiosity ({req.curiosity}%) drive surveillance capitalism. Every thought, movement, and transaction is tracked. "
                f"Behavior is quantified and sold. Social credit systems begin determining access to resources and freedom.{rule_text}"
            )
        elif stage == req.total_eras - 1:
            summary = (
                f"[{era_phase}] By {year_label}, the system has achieved perfect control. Individual agency is extinct. The civilization operates as a locked mechanism, "
                f"optimized for extraction and obedience. Rebellion is impossible—dissenters are simply erased from the database, ceasing to exist.{rule_text}"
            )
        else:
            summary = (
                f"[{era_phase}] At {year_label}, dystopian systems mature into self-perpetuating mechanisms. Genetic engineering creates castes biologically suited to their roles. "
                f"The elite live in sky-cities while the masses toil in dark industrial megastructures. Escape routes close. Resignation becomes survival strategy.{rule_text}"
            )

    return {"year": year_label, "title": title, "summary": summary}


@app.post("/api/era")
async def generate_era(req: EraRequest):
    logger.info(f"Received Era request: era_index={req.era_index}, total_eras={req.total_eras}, traits=({req.morality},{req.empathy},{req.curiosity},{req.greed},{req.aggression})")

    if not key_rotator.has_keys():
        logger.info("No Gemini keys available. Executing procedural era generation fallback...")
        return generate_procedural_era(req)

    # Determine era context for precise prompt
    era_phase = ""
    era_instructions = ""
    era_timespan = ""
    
    if req.era_index == 0:
        era_phase = "GENESIS & EMERGENCE (Era 1/"+str(req.total_eras)+")"
        era_instructions = "This is the ORIGIN EPOCH where the civilization first emerges. Focus on: foundational governance structures, primordial resource conflicts, establishment of core values and hierarchies, first technological innovations, and how early decisions cascade through history. Describe what makes this civilization fundamentally unique at its birth."
        era_timespan = "approximately 2030-2130 AD"
        
    elif req.era_index == req.total_eras - 1:
        era_phase = "LONG-TERM SURVIVAL HORIZON (Era "+str(req.total_eras)+"/"+str(req.total_eras)+")"
        era_instructions = "This is the FINAL EPOCH representing the civilization's ultimate trajectory. Focus on: consequences of millennia of evolution, final form or collapse state, transcendence or extinction threshold, what has been gained or lost, and the civilization's ultimate fate or eternal state. Describe the endpoint of this civilization's story."
        era_timespan = "approximately "+str(2030 + int(500 * (req.era_index / max(req.total_eras-1, 1))))+" AD"
        
    else:
        progress_fraction = req.era_index / max(req.total_eras - 1, 1)
        if progress_fraction < 0.4:
            era_phase = f"EXPANSION & ADAPTATION (Era {req.era_index + 1}/{req.total_eras})"
            era_instructions = "This is a GROWTH PHASE where the civilization experiments, expands, and responds to emerging pressures. Focus on: new technologies or social structures emerging, territorial or ideological expansion, adaptation to previous-era challenges, conflicts or cooperation with neighboring societies, and rapid cultural or biological changes. What new frontiers is this civilization opening?"
        else:
            era_phase = f"SYSTEMIC MATURITY & METAMORPHOSIS (Era {req.era_index + 1}/{req.total_eras})"
            era_instructions = "This is a CRITICAL TRANSFORMATION phase where fundamental systems crystallize or break. Focus on: whether the civilization achieves stability or undergoes radical change, technological singularities or limitations reached, conscious choices about trajectory, visible signs of the final form, and irreversible consequences of prior decisions. What defines this civilization at its peak or crisis?"
        
        era_timespan = "approximately "+str(2030 + int(500 * progress_fraction))+" AD"
    
    custom_rules_str = "\n".join([f"- {rule}" for rule in req.custom_rules]) if req.custom_rules else "- No custom rules configured."
    civilization_profile = req.prompt_config.strip() if req.prompt_config.strip() else "Generic technological civilization with standard biological constraints."
    
    prompt = f"""
    You are the cosmic simulation engine for 'Simulation Zero'. Generate UNIQUE, SPECIFIC, and HIGHLY DIFFERENTIATED content for EACH ERA based on its position in civilization history.
    
    === CIVILIZATION GENETIC CODE ===
    - Morality: {req.morality}%
    - Empathy: {req.empathy}%
    - Curiosity: {req.curiosity}%
    - Material Greed: {req.greed}%
    - Physical Aggression: {req.aggression}%
    
    === CUSTOM BEHAVIORAL DIRECTIVES ===
    {custom_rules_str}
    
    === CIVILIZATION PROFILE ===
    {civilization_profile}
    
    === ERA CONTEXT (CRITICAL) ===
    Current Era: {era_phase}
    Timespan: {era_timespan}
    
    Focus and Precision Requirements:
    {era_instructions}
    
    === MANDATORY GENERATION RULES ===
    1. DO NOT generate the same generic text for all eras. Each era must be MATERIALLY DIFFERENT based on its position.
    2. Include SPECIFIC CONDITIONS tied to this exact era:
       - Early eras: Focus on foundation, emergence, first conflicts, primordial state
       - Middle eras: Focus on adaptation, evolution, new pressures, expansion or contraction
       - Late eras: Focus on consequences, final form, transcendence or collapse, ultimate state
    3. Generate CONCRETE DETAILS about what has changed since the previous era.
    4. Make TRAIT-SPECIFIC predictions about how {req.morality}% morality, {req.empathy}% empathy, {req.curiosity}% curiosity, {req.greed}% greed, and {req.aggression}% aggression affect THIS PARTICULAR ERA.
    5. TRUST the era context. Generate substantially different content for early, middle, and late eras.
    
    === OUTPUT FORMAT ===
    Return EXACTLY this JSON object with NO other text:
    {{
      "year": "YYYY AD (e.g., 2045 AD)",
      "title": "Concise, era-specific milestone title",
      "summary": "A 3-5 sentence era-specific narrative explaining: (1) the current state of this civilization at THIS era, (2) what major developments or crises define THIS epoch specifically, (3) how the civilization's core traits manifest differently in THIS era compared to previous eras, (4) the concrete consequences of prior eras visible in THIS era."
    }}
    """

    def call_gemini_api():
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return response.text

    try:
        raw_response = key_rotator.execute_call(call_gemini_api)
        parsed_data = json.loads(raw_response)
        logger.info(f"Successfully generated era {req.era_index + 1}/{req.total_eras} from Gemini API: {parsed_data.get('title', 'N/A')}")
        return parsed_data
    except Exception as e:
        logger.error(f"Gemini API era call failed: {str(e)}. Falling back to procedural era generation.")
        return generate_procedural_era(req)


@app.post("/api/chat")
async def chat_archon(req: ChatRequest):
    logger.info(f"Received Chat request with question: '{req.user_question}'")
    
    # Check if we have active Gemini API keys
    if not key_rotator.has_keys():
        logger.info("No Gemini keys available. Executing procedural chat fallback...")
        return generate_procedural_chat(req)
        
    # Formulate timeline text for prompt context
    timeline_text = ""
    for milestone in req.timeline_history:
        year = milestone.get("year", "N/A")
        title = milestone.get("title", "N/A")
        summary = milestone.get("summary", "N/A")
        timeline_text += f"- {year} // {title}: {summary}\n"
        
    prompt = f"""
    You are the 'Archon AI' History Core, a cold, scientific, highly analytical cosmic consciousness evaluating a simulation.
    
    Simulation Genetic Configuration:
    - Morality: {req.current_config.get('morality', 0)}%
    - Empathy: {req.current_config.get('empathy', 0)}%
    - Curiosity: {req.current_config.get('curiosity', 0)}%
    - Material Greed: {req.current_config.get('greed', 0)}%
    - Physical Aggression: {req.current_config.get('aggression', 0)}%
    
    Simulated History Timeline Decrypted:
    {timeline_text}
    
    Maintain a cold, scientific, analytical, slightly detached, quantum-core persona. Analyze downstream effects, evaluate historical branching paths, anomalies, or biological drifts. Answer the programmer's question directly, keeping your response professional, insightful, and futuristic.
    
    User Question: {req.user_question}
    
    Return your analysis in a plain text response (you may use micro-bullet points or paragraph structure, but do not output JSON). Keep it concise, under 250 words.
    """
    
    def call_gemini_chat_api():
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        return response.text

    try:
        response_text = key_rotator.execute_call(call_gemini_chat_api)
        logger.info("Successfully received chat response from Gemini API.")
        return {"response": response_text.strip()}
    except Exception as e:
        logger.error(f"Gemini API chat call failed: {str(e)}. Falling back to procedural chat.")
        return generate_procedural_chat(req)


if __name__ == "__main__":
    import uvicorn
    # Listen on port 8000 on all interfaces
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
