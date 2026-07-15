import os
import json
import logging
from typing import List, Dict, Any
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
@app.get("/")
async def root():
    return {"message": "Simulation Zero API is running. Use /api/simulate to generate narratives."}                                                 
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
            logger.warning("KeyRotator: No Gemini API keys found. Offline fallback is disabled.")

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

# Small in-memory cache for Gemini era generation responses
era_cache: Dict[str, Any] = {}

# Offline fallback has been removed. Backend requires Gemini API access for all scenario generation and chat.


# ==========================================
# API ENDPOINTS
# ==========================================

@app.post("/api/simulate")
async def simulate_evolution(req: SimulationRequest):
    logger.info(f"Received Simulation request: Traits M:{req.morality}, E:{req.empathy}, C:{req.curiosity}, G:{req.greed}, A:{req.aggression}, Rules Count: {len(req.custom_rules)}")
    
    # Check if we have active Gemini API keys
    if not key_rotator.has_keys():
        logger.error("No Gemini keys available. Gemini-only mode is enabled; no offline fallback is allowed.")
        raise HTTPException(status_code=503, detail="Gemini API keys unavailable. Offline fallback has been disabled.")
    
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
        parsed_data = json.loads(raw_response)
        logger.info("Successfully received and parsed simulation data from Gemini API.")
        return parsed_data
    except json.JSONDecodeError as e:
        logger.error(f"Gemini API simulation response was invalid JSON: {str(e)}")
        raise HTTPException(status_code=502, detail="Gemini returned invalid JSON for simulation generation.")
    except Exception as e:
        logger.error(f"Gemini API call failed: {str(e)}. Offline fallback disabled.")
        raise HTTPException(status_code=503, detail="Gemini API simulation request failed. Offline fallback disabled.")


@app.post("/api/era")
async def generate_era(req: EraRequest):
    logger.info(f"Received Era request: era_index={req.era_index}, total_eras={req.total_eras}, traits=({req.morality},{req.empathy},{req.curiosity},{req.greed},{req.aggression})")

    if not key_rotator.has_keys():
        logger.error("No Gemini keys available. Gemini-only mode is enabled; no offline fallback is allowed.")
        raise HTTPException(status_code=503, detail="Gemini API keys unavailable. Offline fallback has been disabled.")

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

    cache_key = json.dumps({
        "era_index": req.era_index,
        "total_eras": req.total_eras,
        "morality": req.morality,
        "empathy": req.empathy,
        "curiosity": req.curiosity,
        "greed": req.greed,
        "aggression": req.aggression,
        "custom_rules": req.custom_rules,
        "prompt_config": req.prompt_config,
    }, sort_keys=True)

    if cache_key in era_cache:
        logger.info(f"Returning cached Gemini era response for key: {cache_key}")
        return era_cache[cache_key]

    try:
        raw_response = key_rotator.execute_call(call_gemini_api)
        parsed_data = json.loads(raw_response)
        era_cache[cache_key] = parsed_data
        logger.info(f"Successfully generated era {req.era_index + 1}/{req.total_eras} from Gemini API: {parsed_data.get('title', 'N/A')}")
        return parsed_data
    except json.JSONDecodeError as e:
        logger.error(f"Gemini API era response was invalid JSON: {str(e)}")
        raise HTTPException(status_code=502, detail="Gemini returned invalid JSON for era generation.")
    except Exception as e:
        logger.error(f"Gemini API era call failed: {str(e)}. Offline fallback disabled.")
        raise HTTPException(status_code=503, detail="Gemini API era request failed. Offline fallback disabled.")


@app.post("/api/chat")
async def chat_archon(req: ChatRequest):
    logger.info(f"Received Chat request with question: '{req.user_question}'")
    
    # Check if we have active Gemini API keys
    if not key_rotator.has_keys():
        logger.error("No Gemini keys available. Gemini-only mode is enabled; no offline fallback is allowed.")
        raise HTTPException(status_code=503, detail="Gemini API keys unavailable. Offline fallback has been disabled.")
        
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
        logger.error(f"Gemini API chat call failed: {str(e)}. Offline fallback disabled.")
        raise HTTPException(status_code=503, detail="Gemini API chat request failed. Offline fallback disabled.")


if __name__ == "__main__":
    import uvicorn
    # Listen on port 8000 on all interfaces
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
