'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Bell, Bike, Car, ChevronDown, CircleHelp, Clock3, CloudSun, Compass, Cross, Gauge, Layers3, Leaf, LocateFixed, Menu, Navigation, Radio, Route, Search, Settings2, ShieldCheck, Sparkles, TrafficCone, UsersRound, X, Zap } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { congestion, metrics, navItems, routes, signals } from '../lib/data';

type IconKey = 'activity' | 'car' | 'gauge' | 'clock' | 'leaf';
const iconMap: Record<IconKey, typeof Activity> = { activity: Activity, car: Car, gauge: Gauge, clock: Clock3, leaf: Leaf };

// Bhopal Junctions for Search & Predict autocomplete list
const BHOPAL_JUNCTIONS = [
  "Rani Kamlapati Station",
  "Board Office Sq.",
  "Roshanpura Sq.",
  "Lalghati Circle",
  "Polytechnic Sq.",
  "VIP Road",
  "New Market",
  "Peer Gate",
  "Lake View Rd",
  "Raja Bhoj Airport"
];

export default function Home() {
  const [activeNav, setActiveNav] = useState('Live city');
  const [forecast, setForecast] = useState(15);
  const [activeRoute, setActiveRoute] = useState('fastest');
  const [emergency, setEmergency] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const [livePulse, setLivePulse] = useState(0);

  // Live telemetry clock
  const [time, setTime] = useState('08:42:16');

  // Dynamic live states with fallback to mock data
  const [metricsData, setMetricsData] = useState(metrics);
  const [routesData, setRoutesData] = useState(routes);
  const [congestionData, setCongestionData] = useState(congestion);
  const [signalsData, setSignalsData] = useState(signals);

  // Interactive UI Modal/HUD/Toast States
  const [toasts, setToasts] = useState<Array<{ id: number; title: string; desc: string; type: 'success' | 'error' | 'info' }>>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJunctionPrediction, setSelectedJunctionPrediction] = useState<any>(null);
  
  const [isSignalModalOpen, setIsSignalModalOpen] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const [signalRecommendation, setSignalRecommendation] = useState<any>(null);

  const [isNavHUDOpen, setIsNavHUDOpen] = useState(false);
  const [navHUDProgress, setNavHUDProgress] = useState(0);
  const [isNavHUDPaused, setIsNavHUDPaused] = useState(false);
  const [activeNavNodeIndex, setActiveNavNodeIndex] = useState(0);

  // Map settings
  const [mapMode, setMapMode] = useState('Traffic');
  const [zoom, setZoom] = useState(100);

  // Toast notifier function
  const showToast = (title: string, desc: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, desc, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Clock tick
  useEffect(() => {
    const clock = setInterval(() => {
      const now = new Date();
      setTime(now.toTimeString().split(' ')[0]);
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  // Live pulses for vehicle map animation
  useEffect(() => {
    const ticker = window.setInterval(() => setLivePulse(value => (value + 1) % 100), 2400);
    return () => window.clearInterval(ticker);
  }, []);

  // 1. Fetch City Metrics live from backend (re-run on emergency status toggle)
  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/city/metrics?emergency=${emergency}`);
        if (!res.ok) throw new Error('API down');
        const data = await res.json();
        
        const updatedMetrics = [
          { label: 'City traffic score', value: String(data.traffic_score), suffix: '/100', trend: emergency ? '+3.1%' : '+8.4%', icon: 'activity', tone: 'green' },
          { label: 'Vehicles in motion', value: data.active_vehicles.toLocaleString(), suffix: '', trend: '+2.1%', icon: 'car', tone: 'blue' },
          { label: 'Congestion index', value: String(Math.round(data.congestion_index * 100)), suffix: '%', trend: emergency ? '−5%' : '−12.6%', icon: 'gauge', tone: 'amber' },
          { label: 'Avg. travel time', value: String(data.average_travel_minutes), suffix: ' min', trend: '−3.2 min', icon: 'clock', tone: 'purple' },
          { label: 'CO₂ avoided today', value: String(data.co2_avoided_tons), suffix: ' t', trend: '+18.9%', icon: 'leaf', tone: 'green' }
        ];
        setMetricsData(updatedMetrics);
      } catch (err) {
        console.warn('Metrics API down, using pre-loaded default datasets.', err);
      }
    }
    fetchMetrics();
  }, [emergency]);

  // 2. Fetch daily congestion pattern chart live from backend
  useEffect(() => {
    async function fetchCongestion() {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/predictions/congestion/daily?emergency=${emergency}`);
        if (!res.ok) throw new Error('API down');
        const data = await res.json();
        setCongestionData(data);
      } catch (err) {
        console.warn('Daily Forecast API down, using pre-loaded default datasets.', err);
      }
    }
    fetchCongestion();
  }, [emergency]);

  // 3. Fetch Signal list live from backend
  useEffect(() => {
    async function fetchSignals() {
      try {
        const res = await fetch('http://localhost:8000/api/v1/signals');
        if (!res.ok) throw new Error('API down');
        const data = await res.json();
        setSignalsData(data);
      } catch (err) {
        console.warn('Signals API down, using pre-loaded default datasets.', err);
      }
    }
    fetchSignals();
  }, []);

  // 4. Fetch optimized routes live from backend (re-run on slider change or emergency toggle)
  useEffect(() => {
    async function fetchRoutes() {
      try {
        const fetchRoute = async (pref: string) => {
          const res = await fetch('http://localhost:8000/api/v1/routes/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              origin: 'Rani Kamlapati Station',
              destination: 'Raja Bhoj Airport',
              preference: pref,
              forecast_minutes: forecast,
              emergency: emergency
            })
          });
          if (!res.ok) throw new Error('Route optimization fail');
          return res.json();
        };

        const [fastestRes, ecoRes, shortestRes] = await Promise.all([
          fetchRoute('fastest'),
          fetchRoute('eco'),
          fetchRoute('shortest')
        ]);

        const updatedRoutes = routes.map((r) => {
          let resData = fastestRes;
          if (r.id === 'eco') resData = ecoRes;
          if (r.id === 'shortest') resData = shortestRes;

          return {
            ...r,
            via: resData.via || r.via,
            time: `${resData.eta_minutes} min`,
            distance: `${resData.distance_km} km`,
            saving: r.id === 'fastest' 
              ? `Save ${Math.max(0, 27 - resData.eta_minutes)} min` 
              : r.id === 'eco' 
                ? `−${Math.round((1 - resData.carbon_kg / 1.2) * 100)}% CO₂` 
                : resData.congestion_risk > 0.5 ? 'Busy traffic' : 'Clear route',
            emission: `${resData.carbon_kg} kg`,
            path: resData.path
          };
        });
        setRoutesData(updatedRoutes);
      } catch (err) {
        console.warn('Route Optimizer API down, using pre-loaded default datasets.', err);
      }
    }
    fetchRoutes();
  }, [forecast, emergency]);

  // Selected route getter helper
  const selectedRouteData = useMemo(() => {
    return routesData.find(route => route.id === activeRoute) ?? routesData[0] ?? routes[0];
  }, [activeRoute, routesData]);

  // Navigation HUD progress simulation
  useEffect(() => {
    let interval: number;
    if (isNavHUDOpen && !isNavHUDPaused) {
      interval = window.setInterval(() => {
        setNavHUDProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setIsNavHUDOpen(false);
            showToast('Destination Reached', 'You have arrived safely at Raja Bhoj Airport.', 'success');
            return 100;
          }
          const nextProgress = p + 5;
          const path = selectedRouteData.path || ['Rani Kamlapati Station', 'Roshanpura Sq.', 'Raja Bhoj Airport'];
          const nextIndex = Math.min(path.length - 1, Math.floor((nextProgress / 100) * path.length));
          setActiveNavNodeIndex(nextIndex);
          return nextProgress;
        });
      }, 1000);
    }
    return () => window.clearInterval(interval);
  }, [isNavHUDOpen, isNavHUDPaused, selectedRouteData]);

  // Navigation HUD starter
  const startNavigation = () => {
    setIsNavHUDOpen(true);
    setNavHUDProgress(0);
    setIsNavHUDPaused(false);
    setActiveNavNodeIndex(0);
    showToast('Navigation Started', `Optimal route computed via ${selectedRouteData.via}.`, 'success');
  };

  // Signal optimization modal fetcher
  const handleSignalClick = async (signal: any) => {
    setSelectedSignal(signal);
    setIsSignalModalOpen(true);
    setSignalRecommendation(null);
    try {
      const res = await fetch(`http://localhost:8000/api/v1/signals/${encodeURIComponent(signal.name)}/recommendation?queue_length_meters=${signal.queue}&current_cycle_seconds=90`);
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      setSignalRecommendation(data);
    } catch (err) {
      // API fallback simulation
      setTimeout(() => {
        setSignalRecommendation({
          junction_id: signal.name,
          current_cycle_seconds: 90,
          recommended_cycle_seconds: 105,
          green_extension_seconds: 15,
          estimated_queue_reduction_percent: 22.4,
          reason: `AI model computed a fallback green extension of 15s to clear the ${signal.queue}m queue.`
        });
      }, 700);
    }
  };

  // Search autocomplete filter
  const filteredJunctions = useMemo(() => {
    if (!searchQuery) return BHOPAL_JUNCTIONS;
    return BHOPAL_JUNCTIONS.filter(j => j.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  // Fetch Junction Predictor API
  const fetchJunctionPrediction = async (junctionName: string) => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/predictions/congestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          junction_id: junctionName,
          horizon_minutes: forecast,
          current_density: 0.65
        })
      });
      if (!res.ok) throw new Error('Prediction failed');
      const data = await res.json();
      setSelectedJunctionPrediction(data);
    } catch (err) {
      // Mock result fallback if backend prediction is down
      setSelectedJunctionPrediction({
        junction_id: junctionName,
        horizon_minutes: forecast,
        congestion_probability: 0.42 + (forecast / 150),
        predicted_density: 0.55 + (forecast / 200),
        expected_delay_minutes: Math.round(3 + (forecast / 10)),
        confidence: 0.88
      });
    }
  };

  // Emergency toggle callback with notification toast
  const handleEmergencyToggle = () => {
    const nextEmergency = !emergency;
    setEmergency(nextEmergency);
    if (nextEmergency) {
      showToast('EMERGENCY CORRIDOR ACTIVATED', 'AI routing set green corridors on transit pathways. Commuters redirected.', 'error');
    } else {
      showToast('Emergency Override Deactivated', 'Reverting to normal AI signal cycles.', 'success');
    }
  };

  return (
    <main className={emergency ? 'app emergency-mode' : 'app'}>
      {/* Toast notifications container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast-notification ${t.type === 'error' ? 'error' : t.type === 'info' ? 'info' : ''}`}>
            <div className="toast-content">
              <div className="toast-title">{t.title}</div>
              <div className="toast-desc">{t.desc}</div>
            </div>
            <button className="toast-close" onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <header className="topbar glass">
        <button className="icon-btn mobile-only" onClick={() => setSidebar(!sidebar)} aria-label="Toggle navigation"><Menu size={18} /></button>
        <div className="brand" style={{ cursor: 'pointer' }} onClick={() => showToast('Flow Bhopal', 'Version 1.0.0 (AI Traffic Neural Core).', 'info')}><span className="brand-mark"><Navigation size={17} /></span><span>flow<span>.</span></span><small>BHOPAL</small></div>
        <nav>
          {navItems.map(item => (
            <button 
              className={activeNav === item ? 'nav-link active' : 'nav-link'} 
              onClick={() => {
                setActiveNav(item);
                showToast(`Switched Pane`, `Displaying ${item} parameters.`, 'info');
              }} 
              key={item}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <div className="live" style={{ cursor: 'pointer' }} onClick={() => showToast('Live Node Stream', 'Streaming telemetry at 60fps.', 'info')}><i /> Live <span>{time}</span></div>
          <span className="weather" style={{ cursor: 'pointer' }} onClick={() => showToast('Bhopal Weather', '28°C · Sunny. Air Quality Index is excellent (38).', 'info')}><CloudSun size={16}/> 28°</span>
          <button className="icon-btn" onClick={() => showToast('Flow System Integrity', 'All 18 smart signals reporting 100% online.', 'success')} aria-label="Notifications"><Bell size={17}/><b /></button>
          <button className="avatar" onClick={() => showToast('System Engineer Profile', 'Role: Administrator · Junction Authority Bhopal.', 'info')}>AS</button>
        </div>
      </header>

      <aside className={sidebar ? 'sidebar glass open' : 'sidebar glass'}>
        <div>
          <p className="eyebrow">City operations</p>
          <button className={activeNav === 'Live city' ? 'side-link active' : 'side-link'} onClick={() => setActiveNav('Live city')}><Compass size={18}/> Live overview</button>
          <button className={activeNav === 'Routes' ? 'side-link active' : 'side-link'} onClick={() => setActiveNav('Routes')}><Route size={18}/> Route intelligence</button>
          <button className={activeNav === 'Signals' ? 'side-link active' : 'side-link'} onClick={() => setActiveNav('Signals')}><TrafficCone size={18}/> Signal network <em>{signalsData.filter(s => s.tone === 'red').length}</em></button>
          <button className={activeNav === 'Insights' ? 'side-link active' : 'side-link'} onClick={() => setActiveNav('Insights')}><UsersRound size={18}/> Citizen insights</button>
        </div>
        <div className="side-bottom">
          <button className={emergency ? 'emergency active' : 'emergency'} onClick={handleEmergencyToggle}><span><Cross size={18}/></span><div><strong>Emergency mode</strong><small>{emergency ? 'Green corridor active' : 'Response override'}</small></div></button>
          <button className="side-link" onClick={() => showToast('Control Center Active', 'Security clearance level A-1.', 'info')}><Settings2 size={18}/> Control center</button>
          <button className="side-link" onClick={() => showToast('Bhopal Support Helpline', 'Dial 100/108 or contact support@flow-bhopal.gov.in', 'info')}><CircleHelp size={18}/> Support</button>
        </div>
      </aside>

      <section className="content">
        <div className="intro-row">
          <div><p className="eyebrow"><span className="status-dot"/> BHOPAL MOBILITY NETWORK</p><h1>Good morning, <span>Bhopal.</span></h1><p className="subtitle">Your city is moving smoothly. AI is actively optimizing <b>{emergency ? '9' : '18'} junctions</b>.</p></div>
          <button className="command" onClick={() => setIsSearchOpen(true)}><Search size={17}/> Search city intelligence <kbd>⌘ K</kbd></button>
        </div>
        
        <section className="metrics-grid">
          {metricsData.map(metric => { 
            const Icon = iconMap[metric.icon as IconKey]; 
            return (
              <article 
                className="metric glass" 
                key={metric.label}
                style={{ cursor: 'pointer' }}
                onClick={() => showToast(metric.label, `Real-time indicator values update every minute.`, 'info')}
              >
                <div className={`metric-icon ${metric.tone}`}><Icon size={16}/></div>
                <div>
                  <p>{metric.label}</p>
                  <strong>{metric.value}<small>{metric.suffix}</small></strong>
                </div>
                <span className={metric.trend.startsWith('+') && metric.label !== 'Vehicles in motion' ? 'trend positive' : 'trend'}>{metric.trend}</span>
              </article>
            );
          })}
        </section>

        <section className="workspace">
          <article className="map-card panel">
            <div className="map-toolbar glass">
              <button className="map-search" onClick={() => setIsSearchOpen(true)}><Search size={16}/> Search a location or junction</button>
              <button className="square-btn" onClick={() => { showToast('GPS Calibrated', 'Map locked onto Bhopal City Center.', 'info'); setZoom(100); }} title="Lock Location"><LocateFixed size={17}/></button>
              <button className="square-btn" onClick={() => { showToast('Overlay Layer Loaded', 'Dynamic heat index of secondary roadways compiled.', 'success'); }} title="Toggle Overlay"><Layers3 size={17}/></button>
            </div>
            
            <div className="map-mode glass">
              <button className={mapMode === 'Traffic' ? 'active' : ''} onClick={() => { setMapMode('Traffic'); showToast('Traffic mode loaded', 'Showing neural network congestion streams.', 'info'); }}>Traffic</button>
              <button className={mapMode === 'Transit' ? 'active' : ''} onClick={() => { setMapMode('Transit'); showToast('Transit mode loaded', 'Showing bus routes and active shuttles.', 'info'); }}>Transit</button>
              <button className={mapMode === 'Signals' ? 'active' : ''} onClick={() => { setMapMode('Signals'); showToast('Signals mode loaded', 'Displaying live signal nodes.', 'info'); }}>Signals</button>
            </div>
            
            <div className="forecast glass">
              <div><Sparkles size={15}/><span>AI traffic forecast</span><b>+{forecast} min</b></div>
              <input type="range" min="0" max="60" step="15" value={forecast} onChange={e => {
                const f = Number(e.target.value);
                setForecast(f);
                showToast('Predictive Forecast Shift', `Simulating city congestion for +${f} minutes.`, 'info');
              }}/>
              <div className="range-labels"><span>Now</span><span>+15m</span><span>+30m</span><span>+45m</span><span>+60m</span></div>
            </div>
            
            <div className="city-map">
              <svg viewBox="0 0 920 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Live traffic map of Bhopal" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center', transition: 'transform 0.3s ease' }}>
                <defs>
                  <filter id="glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  <radialGradient id="water"><stop stopColor="#173a51"/><stop offset="1" stopColor="#0d2639"/></radialGradient>
                </defs>
                
                <path className="lake" d="M-20 43 C120 1 248 65 277 137 C305 207 245 241 145 218 C79 203 38 262 -22 246Z"/>
                <path className="lake" d="M670 534 C720 472 818 457 951 490 L951 660 L649 656 C628 604 642 568 670 534Z"/>
                
                {[...Array(11)].map((_, i) => <path key={`h${i}`} className="minor-road" d={`M${-20 + i*19} ${90+i*44} C240 ${160+i*25}, 600 ${70+i*46}, 960 ${125+i*36}`}/>) }
                {[...Array(10)].map((_, i) => <path key={`v${i}`} className="minor-road" d={`M${80+i*91} -30 C${170+i*62} 170, ${40+i*107} 370, ${100+i*96} 650`}/>) }
                
                {mapMode !== 'Transit' && (
                  <>
                    <path className="arterial moderate-road" d="M8 493 C185 475 286 440 362 390 C462 325 572 310 923 182"/>
                    <path className="arterial free-road" d="M35 337 C198 362 337 368 460 315 C593 255 719 209 921 220"/>
                    <path className="arterial heavy-road" d="M250 617 C300 501 339 401 433 315 C520 235 639 177 710 -24"/>
                    <path className="arterial moderate-road" d="M923 440 C724 412 618 373 530 327 C450 285 300 222 43 228"/>
                  </>
                )}

                {mapMode === 'Transit' && (
                  <>
                    <path className="arterial free-road" style={{ stroke: 'var(--blue)' }} d="M35 337 C198 362 337 368 460 315 C593 255 719 209 921 220"/>
                    <path className="arterial free-road" style={{ stroke: 'var(--purple)', strokeDasharray: '5,5' }} d="M8 493 C185 475 286 440 362 390 C462 325 572 310 923 182"/>
                  </>
                )}
                
                {routesData.map(route => (
                  <polyline 
                    key={route.id} 
                    points={route.points} 
                    className={activeRoute === route.id ? 'route-path visible' : 'route-path'} 
                    style={{stroke: emergency ? '#ff5d6e' : route.color}} 
                    filter={activeRoute === route.id ? 'url(#glow)' : undefined}
                  />
                ))}
                
                <circle cx="245" cy="490" r="8" className="route-node start" style={{ cursor: 'pointer' }} onClick={() => showToast('Start Node', 'Rani Kamlapati Station (Origin)', 'info')} />
                <circle cx="713" cy="190" r="8" className="route-node end" style={{ cursor: 'pointer' }} onClick={() => showToast('End Node', 'Raja Bhoj Airport (Destination)', 'info')} />
                
                {/* Vehicles on map */}
                {[[310,460],[370,410],[438,348],[518,303],[598,255],[675,213],[480,410],[550,363],[400,288],[660,335],[290,350],[740,275]].map(([x,y], i) => (
                  <g className="vehicle" key={i} style={{transform:`translate(${(livePulse+i*7)%9}px, ${(livePulse+i*3)%6}px)`}}>
                    <circle cx={x} cy={y} r="6"/>
                    <circle cx={x} cy={y} r="2"/>
                  </g>
                ))}
                
                <g className="map-label" style={{ cursor: 'pointer' }} onClick={() => fetchJunctionPrediction('New Market')}>
                  <rect x="386" y="274" width="118" height="25" rx="12"/>
                  <text x="445" y="291">New Market</text>
                </g>
                
                <text x="73" y="156" className="lake-label">UPPER LAKE</text>
                <text x="718" y="558" className="lake-label">LOWER LAKE</text>
                
                {/* Clickable hotspots */}
                <g className="hotspot" style={{ cursor: 'pointer' }} onClick={() => { showToast('Hotspot Probe', 'Probing Board Office Sq. predictive delays.', 'info'); fetchJunctionPrediction('Board Office Sq.'); setIsSearchOpen(true); }}>
                  <circle cx="433" cy="315" r={18 + forecast/5}/>
                  <circle cx="433" cy="315" r="5"/>
                </g>
                <g className="hotspot amber" style={{ cursor: 'pointer' }} onClick={() => { showToast('Hotspot Probe', 'Probing Roshanpura Sq. predictive delays.', 'info'); fetchJunctionPrediction('Roshanpura Sq.'); setIsSearchOpen(true); }}>
                  <circle cx="600" cy="257" r={12 + forecast/8}/>
                  <circle cx="600" cy="257" r="4"/>
                </g>
              </svg>
            </div>
            
            <div className="map-legend glass">
              <span><i className="free"/> Free flow</span>
              <span><i className="moderate"/> Moderate</span>
              <span><i className="heavy"/> Congested</span>
            </div>
            
            <div className="map-zoom glass">
              <button onClick={() => { setZoom(z => Math.min(160, z + 15)); showToast('Scale Increased', `Map scaling set to ${Math.min(160, zoom + 15)}%`, 'info'); }}>+</button>
              <button onClick={() => { setZoom(z => Math.max(70, z - 15)); showToast('Scale Decreased', `Map scaling set to ${Math.max(70, zoom - 15)}%`, 'info'); }}>−</button>
            </div>
          </article>

          <aside className={`planner panel ${activeNav === 'Routes' ? 'panel-focus' : ''}`}>
            <div className="panel-head">
              <div>
                <p className="eyebrow"><Zap size={13}/> AI ROUTE PLANNER</p>
                <h2>Plan your journey</h2>
              </div>
              <button className="square-btn" onClick={() => showToast('Route Explorer Settings', 'Fastest, Eco, Shortest algorithms configured in NumPy neural backend.', 'info')}><ChevronDown size={17}/></button>
            </div>
            <div className="locations">
              <span className="route-line"><i/><i/></span>
              <label><small>FROM</small><b>Rani Kamlapati Station</b></label>
              <label><small>TO</small><b>Raja Bhoj Airport</b></label>
              <button onClick={() => showToast('Path Reversing', 'Reversing origin and destination coordinates...', 'info')}><Navigation size={15}/></button>
            </div>
            
            <div className="route-tabs">
              <button className="active"><Car size={15}/>Drive</button>
              <button onClick={() => showToast('Mode Restricted', 'Bhopal smart bike routing requires local app companion.', 'info')}><Bike size={15}/>Bike</button>
              <button onClick={() => showToast('Transit Matrix Loaded', 'Showing current AI public bus schedules.', 'info')}><UsersRound size={15}/>Transit</button>
            </div>
            
            <div className="route-title"><span>Suggested routes</span><small>Updated just now</small></div>
            
            <div className="route-options">
              {routesData.map(route => (
                <button 
                  onClick={() => {
                    setActiveRoute(route.id);
                    showToast('Route Selection Updated', `Focusing path via ${route.via}.`, 'info');
                  }} 
                  className={activeRoute === route.id ? 'route-option active' : 'route-option'} 
                  key={route.id}
                >
                  <i style={{background: route.color}}/>
                  <div>
                    <p>{route.label} {route.id === 'fastest' && <Sparkles size={12}/>}</p>
                    <small>{route.via}</small>
                    <span><b>{route.time}</b> · {route.distance}</span>
                  </div>
                  <div className="route-meta">
                    <strong>{route.saving}</strong>
                    <small><Leaf size={11}/>{route.emission}</small>
                  </div>
                </button>
              ))}
            </div>
            
            <button className="start-route" onClick={startNavigation}><Navigation size={16}/> Start navigation <span>→</span></button>
            <div className="ai-note"><ShieldCheck size={15}/><p><b>AI confidence 94%</b><br/><span>Based on live traffic and 14 historical patterns.</span></p></div>
          </aside>
        </section>

        <section className="insights-grid">
          <article className={`chart-card panel ${activeNav === 'Insights' ? 'panel-focus' : ''}`}>
            <div className="section-title">
              <div>
                <p className="eyebrow"><Sparkles size={13}/> PREDICTIVE INTELLIGENCE</p>
                <h3>City congestion forecast</h3>
              </div>
              <button className="chip" onClick={() => showToast('Historical Comparison', 'Comparing actual performance versus pre-trained neural network prediction.', 'info')}>Today <ChevronDown size={13}/></button>
            </div>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={congestionData}>
                  <defs>
                    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b7bff" stopOpacity={.42}/>
                      <stop offset="100%" stopColor="#8b7bff" stopOpacity={.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#23324a" vertical={false}/>
                  <XAxis dataKey="name" tick={{fill:'#8090a7',fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:'#8090a7',fontSize:11}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{background:'#101b2b',border:'1px solid #253750',borderRadius:12}}/>
                  <Area type="monotone" dataKey="predicted" stroke="#a18cff" strokeWidth={2.5} fill="url(#area)"/>
                  <Area type="monotone" dataKey="actual" stroke="#57dbab" strokeWidth={2} fill="transparent"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>
          
          <article className={`signals-card panel ${activeNav === 'Signals' ? 'panel-focus' : ''}`}>
            <div className="section-title">
              <div>
                <p className="eyebrow"><Radio size={13}/> SMART SIGNALS</p>
                <h3>Junction intelligence</h3>
              </div>
              <span className="optimized">{signalsData.filter(s => s.status !== 'Optimize').length} active</span>
            </div>
            <div className="signal-list">
              {signalsData.map(signal => (
                <div className="signal" key={signal.name}>
                  <span className={`signal-light ${signal.tone}`}/>
                  <div>
                    <b>{signal.name}</b>
                    <small>Queue length <strong>{signal.queue}m</strong></small>
                  </div>
                  <em>{signal.gain}</em>
                  <button 
                    onClick={() => handleSignalClick(signal)} 
                    style={{ 
                      cursor: 'pointer',
                      border: signal.status === 'Optimize' ? '1px solid var(--red)' : '1px solid #ffffff10',
                      color: signal.status === 'Optimize' ? 'var(--red)' : '#94a6b7'
                    }}
                  >
                    {signal.status}
                  </button>
                </div>
              ))}
            </div>
          </article>
          
          <article className={`impact-card panel ${activeNav === 'Insights' ? 'panel-focus' : ''}`}>
            <p className="eyebrow"><Leaf size={13}/> CITIZEN IMPACT</p>
            <h3>Moving better,<br/><span>breathing easier.</span></h3>
            <p>AI routing has helped Bhopal save <b>{emergency ? '850 commuter hours' : '1,248 commuter hours'}</b> this week.</p>
            <div className="impact-stats">
              <div>
                <strong>{emergency ? '10.5k' : '14.2k'}</strong>
                <small>litres fuel saved</small>
              </div>
              <div>
                <strong>{emergency ? '−8%' : '−18%'}</strong>
                <small>peak-hour delay</small>
              </div>
            </div>
          </article>
        </section>
      </section>

      {/* 5. Live Navigation HUD overlay */}
      {isNavHUDOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => { setIsNavHUDOpen(false); showToast('Navigation Paused', 'Interactive HUD hidden.', 'info'); }}>
              <X size={18} />
            </button>
            <h3 className="modal-title" style={{ color: 'var(--green)' }}>
              <Navigation size={18} className="pulse-nav" />
              <span>Live Navigation HUD</span>
            </h3>
            
            <div className="nav-hud">
              <div className="hud-telemetry">
                <div className="telemetry-item highlight">
                  <small>Speed</small>
                  <strong>{isNavHUDPaused ? 0 : Math.round(48 + Math.random() * 6)} <small>km/h</small></strong>
                </div>
                <div className="telemetry-item">
                  <small>ETA</small>
                  <strong>{Math.max(1, Math.round(Number(selectedRouteData.time.split(' ')[0]) * (1 - navHUDProgress/100)))} <small>min</small></strong>
                </div>
                <div className="telemetry-item">
                  <small>Remaining</small>
                  <strong>{Math.max(0.1, Number((Number(selectedRouteData.distance.split(' ')[0]) * (1 - navHUDProgress/100)).toFixed(1)))} <small>km</small></strong>
                </div>
              </div>

              <div className="hud-progress-container">
                <div className="hud-progress-labels">
                  <span>Rani Kamlapati Station</span>
                  <span>Raja Bhoj Airport</span>
                </div>
                <div className="hud-progress-bar">
                  <div className="hud-progress-fill" style={{ width: `${navHUDProgress}%` }} />
                </div>
              </div>

              <div className="hud-stepper">
                {(selectedRouteData.path || ['Rani Kamlapati Station', 'Roshanpura Sq.', 'Raja Bhoj Airport']).map((node: string, index: number) => {
                  const pathLen = (selectedRouteData.path || []).length || 3;
                  let status = 'stepper-node';
                  if (index < activeNavNodeIndex) status = 'stepper-node passed';
                  else if (index === activeNavNodeIndex) status = 'stepper-node active';
                  return (
                    <div key={node} className={status}>
                      <span className="stepper-dot" />
                      <span>{node}</span>
                    </div>
                  );
                })}
              </div>

              <div className="hud-actions">
                <button className="hud-btn pause" onClick={() => setIsNavHUDPaused(!isNavHUDPaused)}>
                  {isNavHUDPaused ? 'Resume Journey' : 'Pause Journey'}
                </button>
                <button className="hud-btn cancel" onClick={() => { setIsNavHUDOpen(false); showToast('Navigation Aborted', 'Telemetry session terminated.', 'error'); }}>
                  End Navigation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Junction Search & Prediction Modal */}
      {isSearchOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => { setIsSearchOpen(false); setSelectedJunctionPrediction(null); }}>
              <X size={18} />
            </button>
            <h3 className="modal-title">
              <Search size={18} />
              <span>Bhopal Predictive Traffic Probe</span>
            </h3>
            
            <div className="search-input-g">
              <Search size={16} className="text-muted" style={{ marginRight: 8 }} />
              <input 
                type="text" 
                placeholder="Type a junction (e.g. Board Office, Roshanpura, Lalghati)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="search-results-list">
              {filteredJunctions.map(junction => (
                <div key={junction} className="search-item" onClick={() => fetchJunctionPrediction(junction)}>
                  <div>
                    <strong>{junction}</strong>
                    <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>Tap to analyze real-time AI metrics</div>
                  </div>
                  <Sparkles size={14} style={{ color: 'var(--purple)' }} />
                </div>
              ))}
              {filteredJunctions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--muted)' }}>No matching junctions found in Bhopal.</div>
              )}
            </div>

            {selectedJunctionPrediction && (
              <div style={{ marginTop: 20, borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 16 }}>
                <h4 style={{ fontWeight: 600, fontSize: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--purple)' }}>
                  <Activity size={14} />
                  <span>Real-time Neural Prediction Result ({selectedJunctionPrediction.junction_id})</span>
                </h4>
                
                <div className="report-grid">
                  <div className="report-card">
                    <small>Congestion Risk</small>
                    <strong>{Math.round(selectedJunctionPrediction.congestion_probability * 100)}%</strong>
                    <div className="report-bar">
                      <div 
                        className="report-fill" 
                        style={{ 
                          width: `${selectedJunctionPrediction.congestion_probability * 100}%`,
                          background: selectedJunctionPrediction.congestion_probability > 0.6 ? 'var(--red)' : selectedJunctionPrediction.congestion_probability > 0.3 ? 'var(--amber)' : 'var(--green)'
                        }} 
                      />
                    </div>
                  </div>
                  <div className="report-card">
                    <small>Est. Traffic Density</small>
                    <strong>{Math.round(selectedJunctionPrediction.predicted_density * 100)}%</strong>
                    <div className="report-bar">
                      <div 
                        className="report-fill" 
                        style={{ 
                          width: `${selectedJunctionPrediction.predicted_density * 100}%`,
                          background: selectedJunctionPrediction.predicted_density > 0.6 ? 'var(--red)' : selectedJunctionPrediction.predicted_density > 0.3 ? 'var(--amber)' : 'var(--green)'
                        }} 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="ai-note" style={{ marginTop: 12 }}>
                  <ShieldCheck size={15} />
                  <p style={{ margin: 0, fontSize: 9 }}>
                    <b>Expected delay: {selectedJunctionPrediction.expected_delay_minutes} minutes</b>
                    <br />
                    <span>Based on {forecast}m horizon prediction. Confirmed with 88% confidence.</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Smart Signal Optimization Modal */}
      {isSignalModalOpen && selectedSignal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => { setIsSignalModalOpen(false); setSignalRecommendation(null); }}>
              <X size={18} />
            </button>
            <h3 className="modal-title" style={{ color: selectedSignal.tone === 'red' ? 'var(--red)' : selectedSignal.tone === 'amber' ? 'var(--amber)' : 'var(--green)' }}>
              <Radio size={18} className="pulse-nav" />
              <span>Junction Signal Intelligence — {selectedSignal.name}</span>
            </h3>
            
            <div className="report-grid">
              <div className="report-card">
                <small>Current Queue</small>
                <strong style={{ color: 'var(--text)' }}>{selectedSignal.queue}m</strong>
                <div className="report-bar">
                  <div className="report-fill" style={{ width: `${Math.min(100, selectedSignal.queue)}%`, background: selectedSignal.tone === 'red' ? 'var(--red)' : selectedSignal.tone === 'amber' ? 'var(--amber)' : 'var(--green)' }} />
                </div>
              </div>
              <div className="report-card">
                <small>Current Status</small>
                <strong style={{ color: selectedSignal.tone === 'red' ? 'var(--red)' : selectedSignal.tone === 'amber' ? 'var(--amber)' : 'var(--green)' }}>{selectedSignal.status}</strong>
              </div>
            </div>

            {signalRecommendation ? (
              <div style={{ marginTop: 20 }}>
                <h4 style={{ fontWeight: 600, fontSize: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green)' }}>
                  <Sparkles size={14} />
                  <span>AI Adaptive Recalibration Results</span>
                </h4>
                
                <div className="report-grid">
                  <div className="report-card">
                    <small>Recommended Cycle</small>
                    <strong>{signalRecommendation.recommended_cycle_seconds}s</strong>
                    <div className="text-xs text-muted" style={{ marginTop: 4, fontSize: 8 }}>
                      Base Cycle: {signalRecommendation.current_cycle_seconds}s
                    </div>
                  </div>
                  <div className="report-card">
                    <small>Queue Reduction</small>
                    <strong style={{ color: 'var(--green)' }}>−{signalRecommendation.estimated_queue_reduction_percent}%</strong>
                    <div className="report-bar">
                      <div className="report-fill" style={{ width: `${signalRecommendation.estimated_queue_reduction_percent}%`, background: 'var(--green)' }} />
                    </div>
                  </div>
                </div>
                
                <div className="ai-note" style={{ marginTop: 12 }}>
                  <Zap size={15} />
                  <p style={{ margin: 0, fontSize: 9 }}>
                    <b>Green Signal Extension: +{signalRecommendation.green_extension_seconds} seconds</b>
                    <br />
                    <span>{signalRecommendation.reason}</span>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button className="start-route" style={{ margin: 0, flex: 1 }} onClick={() => {
                    showToast('Dynamic Cycle Applied', `Green light extended by ${signalRecommendation.green_extension_seconds}s at ${selectedSignal.name}.`, 'success');
                    setIsSignalModalOpen(false);
                    // Update signalsData state locally
                    setSignalsData(prev => prev.map(s => s.name === selectedSignal.name ? { 
                      ...s, 
                      status: 'Adaptive', 
                      queue: Math.max(5, Math.round(s.queue * (1 - signalRecommendation.estimated_queue_reduction_percent/100))), 
                      gain: `−${Math.round(signalRecommendation.estimated_queue_reduction_percent)}%`, 
                      tone: 'green' 
                    } : s));
                  }}>
                    Deploy Dynamic Signal Cycle
                  </button>
                  <button className="hud-btn pause" style={{ flex: 0.4 }} onClick={() => setIsSignalModalOpen(false)}>
                    Dismiss
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120, gap: 10 }}>
                <div className="pulse-nav" style={{ width: 30, height: 30, border: '3px solid var(--blue)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                <span className="text-muted">Computing neural green extensions...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
