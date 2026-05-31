'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Bell, Bike, Car, ChevronDown, CircleHelp, Clock3, CloudSun, Compass, Cross, Gauge, HeartPulse, Layers3, Leaf, LocateFixed, MapPin, Menu, Navigation, Radio, Route, Search, Settings2, ShieldCheck, Sparkles, Timer, TrafficCone, TrendingDown, UsersRound, X, Zap } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { congestion, metrics, navItems, routes, signals } from '../lib/data';

type IconKey = 'activity' | 'car' | 'gauge' | 'clock' | 'leaf';
const iconMap: Record<IconKey, typeof Activity> = { activity: Activity, car: Car, gauge: Gauge, clock: Clock3, leaf: Leaf };

export default function Home() {
  const [activeNav, setActiveNav] = useState('Live city');
  const [forecast, setForecast] = useState(15);
  const [activeRoute, setActiveRoute] = useState('fastest');
  const [emergency, setEmergency] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const [livePulse, setLivePulse] = useState(0);
  const selectedRoute = useMemo(() => routes.find(route => route.id === activeRoute) ?? routes[0], [activeRoute]);

  useEffect(() => {
    const ticker = window.setInterval(() => setLivePulse(value => (value + 1) % 100), 2400);
    return () => window.clearInterval(ticker);
  }, []);

  return (
    <main className={emergency ? 'app emergency-mode' : 'app'}>
      <header className="topbar glass">
        <button className="icon-btn mobile-only" onClick={() => setSidebar(!sidebar)} aria-label="Toggle navigation"><Menu size={18} /></button>
        <div className="brand"><span className="brand-mark"><Navigation size={17} /></span><span>flow<span>.</span></span><small>BHOPAL</small></div>
        <nav>{navItems.map(item => <button className={activeNav === item ? 'nav-link active' : 'nav-link'} onClick={() => setActiveNav(item)} key={item}>{item}</button>)}</nav>
        <div className="top-actions">
          <div className="live"><i /> Live <span>08:42:16</span></div>
          <span className="weather"><CloudSun size={16}/> 28°</span>
          <button className="icon-btn" aria-label="Notifications"><Bell size={17}/><b /></button>
          <button className="avatar">AS</button>
        </div>
      </header>

      <aside className={sidebar ? 'sidebar glass open' : 'sidebar glass'}>
        <div>
          <p className="eyebrow">City operations</p>
          <button className="side-link active"><Compass size={18}/> Live overview</button>
          <button className="side-link"><Route size={18}/> Route intelligence</button>
          <button className="side-link"><TrafficCone size={18}/> Signal network <em>3</em></button>
          <button className="side-link"><UsersRound size={18}/> Citizen insights</button>
        </div>
        <div className="side-bottom">
          <button className={emergency ? 'emergency active' : 'emergency'} onClick={() => setEmergency(!emergency)}><span><Cross size={18}/></span><div><strong>Emergency mode</strong><small>{emergency ? 'Green corridor active' : 'Response intelligence'}</small></div></button>
          <button className="side-link"><Settings2 size={18}/> Control center</button>
          <button className="side-link"><CircleHelp size={18}/> Support</button>
        </div>
      </aside>

      <section className="content">
        <div className="intro-row">
          <div><p className="eyebrow"><span className="status-dot"/> BHOPAL MOBILITY NETWORK</p><h1>Good morning, <span>Bhopal.</span></h1><p className="subtitle">Your city is moving smoothly. AI is actively optimizing <b>18 junctions</b>.</p></div>
          <button className="command"><Search size={17}/> Search city intelligence <kbd>⌘ K</kbd></button>
        </div>
        <section className="metrics-grid">
          {metrics.map(metric => { const Icon = iconMap[metric.icon as IconKey]; return <article className="metric glass" key={metric.label}><div className={`metric-icon ${metric.tone}`}><Icon size={16}/></div><div><p>{metric.label}</p><strong>{metric.value}<small>{metric.suffix}</small></strong></div><span className={metric.trend.startsWith('+') && metric.label !== 'Vehicles in motion' ? 'trend positive' : 'trend'}>{metric.trend}</span></article>})}
        </section>

        <section className="workspace">
          <article className="map-card panel">
            <div className="map-toolbar glass">
              <button className="map-search"><Search size={16}/> Search a location or junction</button><button className="square-btn"><LocateFixed size={17}/></button><button className="square-btn"><Layers3 size={17}/></button>
            </div>
            <div className="map-mode glass"><button className="active">Traffic</button><button>Transit</button><button>Signals</button></div>
            <div className="forecast glass">
              <div><Sparkles size={15}/><span>AI traffic forecast</span><b>+{forecast} min</b></div>
              <input type="range" min="0" max="60" step="15" value={forecast} onChange={e => setForecast(Number(e.target.value))}/>
              <div className="range-labels"><span>Now</span><span>+15m</span><span>+30m</span><span>+45m</span><span>+60m</span></div>
            </div>
            <CityMap activeRoute={selectedRoute} forecast={forecast} emergency={emergency} pulse={livePulse} />
            <div className="map-legend glass"><span><i className="free"/> Free flow</span><span><i className="moderate"/> Moderate</span><span><i className="heavy"/> Congested</span></div>
            <div className="map-zoom glass"><button>+</button><button>−</button></div>
          </article>

          <aside className="planner panel">
            <div className="panel-head"><div><p className="eyebrow"><Zap size={13}/> AI ROUTE PLANNER</p><h2>Plan your journey</h2></div><button className="square-btn"><ChevronDown size={17}/></button></div>
            <div className="locations">
              <span className="route-line"><i/><i/></span>
              <label><small>FROM</small><b>Rani Kamlapati Station</b></label>
              <label><small>TO</small><b>Raja Bhoj Airport</b></label>
              <button><Navigation size={15}/></button>
            </div>
            <div className="route-tabs"><button className="active"><Car size={15}/>Drive</button><button><Bike size={15}/>Bike</button><button><UsersRound size={15}/>Transit</button></div>
            <div className="route-title"><span>Suggested routes</span><small>Updated just now</small></div>
            <div className="route-options">
              {routes.map(route => <button onClick={() => setActiveRoute(route.id)} className={activeRoute === route.id ? 'route-option active' : 'route-option'} key={route.id}>
                <i style={{background: route.color}}/><div><p>{route.label} {route.id === 'fastest' && <Sparkles size={12}/>}</p><small>{route.via}</small><span><b>{route.time}</b> · {route.distance}</span></div><div className="route-meta"><strong>{route.saving}</strong><small><Leaf size={11}/>{route.emission}</small></div>
              </button>)}
            </div>
            <button className="start-route"><Navigation size={16}/> Start navigation <span>→</span></button>
            <div className="ai-note"><ShieldCheck size={15}/><p><b>AI confidence 94%</b><br/><span>Based on live traffic and 14 historical patterns.</span></p></div>
          </aside>
        </section>

        <section className="insights-grid">
          <article className="chart-card panel">
            <div className="section-title"><div><p className="eyebrow"><Sparkles size={13}/> PREDICTIVE INTELLIGENCE</p><h3>City congestion forecast</h3></div><button className="chip">Today <ChevronDown size={13}/></button></div>
            <div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={congestion}><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b7bff" stopOpacity={.42}/><stop offset="100%" stopColor="#8b7bff" stopOpacity={.02}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#23324a" vertical={false}/><XAxis dataKey="name" tick={{fill:'#8090a7',fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:'#8090a7',fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:'#101b2b',border:'1px solid #253750',borderRadius:12}}/><Area type="monotone" dataKey="predicted" stroke="#a18cff" strokeWidth={2.5} fill="url(#area)"/><Area type="monotone" dataKey="actual" stroke="#57dbab" strokeWidth={2} fill="transparent"/></AreaChart></ResponsiveContainer></div>
          </article>
          <article className="signals-card panel">
            <div className="section-title"><div><p className="eyebrow"><Radio size={13}/> SMART SIGNALS</p><h3>Junction intelligence</h3></div><span className="optimized">18 optimized</span></div>
            <div className="signal-list">{signals.map(signal => <div className="signal" key={signal.name}><span className={`signal-light ${signal.tone}`}/><div><b>{signal.name}</b><small>Queue length <strong>{signal.queue}m</strong></small></div><em>{signal.gain}</em><button>{signal.status}</button></div>)}</div>
          </article>
          <article className="impact-card panel">
            <p className="eyebrow"><Leaf size={13}/> CITIZEN IMPACT</p><h3>Moving better,<br/><span>breathing easier.</span></h3><p>AI routing has helped Bhopal save <b>1,248 commuter hours</b> this week.</p>
            <div className="impact-stats"><div><strong>14.2k</strong><small>litres fuel saved</small></div><div><strong>−18%</strong><small>peak-hour delay</small></div></div>
          </article>
        </section>
      </section>
    </main>
  );
}

function CityMap({ activeRoute, forecast, emergency, pulse }: { activeRoute: typeof routes[number], forecast: number, emergency: boolean, pulse: number }) {
  const vehicles = [[310,460],[370,410],[438,348],[518,303],[598,255],[675,213],[480,410],[550,363],[400,288],[660,335],[290,350],[740,275]];
  return <div className="city-map">
    <svg viewBox="0 0 920 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Live traffic map of Bhopal">
      <defs><filter id="glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter><radialGradient id="water"><stop stopColor="#173a51"/><stop offset="1" stopColor="#0d2639"/></radialGradient></defs>
      <path className="lake" d="M-20 43 C120 1 248 65 277 137 C305 207 245 241 145 218 C79 203 38 262 -22 246Z"/>
      <path className="lake" d="M670 534 C720 472 818 457 951 490 L951 660 L649 656 C628 604 642 568 670 534Z"/>
      {[...Array(11)].map((_, i) => <path key={`h${i}`} className="minor-road" d={`M${-20 + i*19} ${90+i*44} C240 ${160+i*25}, 600 ${70+i*46}, 960 ${125+i*36}`}/>) }
      {[...Array(10)].map((_, i) => <path key={`v${i}`} className="minor-road" d={`M${80+i*91} -30 C${170+i*62} 170, ${40+i*107} 370, ${100+i*96} 650`}/>) }
      <path className="arterial moderate-road" d="M8 493 C185 475 286 440 362 390 C462 325 572 310 923 182"/>
      <path className="arterial free-road" d="M35 337 C198 362 337 368 460 315 C593 255 719 209 921 220"/>
      <path className="arterial heavy-road" d="M250 617 C300 501 339 401 433 315 C520 235 639 177 710 -24"/>
      <path className="arterial moderate-road" d="M923 440 C724 412 618 373 530 327 C450 285 300 222 43 228"/>
      {routes.map(route => <polyline key={route.id} points={route.points} className={activeRoute.id === route.id ? 'route-path visible' : 'route-path'} style={{stroke: emergency ? '#ff5d6e' : route.color}} filter={activeRoute.id === route.id ? 'url(#glow)' : undefined}/>)}
      <circle cx="245" cy="490" r="8" className="route-node start"/><circle cx="713" cy="190" r="8" className="route-node end"/>
      {vehicles.map(([x,y], i) => <g className="vehicle" key={i} style={{transform:`translate(${(pulse+i*7)%9}px, ${(pulse+i*3)%6}px)`}}><circle cx={x} cy={y} r="6"/><circle cx={x} cy={y} r="2"/></g>)}
      <g className="map-label"><rect x="386" y="274" width="118" height="25" rx="12"/><text x="445" y="291">New Market</text></g><text x="73" y="156" className="lake-label">UPPER LAKE</text><text x="718" y="558" className="lake-label">LOWER LAKE</text>
      <g className="hotspot"><circle cx="433" cy="315" r={18 + forecast/5}/><circle cx="433" cy="315" r="5"/></g><g className="hotspot amber"><circle cx="600" cy="257" r={12 + forecast/8}/><circle cx="600" cy="257" r="4"/></g>
    </svg>
  </div>
}
