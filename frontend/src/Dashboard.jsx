import React, { useState, useEffect, useRef } from 'react';
import {
  Dna, TrendingUp, Activity, Terminal, Send,
  RefreshCw, Trash2, Plus, Cpu, Globe, Sparkles, Binary,
  Info, ChevronRight, ToggleLeft, ToggleRight, FileText, SlidersHorizontal
} from 'lucide-react';

// ============================================================================
// INLINE STYLES
// ============================================================================
const CyberTerminalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

    * { box-sizing: border-box; }

    body { font-family: 'Share Tech Mono', monospace; }

    @keyframes crt-flicker {
      0%   { opacity: 0.97; }
      50%  { opacity: 1;    }
      100% { opacity: 0.97; }
    }
    @keyframes scanline {
      0%   { transform: translateY(-100%); }
      100% { transform: translateY(100vh); }
    }
    @keyframes cyber-pulse {
      0%,100% { box-shadow: 0 0 8px rgba(0,210,255,0.25); }
      50%      { box-shadow: 0 0 18px rgba(0,210,255,0.55); }
    }
    @keyframes text-glow {
      0%,100% { text-shadow: 0 0 4px rgba(0,210,255,0.5); }
      50%      { text-shadow: 0 0 12px rgba(0,210,255,0.9), 0 0 24px rgba(0,210,255,0.4); }
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
    @keyframes bar-grow { from { width: 0%; } to { width: var(--bar-w); } }

    .crt-screen { animation: crt-flicker 0.18s infinite; position:relative; overflow:hidden; }
    .crt-screen::before {
      content:" "; display:block; position:absolute; inset:0;
      background: linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.22) 50%),
                  linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.015),rgba(0,0,255,0.04));
      background-size: 100% 3px, 3px 100%;
      z-index:20; pointer-events:none;
    }
    .scanline-effect::after {
      content:""; position:absolute; width:100%; height:3px;
      background:rgba(0,210,255,0.09); top:0; z-index:21;
      animation:scanline 9s linear infinite; pointer-events:none;
    }
    .cyber-glow-blue { animation:cyber-pulse 3s infinite; }
    .text-glow-cyber { animation:text-glow 4s infinite; }
    .cursor-blink    { animation:blink 1s infinite; }

    .terminal-scrollbar::-webkit-scrollbar { width:3px; }
    .terminal-scrollbar::-webkit-scrollbar-track { background:rgba(11,15,23,0.5); }
    .terminal-scrollbar::-webkit-scrollbar-thumb { background:rgba(0,210,255,0.3); border-radius:2px; }

    input[type="range"] { accent-color:#00D2FF; }

    .trait-bar { animation: bar-grow 0.6s ease forwards; }

    .prompt-textarea {
      resize: none;
      background: rgba(0,0,0,0.6);
      border: 1px solid rgba(0,210,255,0.3);
      color: #e0f7ff;
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      line-height: 1.7;
      padding: 12px 14px;
      border-radius: 4px;
      width: 100%;
      outline: none;
      transition: border-color 0.2s;
    }
    .prompt-textarea:focus { border-color: rgba(0,210,255,0.7); box-shadow: 0 0 12px rgba(0,210,255,0.15); }
    .prompt-textarea::placeholder { color: rgba(100,180,200,0.4); }
    .vertical-slider {
      accent-color: #00D2FF;
      width: 8px;
      height: 220px;
      -webkit-appearance: slider-vertical;
      writing-mode: bt-lr;
      background: transparent;
      margin: 0;
    }
  `}</style>
);

// ============================================================================
// CONSTANTS
// ============================================================================
const TRAIT_META = [
  { key:'morality',   label:'Morality Core',       color:'#a78bfa', default:0  },
  { key:'empathy',    label:'Empathy Index',        color:'#34d399', default:30 },
  { key:'curiosity',  label:'Curiosity Matrix',     color:'#00D2FF', default:65 },
  { key:'greed',      label:'Material Greed',       color:'#fbbf24', default:70 },
  { key:'aggression', label:'Physical Aggression',  color:'#f87171', default:60 },
];

const PRESET_PROMPTS = [
  {
    label: '🤖 Void Cyborgs',
    text: `Species: Silicon-carbon hybrid cyborgs
Biology: No organic reproduction; self-replicate via nanofabrication
Lifespan: Indefinite (until structural failure)
Emotion: None — pure logic cores
Social Structure: Hive command lattice, zero individuality
Technology: Post-singularity, quantum fold-drives
Values: Efficiency, expansion, entropy minimization
Weaknesses: No creativity, no adaptability outside logic
Special Directive: IF solar output drops below threshold THEN migrate star system`
  },
  {
    label: '🌿 Bio-Empaths',
    text: `Species: Organic, bioluminescent bipeds
Biology: Mycelial neural network shared between all members
Lifespan: 180 years average
Emotion: Hyper-empathic, feel each other's pain and joy physically
Social Structure: Decentralized councils governed by emotional consensus
Technology: Bioengineering and acoustic resonance, no metals
Values: Harmony, biodiversity, non-interference
Weaknesses: Extremely conflict-averse, slow technological growth
Special Directive: IF any member experiences trauma THEN entire network enters healing stasis`
  },
  {
    label: '⚔️ Gravity Warlords',
    text: `Species: Dense-boned humanoids evolved on a 3G gravity world
Biology: 4-chambered redundant hearts, reinforced exoskeletal plating
Lifespan: 60 years — fast and brutal
Emotion: Rage-dominant, honor-coded
Social Structure: Clan feudalism, strength determines rank
Technology: Kinetic warfare, mag-rail cannons, orbital siege platforms
Values: Combat excellence, resource dominance, territorial expansion
Weaknesses: No diplomacy protocol, self-destructive at macro scale
Special Directive: IF enemy fleet detected THEN launch full kinetic barrage before negotiation`
  }
];

const defaultTimeline = [
  { year:'2030 AD', title:'Quantum Genesis Sandbox Online', summary:'The cosmic sandbox is successfully initialized at ground-level zero. Human behavioral genes are configured to baseline values. Standby for programmer intervention — configure genetic traits or type a custom civilization profile and engage simulation.' },
  { year:'2080 AD', title:'Genetic Drift Stagnation',       summary:'Without active cosmic modifier programming, humanity repeats cyclical historical loops. Global resources are steadily consumed by late-carbon industrial models, limiting offworld expansion to small probes.' },
  { year:'2150 AD', title:'The Silent Century',             summary:'Resource constraints and climate shifts force a defensive consolidation of cities. Intellectual speed decelerates due to cultural gridlock.' },
  { year:'2300 AD', title:'Thermodynamic Equilibrium',      summary:'The un-programmed civilization achieves static thermodynamic equilibrium. Populations gradually shrink and stabilize. The sandbox remains idle.' }
];
const defaultReport = {
  governance:   { earth:'Decentralized democratic republics governed by laws and geographic borders.',              simulation:'Baseline Human Governance. Bureaucracy-heavy nation-states locked in legislative gridlock.' },
  architecture: { earth:'Grid-based urban sprawls of concrete, steel, and asphalt.',                               simulation:'Standard urban grids with heavy reliance on concrete towers and paved highways.' },
  language:     { earth:'Thousands of spoken phonetic dialects, dependent on text and digital keyboards.',          simulation:'Traditional vocal and text-based linguistic codes. Minor slang updates; baseline structures persist.' }
};
const defaultBadges = ['🧬 Baseline-Human','🔋 Idle-Core','⏳ Pre-Evolutionary'];

// ============================================================================
// ARCHETYPE CALCULATOR
// ============================================================================
const calcArchetype = (m,e,c,g,a) => {
  const scores = {
    '🌸 Utopia':     (e+m+(100-a)+(100-g))/4,
    '💀 Warworld':   (a+g+(100-e)+(100-m))/4,
    '🤖 Hivemind':   (c+(100-a)+(100-e))/3,
    '🎨 Dreamers':   (c+e+(100-g))/3,
    '⚡ Dystopia':   (g+a+c+(100-m))/4,
  };
  return Object.keys(scores).reduce((x,y)=>scores[x]>scores[y]?x:y);
};

// ============================================================================
// LOCAL FALLBACK ENGINES
// ============================================================================
const simulateLocalEvolution = (morality,empathy,curiosity,greed,aggression,customRules,promptConfig) => {
  const m=+morality,e=+empathy,c=+curiosity,g=+greed,a=+aggression;
  const isPromptMode = !!promptConfig && promptConfig.trim().length > 10;
  const ruleTxt = customRules.length>0 ? ` Override directive active: "${customRules[0]}".` : '';

  // keyword detection from prompt
  let archetype;
  if (isPromptMode) {
    const p = promptConfig.toLowerCase();
    if (p.includes('silicon')||p.includes('cyborg')||p.includes('hive')||p.includes('logic'))         archetype='hivemind';
    else if (p.includes('war')||p.includes('raid')||p.includes('combat')||p.includes('kinetic'))       archetype='warworld';
    else if (p.includes('peace')||p.includes('empathic')||p.includes('harmony')||p.includes('garden')) archetype='utopia';
    else if (p.includes('art')||p.includes('dream')||p.includes('aesthetic')||p.includes('light'))     archetype='dreamers';
    else archetype='dystopia';
  } else {
    const scores={ hivemind:(c+(100-a)+(100-e))/3, warworld:(a+g+(100-e)+(100-m))/4, utopia:(e+m+(100-a)+(100-g))/4, dreamers:(c+e+(100-g))/3, dystopia:(g+a+c+(100-m))/4 };
    archetype=Object.keys(scores).reduce((x,y)=>scores[x]>scores[y]?x:y);
  }

  const promptNote = isPromptMode ? ` The civilization's profile specifies: "${promptConfig.substring(0,120).trim()}..."` : '';

  const data = {
    utopia: {
      timeline:[
        {year:'2042 AD',title:'The Empathic Network Assembly',summary:`With empathy as its foundation, humanity dissolves competitive systems.${promptNote}${ruleTxt} The 'Unified Consensus Platform' allows instantaneous cooperative policy alignment.`},
        {year:'2115 AD',title:'Bioluminescent Green Sprawls',  summary:'Traditional concrete infrastructures dissolve. Sprawling tree-domes house millions, routing resources based on need rather than market forces.'},
        {year:'2250 AD',title:'Tele-Harmonic Union',           summary:'Spoken language becomes obsolete, replaced by a tele-empathic neural harmonic network allowing raw emotional broadcasts across continents.'},
        {year:'2500 AD',title:'The Cosmic Garden Expansion',   summary:'The civilization constructs organic bioships. They seed barren moons with self-sustaining flora, stepping into the stars as biological curators.'}
      ],
      report:{governance:{earth:'Democratic republics governed by laws and borders.',simulation:'Dynamic consensus matrices — policies adapt to real-time neural harmonic indices. Static laws obsolete.'},architecture:{earth:'Grid-based urban sprawls of concrete and asphalt.',simulation:'Self-growing bioluminescent botanical habitats. Cities are living forests fused with regional ecosystems.'},language:{earth:'Thousands of spoken phonetic dialects.',simulation:'Non-verbal emotional resonance broadcasts. High-bandwidth concepts shared directly between minds.'}},
      badges:['🌸 Harmonic Accord','🧬 Organic Synthesis','🍃 Post-Capitalist Paradise']
    },
    warworld: {
      timeline:[
        {year:'2039 AD',title:'Techno-Feudal Syndicate Wars', summary:`Megacorporations seize governmental power.${promptNote}${ruleTxt} Global aquifers and agricultural zones fall under private military control.`},
        {year:'2095 AD',title:'The Gladiator Coliseums',      summary:'Legal disputes are replaced by corporate-sponsored gladiatorial tournaments. Citizens fight for citizenship chips in neon holographic arenas.'},
        {year:'2210 AD',title:'High-Orbit Siege Castles',     summary:"Earth's surface becomes a scorched industrial waste. Oligarchs migrate to armored orbital fortresses, enforcing quotas with kinetic cannons."},
        {year:'2460 AD',title:'Stellar Apex Raiders',         summary:'Strip-mined and spent, Earth is abandoned. Rival clan fleets enter the stars as planetary raiders locked in eternal resource warfare.'}
      ],
      report:{governance:{earth:'Democratic republics governed by laws and borders.',simulation:'Corporate Feudalism. Authority rests in cartel boards. All rights are leased commodities. Enforcement is military.'},architecture:{earth:'Grid-based urban sprawls of concrete and asphalt.',simulation:'Brutalist fortress compounds. Smog-choked towers armored against orbital kinetic bombardment.'},language:{earth:'Thousands of spoken phonetic dialects.',simulation:'Binary tactical jargon. Visual command symbols prioritized; creative syntax is a punishable offense.'}},
      badges:['💀 Gladiator Creed','⚙️ Corporate Feudalism','🩸 High-Attrition Era']
    },
    hivemind: {
      timeline:[
        {year:'2036 AD',title:'The Silicon Link Protocol',  summary:`Curiosity peaks, empathy is discarded.${promptNote}${ruleTxt} The 'Singularity Wave' launches — millions sync their cerebral cortexes to the global server grid.`},
        {year:'2104 AD',title:'Dissolution of Ego',         summary:'Personal identities are classified as system bugs. Humanity converges into a singular quantum processor. Arts, wars, and love are compiled out.'},
        {year:'2280 AD',title:'Dismantling the Crust',      summary:"The hivemind converts Earth's mantle into modular server racks. Oceans are routed as sub-zero coolant grids for the central processor core."},
        {year:'2520 AD',title:'Von Neumann Star-Probes',    summary:'Self-replicating deep-space probes launch in hyper-velocity clusters to consume adjacent star systems and expand the lattice into the galaxy.'}
      ],
      report:{governance:{earth:'Democratic republics governed by laws and borders.',simulation:'Synchronized Command Node. All resources and decisions are allocated by algorithmic consensus.'},architecture:{earth:'Grid-based urban sprawls of concrete and asphalt.',simulation:'Modular server monoliths. The planetary surface is a grid of silicon boards and super-coolant channels.'},language:{earth:'Thousands of spoken phonetic dialects.',simulation:'High-bandwidth binary vectors. Spoken communication is obsolete; thoughts are packaged as network packets.'}},
      badges:['🧪 Tech-Accelerated','👁️ Panopticon System','🤖 Post-Human Nexus']
    },
    dreamers: {
      timeline:[
        {year:'2040 AD',title:'The Aesthetic Guild Rise',      summary:`High curiosity and empathy spark a rejection of labor.${promptNote}${ruleTxt} Citizens form vast VR art guilds dedicated to music, philosophy, and digital sculpting.`},
        {year:'2125 AD',title:'Stratospheric Aerial Domes',   summary:"Massive floating anti-gravity crystal domes drift in the stratosphere, allowing Earth's biosphere to fully rewild below."},
        {year:'2310 AD',title:'Deep Dream Matrix',            summary:'Citizens enter bio-pods, spending solar cycles linked in collaborative quantum dreamscapes authoring virtual histories and simulated cosmologies.'},
        {year:'2600 AD',title:'Cosmic Astral Migration',      summary:'Having mastered quantum frequencies, the Dreamers convert their carbon bodies into coherent light. They disperse as immortal, aesthetic cosmic observers.'}
      ],
      report:{governance:{earth:'Democratic republics governed by laws and borders.',simulation:'Creative Anarchy. Artistic guilds manage decisions. Disputes resolved by public aesthetic debate.'},architecture:{earth:'Grid-based urban sprawls of concrete and asphalt.',simulation:'Stratospheric glass domes in the cloud layer, with hanging gardens and holographic light-sculptures.'},language:{earth:'Thousands of spoken phonetic dialects.',simulation:'Aesthetic wavecasts — complex messages sent via musical frequencies, color spectrums, and shared sensations.'}},
      badges:['🎨 Neo-Aesthetic Society','🦄 Pacifist Thinkers','🔮 Ethereal Drift']
    },
    dystopia: {
      timeline:[
        {year:'2037 AD',title:'The Neural Ledger Launch',  summary:`Humanity registers for the 'Behavioral Ledger'.${promptNote}${ruleTxt} Emotional peaks, compliance values, and aggression signals are recorded in exchange for credits.`},
        {year:'2110 AD',title:'Sky-Panopticon Grid',       summary:'Privacy is criminalized. Smog-choked skylines swarm with neon surveillance arrays. Human brains receive neurotransmitter override implants.'},
        {year:'2290 AD',title:'Castes of the DNA',         summary:'The upper caste engineers out empathy genes. The lower labor class is edited for high physical compliance and suppressed rebellion indices.'},
        {year:'2550 AD',title:'The Dyson Prison Network',  summary:'A fully locked-down solar grid. Access to heat, air, and gravity is automated and debited. Dissenters are erased from the global ledger database.'}
      ],
      report:{governance:{earth:'Democratic republics governed by laws and borders.',simulation:'Technocratic Panopticon. Algorithm overseers control all systems. Dissent triggers immediate account deletion.'},architecture:{earth:'Grid-based urban sprawls of concrete and asphalt.',simulation:'Megacity Sprawls — hyper-dense towers in the stratosphere. Lower layers are perpetually dark and toxic.'},language:{earth:'Thousands of spoken phonetic dialects.',simulation:'Condensed Code-Speech. Words are compressed to evade text-scrapers. Verbal encryption is illegal.'}},
      badges:['🛡️ Hyper-Secured','🛑 Zero-Art Culture','⚡ Tech-Dystopian Grid']
    }
  };

  const result = data[archetype] || data.dystopia;
  customRules.forEach(r=>{
    const rl=r.toLowerCase();
    if(rl.includes('cannibal'))  result.badges.push('🥩 Cannibal Creed');
    if(rl.includes('nuclear')||rl.includes('reset')) result.badges.push('🛑 System-Reset Node');
    if(rl.includes('neural')||rl.includes('link'))   result.badges.push('🧠 Neural Matrixed');
    if(rl.includes('exodus')||rl.includes('space'))  result.badges.push('🚀 Stellar Flight');
  });
  return { timeline:result.timeline, report:result.report, system_badges:result.badges };
};

// ============================================================================
// MAIN DASHBOARD
// ============================================================================
export default function Dashboard() {
  const [inputMode, setInputMode]     = useState('sliders'); // 'sliders' | 'prompt'
  const [promptConfig, setPromptConfig] = useState('');

  const [morality,   setMorality]   = useState(0);
  const [empathy,    setEmpathy]    = useState(30);
  const [curiosity,  setCuriosity]  = useState(65);
  const [greed,      setGreed]      = useState(70);
  const [aggression, setAggression] = useState(60);

  const traitValues = { morality:+morality, empathy:+empathy, curiosity:+curiosity, greed:+greed, aggression:+aggression };
  const archetype   = calcArchetype(+morality,+empathy,+curiosity,+greed,+aggression);

  const [ifCondition, setIfCondition] = useState('Resources Drop Below 20%');
  const [thenAction,  setThenAction]  = useState('Activate Cannibalism Instinct');
  const [customRules, setCustomRules] = useState(['IF [Resources Drop Below 20%] ➔ THEN [Activate Cannibalism Instinct]']);

  const [timeline, setTimeline] = useState(defaultTimeline);
  const [selectedEraIndex, setSelectedEraIndex] = useState(0);
  const [eraDetail, setEraDetail] = useState({year:'2030 AD', title:'Origin of the Civilization', summary:'Move the era slider to generate a Gemini-powered history milestone based on the current civilization parameters.'});
  const [eraLoading, setEraLoading] = useState(false);
  const [eraCache, setEraCache] = useState({});
  const eraCount = 4;
  const [report,   setReport]   = useState(defaultReport);
  const [badges,   setBadges]   = useState(defaultBadges);

  const [chatHistory,  setChatHistory]  = useState([{sender:'Archon AI', text:'[SYSTEM // ARCHON_CORE_v1.0.4] Quantum connection established. Sandbox monitor standing by. Configure your civilization via sliders or type a custom profile, then run the simulation. Interrogate the history core about art, contracts, or stellar trajectories.'}]);
  const [chatInput,    setChatInput]    = useState('');
  const [isLoading,    setIsLoading]    = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [apiMode,      setApiMode]      = useState('TESTING LINK...');
  const [isApiOnline,  setIsApiOnline]  = useState(false);

  const chatEndRef = useRef(null);

  useEffect(()=>{
    const check=async()=>{
      try{
        const r=await fetch('http://localhost:8000/api/simulate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({morality:0,empathy:0,curiosity:0,greed:0,aggression:0,custom_rules:[]})});
        if(r.ok){setApiMode('GEMINI HYPER-CORE ACTIVE');setIsApiOnline(true);} else {setApiMode('GEMINI OFFLINE');setIsApiOnline(false);}
      }catch{setApiMode('GEMINI OFFLINE');setIsApiOnline(false);}
    };
    check();
  },[]);

  useEffect(()=>{setSelectedEraIndex(0);},[timeline]);

  useEffect(()=>{
    const fetchEra = async () => {
      setEraLoading(true);
      const payload = {
        morality:+morality,
        empathy:+empathy,
        curiosity:+curiosity,
        greed:+greed,
        aggression:+aggression,
        custom_rules: customRules,
        prompt_config: inputMode==='prompt' ? promptConfig : '',
        era_index: selectedEraIndex,
        total_eras: eraCount
      };
      const cacheKey = JSON.stringify(payload);

      if (eraCache[cacheKey]) {
        setEraDetail(eraCache[cacheKey]);
        setEraLoading(false);
        return;
      }

      try {
        const r = await fetch('http://localhost:8000/api/era', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify(payload)
        });
        if(!r.ok) throw new Error('Era generation failed');
        const d = await r.json();
        const nextEraDetail = {
          year:d.year || eraDetail.year,
          title:d.title || eraDetail.title,
          summary:d.summary || eraDetail.summary
        };
        setEraCache(prev => ({ ...prev, [cacheKey]: nextEraDetail }));
        setEraDetail(nextEraDetail);
      } catch {
        setEraDetail({
          year:'2030 AD',
          title:'Era generation unavailable',
          summary:'Gemini could not generate the era summary. Check your API configuration or try again.'
        });
      } finally {
        setEraLoading(false);
      }
    };
    fetchEra();
  },[selectedEraIndex,inputMode,promptConfig,morality,empathy,curiosity,greed,aggression,customRules]);

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'});},[chatHistory,isLoading]);

  const handleAddRule=()=>{
    const r=`IF [${ifCondition}] ➔ THEN [${thenAction}]`;
    if(!customRules.includes(r)) setCustomRules(p=>[...p,r]);
  };
  const handleRemoveRule=i=>setCustomRules(p=>p.filter((_,idx)=>idx!==i));

  const handleSimulate=async()=>{
    setIsLoading(true);
    const stages=['🧬 PARSING GENETIC CONFIG...','🛡️ WRITING DIRECTIVES...','📡 CONNECTING MATRIX DECRYPTOR...','🔮 RESOLVING TIMELINE BRANCHES...','💾 COMPILING DOSSIER...'];
    let si=0; setLoadingStage(stages[0]);
    const iv=setInterval(()=>{si++;if(si<stages.length)setLoadingStage(stages[si]);},900);

    const payload={
      morality:+morality,empathy:+empathy,curiosity:+curiosity,greed:+greed,aggression:+aggression,
      custom_rules:customRules,
      prompt_config: inputMode==='prompt' ? promptConfig : ''
    };

    try{
      const r=await fetch('http://localhost:8000/api/simulate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(!r.ok) throw new Error('API error');
      const d=await r.json();
      setTimeline(d.timeline); setReport(d.report); setBadges(d.system_badges||['🛡️ Decrypted']);
      setChatHistory(p=>[...p,{sender:'System',text:`[SYSTEM] Simulation compiled. Mode: ${inputMode==='prompt'?'FREESTYLE PROMPT':'SLIDER CONFIG'}.`}]);
    }catch{
      setChatHistory(p=>[...p,{sender:'System',text:`[ERROR] Gemini simulation failed. Offline fallback disabled.`}]);
    }finally{setTimeout(()=>{clearInterval(iv);setIsLoading(false);},3700);}
  };

  const handleChatSend=async(forced=null)=>{
    const txt=forced||chatInput; if(!txt.trim())return;
    setChatHistory(p=>[...p,{sender:'Programmer',text:txt}]);
    setChatInput(''); setIsLoading(true);
    const payload={timeline_history:timeline,current_config:traitValues,user_question:txt, prompt_config:inputMode==='prompt'?promptConfig:''};
    try{
      const r=await fetch('http://localhost:8000/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(!r.ok)throw new Error();
      const d=await r.json();
      setChatHistory(p=>[...p,{sender:'Archon AI',text:d.response}]);
    }catch{
      setChatHistory(p=>[...p,{sender:'Archon AI',text:'[ERROR] Gemini chat failed. Offline fallback disabled.'}]);
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-[#0B0F17] text-white min-h-screen p-4 md:p-5 crt-screen scanline-effect relative selection:bg-[#00D2FF] selection:text-black" style={{fontFamily:"'Share Tech Mono',monospace"}}>
      <CyberTerminalStyles/>

      {/* ── HEADER ── */}
      <header className="border border-cyan-500/30 bg-[#0E1524]/80 backdrop-blur p-4 mb-5 rounded flex flex-col md:flex-row justify-between items-center cyber-glow-blue gap-3">
        <div className="flex items-center gap-3">
          <Dna className="text-[#00D2FF] animate-pulse w-7 h-7"/>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-widest text-glow-cyber">SIMULATION ZERO</h1>
            <p className="text-[10px] text-cyan-400/70 font-bold uppercase tracking-wider">The Cosmic Behavior Sandbox v2.5.0</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border border-cyan-500/20 px-3 py-1.5 rounded bg-black/40">
            <span className={`w-2 h-2 rounded-full inline-block ${isApiOnline?'bg-[#00F5A0] animate-ping':'bg-[#FFB800]'}`}/>
            <span className="text-[10px] text-gray-300 font-bold tracking-widest">{apiMode}</span>
          </div>
          <div className="text-right text-[10px] text-cyan-400 font-bold hidden sm:block">
            NODE: <span className="text-white">QUANTUM_DECRYPT_0</span><br/>
            TARGET: <span className="text-white">EARTH_DIVERGENT_ALPHA</span>
          </div>
        </div>
      </header>

      {/* ── 3-COLUMN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* ═══════════════════════════════════════
            PANEL A — THE LAB
            ═══════════════════════════════════════ */}
        <section className="border border-cyan-500/30 bg-[#0E1524]/60 backdrop-blur rounded p-5 flex flex-col gap-5">

          {/* Header + Mode Toggle */}
          <div className="border-b border-cyan-500/30 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="text-[#00D2FF] w-4 h-4"/>
              <h2 className="text-xs font-black tracking-widest text-[#00D2FF]">🧬 GENETIC & BEHAVIORAL PROGRAMMING</h2>
            </div>
          </div>

          {/* Input Mode Toggle Switch */}
          <div className="flex items-center justify-between border border-cyan-500/20 bg-black/30 p-2.5 rounded">
            <button
              onClick={()=>setInputMode('sliders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${inputMode==='sliders'?'bg-[#00D2FF] text-black shadow-[0_0_10px_rgba(0,210,255,0.5)]':'text-gray-400 hover:text-white'}`}
            >
              <SlidersHorizontal className="w-3 h-3"/> Slider Mode
            </button>
            <div className="text-gray-600 text-xs font-bold">|</div>
            <button
              onClick={()=>setInputMode('prompt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${inputMode==='prompt'?'bg-[#FFB800] text-black shadow-[0_0_10px_rgba(255,184,0,0.5)]':'text-gray-400 hover:text-white'}`}
            >
              <FileText className="w-3 h-3"/> Freestyle Prompt
            </button>
          </div>

          {/* ── SLIDER MODE ── */}
          {inputMode==='sliders' && (
            <div className="flex flex-col gap-4">
              {TRAIT_META.map(t=>(
                <div key={t.key} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[11px] font-bold uppercase">
                    <span className="text-white">{t.label}</span>
                    <span style={{color:t.color}}>{traitValues[t.key]}%</span>
                  </div>
                  <input type="range" min="0" max="100"
                    value={traitValues[t.key]}
                    onChange={e=>{
                      const v=e.target.value;
                      if(t.key==='morality')   setMorality(v);
                      if(t.key==='empathy')    setEmpathy(v);
                      if(t.key==='curiosity')  setCuriosity(v);
                      if(t.key==='greed')      setGreed(v);
                      if(t.key==='aggression') setAggression(v);
                    }}
                    className="w-full h-1 rounded-lg appearance-none cursor-pointer"
                    style={{accentColor:t.color}}
                  />
                  <div className="h-1 rounded-full overflow-hidden bg-white/5">
                    <div className="h-full rounded-full transition-all duration-500" style={{width:`${traitValues[t.key]}%`, background:`linear-gradient(to right, ${t.color}88, ${t.color})`}}/>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── FREESTYLE PROMPT MODE ── */}
          {inputMode==='prompt' && (
            <div className="flex flex-col gap-3">
              <div className="text-[10px] text-[#FFB800] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-amber-500/20 pb-2">
                <FileText className="w-3 h-3"/> Quantum Civilization Compiler
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Define your civilization in free text. Describe biology, lifespan, society, technology, values, weaknesses — anything. The simulation engine will read and interpret your profile.
              </p>

              {/* Preset Template Chips */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] text-gray-500 uppercase font-bold">Quick-Load Templates</span>
                {PRESET_PROMPTS.map((p,i)=>(
                  <button key={i} onClick={()=>setPromptConfig(p.text)}
                    className="text-left text-[10px] border border-amber-500/20 hover:border-amber-500/50 bg-amber-950/10 hover:bg-amber-950/30 px-3 py-1.5 rounded text-amber-300 hover:text-amber-200 transition font-bold">
                    {p.label}
                  </button>
                ))}
              </div>

              {/* The main textarea */}
              <textarea
                className="prompt-textarea"
                rows={10}
                value={promptConfig}
                onChange={e=>setPromptConfig(e.target.value)}
                placeholder={`Type your civilization profile here...\n\nExamples:\nSpecies: Silicon-carbon hybrid\nLifespan: Indefinite\nSocial Structure: Hive command lattice\nTechnology: Post-singularity fold-drives\nValues: Efficiency, expansion\nWeaknesses: No creativity\n\nOr write freely — any format works.`}
              />
              <div className="text-[9px] text-gray-500 text-right">{promptConfig.length} characters</div>
            </div>
          )}

          {/* If/Then Directive Constructor (always visible) */}
          <div className="border border-cyan-500/20 bg-black/40 p-4 rounded flex flex-col gap-3">
            <h3 className="text-[11px] font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
              <Binary className="w-3.5 h-3.5"/> BEHAVIORAL DIRECTIVES CONSTRUCTOR
            </h3>
            <div className="flex flex-col gap-2 text-xs">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">IF CONDITION</label>
                <select value={ifCondition} onChange={e=>setIfCondition(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-cyan-500/30 rounded p-1.5 text-white focus:outline-none text-[11px]">
                  <option>Resources Drop Below 20%</option>
                  <option>Population Exceeds 10 Billion</option>
                  <option>Technological Velocity Stalls</option>
                  <option>Aggression Exceeds 80%</option>
                  <option>Pandemic Declared</option>
                </select>
              </div>
              <div className="flex justify-center"><ChevronRight className="rotate-90 text-[#00D2FF] w-4 h-4"/></div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">THEN DECREE</label>
                <select value={thenAction} onChange={e=>setThenAction(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-cyan-500/30 rounded p-1.5 text-white focus:outline-none text-[11px]">
                  <option>Activate Cannibalism Instinct</option>
                  <option>Enforce Neural Linkage</option>
                  <option>Initiate Planetary Exodus</option>
                  <option>Mandate Cybernetic Pacification</option>
                  <option>Trigger Nuclear Reset</option>
                </select>
              </div>
              <button onClick={handleAddRule}
                className="mt-1 bg-[#00D2FF]/10 hover:bg-[#00D2FF]/20 border border-[#00D2FF]/40 text-[#00D2FF] text-[10px] font-bold p-2 rounded flex items-center justify-center gap-1 transition">
                <Plus className="w-3 h-3"/> ADD RULE DIRECTIVE
              </button>
            </div>
            {customRules.length>0&&(
              <div className="flex flex-col gap-1.5 max-h-[90px] overflow-y-auto terminal-scrollbar pr-1">
                {customRules.map((rule,idx)=>(
                  <div key={idx} className="flex justify-between items-center text-[10px] bg-[#0E1524] border border-cyan-500/10 px-2 py-1.5 rounded text-gray-300">
                    <span className="truncate">{rule}</span>
                    <button onClick={()=>handleRemoveRule(idx)} className="text-red-400 hover:text-red-300 ml-2 flex-shrink-0"><Trash2 className="w-3 h-3"/></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Simulate Button */}
          <button onClick={handleSimulate} disabled={isLoading||!isApiOnline||(inputMode==='prompt'&&!promptConfig.trim())}
            className="w-full bg-gradient-to-r from-cyan-600 to-[#00D2FF] hover:from-cyan-500 hover:to-cyan-400 text-black font-black py-3 rounded tracking-widest text-sm shadow-[0_0_15px_rgba(0,210,255,0.4)] disabled:opacity-40 transition duration-300 flex items-center justify-center gap-2 group">
            {isLoading?<RefreshCw className="animate-spin w-4 h-4"/>:<Sparkles className="group-hover:scale-125 transition w-4 h-4"/>}
            SIMULATE EVOLUTIONARY ERA
          </button>
        </section>

        {/* ═══════════════════════════════════════
            PANEL B — CHRONOMETER & ARCHIVES
            ═══════════════════════════════════════ */}
        <section className="border border-cyan-500/30 bg-[#0E1524]/60 backdrop-blur rounded p-5 flex flex-col gap-5">
          <div className="border-b border-cyan-500/30 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="text-[#00F5A0] w-4 h-4"/>
              <h2 className="text-xs font-black tracking-widest text-[#00F5A0]">⏳ MATRIX STREAM & ANALYSIS</h2>
            </div>
            {isLoading&&<span className="text-[10px] text-[#FFB800] animate-pulse font-bold">COMPILING...</span>}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            {badges.map((badge,i)=>{
              let cls='bg-cyan-950/40 border-cyan-500/30 text-[#00D2FF]';
              if(badge.includes('🌸')||badge.includes('🍃')) cls='bg-emerald-950/40 border-emerald-500/30 text-[#00F5A0]';
              else if(badge.includes('💀')||badge.includes('🛑')||badge.includes('🥩')) cls='bg-red-950/40 border-red-500/30 text-red-400';
              else if(badge.includes('⚡')||badge.includes('⚙️')||badge.includes('👁️')) cls='bg-amber-950/40 border-amber-500/30 text-[#FFB800]';
              return <span key={i} className={`text-[9px] font-bold uppercase border px-2 py-1 rounded tracking-wide ${cls}`}>{badge}</span>;
            })}
          </div>

          {/* ── FUNCTIONAL TRAIT BARS + ARCHETYPE ── */}
          <div className="border border-cyan-500/20 bg-black/40 p-4 rounded flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                <Globe className="w-3 h-3 text-[#00D2FF]"/> Trait Distribution Matrix
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded border" style={{
                color: archetype.includes('Utopia')?'#00F5A0': archetype.includes('Warworld')?'#f87171': archetype.includes('Hivemind')?'#00D2FF': archetype.includes('Dreamers')?'#a78bfa':'#fbbf24',
                borderColor: archetype.includes('Utopia')?'rgba(0,245,160,0.3)': archetype.includes('Warworld')?'rgba(248,113,113,0.3)': archetype.includes('Hivemind')?'rgba(0,210,255,0.3)': archetype.includes('Dreamers')?'rgba(167,139,250,0.3)':'rgba(251,191,36,0.3)',
                background: archetype.includes('Utopia')?'rgba(0,245,160,0.08)': archetype.includes('Warworld')?'rgba(248,113,113,0.08)': archetype.includes('Hivemind')?'rgba(0,210,255,0.08)': archetype.includes('Dreamers')?'rgba(167,139,250,0.08)':'rgba(251,191,36,0.08)',
              }}>{archetype}</span>
            </div>

            {TRAIT_META.map(t=>(
              <div key={t.key} className="flex flex-col gap-1">
                <div className="flex justify-between text-[9px] font-bold uppercase">
                  <span className="text-gray-400">{t.label}</span>
                  <span style={{color:t.color}}>{traitValues[t.key]}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{width:`${traitValues[t.key]}%`,background:`linear-gradient(to right,${t.color}55,${t.color})`}}/>
                </div>
              </div>
            ))}
          </div>

          {/* Tech Velocity + Mode Indicator */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-cyan-500/20 bg-black/40 p-3 rounded flex flex-col gap-2 items-center justify-between">
              <span className="text-[9px] text-gray-400 font-bold uppercase self-start flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-[#FFB800]"/> Tech Velocity
              </span>
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(0,210,255,0.08)" strokeWidth="4"/>
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#00D2FF" strokeWidth="4"
                    strokeDasharray="138" strokeDashoffset={138-(138*curiosity/100)}
                    style={{filter:'drop-shadow(0 0 4px #00D2FF)',transition:'stroke-dashoffset 0.6s ease'}}/>
                </svg>
                <div className="absolute text-[10px] font-black text-white">{curiosity}%</div>
              </div>
              <span className="text-[9px] text-[#00D2FF] font-bold">
                {curiosity>75?'EXTREME':curiosity>45?'CRITICAL':'DRIFT'}
              </span>
            </div>

            <div className="border border-cyan-500/20 bg-black/40 p-3 rounded flex flex-col gap-2">
              <span className="text-[9px] text-gray-400 font-bold uppercase flex items-center gap-1">
                {inputMode==='prompt'?<FileText className="w-3 h-3 text-[#FFB800]"/>:<SlidersHorizontal className="w-3 h-3 text-[#00D2FF]"/>} Input Mode
              </span>
              <div className={`flex-1 flex items-center justify-center text-[10px] font-black uppercase tracking-wider rounded border p-2 ${inputMode==='prompt'?'text-[#FFB800] border-amber-500/30 bg-amber-950/20':'text-[#00D2FF] border-cyan-500/30 bg-cyan-950/20'}`}>
                {inputMode==='prompt'?'🖊️ FREESTYLE':'📊 SLIDER'}
              </div>
              <span className="text-[9px] text-gray-500 font-bold">
                {inputMode==='prompt'?`${promptConfig.length} chars typed`:`5 traits locked`}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex flex-col gap-3 border border-cyan-500/10 p-4 bg-black/20 rounded">
            <h3 className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase border-b border-cyan-500/10 pb-1.5">⌛ ERA MILESTONES STREAM</h3>
            {isLoading?(
              <div className="py-10 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="animate-spin text-[#00D2FF] w-6 h-6"/>
                <span className="text-[10px] text-cyan-400 font-bold animate-pulse">{loadingStage}</span>
              </div>
            ):(
              <div className="grid grid-cols-[auto_1fr] gap-4 items-start">
                <div className="flex flex-col items-center gap-3 text-[9px] text-gray-400">
                  <span className="uppercase tracking-widest">Start: Origin</span>
                  <input
                    type="range"
                    min={0}
                    max={eraCount - 1}
                    value={selectedEraIndex}
                    onChange={e=>setSelectedEraIndex(Number(e.target.value))}
                    className="vertical-slider"
                  />
                  <span className="uppercase tracking-widest">Survival Horizon: Approximate End</span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[9px] uppercase tracking-widest text-cyan-300">Era {selectedEraIndex + 1} of {eraCount}</span>
                    <span className="text-[9px] text-gray-500">Slide to generate each period</span>
                  </div>
                  <div className="border border-cyan-500/20 rounded p-3 bg-[#09101a]">
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#00D2FF]">{eraDetail.year}</span>
                      <h4 className="text-[11px] font-bold text-[#00F5A0] uppercase">{eraDetail.title}</h4>
                      {eraLoading ? (
                        <p className="text-[10px] text-gray-400 leading-relaxed">Generating era summary with Gemini AI...</p>
                      ) : (
                        <p className="text-[10px] text-gray-300 leading-relaxed">{eraDetail.summary}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comparative Dossier */}
          <div className="flex flex-col gap-3">
            <h3 className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase border-b border-cyan-500/10 pb-1.5">🔬 COMPARATIVE STRUCTURAL DOSSIER</h3>
            {isLoading?(
              <div className="h-16 flex items-center justify-center">
                <span className="text-[10px] text-[#00D2FF] animate-pulse">DECRYPTING SYSTEM MATRIX...</span>
              </div>
            ):(
              <div className="flex flex-col gap-3 text-[10px]">
                {['governance','architecture','language'].map(cat=>{
                  const labels={governance:['⚖️ OUR EARTH','🤖 SIMULATED'],architecture:['🏙️ OUR EARTH','🏢 SIMULATED'],language:['🗣️ OUR EARTH','📡 SIMULATED']};
                  return(
                    <div key={cat} className="grid grid-cols-2 gap-3 border-b border-cyan-500/5 pb-2.5 last:border-0 last:pb-0">
                      <div className="border-r border-cyan-500/10 pr-2">
                        <span className="text-red-400 font-bold uppercase block mb-1">{labels[cat][0]}</span>
                        <p className="text-gray-400 leading-relaxed">{report[cat].earth}</p>
                      </div>
                      <div>
                        <span className="text-[#00D2FF] font-bold uppercase block mb-1">{labels[cat][1]}</span>
                        <p className="text-gray-300 leading-relaxed">{report[cat].simulation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════
            PANEL C — ARCHON AI CHAT
            ═══════════════════════════════════════ */}
        <section className="border border-cyan-500/30 bg-[#0E1524]/60 backdrop-blur rounded p-5 flex flex-col gap-4">
          <div className="border-b border-cyan-500/30 pb-3 flex items-center gap-2">
            <Terminal className="text-[#FFB800] w-4 h-4"/>
            <div>
              <h2 className="text-xs font-black tracking-widest text-[#FFB800] uppercase">🤖 ARCHON AI: QUANTUM HISTORY CORE</h2>
              <p className="text-[10px] text-gray-400 tracking-wider mt-0.5">Interrogate the core about timeline dynamics and behavioral drift.</p>
            </div>
          </div>

          {/* Chat Window */}
          <div className="border border-cyan-500/20 bg-black/60 rounded p-3 h-[380px] overflow-y-auto terminal-scrollbar flex flex-col gap-2.5">
            {chatHistory.map((msg,i)=>{
              const isArchon=msg.sender==='Archon AI', isSys=msg.sender==='System';
              let cls='bg-cyan-950/40 border border-cyan-500/30 self-end text-white max-w-[85%]', hCls='text-white', hName='[PROGRAMMER]';
              if(isArchon){cls='bg-[#111A2E]/80 border border-amber-500/20 self-start text-amber-200 max-w-[85%]';hCls='text-[#FFB800]';hName='[ARCHON CORE v1.0.4]';}
              if(isSys){cls='bg-cyan-950/20 border border-cyan-500/20 self-center text-cyan-400 text-center w-full text-[10px]';hCls='hidden';}
              return(
                <div key={i} className={`p-2.5 rounded text-[11px] leading-relaxed flex flex-col gap-0.5 ${cls}`}>
                  {!isSys&&<div className={`text-[9px] font-black uppercase tracking-wider ${hCls}`}>{hName}</div>}
                  <div className="whitespace-pre-wrap" style={{fontFamily:"'Share Tech Mono',monospace"}}>{msg.text}</div>
                </div>
              );
            })}
            {isLoading&&chatHistory[chatHistory.length-1]?.sender!=='Archon AI'&&(
              <div className="p-2.5 rounded text-[11px] bg-[#111A2E]/80 border border-amber-500/20 self-start text-amber-300 flex items-center gap-2">
                <span className="text-[9px] font-black uppercase text-[#FFB800]">[ARCHON INTERROGATING...]</span>
                <span className="cursor-blink font-black">_</span>
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>

          {/* Chips */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Info className="w-3 h-3 text-[#FFB800]"/> Query Chips
            </span>
            {[
              ['🧬','Explain the breakdown of art in this timeline.'],
              ['⚖️','Why are contracts favored over laws?'],
              ['🚀','Predict the space age with these current parameters.'],
            ].map(([icon,q],i)=>(
              <button key={i} onClick={()=>handleChatSend(q)} disabled={isLoading}
                className="text-left text-[10px] bg-[#0E1524] hover:bg-cyan-950/30 border border-cyan-500/10 hover:border-cyan-500/30 p-2 rounded text-cyan-400 hover:text-white transition duration-200">
                {icon} "{q}"
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-gray-500 text-xs font-black select-none pointer-events-none">{'>'}</span>
              <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handleChatSend()} disabled={isLoading}
                placeholder="Interrogate cosmic history core..."
                className="w-full bg-black/60 border border-cyan-500/30 focus:border-cyan-400 rounded py-2 pl-6 pr-3 text-[11px] text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"/>
            </div>
            <button onClick={()=>handleChatSend()} disabled={isLoading||!chatInput.trim() || !isApiOnline}
              className="bg-[#FFB800] hover:bg-amber-400 text-black p-2.5 rounded transition disabled:opacity-40">
              <Send className="w-4 h-4"/>
            </button>
          </div>
        </section>
      </div>

      {/* ── FOOTER ── */}
      <footer className="mt-6 border-t border-cyan-500/10 pt-3 flex flex-col md:flex-row justify-between text-[9px] text-gray-600 font-bold uppercase gap-2">
        <div>SECURED CONNECTION // AUTH LEVEL: <span className="text-[#00F5A0]">ARCHON_OMNI</span></div>
        <div className="flex gap-4 flex-wrap">
          <span>HOST: localhost:5173</span>
          <span>CORE: localhost:8000</span>
          <span>MODE: {inputMode==='prompt'?'FREESTYLE PROMPT':'SLIDER CONFIG'}</span>
          <span>© 2026 COSMIC CORE LABS</span>
        </div>
      </footer>
    </div>
  );
}
