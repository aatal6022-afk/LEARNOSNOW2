import React, { useState, useEffect, useRef } from 'react';

interface BitrixStyleLandingProps {
  onStartFree: () => void;
  onLogin: () => void;
  onEnterDemoDesktop?: () => void;
}

export const BitrixStyleLanding: React.FC<BitrixStyleLandingProps> = ({
  onStartFree,
  onLogin,
  onEnterDemoDesktop
}) => {
  const [activeTab, setActiveTab] = useState<string>('graph');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isBarLifted, setIsBarLifted] = useState(false);

  // Interactive DAG Graph state in Hero
  const [dagState, setDagState] = useState<Record<string, string>>({
    n0: 'done',
    n1: 'done',
    n2: 'review',
    n3: 'open',
    n4: 'lock',
    n5: 'lock'
  });
  const [currentXp, setCurrentXp] = useState(1240);
  const [targetXp, setTargetXp] = useState(1240);
  const [tipMessage, setTipMessage] = useState('Нажмите на светящийся узел, чтобы пройти его.');
  const [isGraphFinished, setIsGraphFinished] = useState(false);

  // Pomodoro countdown timer in productivity tab
  const [pomodoroSeconds, setPomodoroSeconds] = useState(18 * 60 + 42);

  // Scroll listener for progress bar and app bar shadow
  useEffect(() => {
    const handleScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
      setScrollProgress(progress);
      setIsBarLifted(window.scrollY > 8);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Pomodoro timer tick when productivity tab is active
  useEffect(() => {
    if (activeTab !== 'focus') return;
    const interval = setInterval(() => {
      setPomodoroSeconds((prev) => (prev > 0 ? prev - 1 : 25 * 60));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Animated counter for XP
  useEffect(() => {
    if (currentXp === targetXp) return;
    const start = currentXp;
    const diff = targetXp - start;
    const startTime = performance.now();
    const duration = 700;

    let frameId: number;
    const step = (time: number) => {
      const elapsed = time - startTime;
      const p = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      setCurrentXp(Math.round(start + diff * ease));
      if (p < 1) {
        frameId = requestAnimationFrame(step);
      }
    };
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [targetXp]);

  // Confetti burst effect
  const triggerBurst = (event: React.MouseEvent<SVGGElement>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ['#c8266a', '#f48fb4', '#ffcfe0', '#ff8db8'];

    for (let i = 0; i < 28; i++) {
      const el = document.createElement('i');
      el.className = 'pink-cf';
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 90;
      el.style.left = `${cx}px`;
      el.style.top = `${cy}px`;
      el.style.backgroundColor = colors[i % colors.length];
      el.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      el.style.setProperty('--dy', `${Math.sin(angle) * dist + 40}px`);
      el.style.setProperty('--rot', `${Math.random() * 540 - 270}deg`);
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1000);
    }
  };

  const handleNodeClick = (nodeId: string, event: React.MouseEvent<SVGGElement>) => {
    const s = dagState[nodeId];
    if (s !== 'open' && s !== 'review') return;

    triggerBurst(event);

    const XP_GAINS: Record<string, number> = { n2: 40, n3: 120, n4: 80, n5: 200 };
    const NODE_NAMES: Record<string, string> = {
      n2: 'Практика повторена',
      n3: 'Спарринг пройден',
      n4: 'Квиз сдан',
      n5: 'Capstone защищён'
    };

    const nextState = { ...dagState, [nodeId]: 'done' };

    // Progressive unlocking logic
    if (nextState.n2 === 'done' && nextState.n4 === 'lock') nextState.n4 = 'open';
    if (nextState.n3 === 'done' && nextState.n4 === 'done' && nextState.n5 === 'lock') nextState.n5 = 'open';

    setDagState(nextState);
    const addedXp = XP_GAINS[nodeId] || 50;
    setTargetXp((prev) => prev + addedXp);

    if (nodeId === 'n5' || nextState.n5 === 'done') {
      setTipMessage('Граф пройден! Теперь работу можно добавить в портфолио.');
      setIsGraphFinished(true);
    } else {
      setTipMessage(`+${addedXp} XP. ${NODE_NAMES[nodeId] || 'Узел пройден'}. Следующие узлы открыты.`);
    }
  };

  const handleResetDag = () => {
    setDagState({
      n0: 'done',
      n1: 'done',
      n2: 'review',
      n3: 'open',
      n4: 'lock',
      n5: 'lock'
    });
    setTargetXp(1240);
    setCurrentXp(1240);
    setTipMessage('Нажмите на светящийся узел, чтобы пройти его.');
    setIsGraphFinished(false);
  };

  const formatPomoTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const reviewCount = Object.values(dagState).filter((s) => s === 'review').length;

  return (
    <div className="pink-landing-root">
      <style>{`
        .pink-landing-root {
          --bg: #fffbfc;
          --surface: #fff1f6;
          --container: #ffdfeb;
          --container-hi: #ffcfe0;
          --fg: #241519;
          --muted: #6f5a63;
          --line: #ecd5de;
          --primary: #c8266a;
          --primary-hover: #a81b56;
          --on-primary: #ffffff;
          --primary-soft: #f48fb4;
          --on-container: #4a0b27;
          --footer: #fbeef3;
          --font-display: "Outfit", "Roboto", system-ui, sans-serif;
          --font-body: "Roboto", system-ui, -apple-system, "Segoe UI", sans-serif;
          --font-mono: "Roboto Mono", ui-monospace, Menlo, monospace;
          background: var(--bg);
          color: var(--fg);
          font-family: var(--font-body);
          font-size: 16px;
          line-height: 1.6;
          margin: 0;
          min-height: 100vh;
        }

        .pink-landing-root * {
          box-sizing: border-box;
        }

        .pink-wrap {
          max-width: 1120px;
          margin-inline: auto;
          padding-inline: 20px;
        }

        .pink-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font: 500 15px/1 var(--font-body);
          padding: 14px 26px;
          border-radius: 999px;
          border: 1px solid transparent;
          cursor: pointer;
          text-decoration: none;
          transition: background .15s, box-shadow .15s;
        }

        .pink-btn-filled {
          background: var(--primary);
          color: var(--on-primary);
        }

        .pink-btn-filled:hover {
          background: var(--primary-hover);
          box-shadow: 0 2px 10px rgba(200, 38, 106, 0.4);
        }

        .pink-btn-tonal {
          background: var(--container);
          color: var(--on-container);
        }

        .pink-btn-tonal:hover {
          background: var(--container-hi);
        }

        .pink-btn-text {
          color: var(--primary);
          padding-inline: 14px;
        }

        .pink-btn-text:hover {
          background: var(--surface);
        }

        .pink-btn.sm {
          padding: 10px 20px;
          font-size: 14px;
        }

        /* App bar */
        .pink-bar {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(255, 251, 252, 0.92);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--line);
          transition: box-shadow 0.2s;
        }

        .pink-bar.lift {
          box-shadow: 0 2px 18px rgba(120, 20, 60, 0.10);
        }

        .pink-bar .pink-wrap {
          display: flex;
          align-items: center;
          gap: 16px;
          height: 64px;
        }

        .pink-logo {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 23px;
          letter-spacing: -.02em;
          text-decoration: none;
          display: inline-flex;
          color: var(--fg);
        }

        .pink-logo b {
          color: var(--primary);
          font-weight: 600;
        }

        .pink-bar nav {
          display: flex;
          gap: 2px;
          margin-left: 24px;
        }

        .pink-bar nav a {
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          color: var(--muted);
          padding: 8px 14px;
          border-radius: 999px;
          transition: background .15s, color .15s;
        }

        .pink-bar nav a:hover {
          background: var(--surface);
          color: var(--fg);
        }

        .pink-spacer {
          flex: 1;
        }

        @media (max-width: 760px) {
          .pink-bar nav { display: none; }
        }

        .pink-prog {
          position: absolute;
          left: 0;
          bottom: -1px;
          height: 3px;
          background: linear-gradient(90deg, var(--primary-soft), var(--primary));
          border-radius: 0 3px 3px 0;
          transition: width 0.1s ease-out;
        }

        /* Hero */
        .pink-hero {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(60% 50% at 15% 0%, rgba(244, 143, 180, 0.38), transparent 70%),
            radial-gradient(50% 45% at 90% 10%, rgba(255, 207, 224, 0.70), transparent 70%);
        }

        .pink-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
        }

        .pink-b1 {
          width: 420px;
          height: 420px;
          left: -120px;
          top: -100px;
          background: var(--primary-soft);
          opacity: .45;
          animation: pinkDrift 16s ease-in-out infinite alternate;
        }

        .pink-b2 {
          width: 360px;
          height: 360px;
          right: -100px;
          top: 60px;
          background: var(--container-hi);
          opacity: .9;
          animation: pinkDrift 20s -6s ease-in-out infinite alternate;
        }

        .pink-b3 {
          width: 300px;
          height: 300px;
          left: 40%;
          bottom: -120px;
          background: var(--primary-soft);
          opacity: .3;
          animation: pinkDrift 18s -3s ease-in-out infinite alternate;
        }

        .pink-hero-in {
          text-align: center;
          padding-block: clamp(44px, 8vw, 88px) 40px;
        }

        .pink-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--container);
          color: var(--on-container);
          font-size: 13.5px;
          font-weight: 500;
          padding: 6px 14px 6px 10px;
          border-radius: 999px;
          margin-bottom: 22px;
          animation: pinkRise .7s .05s backwards;
        }

        .pink-pill i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
        }

        .pink-hero h1 {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: clamp(38px, 7.4vw, 76px);
          line-height: 1.04;
          letter-spacing: -.035em;
          max-width: 16ch;
          margin-inline: auto;
          animation: pinkRise .8s .15s backwards;
        }

        .pink-hero h1 em {
          font-style: normal;
          background: linear-gradient(90deg, var(--primary), var(--primary-soft), var(--primary-hover), var(--primary));
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          animation: pinkSheen 6s linear infinite;
        }

        .pink-hero p.sub {
          font-size: clamp(17px, 2.2vw, 21px);
          color: var(--muted);
          max-width: 44ch;
          margin: 22px auto 30px;
          animation: pinkRise .8s .3s backwards;
        }

        .pink-cta-row {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          animation: pinkRise .8s .42s backwards;
        }

        .pink-hint {
          font-size: 13.5px;
          color: var(--muted);
          margin: 16px 0 0;
          animation: pinkRise .8s .52s backwards;
        }

        /* Desktop mockup */
        .pink-desk {
          position: relative;
          border-radius: 28px;
          padding: clamp(14px, 3vw, 34px) clamp(14px, 3vw, 34px) 18px;
          margin-bottom: clamp(40px, 6vw, 72px);
          background: linear-gradient(140deg, rgba(244, 143, 180, 0.55), var(--container-hi) 60%, var(--container));
          border: 1px solid var(--line);
          animation: pinkRise 1s .55s backwards;
        }

        .pink-win {
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 16px;
          box-shadow: 0 18px 50px rgba(120, 20, 60, .18);
          overflow: hidden;
          text-align: left;
        }

        .pink-win .tb {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 11px 14px;
          background: var(--surface);
          border-bottom: 1px solid var(--line);
        }

        .pink-win .tb i {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: var(--container-hi);
        }

        .pink-win .tb i:first-child {
          background: var(--primary-soft);
        }

        .pink-win .tb span {
          flex: 1;
          text-align: center;
          font-size: 13px;
          font-weight: 500;
          color: var(--muted);
          margin-right: 40px;
        }

        .pink-win .body {
          padding: 14px;
        }

        .pink-win .status {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
          padding: 9px 14px;
          border-top: 1px solid var(--line);
          background: var(--surface);
          font: 500 12px var(--font-mono);
          color: var(--muted);
        }

        .pink-win .status b {
          color: var(--primary);
          font-weight: 500;
        }

        .pink-desk .pink-win.main {
          max-width: 860px;
          margin-inline: auto;
        }

        .pink-win.float {
          position: absolute;
          right: clamp(14px, 4vw, 60px);
          bottom: 96px;
          width: min(300px, 34%);
          box-shadow: 0 22px 60px rgba(120, 20, 60, .28);
          animation: pinkBob 6s ease-in-out infinite;
        }

        .pink-win.float .body {
          display: grid;
          gap: 10px;
        }

        .pink-skel {
          height: 8px;
          border-radius: 4px;
          background: linear-gradient(90deg, var(--container) 30%, var(--container-hi) 50%, var(--container) 70%);
          background-size: 200% 100%;
          animation: pinkSheen 2.6s linear infinite;
        }

        .pink-skel.w1 { width: 92%; }
        .pink-skel.w2 { width: 70%; }
        .pink-skel.w3 { width: 81%; }

        .pink-bar-p {
          height: 8px;
          border-radius: 4px;
          background: var(--container);
          overflow: hidden;
        }

        .pink-bar-p span {
          display: block;
          height: 100%;
          width: 72%;
          background: var(--primary);
          border-radius: 4px;
          animation: pinkGrow 1.4s .3s ease-out backwards;
        }

        .pink-mini {
          font-size: 12px;
          color: var(--muted);
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .pink-dock {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin: 22px auto 0;
          width: max-content;
          max-width: 100%;
          padding: 8px 12px;
          border-radius: 20px;
          background: rgba(255, 251, 252, 0.60);
          border: 1px solid rgba(255, 251, 252, 0.70);
        }

        .pink-dock span {
          width: 42px;
          height: 42px;
          border-radius: 13px;
          background: var(--bg);
          color: var(--primary);
          display: grid;
          place-items: center;
          box-shadow: 0 2px 6px rgba(120, 20, 60, .12);
          transition: transform .25s cubic-bezier(.3, 1.6, .5, 1), background .2s;
          cursor: pointer;
        }

        .pink-dock span:hover {
          transform: translateY(-10px) scale(1.18);
        }

        .pink-dock span.on {
          background: var(--primary);
          color: var(--on-primary);
        }

        @media (max-width: 760px) {
          .pink-win.float { display: none; }
          .pink-dock span { width: 38px; height: 38px; }
        }

        .pink-sym {
          width: 22px;
          height: 22px;
        }

        /* Hero DAG graph */
        .pink-dag svg {
          display: block;
          width: 100%;
          height: auto;
        }

        .pink-dag .edge {
          stroke: var(--line);
          stroke-width: 2;
          fill: none;
          transition: stroke .6s;
        }

        .pink-dag .edge.on {
          stroke: var(--primary-soft);
        }

        .pink-dag text {
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 500;
          fill: var(--fg);
          pointer-events: none;
        }

        .pink-dag .node .c {
          fill: var(--bg);
          stroke: var(--line);
          stroke-width: 2;
          transition: fill .5s, stroke .5s;
        }

        .pink-dag .node.s-done .c {
          fill: var(--primary);
          stroke: var(--primary);
        }

        .pink-dag .node.s-done text {
          fill: var(--on-primary);
        }

        .pink-dag .node.s-review .c {
          stroke: var(--primary);
          stroke-width: 2.5;
          stroke-dasharray: 5 4;
          animation: pinkDashmove 1.4s linear infinite;
        }

        .pink-dag .node.s-open .c {
          fill: var(--container);
          stroke: var(--primary-soft);
          stroke-width: 2.5;
          animation: pinkBreathe 2s ease-in-out infinite;
        }

        .pink-dag .node.s-lock text {
          fill: var(--muted);
        }

        .pink-dag .node .pulse {
          fill: none;
          stroke: var(--primary);
          stroke-width: 2;
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          pointer-events: none;
        }

        .pink-dag .node.s-open .pulse,
        .pink-dag .node.s-review .pulse {
          animation: pinkPing 1.8s ease-out infinite;
        }

        .pink-dag .node.act {
          cursor: pointer;
          transition: transform .2s;
        }

        .pink-dag .node.act:hover {
          transform: scale(1.08);
        }

        .pink-legend {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 10px;
          font-size: 13px;
          color: var(--muted);
        }

        .pink-legend i {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 6px;
          vertical-align: -1px;
        }

        .l-done { background: var(--primary); }
        .l-review { border: 2px dashed var(--primary); }
        .l-open { background: var(--container); border: 2px solid var(--primary-soft); }
        .l-lock { border: 2px solid var(--line); }

        .pink-tip {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 8px;
          font-size: 14px;
          color: var(--fg);
          min-height: 38px;
        }

        .pink-tip b {
          color: var(--primary);
        }

        /* Marquee */
        .pink-mq {
          border-block: 1px solid var(--line);
          padding-block: 16px;
          overflow: hidden;
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
          mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
        }

        .pink-mq-track {
          display: flex;
          width: max-content;
          animation: pinkMarquee 42s linear infinite;
        }

        .pink-mq:hover .pink-mq-track {
          animation-play-state: paused;
        }

        .pink-mq-group {
          display: flex;
          gap: 12px;
          padding-right: 12px;
        }

        .pink-mq-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 9px 18px;
          font-weight: 500;
          font-size: 15px;
        }

        .pink-mq-chip svg {
          width: 18px;
          height: 18px;
          color: var(--primary);
        }

        /* Sections */
        .pink-section {
          padding-block: clamp(56px, 8vw, 104px);
        }

        .pink-eyebrow {
          font: 500 12.5px var(--font-mono);
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--primary);
          margin: 0 0 12px;
        }

        .pink-section h2 {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: clamp(30px, 4.6vw, 48px);
          line-height: 1.1;
          letter-spacing: -.025em;
          margin: 0;
        }

        .pink-lead {
          color: var(--muted);
          font-size: 18px;
          max-width: 58ch;
          margin: 16px 0 0;
        }

        .pink-center {
          text-align: center;
        }

        .pink-center .pink-lead {
          margin-inline: auto;
        }

        /* Tabs */
        .pink-tabs {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 6px;
          margin: 36px 0 28px;
          scrollbar-width: thin;
          justify-content: flex-start;
        }

        @media (min-width: 1000px) {
          .pink-tabs { justify-content: center; }
        }

        .pink-tab {
          flex: none;
          font: 500 15px var(--font-body);
          color: var(--fg);
          background: transparent;
          border: 1px solid var(--line);
          padding: 10px 20px;
          border-radius: 999px;
          cursor: pointer;
          transition: background .15s, color .15s, border-color .15s;
        }

        .pink-tab:hover {
          background: var(--surface);
        }

        .pink-tab[aria-selected="true"] {
          background: var(--container);
          border-color: var(--container);
          color: var(--on-container);
        }

        .pink-panel {
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: clamp(24px, 5vw, 64px);
          align-items: center;
          background: var(--surface);
          border-radius: 32px;
          padding: clamp(24px, 5vw, 56px);
          animation: pinkRise .55s backwards;
        }

        @media (max-width: 860px) {
          .pink-panel { grid-template-columns: 1fr; }
        }

        .pink-panel h3 {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: clamp(26px, 3.4vw, 36px);
          line-height: 1.15;
          letter-spacing: -.02em;
          margin: 0;
        }

        .pink-panel p.d {
          color: var(--muted);
          font-size: 17px;
          margin: 14px 0 0;
        }

        .pink-ticks {
          list-style: none;
          margin: 22px 0 0;
          padding: 0;
          display: grid;
          gap: 12px;
        }

        .pink-ticks li {
          display: grid;
          grid-template-columns: 22px 1fr;
          gap: 12px;
          font-size: 16px;
        }

        .pink-ticks svg {
          width: 22px;
          height: 22px;
          color: var(--primary);
          margin-top: 1px;
        }

        .pink-ticks span {
          color: var(--muted);
        }

        .pink-ticks strong {
          font-weight: 500;
          color: var(--fg);
        }

        .pink-art {
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 22px;
          padding: 18px;
          min-width: 0;
          box-shadow: 0 8px 28px rgba(120, 20, 60, .08);
        }

        .pink-art .cap {
          font: 500 12px var(--font-mono);
          color: var(--muted);
          letter-spacing: .06em;
          text-transform: uppercase;
          margin: 0 0 12px;
        }

        .pink-box {
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 14px;
          background: var(--bg);
        }

        .pink-stack {
          display: grid;
          gap: 12px;
        }

        .pink-chip {
          display: inline-block;
          background: var(--container);
          color: var(--on-container);
          font-size: 12.5px;
          font-weight: 500;
          padding: 3px 10px;
          border-radius: 999px;
        }

        .pink-row {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: space-between;
          flex-wrap: wrap;
        }

        .pink-opt {
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 14px;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .pink-opt.ok {
          border-color: var(--primary);
          background: var(--surface);
        }

        .pink-opt i {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid var(--line);
          flex: none;
        }

        .pink-opt.ok i {
          border-color: var(--primary);
          background: var(--primary);
        }

        .pink-dots {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .pink-dots i {
          width: 18px;
          height: 18px;
          border-radius: 6px;
          background: var(--container);
        }

        .pink-dots i.on {
          background: var(--primary);
        }

        /* Steps */
        .pink-steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
          gap: 16px;
          margin-top: 44px;
        }

        .pink-step {
          background: var(--surface);
          border-radius: 28px;
          padding: 28px;
          min-width: 0;
          transition: transform .25s, box-shadow .25s;
        }

        .pink-step:hover {
          transform: translateY(-6px);
          box-shadow: 0 14px 30px rgba(120, 20, 60, .10);
        }

        .pink-step .n {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--primary);
          color: var(--on-primary);
          display: grid;
          place-items: center;
          font: 600 20px var(--font-display);
          margin-bottom: 18px;
          position: relative;
        }

        .pink-step .n::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid var(--primary);
          animation: pinkPing 2.6s ease-out infinite;
        }

        .pink-step h3 {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 22px;
          margin: 0 0 8px;
        }

        .pink-step p {
          margin: 0;
          color: var(--muted);
        }

        /* Cards everywhere */
        .pink-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
          gap: 16px;
          margin-top: 44px;
        }

        .pink-cc {
          border: 1px solid var(--line);
          border-radius: 24px;
          padding: 26px;
          min-width: 0;
          transition: transform .25s, border-color .25s, box-shadow .25s;
        }

        .pink-cc:hover {
          transform: translateY(-6px);
          border-color: var(--primary-soft);
          box-shadow: 0 14px 30px rgba(120, 20, 60, .10);
        }

        .pink-cc .ic {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: var(--container);
          color: var(--on-container);
          display: grid;
          place-items: center;
          margin-bottom: 16px;
          transition: transform .3s cubic-bezier(.3, 1.6, .5, 1);
        }

        .pink-cc:hover .ic {
          transform: rotate(-8deg) scale(1.1);
        }

        .pink-cc h3 {
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 19px;
          margin: 0 0 6px;
        }

        .pink-cc p {
          margin: 0;
          color: var(--muted);
          font-size: 15.5px;
        }

        /* FAQ */
        .pink-faq {
          max-width: 760px;
          margin: 40px auto 0;
        }

        .pink-faq details {
          border-bottom: 1px solid var(--line);
        }

        .pink-faq summary {
          list-style: none;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 22px 4px;
          font: 500 19px var(--font-display);
        }

        .pink-faq summary::-webkit-details-marker {
          display: none;
        }

        .pink-faq summary::after {
          content: "";
          flex: none;
          width: 12px;
          height: 12px;
          border-right: 2.5px solid var(--primary);
          border-bottom: 2.5px solid var(--primary);
          transform: rotate(45deg) translate(-2px, -2px);
          transition: transform .2s;
        }

        .pink-faq details[open] summary::after {
          transform: rotate(-135deg) translate(-2px, -2px);
        }

        .pink-faq details p {
          margin: 0;
          padding: 0 4px 22px;
          color: var(--muted);
          font-size: 16.5px;
          max-width: 62ch;
        }

        /* Final CTA */
        .pink-cta {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, var(--container), var(--container-hi));
          border-radius: 40px;
          text-align: center;
          padding: clamp(44px, 8vw, 88px) 20px;
        }

        .pink-cta > *:not(.pink-orb) {
          position: relative;
          z-index: 1;
        }

        .pink-orb {
          position: absolute;
          border-radius: 50%;
          background: var(--primary-soft);
          pointer-events: none;
        }

        .pink-o1 {
          width: 180px;
          height: 180px;
          left: -40px;
          top: -50px;
          opacity: .4;
          animation: pinkWander1 9s ease-in-out infinite;
        }

        .pink-o2 {
          width: 110px;
          height: 110px;
          right: 9%;
          top: 18%;
          opacity: .28;
          animation: pinkWander2 7s ease-in-out infinite;
        }

        .pink-o3 {
          width: 230px;
          height: 230px;
          right: -60px;
          bottom: -90px;
          opacity: .35;
          animation: pinkWander1 11s ease-in-out infinite;
        }

        .pink-o4 {
          width: 70px;
          height: 70px;
          left: 14%;
          bottom: 14%;
          opacity: .3;
          animation: pinkWander2 8s ease-in-out infinite;
        }

        .pink-cta h2 {
          font-family: var(--font-display);
          max-width: 18ch;
          margin-inline: auto;
          font-size: clamp(30px, 4.6vw, 48px);
          font-weight: 600;
        }

        .pink-cta p {
          color: var(--on-container);
          opacity: .8;
          margin: 16px auto 30px;
          font-size: 18px;
          max-width: 42ch;
        }

        /* Footer */
        .pink-footer {
          background: var(--footer);
          margin-top: clamp(56px, 8vw, 104px);
          border-top: 1px solid var(--line);
        }

        .pink-fcols {
          display: grid;
          grid-template-columns: 1.4fr repeat(2, 1fr);
          gap: 32px;
          padding-block: 48px 32px;
        }

        @media (max-width: 700px) {
          .pink-fcols {
            grid-template-columns: 1fr 1fr;
          }
          .pink-fcols > div:first-child {
            grid-column: 1 / -1;
          }
        }

        .pink-fcols h4 {
          font: 500 14px var(--font-body);
          margin: 0 0 14px;
        }

        .pink-fcols ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 10px;
        }

        .pink-fcols a {
          text-decoration: none;
          color: var(--muted);
          font-size: 14.5px;
        }

        .pink-fcols a:hover {
          color: var(--primary);
          text-decoration: underline;
        }

        .pink-fcols p {
          color: var(--muted);
          font-size: 14.5px;
          margin: 12px 0 0;
          max-width: 30ch;
        }

        .pink-fbot {
          border-top: 1px solid var(--line);
          padding-block: 20px;
          color: var(--muted);
          font-size: 13.5px;
        }

        /* Confetti particle */
        .pink-cf {
          position: fixed;
          width: 9px;
          height: 9px;
          border-radius: 2px;
          pointer-events: none;
          z-index: 9999;
          animation: pinkCf .95s cubic-bezier(.2, .8, .4, 1) forwards;
        }

        /* Keyframe animations */
        @keyframes pinkRise { from { opacity: 0; transform: translateY(22px); } }
        @keyframes pinkDrift {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, 30px) scale(1.12); }
          100% { transform: translate(-30px, 50px) scale(.95); }
        }
        @keyframes pinkBob { 50% { transform: translateY(-10px); } }
        @keyframes pinkPing {
          from { opacity: .6; transform: scale(1); }
          to { opacity: 0; transform: scale(1.55); }
        }
        @keyframes pinkDashmove { to { stroke-dashoffset: -18; } }
        @keyframes pinkBreathe { 50% { stroke: var(--primary); } }
        @keyframes pinkSheen {
          from { background-position: 0 0; }
          to { background-position: 200% 0; }
        }
        @keyframes pinkMarquee { to { transform: translateX(-50%); } }
        @keyframes pinkGrow { from { width: 0; } }
        @keyframes pinkSpin { to { transform: rotate(360deg); } }
        @keyframes pinkBeat { 50% { transform: scale(1.1); } }
        @keyframes pinkWander1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(34px, -26px); }
        }
        @keyframes pinkWander2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-40px, 22px); }
        }
        @keyframes pinkCf {
          to {
            transform: translate(var(--dx), var(--dy)) rotate(var(--rot));
            opacity: 0;
          }
        }
      `}</style>

      {/* Embedded SVGs */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <symbol id="i-graph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="9" r="2.5"/><circle cx="9" cy="18" r="2.5"/>
          <path d="M8 7l8 1.5M7.5 8.3L8.5 15.5M16.5 11l-6 5.5"/>
        </symbol>
        <symbol id="i-studio" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8l9-4 9 4-9 4-9-4z"/><path d="M7 10.5V15c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5"/>
        </symbol>
        <symbol id="i-sphere" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>
        </symbol>
        <symbol id="i-spar" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/>
          <path d="M3 20c0-3.3 2.2-5.5 5-5.5s5 2.2 5 5.5M14.5 15c2.8-.5 6 .9 6.5 5"/>
        </symbol>
        <symbol id="i-git" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="5" r="2.2"/><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="9" r="2.2"/>
          <path d="M6 7.2v9.6M18 11.2c0 4-6 3-11 6"/>
        </symbol>
        <symbol id="i-folio" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="7" width="18" height="13" rx="2.5"/>
          <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 13h18"/>
        </symbol>
        <symbol id="i-focus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/>
        </symbol>
        <symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" strokeWidth="1.8"/><path d="M8 12.5l3 3 5-6"/>
        </symbol>
        <symbol id="i-desk" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="13" rx="2.5"/><path d="M8 21h8M12 17v4"/>
        </symbol>
        <symbol id="i-phone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>
        </symbol>
        <symbol id="i-sync" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 8a8 8 0 0 0-14-2.5L4 8M4 4v4h4M4 16a8 8 0 0 0 14 2.5L20 16M20 20v-4h-4"/>
        </symbol>
        <symbol id="i-key" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>
        </symbol>
      </svg>

      {/* Sticky App Bar */}
      <div className={`pink-bar ${isBarLifted ? 'lift' : ''}`}>
        <div className="pink-wrap">
          <a className="pink-logo" href="#top">Pink<b>In</b>Au</a>
          <nav aria-label="Разделы">
            <a href="#features">Возможности</a>
            <a href="#how">Как это работает</a>
            <a href="#faq">Вопросы</a>
          </nav>
          <span className="pink-spacer"></span>
          <button
            type="button"
            onClick={onStartFree}
            className="pink-btn pink-btn-filled sm cursor-pointer"
          >
            Попробовать
          </button>
        </div>
        <div className="pink-prog" style={{ width: `${scrollProgress}%` }}></div>
      </div>

      <main id="top">
        {/* Hero Section */}
        <div className="pink-hero">
          <div className="pink-blob pink-b1" aria-hidden="true"></div>
          <div className="pink-blob pink-b2" aria-hidden="true"></div>
          <div className="pink-blob pink-b3" aria-hidden="true"></div>

          <div className="pink-wrap">
            <div className="pink-hero-in">
              <span className="pink-pill"><i></i>Pink Learn от PinkInAu</span>
              <h1>Учитесь так, как <em>работает память</em></h1>
              <p className="sub">Платформа, которая превращает тему в граф знаний, а каждый модуль в готовую работу для портфолио.</p>
              
              <div className="pink-cta-row">
                <button
                  type="button"
                  onClick={onEnterDemoDesktop || onStartFree}
                  className="pink-btn pink-btn-filled cursor-pointer"
                >
                  Открыть демо без пароля
                </button>
                <button
                  type="button"
                  onClick={onLogin}
                  className="pink-btn pink-btn-tonal cursor-pointer"
                >
                  Войти через Google
                </button>
              </div>
              <p className="pink-hint">Вход в один клик. Гостевой режим работает без регистрации.</p>
            </div>

            {/* Interactive Web OS Mock Window */}
            <div className="pink-desk" aria-label="Пример окна Pink Learn">
              <div className="pink-win main">
                <div className="tb">
                  <i></i><i></i><i></i>
                  <span>Граф: Алгоритмы и структуры данных</span>
                </div>
                <div className="body pink-dag">
                  <svg viewBox="0 0 560 280" role="group" aria-label="Интерактивный граф обучения. Нажмите на светящийся узел, чтобы пройти его.">
                    <path className={`edge ${dagState.n0 === 'done' ? 'on' : ''}`} d="M70 140 C120 140 120 70 175 70" />
                    <path className={`edge ${dagState.n0 === 'done' ? 'on' : ''}`} d="M70 140 C120 140 120 210 175 210" />
                    <path className={`edge ${dagState.n1 === 'done' ? 'on' : ''}`} d="M235 70 C300 70 300 105 350 105" />
                    <path className={`edge ${dagState.n2 === 'done' ? 'on' : ''}`} d="M235 210 C300 210 300 175 350 175" />
                    <path className={`edge ${dagState.n3 === 'done' ? 'on' : ''}`} d="M410 105 C455 105 455 140 480 140" />
                    <path className={`edge ${dagState.n4 === 'done' ? 'on' : ''}`} d="M410 175 C455 175 455 140 480 140" />

                    {/* Node 0: Основы */}
                    <g
                      className={`node s-${dagState.n0} ${dagState.n0 === 'open' || dagState.n0 === 'review' ? 'act' : ''}`}
                      onClick={(e) => handleNodeClick('n0', e)}
                    >
                      <circle className="pulse" cx="42" cy="140" r="30" />
                      <circle className="c" cx="42" cy="140" r="30" />
                      <text x="42" y="145" textAnchor="middle">Основы</text>
                    </g>

                    {/* Node 1: Теория */}
                    <g
                      className={`node s-${dagState.n1} ${dagState.n1 === 'open' || dagState.n1 === 'review' ? 'act' : ''}`}
                      onClick={(e) => handleNodeClick('n1', e)}
                    >
                      <circle className="pulse" cx="205" cy="70" r="32" />
                      <circle className="c" cx="205" cy="70" r="32" />
                      <text x="205" y="75" textAnchor="middle">Теория</text>
                    </g>

                    {/* Node 2: Практика */}
                    <g
                      className={`node s-${dagState.n2} ${dagState.n2 === 'open' || dagState.n2 === 'review' ? 'act' : ''}`}
                      onClick={(e) => handleNodeClick('n2', e)}
                    >
                      <circle className="pulse" cx="205" cy="210" r="32" />
                      <circle className="c" cx="205" cy="210" r="32" />
                      <text x="205" y="215" textAnchor="middle">Практика</text>
                    </g>

                    {/* Node 3: Спарринг */}
                    <g
                      className={`node s-${dagState.n3} ${dagState.n3 === 'open' || dagState.n3 === 'review' ? 'act' : ''}`}
                      onClick={(e) => handleNodeClick('n3', e)}
                    >
                      <circle className="pulse" cx="380" cy="105" r="32" />
                      <circle className="c" cx="380" cy="105" r="32" />
                      <text x="380" y="110" textAnchor="middle">Спарринг</text>
                    </g>

                    {/* Node 4: Квиз */}
                    <g
                      className={`node s-${dagState.n4} ${dagState.n4 === 'open' || dagState.n4 === 'review' ? 'act' : ''}`}
                      onClick={(e) => handleNodeClick('n4', e)}
                    >
                      <circle className="pulse" cx="380" cy="175" r="32" />
                      <circle className="c" cx="380" cy="175" r="32" />
                      <text x="380" y="180" textAnchor="middle">Квиз</text>
                    </g>

                    {/* Node 5: Capstone */}
                    <g
                      className={`node s-${dagState.n5} ${dagState.n5 === 'open' || dagState.n5 === 'review' ? 'act' : ''}`}
                      onClick={(e) => handleNodeClick('n5', e)}
                    >
                      <circle className="pulse" cx="510" cy="140" r="34" />
                      <circle className="c" cx="510" cy="140" r="34" />
                      <text x="510" y="145" textAnchor="middle">Capstone</text>
                    </g>
                  </svg>

                  <div className="pink-legend">
                    <span><i className="l-done"></i>Пройдено</span>
                    <span><i className="l-review"></i>Пора повторить</span>
                    <span><i className="l-open"></i>Доступно</span>
                    <span><i className="l-lock"></i>Закрыто</span>
                  </div>

                  <div className="pink-tip" aria-live="polite">
                    <span>{tipMessage}</span>
                    {isGraphFinished && (
                      <button
                        type="button"
                        onClick={handleResetDag}
                        className="pink-btn pink-btn-text sm cursor-pointer"
                      >
                        Пройти заново
                      </button>
                    )}
                  </div>
                </div>

                <div className="status">
                  <span>XP <b>{currentXp.toLocaleString('ru-RU')}</b></span>
                  <span>Стрик <b>12 дней</b></span>
                  <span>Повторить <b>{reviewCount ? `${reviewCount} тема` : 'всё повторено'}</b></span>
                </div>
              </div>

              {/* Floating Quick Widget Mock */}
              <div className="pink-win float" aria-hidden="true">
                <div className="tb">
                  <i></i><i></i><i></i>
                  <span>Чистый лист</span>
                </div>
                <div className="body">
                  <div className="pink-skel w1"></div>
                  <div className="pink-skel w2"></div>
                  <div className="pink-skel w3"></div>
                  <div className="pink-mini">
                    <span>Полнота ответа</span>
                    <b>72%</b>
                  </div>
                  <div className="pink-bar-p"><span></span></div>
                </div>
              </div>

              {/* Dock Bar */}
              <div className="pink-dock" aria-hidden="true">
                <span className="on" onClick={() => setActiveTab('graph')}>
                  <svg className="pink-sym"><use href="#i-graph"/></svg>
                </span>
                <span onClick={() => setActiveTab('studio')}>
                  <svg className="pink-sym"><use href="#i-studio"/></svg>
                </span>
                <span onClick={() => setActiveTab('sphere')}>
                  <svg className="pink-sym"><use href="#i-sphere"/></svg>
                </span>
                <span onClick={() => setActiveTab('spar')}>
                  <svg className="pink-sym"><use href="#i-spar"/></svg>
                </span>
                <span onClick={() => setActiveTab('focus')}>
                  <svg className="pink-sym"><use href="#i-focus"/></svg>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Marquee Ticker */}
        <div className="pink-mq" aria-label="Что внутри Pink Learn">
          <div className="pink-mq-track">
            <div className="pink-mq-group">
              <span className="pink-mq-chip"><svg><use href="#i-graph"/></svg>Граф знаний</span>
              <span className="pink-mq-chip"><svg><use href="#i-studio"/></svg>Чистый лист</span>
              <span className="pink-mq-chip"><svg><use href="#i-desk"/></svg>Песочницы</span>
              <span className="pink-mq-chip"><svg><use href="#i-check"/></svg>Адаптивные квизы</span>
              <span className="pink-mq-chip"><svg><use href="#i-sphere"/></svg>Сфера знаний</span>
              <span className="pink-mq-chip"><svg><use href="#i-spar"/></svg>Спарринг</span>
              <span className="pink-mq-chip"><svg><use href="#i-sync"/></svg>Общая доска</span>
              <span className="pink-mq-chip"><svg><use href="#i-git"/></svg>Git знаний</span>
              <span className="pink-mq-chip"><svg><use href="#i-folio"/></svg>Портфолио</span>
              <span className="pink-mq-chip"><svg><use href="#i-focus"/></svg>Помодоро</span>
              <span className="pink-mq-chip"><svg><use href="#i-key"/></svg>Привычки и стрики</span>
              <span className="pink-mq-chip"><svg><use href="#i-phone"/></svg>Мобильные блоки</span>
            </div>
            {/* Seamless duplicate loop */}
            <div className="pink-mq-group" aria-hidden="true">
              <span className="pink-mq-chip"><svg><use href="#i-graph"/></svg>Граф знаний</span>
              <span className="pink-mq-chip"><svg><use href="#i-studio"/></svg>Чистый лист</span>
              <span className="pink-mq-chip"><svg><use href="#i-desk"/></svg>Песочницы</span>
              <span className="pink-mq-chip"><svg><use href="#i-check"/></svg>Адаптивные квизы</span>
              <span className="pink-mq-chip"><svg><use href="#i-sphere"/></svg>Сфера знаний</span>
              <span className="pink-mq-chip"><svg><use href="#i-spar"/></svg>Спарринг</span>
              <span className="pink-mq-chip"><svg><use href="#i-sync"/></svg>Общая доска</span>
              <span className="pink-mq-chip"><svg><use href="#i-git"/></svg>Git знаний</span>
              <span className="pink-mq-chip"><svg><use href="#i-folio"/></svg>Портфолио</span>
              <span className="pink-mq-chip"><svg><use href="#i-focus"/></svg>Помодоро</span>
              <span className="pink-mq-chip"><svg><use href="#i-key"/></svg>Привычки и стрики</span>
              <span className="pink-mq-chip"><svg><use href="#i-phone"/></svg>Мобильные блоки</span>
            </div>
          </div>
        </div>

        {/* Feature Modules Tab Showcase */}
        <section id="features" className="pink-section">
          <div className="pink-wrap">
            <div className="pink-center">
              <p className="pink-eyebrow">Всё в одном продукте</p>
              <h2>Семь модулей, один рабочий стол</h2>
              <p className="pink-lead">Граф, студия, спарринг и портфолио открываются как окна в одном окружении и делят общие данные.</p>
            </div>

            <div className="pink-tabs" role="tablist" aria-label="Модули Pink Learn">
              <button
                type="button"
                className="pink-tab"
                role="tab"
                aria-selected={activeTab === 'graph'}
                onClick={() => setActiveTab('graph')}
              >
                Граф
              </button>
              <button
                type="button"
                className="pink-tab"
                role="tab"
                aria-selected={activeTab === 'studio'}
                onClick={() => setActiveTab('studio')}
              >
                Фокус-студия
              </button>
              <button
                type="button"
                className="pink-tab"
                role="tab"
                aria-selected={activeTab === 'sphere'}
                onClick={() => setActiveTab('sphere')}
              >
                Сфера знаний
              </button>
              <button
                type="button"
                className="pink-tab"
                role="tab"
                aria-selected={activeTab === 'spar'}
                onClick={() => setActiveTab('spar')}
              >
                Спарринг
              </button>
              <button
                type="button"
                className="pink-tab"
                role="tab"
                aria-selected={activeTab === 'git'}
                onClick={() => setActiveTab('git')}
              >
                Git знаний
              </button>
              <button
                type="button"
                className="pink-tab"
                role="tab"
                aria-selected={activeTab === 'folio'}
                onClick={() => setActiveTab('folio')}
              >
                Портфолио
              </button>
              <button
                type="button"
                className="pink-tab"
                role="tab"
                aria-selected={activeTab === 'focus'}
                onClick={() => setActiveTab('focus')}
              >
                Продуктивность
              </button>
            </div>

            {/* Panel 1: Graph */}
            {activeTab === 'graph' && (
              <div className="pink-panel" role="tabpanel">
                <div>
                  <h3>Тема выглядит как карта, а не как список</h3>
                  <p className="d">Каждая тема разбита на атомарные кванты: теория, осознанная практика, парный спарринг и проект Capstone.</p>
                  <ul className="pink-ticks">
                    <li><svg><use href="#i-check"/></svg><div><strong>Блоки открываются по баллу.</strong> <span>Следующий узел доступен после проходного порога в предыдущих.</span></div></li>
                    <li><svg><use href="#i-check"/></svg><div><strong>Тепловая карта памяти.</strong> <span>Цвет узла следует кривой забывания Эббингауза и подсказывает, что повторить сейчас.</span></div></li>
                    <li><svg><use href="#i-check"/></svg><div><strong>Стикеры на узлах.</strong> <span>Заметки видны вам и коллегам при совместном обучении.</span></div></li>
                    <li><svg><use href="#i-check"/></svg><div><strong>Помощь, если застряли.</strong> <span>Система сама вставляет облегчающий промежуточный проект.</span></div></li>
                  </ul>
                </div>
                <div className="pink-art">
                  <p className="cap">Тепловая карта понимания</p>
                  <div className="pink-dag">
                    <svg viewBox="0 0 400 230">
                      <path className="edge on" d="M60 115 C90 115 90 55 130 55"/>
                      <path className="edge on" d="M60 115 C90 115 90 175 130 175"/>
                      <path className="edge on" d="M180 55 C220 55 220 115 250 115"/>
                      <path className="edge on" d="M180 175 C220 175 220 115 250 115"/>
                      <path className="edge" d="M300 115 C320 115 320 115 340 115"/>
                      <circle className="l-done" cx="40" cy="115" r="24" fill="#c8266a"/>
                      <circle className="l-done" cx="155" cy="55" r="26" fill="#c8266a"/>
                      <circle className="l-review" cx="155" cy="175" r="26" fill="#fffbfc" stroke="#c8266a" strokeWidth="2.5" strokeDasharray="5 4"/>
                      <circle className="l-open" cx="275" cy="115" r="26" fill="#ffdfeb" stroke="#f48fb4" strokeWidth="2"/>
                      <circle className="l-lock" cx="365" cy="115" r="24" fill="#fffbfc" stroke="#ecd5de" strokeWidth="2"/>
                      <g className="stk">
                        <rect x="268" y="150" width="86" height="40" rx="8" fill="var(--container)"/>
                        <text x="278" y="168" style={{ fontSize: '12px', fill: '#4a0b27' }}>Стикер:</text>
                        <text x="278" y="183" style={{ fontSize: '12px', fill: '#4a0b27' }}>спросить у Макса</text>
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Panel 2: Studio */}
            {activeTab === 'studio' && (
              <div className="pink-panel" role="tabpanel">
                <div>
                  <h3>Фокус-студия: учитесь без воды</h3>
                  <p className="d">Сжатая выжимка инвариантов, примеров и ментальных моделей. Дальше вы проверяете себя и делаете реальную работу.</p>
                  <ul className="pink-ticks">
                    <li><svg><use href="#i-check"/></svg><div><strong>«Чистый лист».</strong> <span>Вы воспроизводите тему по памяти без подсказок, ИИ находит пробелы и объясняет, чего не хватило.</span></div></li>
                    <li><svg><use href="#i-check"/></svg><div><strong>Интерактивные песочницы.</strong> <span>Симуляторы, редакторы кода и диаграммы прямо внутри модуля.</span></div></li>
                    <li><svg><use href="#i-check"/></svg><div><strong>Адаптивные квизы на Gemini.</strong> <span>Вопросы подстраиваются под ваш уровень.</span></div></li>
                    <li><svg><use href="#i-check"/></svg><div><strong>Артефакт на выходе.</strong> <span>Код, схема, перевод или аналитический отчёт.</span></div></li>
                  </ul>
                </div>
                <div className="pink-art pink-stack">
                  <p className="cap" style={{ margin: 0 }}>Чистый лист</p>
                  <div className="pink-box pink-stack" style={{ gap: '9px' }}>
                    <div className="pink-skel w1"></div>
                    <div className="pink-skel w2"></div>
                    <div className="pink-skel w3"></div>
                  </div>
                  <div className="pink-box pink-stack" style={{ gap: '10px' }}>
                    <div className="pink-row">
                      <span style={{ fontWeight: 500 }}>Анализ ИИ</span>
                      <span className="pink-chip">Полнота 72%</span>
                    </div>
                    <div className="pink-bar-p"><span></span></div>
                    <span style={{ fontSize: '14px', color: 'var(--muted)' }}>Пробелы: инварианты и граничный случай</span>
                  </div>
                  <div className="pink-opt ok">
                    <i></i>
                    <span>Вопрос подобран под ваш уровень</span>
                  </div>
                </div>
              </div>
            )}

            {/* Panel 3: Sphere */}
            {activeTab === 'sphere' && (
              <div className="pink-panel" role="tabpanel">
                <div>
                  <h3>Сфера знаний: связи между дисциплинами</h3>
                  <p className="d">Модуль вдохновлён «Игрой в бисер» Германа Гессе. Знания кристаллизуются в три слоя.</p>
                  <ul className="pink-ticks">
                    <li><svg><use href="#i-check"/></svg><div><strong>Ядро.</strong> <span>Фундаментальные законы и формулы.</span></div></li>
                    <li><svg><use href="#i-check"/></svg><div><strong>Мантия.</strong> <span>Прикладные инженерные и профессиональные навыки.</span></div></li>
                    <li><svg><use href="#i-check"/></svg><div><strong>Орбита.</strong> <span>Ваши проекты и портфолио.</span></div></li>
                    <li><svg><use href="#i-check"/></svg><div><strong>Кастальенский синтез.</strong> <span>ИИ находит скрытое родство дисциплин, например теории музыки и алгоритмов.</span></div></li>
                  </ul>
                </div>
                <div className="pink-art">
                  <p className="cap">Лучи влияния</p>
                  <svg viewBox="0 0 400 300" role="img" aria-label="Три слоя: ядро, мантия, орбита">
                    <circle cx="200" cy="150" r="135" fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray="4 5"/>
                    <circle cx="200" cy="150" r="88" fill="var(--container)" opacity=".7"/>
                    <circle cx="200" cy="150" r="42" fill="var(--primary)" style={{ transformOrigin: 'center', animation: 'pinkBeat 2.4s ease-in-out infinite' }}/>
                    <g style={{ transformOrigin: '200px 150px', animation: 'pinkSpin 50s linear infinite' }}>
                      <path d="M200 150L318 82M200 150L96 66M200 150L110 238M200 150L300 232" stroke="var(--primary-soft)" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="318" cy="82" r="10" fill="var(--bg)" stroke="var(--primary)" strokeWidth="3"/>
                      <circle cx="96" cy="66" r="10" fill="var(--bg)" stroke="var(--primary)" strokeWidth="3"/>
                      <circle cx="110" cy="238" r="10" fill="var(--bg)" stroke="var(--primary)" strokeWidth="3"/>
                      <circle cx="300" cy="232" r="10" fill="var(--bg)" stroke="var(--primary)" strokeWidth="3"/>
                    </g>
                    <text x="200" y="155" textAnchor="middle" style={{ fill: 'var(--on-primary)', fontWeight: 600 }}>Ядро</text>
                    <text x="200" y="112" textAnchor="middle" style={{ fontSize: '13px', fill: 'var(--on-container)', fontWeight: 500 }}>Мантия</text>
                    <text x="200" y="20" textAnchor="middle" style={{ fontSize: '13px', fill: 'var(--muted)', fontWeight: 500 }}>Орбита</text>
                  </svg>
                </div>
              </div>
            )}

            {/* Panel 4: Sparring */}
            {activeTab === 'spar' && (
              <div className="pink-panel" role="tabpanel">
                <div>
                  <h3>Спарринг: учиться вместе быстрее</h3>
                  <p className="d">Совместная практика закрепляет материал лучше, чем чтение. Pink Learn помогает найти напарника и провести сессию.</p>
                  <ul className="pink-ticks">
                    <li><svg><use href="#i-check"/></svg><div><strong>Умный подбор.</strong> <span>Напарник со схожими целями, доменом и уровнем.</span></div></li>
                    <li><svg><use href="#i-check"/></svg><div><strong>Видно, что делает напарник.</strong> <span>Курсоры, клики и открытые окна синхронизируются в реальном времени.</span></div></li>
                    <li><svg><use href="#i-check"/></svg><div><strong>Общая доска и видеосвязь.</strong> <span>Рисуйте схемы и говорите, не выходя из приложения.</span></div></li>
                    <li><svg><use href="#i-check"/></svg><div><strong>ИИ-экзаменатор.</strong> <span>Оценивает защиту проекта обоими участниками и выносит вердикт.</span></div></li>
                  </ul>
                </div>
                <div className="pink-art">
                  <p className="cap">Общая доска</p>
                  <svg viewBox="0 0 400 260" role="img" aria-label="Две схемы на общей доске и курсоры двух участников">
                    <rect x="24" y="30" width="112" height="52" rx="10" fill="var(--container)"/>
                    <text x="80" y="61" textAnchor="middle" style={{ fill: 'var(--on-container)', fontWeight: 600 }}>Клиент</text>
                    <rect x="244" y="30" width="112" height="52" rx="10" fill="var(--container)"/>
                    <text x="300" y="61" textAnchor="middle" style={{ fill: 'var(--on-container)', fontWeight: 600 }}>Сервер</text>
                    <rect x="134" y="170" width="112" height="52" rx="10" fill="var(--bg)" stroke="var(--primary)" strokeWidth="2.5"/>
                    <text x="190" y="201" textAnchor="middle" style={{ fontWeight: 600 }}>База</text>
                    <path d="M136 56H244M300 82V120C300 150 250 190 246 196M80 82V120C80 150 130 190 134 196" stroke="var(--primary-soft)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                    
                    {/* Partner cursor */}
                    <g style={{ animation: 'pinkWander1 5s ease-in-out infinite' }}>
                      <path d="M262 112l0 22 6-5 4 10 4-2-4-10 8 0z" fill="var(--primary)"/>
                      <rect x="276" y="138" width="62" height="22" rx="11" fill="var(--primary)"/>
                      <text x="307" y="153" textAnchor="middle" style={{ fontSize: '12px', fill: 'var(--on-primary)', fontWeight: 600 }}>Напарник</text>
                    </g>

                    {/* User cursor */}
                    <g style={{ animation: 'pinkWander2 6s ease-in-out infinite' }}>
                      <path d="M96 112l0 22 6-5 4 10 4-2-4-10 8 0z" fill="var(--primary-soft)"/>
                      <rect x="110" y="138" width="36" height="22" rx="11" fill="var(--primary-soft)"/>
                      <text x="128" y="153" textAnchor="middle" style={{ fontSize: '12px', fill: 'var(--on-container)', fontWeight: 600 }}>Вы</text>
                    </g>
                  </svg>
                </div>
              </div>
            )}

            {/* Panel 5: Git */}
            {activeTab === 'git' && (
              <div className="pink-panel" role="tabpanel">
                <div>
                  <h3>Git знаний: версии вашего понимания</h3>
                  <p className="d">Прогресс в навыке можно сохранять так же аккуратно, как код.</p>
                  <ul className="pink-ticks">
                    <li><svg><use href="#i-check"/></svg><div><strong>Коммиты понимания.</strong> <span>Контрольные точки с диффами и заметками.</span></div></li>
                    <li><svg><use href="#i-check"/></svg><div><strong>Ветки гипотез.</strong> <span>Пробуйте альтернативные подходы к проекту и сравнивайте.</span></div></li>
                    <li><svg><use href="#i-check"/></svg><div><strong>История трансформации.</strong> <span>Полная хронология пути от новичка до эксперта.</span></div></li>
                  </ul>
                </div>
                <div className="pink-art">
                  <p className="cap">История мастерства</p>
                  <svg viewBox="0 0 400 240" role="img" aria-label="Ветка main с коммитами и ветка гипотезы">
                    <path d="M40 60H360" stroke="var(--primary)" strokeWidth="3" fill="none"/>
                    <path d="M140 60C160 60 160 150 190 150H280C300 150 300 60 320 60" stroke="var(--primary-soft)" strokeWidth="3" fill="none"/>
                    <circle cx="40" cy="60" r="9" fill="var(--primary)"/>
                    <circle cx="140" cy="60" r="9" fill="var(--primary)"/>
                    <circle cx="320" cy="60" r="9" fill="var(--primary)"/>
                    <circle cx="190" cy="150" r="9" fill="var(--primary-soft)"/>
                    <circle cx="280" cy="150" r="9" fill="var(--primary-soft)"/>
                    <text x="40" y="38" textAnchor="middle" style={{ fontSize: '12px', fontWeight: 600 }}>Основы</text>
                    <text x="140" y="38" textAnchor="middle" style={{ fontSize: '12px', fontWeight: 600 }}>Рекурсия</text>
                    <text x="320" y="38" textAnchor="middle" style={{ fontSize: '12px', fontWeight: 600 }}>Слияние</text>
                    <text x="235" y="188" textAnchor="middle" style={{ fontSize: '12px', fill: 'var(--muted)' }}>ветка: другой подход</text>
                    <text x="40" y="220" style={{ fontSize: '12px', fill: 'var(--muted)' }}>main</text>
                  </svg>
                </div>
              </div>
            )}

            {/* Panel 6: Portfolio */}
            {activeTab === 'folio' && (
              <div className="pink-panel" role="tabpanel">
                <div>
                  <h3>Портфолио, которое собирается само</h3>
                  <p className="d">Каждый сданный артефакт попадает на вашу публичную страницу с оценкой ИИ и исходным кодом.</p>
                  <ul className="pink-ticks">
                    <li><svg><use href="#i-check"/></svg><div><strong>Одна ссылка.</strong> <span>Отправьте работодателю или коллегам доказанные работы.</span></div></li>
                    <li><svg><use href="#i-check"/></svg><div><strong>Социальный профиль и стена.</strong> <span>Смотрите чужие траектории, комментируйте артефакты, обменивайтесь опытом.</span></div></li>
                  </ul>
                </div>
                <div className="pink-art pink-stack">
                  <p className="cap" style={{ margin: 0 }}>Публичная страница</p>
                  <div className="pink-box" style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: 'var(--muted)' }}>
                    /portfolio?portfolio=UID
                  </div>
                  <div className="pink-box">
                    <div className="pink-row">
                      <strong style={{ fontWeight: 500 }}>Балансировщик нагрузки</strong>
                      <span className="pink-chip">ИИ: 92</span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '4px' }}>Код и архитектурная схема</div>
                  </div>
                  <div className="pink-box">
                    <div className="pink-row">
                      <strong style={{ fontWeight: 500 }}>Анализ запросов к базе</strong>
                      <span className="pink-chip">ИИ: 88</span>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '4px' }}>Аналитический отчёт</div>
                  </div>
                </div>
              </div>
            )}

            {/* Panel 7: Productivity */}
            {activeTab === 'focus' && (
              <div className="pink-panel" role="tabpanel">
                <div>
                  <h3>Продуктивность встроена в обучение</h3>
                  <p className="d">Таймер, привычки и задачи работают рядом с графом и знают о ваших этапах.</p>
                  <ul className="pink-ticks">
                    <li><svg><use href="#i-check"/></svg><div><strong>Командный Помодоро.</strong> <span>Запускайте фокус-сессию вместе с группой или напарником.</span></div></li>
                    <li><svg><use href="#i-check"/></svg><div><strong>Привычки и стрики.</strong> <span>Ежедневная серия с защитой от выгорания.</span></div></li>
                    <li><svg><use href="#i-check"/></svg><div><strong>Задачи и заметки.</strong> <span>Планировщик спринтов с привязкой к этапам графа.</span></div></li>
                    <li><svg><use href="#i-check"/></svg><div><strong>Карма и XP.</strong> <span>Очки за закрытые модули, победы в спаррингах и помощь другим.</span></div></li>
                  </ul>
                </div>
                <div className="pink-art pink-stack">
                  <div className="pink-box pink-row" style={{ flexWrap: 'nowrap' }}>
                    <div>
                      <div className="cap" style={{ margin: '0 0 4px' }}>Помодоро</div>
                      <div style={{ font: '600 34px var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatPomoTime(pomodoroSeconds)}
                      </div>
                    </div>
                    <svg width="64" height="64" viewBox="0 0 72 72" style={{ flex: 'none', width: '64px', height: '64px' }} aria-hidden="true">
                      <circle cx="36" cy="36" r="30" fill="none" stroke="var(--container)" strokeWidth="8"/>
                      <circle cx="36" cy="36" r="30" fill="none" stroke="var(--primary)" strokeWidth="8" strokeLinecap="round" strokeDasharray="188" strokeDashoffset="62" transform="rotate(-90 36 36)" style={{ animation: 'pinkRingrun 24s linear infinite' }}/>
                    </svg>
                  </div>
                  <div className="pink-box pink-stack" style={{ gap: '10px' }}>
                    <div className="pink-row">
                      <span style={{ fontWeight: 500 }}>Привычка: 25 минут практики</span>
                      <span className="pink-chip">12 дней</span>
                    </div>
                    <div className="pink-dots">
                      <i className="on"></i><i className="on"></i><i className="on"></i><i className="on"></i><i className="on"></i><i className="on"></i><i></i>
                    </div>
                  </div>
                  <div className="pink-box pink-stack" style={{ gap: '10px' }}>
                    <div className="pink-row">
                      <span style={{ fontWeight: 500 }}>Карма</span>
                      <span className="pink-chip">1 240 XP</span>
                    </div>
                    <div className="pink-bar-p"><span style={{ width: '64%' }}></span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3 Steps */}
        <section id="how" className="pink-section" style={{ paddingTop: 0 }}>
          <div className="pink-wrap">
            <div className="pink-center">
              <p className="pink-eyebrow">Старт</p>
              <h2>Три шага до первого артефакта</h2>
            </div>
            <div className="pink-steps">
              <div className="pink-step">
                <div className="n">1</div>
                <h3>Войдите в один клик</h3>
                <p>Через аккаунт Google или в гостевом демо-режиме. Пароль не нужен.</p>
              </div>
              <div className="pink-step">
                <div className="n">2</div>
                <h3>Идите по графу</h3>
                <p>Закрывайте блоки, сдавайте «Чистый лист» и повторяйте узлы, которые подсвечены.</p>
              </div>
              <div className="pink-step">
                <div className="n">3</div>
                <h3>Покажите результат</h3>
                <p>Артефакты собираются в публичное портфолио, ссылкой на которое можно поделиться.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Cards */}
        <section className="pink-section" style={{ paddingTop: 0 }}>
          <div className="pink-wrap">
            <div className="pink-center">
              <p className="pink-eyebrow">Платформа</p>
              <h2>Работает там, где удобно вам</h2>
            </div>
            <div className="pink-cards">
              <div className="pink-cc">
                <div className="ic"><svg className="pink-sym"><use href="#i-desk"/></svg></div>
                <h3>Рабочий стол в браузере</h3>
                <p>Плавающие окна, док приложений, строка состояния и многозадачность.</p>
              </div>
              <div className="pink-cc">
                <div className="ic"><svg className="pink-sym"><use href="#i-phone"/></svg></div>
                <h3>Блоки на телефоне</h3>
                <p>Интерфейс сам перестраивается в привычный мобильный формат с полным набором функций.</p>
              </div>
              <div className="pink-cc">
                <div className="ic"><svg className="pink-sym"><use href="#i-sync"/></svg></div>
                <h3>Мгновенная синхронизация</h3>
                <p>Граф, заметки, задачи, XP и настройки сохраняются в облаке в реальном времени.</p>
              </div>
              <div className="pink-cc">
                <div className="ic"><svg className="pink-sym"><use href="#i-key"/></svg></div>
                <h3>Безопасный вход</h3>
                <p>Google-аккаунт в один клик или гостевой режим без пароля.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="pink-section" style={{ paddingTop: 0 }}>
          <div className="pink-wrap">
            <div className="pink-center">
              <p className="pink-eyebrow">Вопросы</p>
              <h2>Коротко о главном</h2>
            </div>
            <div className="pink-faq">
              <details open>
                <summary>Нужна ли регистрация?</summary>
                <p>Нет. Можно войти через Google-аккаунт в один клик или открыть гостевой демо-режим без пароля.</p>
              </details>
              <details>
                <summary>Как открываются новые блоки в графе?</summary>
                <p>Узел становится доступным, когда закрыты все предшествующие блоки с баллом не ниже проходного порога.</p>
              </details>
              <details>
                <summary>Что такое «Чистый лист»?</summary>
                <p>Это режим, в котором вы по памяти записываете ключевые идеи темы. ИИ проверяет полноту ответа, показывает пробелы и даёт точную обратную связь.</p>
              </details>
              <details>
                <summary>Можно ли учиться с телефона?</summary>
                <p>Да. На смартфоне рабочий стол автоматически превращается в блочный интерфейс со всеми функциями.</p>
              </details>
              <details>
                <summary>Как показать результаты другим?</summary>
                <p>Все сданные артефакты собираются на публичной странице портфолио. Ссылкой можно поделиться с работодателем или коллегами.</p>
              </details>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="pink-section" style={{ paddingTop: 0 }}>
          <div className="pink-wrap">
            <div className="pink-cta">
              <i className="pink-orb pink-o1" aria-hidden="true"></i>
              <i className="pink-orb pink-o2" aria-hidden="true"></i>
              <i className="pink-orb pink-o3" aria-hidden="true"></i>
              <i className="pink-orb pink-o4" aria-hidden="true"></i>
              <h2>Постройте свой первый граф знаний</h2>
              <p>Откройте демо и пройдите первый блок за несколько минут.</p>
              <button
                type="button"
                onClick={onStartFree}
                className="pink-btn pink-btn-filled cursor-pointer"
              >
                Открыть Pink Learn
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="pink-footer">
        <div className="pink-wrap">
          <div className="pink-fcols">
            <div>
              <a className="pink-logo" href="#top">Pink<b>In</b>Au</a>
              <p>IT-компания, которая делает продукты для обучения и совместной работы.</p>
            </div>
            <div>
              <h4>Pink Learn</h4>
              <ul>
                <li><a href="#features" onClick={() => setActiveTab('graph')}>Граф обучения</a></li>
                <li><a href="#features" onClick={() => setActiveTab('studio')}>Фокус-студия</a></li>
                <li><a href="#features" onClick={() => setActiveTab('sphere')}>Сфера знаний</a></li>
                <li><a href="#features" onClick={() => setActiveTab('spar')}>Спарринг</a></li>
              </ul>
            </div>
            <div>
              <h4>Ещё</h4>
              <ul>
                <li><a href="#features" onClick={() => setActiveTab('git')}>Git знаний</a></li>
                <li><a href="#features" onClick={() => setActiveTab('folio')}>Портфолио</a></li>
                <li><a href="#features" onClick={() => setActiveTab('focus')}>Продуктивность</a></li>
                <li><a href="#faq">Вопросы</a></li>
              </ul>
            </div>
          </div>
          <div className="pink-fbot">© 2026 PinkInAu. Все права защищены.</div>
        </div>
      </footer>
    </div>
  );
};
