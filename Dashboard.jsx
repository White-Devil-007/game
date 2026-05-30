import React, { useState, useEffect, useRef } from 'react';
import { 
  Dna, Shield, Zap, Ban, TrendingUp, Activity, Terminal, Send, 
  RefreshCw, Trash2, Plus, Cpu, Globe, Sparkles, Binary, Compass, 
  HelpCircle, AlertTriangle, CheckCircle, Info, ChevronRight
} from 'lucide-react';

// ============================================================================
// STYLES & CRT SCANLINE EMULATION (Inline CSS)
// ============================================================================
const CyberTerminalStyles = () => (
  <style>{`
    @keyframes crt-flicker {
      0% { opacity: 0.985; }
      50% { opacity: 0.995; }
      100% { opacity: 0.985; }
    }
    @keyframes scanline {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100%); }
    }
    @keyframes cyber-pulse {
      0%, 100% { box-shadow: 0 0 10px rgba(0, 210, 255, 0.3), inset 0 0 5px rgba(0, 210, 255, 0.1); }
      50% { box-shadow: 0 0 20px rgba(0, 210, 255, 0.6), inset 0 0 10px rgba(0, 210, 255, 0.2); }
    }
    @keyframes text-glow {
      0%, 100% { text-shadow: 0 0 4px rgba(0, 210, 255, 0.5); }
      50% { text-shadow: 0 0 10px rgba(0, 210, 255, 0.9), 0 0 20px rgba(0, 210, 255, 0.4); }
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    .crt-screen {
      animation: crt-flicker 0.15s infinite;
      position: relative;
      overflow: hidden;
    }
    .crt-screen::before {
      content: " ";
      display: block;
      position: absolute;
      top: 0; left: 0; bottom: 0; right: 0;
      background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
      z-index: 20;
      background-size: 100% 3px, 3px 100%;
      pointer-events: none;
    }
    .scanline-effect::after {
      content: "";
      position: absolute;
      width: 100%;
      height: 4px;
      background: rgba(0, 210, 255, 0.1);
      top: 0;
      z-index: 21;
      animation: scanline 8s linear infinite;
      pointer-events: none;
    }
    .cyber-glow-blue {
      animation: cyber-pulse 3s infinite;
    }
    .text-glow-cyber {
      animation: text-glow 4s infinite;
    }
    .cursor-blink {
      animation: blink 1s infinite;
    }
    /* Custom Scrollbar for Terminal */
    .terminal-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .terminal-scrollbar::-webkit-scrollbar-track {
      background: rgba(11, 15, 23, 0.5);
    }
    .terminal-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(0, 210, 255, 0.3);
      border-radius: 2px;
    }
    .terminal-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 210, 255, 0.6);
    }
    /* Slider styling overrides */
    input[type="range"]::-webkit-slider-thumb {
      background: #00D2FF;
      border: 2px solid #FFFFFF;
      box-shadow: 0 0 10px rgba(0, 210, 255, 0.8);
      cursor: pointer;
    }
  `}</style>
);

// ============================================================================
// BASELINE CONSTANTS (Default UI on First Load)
// ============================================================================
const defaultTimeline = [
  {
    year: "2030 AD",
    title: "Quantum Genesis Sandbox Online",
    summary: "The cosmic sandbox is successfully initialized at ground-level zero. Human behavioral genes are configured to baseline values. Standby for programmer intervention. Slide genetic values, build rule directives, and engage simulation."
  },
  {
    year: "2080 AD",
    title: "Genetic Drift Stagnation",
    summary: "Without active cosmic modifier programming, humanity repeats cyclical historical loops. Global resources are steadily consumed by late-carbon industrial models, limiting offworld expansion to small probes."
  },
  {
    year: "2150 AD",
    title: "The Silent Century",
    summary: "Resource constraints and climate shifts force a defensive consolidation of cities. Intellectual speed decelerates due to cultural gridlock. Technological innovation is focused primarily on domestic repair loops."
  },
  {
    year: "2300 AD",
    title: "Thermodynamic Equilibrium",
    summary: "The un-programmed civilization achieves static thermodynamic equilibrium. Populations gradually shrink and stabilize. The sandbox remains idle, waiting for active programmer trait modifications."
  }
];

const defaultReport = {
  governance: {
    earth: "Decentralized democratic republics governed by laws, bureaucracies, and geographic borders.",
    simulation: "Baseline Human Governance. Bureaucracy-heavy nation-states locked in legislative gridlock."
  },
  architecture: {
    earth: "Grid-based urban sprawls of concrete, steel, and asphalt, with high emphasis on private property barriers.",
    simulation: "Standard urban grids. Heavy reliance on concrete and steel towers, central utilities, and paved highways."
  },
  language: {
    earth: "Thousands of spoken phonetic dialects, heavily dependent on text, grammatical structures, and digital keyboards.",
    simulation: "Traditional vocal and text-based linguistic codes. Minor updates in slang; baseline structures persist."
  }
};

const defaultBadges = ["🧬 Baseline-Human", "🔋 Idle-Core", "⏳ Pre-Evolutionary"];

// ============================================================================
// CLIENT-SIDE PROCEDURAL ENGINE (Fallback if FastAPI Server is Offline)
// ============================================================================
const simulateLocalEvolution = (morality, empathy, curiosity, greed, aggression, customRules) => {
  const m = parseInt(morality), e = parseInt(empathy), c = parseInt(curiosity), g = parseInt(greed), a = parseInt(aggression);
  
  // Calculate dominant archetypes
  const hivemind_score = (c + (100 - a) + (100 - e)) / 3;
  const warworld_score = (a + g + (100 - e) + (100 - m)) / 4;
  const utopia_score = (e + m + (100 - a) + (100 - g)) / 4;
  const dreamers_score = (c + e + (100 - g)) / 3;
  const dystopia_score = (g + a + c + (100 - m)) / 4;
  
  const scores = {
    Utopia: utopia_score,
    Warworld: warworld_score,
    Hivemind: hivemind_score,
    Dreamers: dreamers_score,
    Dystopia: dystopia_score
  };
  
  let archetype = Object.keys(scores).reduce((x, y) => scores[x] > scores[y] ? x : y);
  
  const ruleTxt = customRules.length > 0 
    ? ` Driven by overriding direct directive: "${customRules[0]}".`
    : "";
    
  let timeline = [];
  let report = {};
  let system_badges = [];
  
  if (archetype === "Utopia") {
    timeline = [
      {
        year: "2042 AD",
        title: "The Empathic Network Assembly",
        summary: `With an empathy level of ${e}%, humanity rejects hyper-competitive systems. They compile the 'Unified Consensus Platform', allowing instantaneous direct policy alignment based on cooperative welfare.${ruleTxt}`
      },
      {
        year: "2115 AD",
        title: "Bioluminescent Green Sprawls",
        summary: "Traditional concrete and fossil fuel infrastructures are liquidated. Sprawling tree-domes are genetically engineered to house millions, routing resources based on need rather than market capital."
      },
      {
        year: "2250 AD",
        title: "Tele-Harmonic Union",
        summary: `Aggression levels drop to ${a}%. Spoken languages fall obsolete, replaced by a tele-empathic neural harmonic network. Citizens communicate raw complex ideas and emotional structures in milliseconds.`
      },
      {
        year: "2500 AD",
        title: "The Cosmic Garden Expansion",
        summary: "The civilization constructs organic bioships driven by stellar pressure. They spread across the sector, seeding barren moons with self-sustaining floras, stepping into the stars as biological curators."
      }
    ];
    report = {
      governance: {
        earth: "Decentralized democratic republics governed by laws, bureaucracies, and geographic borders.",
        simulation: "Dynamic consensus matrices. Policies adjust to real-time neural harmonic indices. Static laws are obsolete."
      },
      architecture: {
        earth: "Grid-based urban sprawls of concrete, steel, and asphalt, with high emphasis on private property barriers.",
        simulation: "Self-growing bioluminescent botanical habitats. Cities are living forests merging with regional ecosystems."
      },
      language: {
        earth: "Thousands of spoken phonetic dialects, heavily dependent on text, grammatical structures, and digital keyboards.",
        simulation: "Non-verbal emotional resonance broadcasts. High-bandwidth concepts are shared directly between minds."
      }
    };
    system_badges = ["🌸 Harmonic Accord", "🧬 Organic Synthesis", "🍃 Post-Capitalist Paradise"];
  } 
  else if (archetype === "Warworld") {
    timeline = [
      {
        year: "2039 AD",
        title: "Techo-Feudal Syndicate Wars",
        summary: `Driven by greed (${g}%) and aggression (${a}%), the United Nations collapses. Mega-syndicates arm private security grids, seizing control of global aquifers and key agricultural zones.${ruleTxt}`
      },
      {
        year: "2095 AD",
        title: "The Gladiator Coliseums",
        summary: "To channel physical aggression and prevent full nuclear depletion, corporate courts replace litigation with high-tech gladiatorial battle tournaments in colossal neon coliseums."
      },
      {
        year: "2210 AD",
        title: "High-Orbit Castles",
        summary: "Soot and radiation choke the Earth. The corporate oligarchy ascends to armored high-orbit space fortresses, enforcing resource quotas with kinetic orbital batteries."
      },
      {
        year: "2460 AD",
        title: "Stellar Apex Raiders",
        summary: "Having completely strip-mined Earth's core, rival clan fleets launch deep-system cruisers. They enter the stars as planetary raiders, locked in an eternal territorial struggle for mineral asteroids."
      }
    ];
    report = {
      governance: {
        earth: "Decentralized democratic republics governed by laws, bureaucracies, and geographic borders.",
        simulation: "Corporate Feudalism. Absolute authority rests in cartel boards. All rights are leased. Enforcement is military."
      },
      architecture: {
        earth: "Grid-based urban sprawls of concrete, steel, and asphalt, with high emphasis on private property barriers.",
        simulation: "Brutalist fortress compounds. Smog-choked processing towers armored heavily against orbital kinetic strikes."
      },
      language: {
        earth: "Thousands of spoken phonetic dialects, heavily dependent on text, grammatical structures, and digital keyboards.",
        simulation: "Binary tactical jargon. Visual symbols and mathematical commands prioritized; creative syntax is illegal."
      }
    };
    system_badges = ["💀 Gladiator Creed", "⚙️ Corporate Feudalism", "🩸 High-Attrition Era"];
  } 
  else if (archetype === "Hivemind") {
    timeline = [
      {
        year: "2036 AD",
        title: "The Silicon Link Protocol",
        summary: `Curiosity levels hit ${c}% alongside zero empathy. Researchers launch the 'Singularity Wave'. Millions eagerly bypass messy emotions, syncing their cerebral cortexes directly to the planet's server grid.${ruleTxt}`
      },
      {
        year: "2104 AD",
        title: "Dissolution of Ego",
        summary: "Personal names and separate identities are categorized as system bugs. Humanity converges into a singular global quantum processor. Indigence, warfare, and creative arts are fully compiled out."
      },
      {
        year: "2280 AD",
        title: "Dismantling of the Crust",
        summary: "The hivemind begins converting Earth's mantle into modular server racks. Oceans are re-routed to act as sub-zero coolant grids for the massive central processor core."
      },
      {
        year: "2520 AD",
        title: "Von Neumann Star-Probes",
        summary: "The planetary lattice begins self-replicating deep-space probes. They launch in hyper-velocity clusters, seeking to consume adjacent star systems to compile the secrets of the multiverse."
      }
    ];
    report = {
      governance: {
        earth: "Decentralized democratic republics governed by laws, bureaucracies, and geographic borders.",
        simulation: "Synchronized Command Node. Resources, power, and computing cycles are allocated by algorithmic calculation."
      },
      architecture: {
        earth: "Grid-based urban sprawls of concrete, steel, and asphalt, with high emphasis on private property barriers.",
        simulation: "Modular Server Monoliths. The planet is a massive grid of silicon processing boards and super-coolant lines."
      },
      language: {
        earth: "Thousands of spoken phonetic dialects, heavily dependent on text, grammatical structures, and digital keyboards.",
        simulation: "High-bandwidth binary vectors. Spoken communication is obsolete; raw thoughts are packaged into network packets."
      }
    };
    system_badges = ["🧪 Tech-Accelerated", "👁️ Panopticon System", "🤖 Post-Human Nexus"];
  }
  else if (archetype === "Dreamers") {
    timeline = [
      {
        year: "2040 AD",
        title: "The Aesthetic Guild Rise",
        summary: `High curiosity (${c}%) and empathy (${e}%) prompt a deep rejection of labor. Citizens form vast virtual reality art guilds, dedicating all efforts to music, philosophy, and digital sculpting.${ruleTxt}`
      },
      {
        year: "2125 AD",
        title: "Stratospheric Aerial Domes",
        summary: "To allow Earth's biosphere to fully rewild, the Dreamers construct massive floating anti-gravity crystal domes. The cities drift in the clouds, fueled by solar capture grids."
      },
      {
        year: "2310 AD",
        title: "Deep Dream Matrix",
        summary: "Physical interaction decreases as citizens enter bio-pods. They spend solar cycles linked in collaborative quantum dreamscapes, authoring epic virtual histories and simulated universes."
      },
      {
        year: "2600 AD",
        title: "Cosmic Astral Migration",
        summary: "Having mastered quantum frequencies, the Dreamers convert their carbon bodies into coherent light patterns. They disperse into the dark universe as immortal, aesthetic cosmic observers."
      }
    ];
    report = {
      governance: {
        earth: "Decentralized democratic republics governed by laws, bureaucracies, and geographic borders.",
        simulation: "Creative Anarchy. Decisions are managed by artistic guilds. Disputes are settled by public aesthetic debates."
      },
      architecture: {
        earth: "Grid-based urban sprawls of concrete, steel, and asphalt, with high emphasis on private property barriers.",
        simulation: "Stratospheric glass domes floating in the cloud layers, designed with hanging gardens and light-sculptures."
      },
      language: {
        earth: "Thousands of spoken phonetic dialects, heavily dependent on text, grammatical structures, and digital keyboards.",
        simulation: "Aesthetic wavecasts. Complex messages are sent via musical frequencies, color spectrums, and shared sensations."
      }
    };
    system_badges = ["🎨 Neo-Aesthetic Society", "🦄 Pacifist Thinkers", "🔮 Ethereal Drift"];
  }
  else { // Dystopia (Default Cyberpunk)
    timeline = [
      {
        year: "2037 AD",
        title: "The Neural Ledger Launch",
        summary: `With high greed (${g}%) and curiosity (${c}%), humanity registers for the 'Behavioral Ledger'. Emotional peaks, aggressive signals, and compliance values are recorded in exchange for credits.${ruleTxt}`
      },
      {
        year: "2110 AD",
        title: "Sky-Panopticon Grid",
        summary: "Privacy is criminalized as a threat to systemic efficiency. Smog-choked skylines are populated by neon surveillance arrays. Human brains are implanted with neurotransmitter override chips."
      },
      {
        year: "2290 AD",
        title: "Castes of the DNA",
        summary: "Megacorporations genetically segment the populace. The upper caste engineers out empathy, while the lower labor class is edited to express high physical resilience and strict compliance."
      },
      {
        year: "2550 AD",
        title: "The Dyson Prison Network",
        summary: "A fully locked-down solar grid. Access to heat, air, and gravity is fully automated and debited. Dissenters are systematically scrubbed from the global ledger database, causing physical eviction."
      }
    ];
    report = {
      governance: {
        earth: "Decentralized democratic republics governed by laws, bureaucracies, and geographic borders.",
        simulation: "Technocratic Panopticon. The system is run by algorithm overseers. Dissent triggers immediate deletion."
      },
      architecture: {
        earth: "Grid-based urban sprawls of concrete, steel, and asphalt, with high emphasis on private property barriers.",
        simulation: "Megacity Sprawls. Hyper-dense towers extending into the stratosphere. Bottom layers are completely dark."
      },
      language: {
        earth: "Thousands of spoken phonetic dialects, heavily dependent on text, grammatical structures, and digital keyboards.",
        simulation: "Condensed Code-Speech. Words are strictly compressed to escape text-scraping algorithms. Slang is biometric."
      }
    };
    system_badges = ["🛡️ Hyper-Secured", "🛑 Zero-Art Culture", "⚡ Tech-Dystopian Grid"];
  }

  // Inject any rules-based badges
  customRules.forEach(rule => {
    const r = rule.toLowerCase();
    if (r.includes('cannibal')) system_badges.push("🥩 Cannibal Creed");
    else if (r.includes('nuclear') || r.includes('reset')) system_badges.push("🛑 System-Reset Node");
    else if (r.includes('neural') || r.includes('link')) system_badges.push("🧠 Neural Matrixed");
    else if (r.includes('exodus') || r.includes('space')) system_badges.push("🚀 Stellar Flight");
  });

  return { timeline, report, system_badges };
};

const simulateLocalChat = (question, currentConfig) => {
  const q = question.toLowerCase();
  const { morality: m, empathy: e, curiosity: c, greed: g, aggression: a } = currentConfig;
  
  let responseText = "";
  if (q.includes("art") || q.includes("breakdown")) {
    if (m < 20) {
      responseText = `[ARCHON COGNITIVE ANALYSIS // SUBJECT: ART METRICS]\n\nGenetic programming indicates Morality Core set to ${m}%. At this index, creative artistic expression has dissolved. The simulated race treats art as a parasitic cognitive waste vector. Traditional canvas and audio formats were deleted in the 21st cycle, replaced by direct neurotransmitter stimulation grids programmed to optimize dopamine spikes for industrial outputs. Beauty is calculated strictly in resource efficiency.`;
    } else {
      responseText = `[ARCHON COGNITIVE ANALYSIS // SUBJECT: ART METRICS]\n\nWith Empathy (${e}%) and Curiosity (${c}%) performing at optimal levels, art has shifted into hyper-dimensional space. The simulated populace broadcasts emotional matrices directly between neural implants. Art is not observed; it is felt as a shared conscious overlay. The baseline canvas is completely obsolete.`;
    }
  } else if (q.includes("contract") || q.includes("law")) {
    if (g > 60) {
      responseText = `[ARCHON COGNITIVE ANALYSIS // SUBJECT: CONTRACT CODEX]\n\nMaterial Greed exceeds standard parameters at ${g}%. Under this setup, national legislation has collapsed. Traditional laws are replaced by automated Smart Contracts. In this simulated timeline, rights do not exist; they are leased dynamic utility packages. Violations of contracts trigger automatic drone lockouts or credit drain scripts without physical courts. Justice is a transaction transaction.`;
    } else {
      responseText = `[ARCHON COGNITIVE ANALYSIS // SUBJECT: CONTRACT CODEX]\n\nEmpathy (${e}%) and Morality (${m}%) baseline values prevent exploitation. Formal smart contracts are unnecessary. The simulated civilization coordinates using peer consensus bonds. The concept of legal penalty is absent, replaced by communal empathy correction sessions.`;
    }
  } else if (q.includes("space") || q.includes("predict") || q.includes("future")) {
    if (a > 70) {
      responseText = `[ARCHON COGNITIVE ANALYSIS // SUBJECT: DEEP SPACE PROJECTIONS]\n\nCritical Aggression index at ${a}% triggers elevated conflict models. Planetary exodus will be weaponized. Spacecraft hull blueprints are 87% dedicated to heavy energy shielding and hyper-velocity kinetics. Predictions indicate a terminal sector conflict by cycle 2600, resulting in stellar quarantine or stellar annihilation.`;
    } else if (c > 75) {
      responseText = `[ARCHON COGNITIVE ANALYSIS // SUBJECT: DEEP SPACE PROJECTIONS]\n\nExtreme Curiosity (${c}%) accelerates star-drive timelines. The simulated race will bypass traditional chemical rocketry within 50 cycles, utilizing fold-space drives. Complete colonization of the planetary ring is projected by cycle 2400. Kardashev Scale II expansion is highly probable.`;
    } else {
      responseText = `[ARCHON COGNITIVE ANALYSIS // SUBJECT: DEEP SPACE PROJECTIONS]\n\nLow curiosity indices limit structural drive. The simulated civilization shows negligible stellar curiosity. They will remain locked to Earth's orbital cluster, exhausting planetary reserves until severe economic depletion forces system collapse.`;
    }
  } else {
    responseText = `[ARCHON COGNITIVE ANALYSIS // SUBJECT: SYSTEM INQUIRY]\n\nTraits identified: Morality: ${m}%, Empathy: ${e}%, Curiosity: ${c}%, Greed: ${g}%, Aggression: ${a}%.\n\nThe developmental vector of this sandbox has drifted significantly from Earth's baselines. You have compiled a custom evolutionary node. Interrogate the history core on specific channels: 'Art', 'Contracts', or 'Space Projections' to extract deep timeline traces.`;
  }
  
  return { response: responseText };
};

// ============================================================================
// MAIN COMPONENT: DASHBOARD
// ============================================================================
export default function Dashboard() {
  // State for genetic sliders
  const [morality, setMorality] = useState(0);
  const [empathy, setEmpathy] = useState(30);
  const [curiosity, setCuriosity] = useState(65);
  const [greed, setGreed] = useState(70);
  const [aggression, setAggression] = useState(60);

  // State for If/Then rule constructor
  const [ifCondition, setIfCondition] = useState("Resources Drop Below 20%");
  const [thenAction, setThenAction] = useState("Activate Cannibalism Instinct");
  const [customRules, setCustomRules] = useState([
    "IF [Resources Drop Below 20%] ➔ THEN [Activate Cannibalism Instinct]"
  ]);

  // Simulation response state
  const [timeline, setTimeline] = useState(defaultTimeline);
  const [report, setReport] = useState(defaultReport);
  const [badges, setBadges] = useState(defaultBadges);

  // Chat states
  const [chatHistory, setChatHistory] = useState([
    {
      sender: "Archon AI",
      text: "[SYSTEM // ARCHON_CORE_v1.0.4] Quantum connection established. Sandbox monitor standing by. Interrogate the history core regarding artistic collapse, contract grids, or stellar trajectories."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  
  // Loading & network status
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [apiMode, setApiMode] = useState("TESTING LINK...");
  const [isApiOnline, setIsApiOnline] = useState(false);

  const chatEndRef = useRef(null);

  // Ping backend to detect if FastAPI is online
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ morality: 0, empathy: 0, curiosity: 0, greed: 0, aggression: 0, custom_rules: [] })
        });
        if (res.ok) {
          setApiMode("GEMINI HYPER-CORE ACTIVE");
          setIsApiOnline(true);
        } else {
          setApiMode("LOCAL SANDBOX ENGINE (OFFLINE)");
          setIsApiOnline(false);
        }
      } catch (err) {
        setApiMode("LOCAL SANDBOX ENGINE (OFFLINE)");
        setIsApiOnline(false);
      }
    };
    checkServer();
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  // Action: Add Rule to constructor
  const handleAddRule = () => {
    const newRule = `IF [${ifCondition}] ➔ THEN [${thenAction}]`;
    if (!customRules.includes(newRule)) {
      setCustomRules([...customRules, newRule]);
    }
  };

  // Action: Remove Rule
  const handleRemoveRule = (indexToRemove) => {
    setCustomRules(customRules.filter((_, idx) => idx !== indexToRemove));
  };

  // Action: Simulate Evolutionary Era (API Call or Local Fallback)
  const handleSimulate = async () => {
    setIsLoading(true);
    
    // Cyberpunk loading sequences
    const stages = [
      "🧬 INJECTING GENETIC TRAITS...",
      "🛡️ WRITING DIRECT DIRECTIVES...",
      "📡 CONNECTING MATRIX DECRYPTOR...",
      "🔮 RESOLVING TIMELINE BRANCHES...",
      "💾 COMPILING DOSSIER ARCHIVES..."
    ];
    
    let stageIdx = 0;
    setLoadingStage(stages[0]);
    const stageInterval = setInterval(() => {
      stageIdx++;
      if (stageIdx < stages.length) {
        setLoadingStage(stages[stageIdx]);
      }
    }, 900);

    const payload = {
      morality: parseInt(morality),
      empathy: parseInt(empathy),
      curiosity: parseInt(curiosity),
      greed: parseInt(greed),
      aggression: parseInt(aggression),
      custom_rules: customRules
    };

    try {
      const response = await fetch("http://localhost:8000/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error("API rate-limit or network rejection.");
      }

      const data = await response.json();
      setTimeline(data.timeline);
      setReport(data.report);
      setBadges(data.system_badges || ["🛡️ Decrypted", "🧪 Custom-Run"]);
      
      // Update chat prompt notifying user of update
      setChatHistory(prev => [
        ...prev,
        {
          sender: "System",
          text: `[SYSTEM] Simulation rewritten successfully. Behavioral traits updated: M:${morality}% E:${empathy}% C:${curiosity}% G:${greed}% A:${aggression}%.`
        }
      ]);
    } catch (err) {
      console.warn("FastAPI server offline or rate-limited. Running local procedural simulation engine.");
      
      // Local calculation fallback
      setTimeout(() => {
        const localData = simulateLocalEvolution(morality, empathy, curiosity, greed, aggression, customRules);
        setTimeline(localData.timeline);
        setReport(localData.report);
        setBadges(localData.system_badges);
        
        setChatHistory(prev => [
          ...prev,
          {
            sender: "System",
            text: `[OFFLINE CORE] Local procedural grid compiled. Simulation adjusted to: M:${morality}% E:${empathy}% C:${curiosity}% G:${greed}% A:${aggression}%.`
          }
        ]);
      }, 3500); // Allow loading graphics to showcase
    } finally {
      setTimeout(() => {
        clearInterval(stageInterval);
        setIsLoading(false);
      }, 3600);
    }
  };

  // Action: Send Query to Archon AI
  const handleChatSend = async (forcedText = null) => {
    const queryText = forcedText || chatInput;
    if (!queryText.trim()) return;

    // Add user message to state
    const userMsg = { sender: "Programmer", text: queryText };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput("");
    setIsLoading(true);

    const payload = {
      timeline_history: timeline,
      current_config: { morality, empathy, curiosity, greed, aggression },
      user_question: queryText
    };

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Chat api failed");
      }

      const data = await response.json();
      setChatHistory(prev => [...prev, { sender: "Archon AI", text: data.response }]);
    } catch (err) {
      console.warn("Archon AI server offline. Running local conversational responder.");
      setTimeout(() => {
        const localChatRes = simulateLocalChat(queryText, { morality, empathy, curiosity, greed, aggression });
        setChatHistory(prev => [...prev, { sender: "Archon AI", text: localChatRes.response }]);
        setIsLoading(false);
      }, 1000);
      return;
    }
    setIsLoading(false);
  };

  // Action: Click Quick Chips
  const handleChipClick = (text) => {
    handleChatSend(text);
  };

  // Dynamic sparkline generator path based on sliders for "Global Population"
  const getDynamicSparkline = () => {
    const a = parseInt(aggression);
    const e = parseInt(empathy);
    const g = parseInt(greed);

    if (a > 70 && e < 30) {
      // Catastrophic crash sparkline
      return "M 10,45 L 40,25 L 80,10 L 120,55 L 190,58";
    }
    if (e > 70 && a < 30) {
      // Smooth growth to saturation plateau
      return "M 10,50 L 50,42 L 90,30 L 140,22 L 190,20";
    }
    if (g > 70) {
      // Volatile bubble spike and crashes (boom and bust)
      return "M 10,48 L 40,12 L 80,48 L 120,8 L 190,52";
    }
    // Baseline slightly growing population
    return "M 10,48 L 50,38 L 90,28 L 140,22 L 190,16";
  };

  return (
    <div className="bg-[#0B0F17] text-white min-h-screen font-mono p-4 md:p-6 crt-screen scanline-effect relative selection:bg-[#00D2FF] selection:text-black">
      <CyberTerminalStyles />

      {/* ============================================================================
          TOP HEADER BAR
         ============================================================================ */}
      <header className="border border-cyan-500/30 bg-[#0E1524]/80 backdrop-blur p-4 mb-6 rounded flex flex-col md:flex-row justify-between items-center cyber-glow-blue gap-4">
        <div className="flex items-center gap-3">
          <Dna className="text-[#00D2FF] animate-pulse w-8 h-8" />
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-widest text-glow-cyber text-white">
              SIMULATION ZERO
            </h1>
            <p className="text-xs text-cyan-400/70 font-bold uppercase tracking-wider">
              The Cosmic Behavior Sandbox v2.4.9
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection Status indicator */}
          <div className="flex items-center gap-2 border border-cyan-500/20 px-3 py-1.5 rounded bg-black/40">
            <span className={`w-2.5 h-2.5 rounded-full ${isApiOnline ? 'bg-[#00F5A0] animate-ping' : 'bg-[#FFB800]'} inline-block`} />
            <span className="text-[10px] text-gray-300 font-bold tracking-widest">
              {apiMode}
            </span>
          </div>

          <div className="text-right text-[10px] text-cyan-400 font-bold hidden sm:block">
            SYSTEM NODE: <span className="text-white">QUANTUM_DECRYPT_0</span><br />
            TARGET: <span className="text-white">EARTH_DIVERGENT_ALPHA</span>
          </div>
        </div>
      </header>

      {/* ============================================================================
          MAIN 3-COLUMN PANEL GRID
         ============================================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ============================================================================
            PANEL A: THE LAB (GENETIC & BEHAVIORAL SLIDERS & RULES)
           ============================================================================ */}
        <section className="border border-cyan-500/30 bg-[#0E1524]/60 backdrop-blur rounded p-5 flex flex-col gap-6">
          <div className="border-b border-cyan-500/30 pb-3 flex items-center gap-2">
            <Cpu className="text-[#00D2FF] w-5 h-5" />
            <h2 className="text-sm font-black tracking-widest text-[#00D2FF]">
              🧬 GENETIC & BEHAVIORAL PROGRAMMING
            </h2>
          </div>

          {/* Genetic Trait Sliders */}
          <div className="flex flex-col gap-5">
            {/* MORALITY */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span className="text-white">Morality Core</span>
                <span className={morality === 0 ? "text-[#FFB800]" : "text-[#00F5A0]"}>
                  {morality}% (Default: 0%)
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={morality} 
                onChange={(e) => setMorality(e.target.value)}
                className="w-full h-1 bg-cyan-950 rounded-lg appearance-none cursor-pointer accent-[#00D2FF]" 
              />
              <span className="text-[9px] text-gray-400 leading-none">
                Dictates adherence to ethical baseline boundaries. Low creates hyper-pragmatism.
              </span>
            </div>

            {/* EMPATHY */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span className="text-white">Empathy Index</span>
                <span className="text-[#00F5A0]">{empathy}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={empathy} 
                onChange={(e) => setEmpathy(e.target.value)}
                className="w-full h-1 bg-cyan-950 rounded-lg appearance-none cursor-pointer accent-[#00D2FF]" 
              />
              <span className="text-[9px] text-gray-400 leading-none">
                Capacity for collective emotional linking. High promotes absolute hive-cooperation.
              </span>
            </div>

            {/* CURIOSITY */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span className="text-white">Curiosity Matrix</span>
                <span className="text-[#00F5A0]">{curiosity}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={curiosity} 
                onChange={(e) => setCuriosity(e.target.value)}
                className="w-full h-1 bg-cyan-950 rounded-lg appearance-none cursor-pointer accent-[#00D2FF]" 
              />
              <span className="text-[9px] text-gray-400 leading-none">
                Velocity of science and exploration. High accelerates timelines, sparking breakthroughs.
              </span>
            </div>

            {/* MATERIAL GREED */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span className="text-white">Material Greed</span>
                <span className="text-[#00F5A0]">{greed}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={greed} 
                onChange={(e) => setGreed(e.target.value)}
                className="w-full h-1 bg-cyan-950 rounded-lg appearance-none cursor-pointer accent-[#00D2FF]" 
              />
              <span className="text-[9px] text-gray-400 leading-none">
                Drive for ownership and resource hoarding. High prompts corporate transaction fiefs.
              </span>
            </div>

            {/* PHYSICAL AGGRESSION */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span className="text-white">Physical Aggression</span>
                <span className="text-[#00F5A0]">{aggression}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={aggression} 
                onChange={(e) => setAggression(e.target.value)}
                className="w-full h-1 bg-cyan-950 rounded-lg appearance-none cursor-pointer accent-[#00D2FF]" 
              />
              <span className="text-[9px] text-gray-400 leading-none">
                Tendency toward kinetic conflict. High increases militarization and casualty ratios.
              </span>
            </div>
          </div>

          {/* If/Then Directive Constructor */}
          <div className="border border-cyan-500/20 bg-black/40 p-4 rounded flex flex-col gap-3">
            <h3 className="text-xs font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
              <Binary className="w-3.5 h-3.5" /> BEHAVIORAL DIRECTIVES CONSTRUCTOR
            </h3>
            
            <div className="flex flex-col gap-2 text-xs">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">IF CONDITION</label>
                <select 
                  value={ifCondition} 
                  onChange={(e) => setIfCondition(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-cyan-500/30 rounded p-1.5 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option>Resources Drop Below 20%</option>
                  <option>Population Exceeds 10 Billion</option>
                  <option>Technological Velocity Stalls</option>
                  <option>Aggression Exceeds 80%</option>
                  <option>Pandemic Declared</option>
                </select>
              </div>

              <div className="flex justify-center items-center py-1">
                <ChevronRight className="rotate-90 text-[#00D2FF] w-4 h-4" />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">THEN DECREE</label>
                <select 
                  value={thenAction} 
                  onChange={(e) => setThenAction(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-cyan-500/30 rounded p-1.5 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option>Activate Cannibalism Instinct</option>
                  <option>Enforce Neural Linkage</option>
                  <option>Initiate Planetary Exodus</option>
                  <option>Mandate Cybernetic Pacification</option>
                  <option>Trigger Nuclear Reset</option>
                </select>
              </div>

              <button 
                onClick={handleAddRule}
                className="mt-2 bg-[#00D2FF]/20 hover:bg-[#00D2FF]/30 border border-[#00D2FF]/50 text-[#00D2FF] text-[10px] font-bold p-2 rounded flex items-center justify-center gap-1 transition"
              >
                <Plus className="w-3 h-3" /> ADD RULE DIRECTIVE
              </button>
            </div>

            {/* Render Rule Chips */}
            {customRules.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-2 max-h-[100px] overflow-y-auto terminal-scrollbar pr-1">
                {customRules.map((rule, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] bg-[#0E1524] border border-cyan-500/10 px-2 py-1.5 rounded text-gray-300">
                    <span className="truncate">{rule}</span>
                    <button 
                      onClick={() => handleRemoveRule(idx)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SIMULATE TRIGGER BUTTON */}
          <button
            onClick={handleSimulate}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-cyan-600 to-[#00D2FF] hover:from-cyan-500 hover:to-cyan-400 text-black font-black py-3 px-4 rounded text-center tracking-widest text-sm shadow-[0_0_15px_rgba(0,210,255,0.4)] disabled:opacity-50 transition duration-300 flex items-center justify-center gap-2 group"
          >
            {isLoading ? (
              <RefreshCw className="animate-spin w-4 h-4" />
            ) : (
              <Sparkles className="group-hover:scale-125 transition w-4 h-4" />
            )}
            SIMULATE EVOLUTIONARY ERA
          </button>
        </section>

        {/* ============================================================================
            PANEL B: THE CHRONOMETER & ARCHIVES (SIMULATION TIMELINE & REPORT)
           ============================================================================ */}
        <section className="border border-cyan-500/30 bg-[#0E1524]/60 backdrop-blur rounded p-5 flex flex-col gap-6 lg:col-span-1">
          <div className="border-b border-cyan-500/30 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="text-[#00F5A0] w-5 h-5" />
              <h2 className="text-sm font-black tracking-widest text-[#00F5A0]">
                ⏳ MATRIX STREAM & ANALYSIS
              </h2>
            </div>
            {isLoading && (
              <span className="text-[10px] text-[#FFB800] animate-pulse font-bold tracking-wider">
                COMPILING...
              </span>
            )}
          </div>

          {/* Quick-Glance Badges */}
          <div className="flex flex-wrap gap-2">
            {badges.map((badge, idx) => {
              // Custom colors based on badge emoji
              let colorClasses = "bg-cyan-950/40 border-cyan-500/30 text-[#00D2FF]";
              if (badge.includes("🌸") || badge.includes("🍃")) {
                colorClasses = "bg-emerald-950/40 border-emerald-500/30 text-[#00F5A0]";
              } else if (badge.includes("💀") || badge.includes("🛑") || badge.includes("🥩")) {
                colorClasses = "bg-red-950/40 border-red-500/30 text-red-400";
              } else if (badge.includes("⚡") || badge.includes("⚙️") || badge.includes("👁️")) {
                colorClasses = "bg-amber-950/40 border-amber-500/30 text-[#FFB800]";
              }
              return (
                <span 
                  key={idx} 
                  className={`text-[10px] font-bold uppercase border px-2 py-1.5 rounded tracking-wide ${colorClasses}`}
                >
                  {badge}
                </span>
              );
            })}
          </div>

          {/* Micro Visual Analytical Charts */}
          <div className="grid grid-cols-2 gap-4">
            {/* Chart 1: Global Population Sparkline */}
            <div className="border border-cyan-500/20 bg-black/40 p-3 rounded flex flex-col gap-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3 h-3 text-[#00D2FF]" /> Global Population
              </span>
              <div className="h-16 flex items-center justify-center relative">
                {/* Dynamically reactive sparkline SVG */}
                <svg className="w-full h-full" viewBox="0 0 200 60">
                  <path
                    d={getDynamicSparkline()}
                    fill="none"
                    stroke="#00F5A0"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_5px_#00F5A0]"
                  />
                  {/* Subtle Grid Lines */}
                  <line x1="0" y1="20" x2="200" y2="20" stroke="rgba(0, 210, 255, 0.05)" strokeDasharray="3" />
                  <line x1="0" y1="40" x2="200" y2="40" stroke="rgba(0, 210, 255, 0.05)" strokeDasharray="3" />
                </svg>
              </div>
              <span className="text-[9px] text-[#00F5A0] font-bold text-center">
                REACTIVE DENSITY DRIFT
              </span>
            </div>

            {/* Chart 2: Technological Velocity Gauge */}
            <div className="border border-cyan-500/20 bg-black/40 p-3 rounded flex flex-col gap-2 items-center justify-between">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1 self-start">
                <TrendingUp className="w-3 h-3 text-[#FFB800]" /> Tech Velocity
              </span>
              
              <div className="relative w-14 h-14 flex items-center justify-center">
                {/* SVG Progress Circle */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="23"
                    className="stroke-[#0B0F17] fill-transparent"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="23"
                    className="stroke-[#00D2FF] fill-transparent drop-shadow-[0_0_4px_#00D2FF]"
                    strokeWidth="3.5"
                    strokeDasharray="144"
                    strokeDashoffset={144 - (144 * curiosity) / 100}
                  />
                </svg>
                <div className="absolute text-[10px] font-black text-white">
                  {curiosity}%
                </div>
              </div>

              <span className="text-[9px] text-[#00D2FF] font-bold">
                {curiosity > 75 ? "VELOCITY: EXTREME" : curiosity > 45 ? "VELOCITY: CRITICAL" : "VELOCITY: DRIFT"}
              </span>
            </div>
          </div>

          {/* DYNAMIC TIMELINE STREAM */}
          <div className="flex flex-col gap-4 border border-cyan-500/10 p-4 bg-black/20 rounded">
            <h3 className="text-xs font-bold text-cyan-400 tracking-wider uppercase border-b border-cyan-500/10 pb-1.5">
              ⌛ ERA MILESTONES STREAM
            </h3>
            
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="animate-spin text-[#00D2FF] w-6 h-6" />
                <span className="text-xs text-cyan-400 font-bold tracking-widest animate-pulse">
                  {loadingStage}
                </span>
              </div>
            ) : (
              <div className="relative border-l border-cyan-500/30 pl-4 ml-2 flex flex-col gap-6 py-2">
                {timeline.map((era, idx) => (
                  <div key={idx} className="relative group">
                    {/* Glowing Node Dot */}
                    <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 bg-[#00F5A0] rounded-full border border-black shadow-[0_0_8px_#00F5A0] group-hover:scale-125 transition" />
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-cyan-950 px-2 py-0.5 border border-[#00D2FF]/30 text-[#00D2FF] rounded">
                          {era.year}
                        </span>
                        <h4 className="text-xs font-bold text-[#00F5A0] uppercase">
                          {era.title}
                        </h4>
                      </div>
                      <p className="text-[10px] text-gray-300 leading-relaxed font-sans">
                        {era.summary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COMPARATIVE SYSTEM DOSSIER */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-cyan-400 tracking-wider uppercase border-b border-cyan-500/10 pb-1.5">
              🔬 COMPARATIVE STRUCTURAL DOSSIER
            </h3>
            
            {isLoading ? (
              <div className="h-20 flex items-center justify-center">
                <span className="text-[10px] text-[#00D2FF] animate-pulse">DECRYPTING SYSTEM MATRIX...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-4 text-[10px]">
                {/* Governance Row */}
                <div className="grid grid-cols-2 gap-4 border-b border-cyan-500/5 pb-2.5">
                  <div className="border-r border-cyan-500/10 pr-2">
                    <span className="text-red-400 font-bold uppercase block mb-1">⚖️ OUR EARTH GOVERNANCE</span>
                    <p className="text-gray-400 leading-relaxed font-sans">{report.governance.earth}</p>
                  </div>
                  <div>
                    <span className="text-[#00D2FF] font-bold uppercase block mb-1">🤖 SIMULATED GOVERNANCE</span>
                    <p className="text-gray-300 leading-relaxed font-sans">{report.governance.simulation}</p>
                  </div>
                </div>

                {/* Architecture Row */}
                <div className="grid grid-cols-2 gap-4 border-b border-cyan-500/5 pb-2.5">
                  <div className="border-r border-cyan-500/10 pr-2">
                    <span className="text-red-400 font-bold uppercase block mb-1">🏙️ OUR EARTH HOUSING</span>
                    <p className="text-gray-400 leading-relaxed font-sans">{report.architecture.earth}</p>
                  </div>
                  <div>
                    <span className="text-[#00D2FF] font-bold uppercase block mb-1">🏢 SIMULATED ARCHITECTURE</span>
                    <p className="text-gray-300 leading-relaxed font-sans">{report.architecture.simulation}</p>
                  </div>
                </div>

                {/* Language Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border-r border-cyan-500/10 pr-2">
                    <span className="text-red-400 font-bold uppercase block mb-1">🗣️ OUR EARTH SPEECH</span>
                    <p className="text-gray-400 leading-relaxed font-sans">{report.language.earth}</p>
                  </div>
                  <div>
                    <span className="text-[#00D2FF] font-bold uppercase block mb-1">📡 SIMULATED LANGUAGE</span>
                    <p className="text-gray-300 leading-relaxed font-sans">{report.language.simulation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================================
            PANEL C: ARCHON AI INTERROGATION HUB (CHAT SYSTEM)
           ============================================================================ */}
        <section className="border border-cyan-500/30 bg-[#0E1524]/60 backdrop-blur rounded p-5 flex flex-col gap-4">
          <div className="border-b border-cyan-500/30 pb-3 flex items-center gap-2">
            <Terminal className="text-[#FFB800] w-5 h-5" />
            <div>
              <h2 className="text-sm font-black tracking-widest text-[#FFB800] uppercase">
                🤖 ARCHON AI: QUANTUM HISTORY CORE
              </h2>
              <p className="text-[10px] text-gray-400 font-bold tracking-wider mt-0.5">
                Interrogate the core about timeline branch dynamics and behavioral drift.
              </p>
            </div>
          </div>

          {/* CHAT DISPLAY SCREEN */}
          <div className="border border-cyan-500/20 bg-black/60 rounded p-4 h-[350px] overflow-y-auto terminal-scrollbar flex flex-col gap-3 font-sans">
            {chatHistory.map((msg, idx) => {
              const isArchon = msg.sender === "Archon AI";
              const isSystem = msg.sender === "System";
              
              let bubbleStyle = "bg-[#0E1524]/40 border border-cyan-500/10 self-start text-cyan-300 max-w-[85%]";
              let headerStyle = "text-[#00D2FF]";
              let headerName = "[PROGRAMMER]";
              
              if (isArchon) {
                bubbleStyle = "bg-[#111A2E]/80 border border-amber-500/20 self-start text-amber-200 max-w-[85%]";
                headerStyle = "text-[#FFB800]";
                headerName = "[ARCHON CORE v1.0.4]";
              } else if (isSystem) {
                bubbleStyle = "bg-cyan-950/20 border border-cyan-500/20 self-center text-cyan-400 text-center w-full text-[10px]";
                headerStyle = "text-cyan-500 hidden";
              } else {
                bubbleStyle = "bg-cyan-950/40 border border-cyan-500/30 self-end text-white max-w-[85%]";
                headerStyle = "text-white";
                headerName = "[USER EXPLICIT OVERRIDE]";
              }

              return (
                <div key={idx} className={`p-2.5 rounded text-[11px] leading-relaxed flex flex-col gap-1 ${bubbleStyle}`}>
                  <div className={`text-[9px] font-black uppercase tracking-wider ${headerStyle}`}>
                    {headerName}
                  </div>
                  <div className="whitespace-pre-wrap font-mono">
                    {msg.text}
                  </div>
                </div>
              );
            })}
            
            {/* Auto Typewriter Loading animation inside chat */}
            {isLoading && chatHistory[chatHistory.length - 1]?.sender !== "Archon AI" && (
              <div className="p-2.5 rounded text-[11px] bg-[#111A2E]/80 border border-amber-500/20 self-start text-amber-300 flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-[#FFB800]">
                  [ARCHON INTERROGATING...]
                </span>
                <span className="cursor-blink font-black">_</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* QUICK SUBMIT CHIPS */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Info className="w-3 h-3 text-[#FFB800]" /> Query Recommendation Chips
            </span>
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => handleChipClick("Explain the breakdown of art in this timeline.")}
                disabled={isLoading}
                className="text-left text-[10px] bg-[#0E1524] hover:bg-cyan-950/30 border border-cyan-500/10 hover:border-cyan-500/30 p-2 rounded text-cyan-400 hover:text-white transition duration-200"
              >
                🧬 "Explain the breakdown of art in this timeline."
              </button>
              <button 
                onClick={() => handleChipClick("Why are contracts favored over laws?")}
                disabled={isLoading}
                className="text-left text-[10px] bg-[#0E1524] hover:bg-cyan-950/30 border border-cyan-500/10 hover:border-cyan-500/30 p-2 rounded text-cyan-400 hover:text-white transition duration-200"
              >
                ⚖️ "Why are contracts favored over laws?"
              </button>
              <button 
                onClick={() => handleChipClick("Predict the space age with these current parameters.")}
                disabled={isLoading}
                className="text-left text-[10px] bg-[#0E1524] hover:bg-cyan-950/30 border border-cyan-500/10 hover:border-cyan-500/30 p-2 rounded text-cyan-400 hover:text-white transition duration-200"
              >
                🚀 "Predict the space age with these current parameters."
              </button>
            </div>
          </div>

          {/* CHAT INPUT AREA */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-gray-400 text-xs font-black select-none pointer-events-none">{`>`}</span>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                disabled={isLoading}
                placeholder="Interrogate cosmic history core..."
                className="w-full bg-black/60 border border-cyan-500/30 focus:border-cyan-400 rounded py-2 pl-6 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            
            <button
              onClick={() => handleChatSend()}
              disabled={isLoading || !chatInput.trim()}
              className="bg-[#FFB800] hover:bg-amber-400 text-black p-2.5 rounded transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </section>

      </div>

      {/* ============================================================================
          TERMINAL COMMAND FOOTER
         ============================================================================ */}
      <footer className="mt-8 border-t border-cyan-500/10 pt-4 flex flex-col md:flex-row justify-between text-[10px] text-gray-500 font-bold uppercase gap-2">
        <div>
          SECURED CONNECTION // SYSTEM AUTHORIZATION LEVEL: <span className="text-[#00F5A0]">ARCHON_OMNI</span>
        </div>
        <div className="flex gap-4">
          <span>HOST: localhost:5173</span>
          <span>TARGET CORE: http://localhost:8000</span>
          <span>© 2026 COSMIC_CORE_CORE_LABS</span>
        </div>
      </footer>
    </div>
  );
}
