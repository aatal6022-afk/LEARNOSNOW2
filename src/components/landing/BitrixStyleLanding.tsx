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
  const [selectedTab, setSelectedTab] = useState<string>('graph');
  const [currentXp, setCurrentXp] = useState<number>(1240);
  const [targetXp, setTargetXp] = useState<number>(1240);
  const [tipText, setTipText] = useState<string>('Нажмите на светящийся узел, чтобы пройти его.');
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [pomoSeconds, setPomoSeconds] = useState<number>(18 * 60 + 42);

  // DAG nodes interactive state
  const [dagState, setDagState] = useState<Record<string, 'done' | 'review' | 'open' | 'lock'>>({
    n0: 'done',
    n1: 'done',
    n2: 'review',
    n3: 'open',
    n4: 'lock',
    n5: 'lock',
  });

  const heroRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Scroll Progress & App Bar Shadow
  useEffect(() => {
    const bar = document.querySelector('.pink-scope .bar');
    const prog = document.getElementById('prog');

    const handleScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
      if (prog) prog.style.width = `${pct}%`;
      if (bar) bar.classList.toggle('lift', window.scrollY > 8);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Hero Mouse Parallax Effect
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    let raf = 0;
    const handlePointerMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = ((e.clientY - r.top) / r.height) * 2 - 1;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        hero.style.setProperty('--mx', x.toFixed(3));
        hero.style.setProperty('--my', y.toFixed(3));
      });
    };

    const handlePointerLeave = () => {
      hero.style.setProperty('--mx', '0');
      hero.style.setProperty('--my', '0');
    };

    hero.addEventListener('pointermove', handlePointerMove);
    hero.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      hero.removeEventListener('pointermove', handlePointerMove);
      hero.removeEventListener('pointerleave', handlePointerLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  // 3. Scroll Reveal (IntersectionObserver) for .rv
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;

    const items = containerRef.current?.querySelectorAll(
      '.center, .tabs, .step, .cc, details, .cta, footer .fcols'
    );
    if (!items || items.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target as HTMLElement;
          el.classList.add('in');
          io.unobserve(el);
          setTimeout(() => {
            el.style.transitionDelay = '';
          }, 1400);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );

    items.forEach((item) => {
      const el = item as HTMLElement;
      const parent = el.parentNode;
      if (parent) {
        const sibs = Array.from(parent.children).filter((s) => s.className === el.className);
        el.style.transitionDelay = `${(Math.max(0, sibs.indexOf(el)) % 4) * 90}ms`;
      }
      el.classList.add('rv');
      io.observe(el);
    });

    return () => io.disconnect();
  }, []);

  // 4. Pomodoro countdown timer when productivity tab is open
  useEffect(() => {
    if (selectedTab !== 'focus') return;
    const interval = setInterval(() => {
      setPomoSeconds((prev) => (prev > 0 ? prev - 1 : 25 * 60));
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedTab]);

  // 5. XP Number Ticker Animation
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

  // Confetti burst on completing DAG node
  const triggerBurst = (e: React.MouseEvent<SVGGElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ['var(--primary)', 'var(--primary-soft)', 'var(--container-hi)'];

    for (let i = 0; i < 28; i++) {
      const el = document.createElement('i');
      el.className = 'cf';
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 90;
      el.style.left = `${cx}px`;
      el.style.top = `${cy}px`;
      el.style.background = colors[i % 3];
      el.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      el.style.setProperty('--dy', `${Math.sin(angle) * dist + 40}px`);
      el.style.setProperty('--rot', `${Math.random() * 540 - 270}deg`);
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1000);
    }
  };

  const handleNodeClick = (nodeId: string, e: React.MouseEvent<SVGGElement>) => {
    const status = dagState[nodeId];
    if (status !== 'open' && status !== 'review') return;

    triggerBurst(e);

    const XP_MAP: Record<string, number> = { n2: 40, n3: 120, n4: 80, n5: 200 };
    const NAME_MAP: Record<string, string> = {
      n2: 'Практика повторена',
      n3: 'Спарринг пройден',
      n4: 'Квиз сдан',
      n5: 'Capstone защищён',
    };

    const nextState = { ...dagState, [nodeId]: 'done' as const };
    if (nextState.n2 === 'done' && nextState.n4 === 'lock') nextState.n4 = 'open';
    if (nextState.n3 === 'done' && nextState.n4 === 'done' && nextState.n5 === 'lock') nextState.n5 = 'open';

    setDagState(nextState);
    const added = XP_MAP[nodeId] || 50;
    setTargetXp((prev) => prev + added);

    if (nodeId === 'n5' || nextState.n5 === 'done') {
      setTipText('Граф пройден. Теперь работу можно добавить в портфолио.');
      setIsFinished(true);
    } else {
      setTipText(`+${added} XP. ${NAME_MAP[nodeId] || 'Узел пройден'}. Следующие узлы открыты.`);
    }
  };

  const handleResetDag = () => {
    setDagState({
      n0: 'done',
      n1: 'done',
      n2: 'review',
      n3: 'open',
      n4: 'lock',
      n5: 'lock',
    });
    setTargetXp(1240);
    setCurrentXp(1240);
    setTipText('Нажмите на светящийся узел, чтобы пройти его.');
    setIsFinished(false);
  };

  const formatPomoTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const reviewCount = Object.values(dagState).filter((s) => s === 'review').length;

  return (
    <div className="pink-scope" ref={containerRef}>
      {/* 1:1 EXACT ORIGINAL CSS STYLES AND ANIMATIONS */}
      <style>{`
        .pink-scope {
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

        .pink-scope * { box-sizing: border-box; }
        .pink-scope h1, .pink-scope h2, .pink-scope h3 { font-family: var(--font-display); margin: 0; text-wrap: balance; }
        .pink-scope a { color: inherit; }
        .pink-scope :focus-visible { outline: 3px solid var(--primary); outline-offset: 3px; border-radius: 10px; }
        .pink-scope .wrap { max-width: 1120px; margin-inline: auto; padding-inline: 20px; }

        /* buttons */
        .pink-scope .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font: 500 15px/1 var(--font-body); padding: 14px 26px; border-radius: 999px; border: 1px solid transparent; cursor: pointer; text-decoration: none; transition: background .15s, box-shadow .15s; }
        .pink-scope .btn-filled { background: var(--primary); color: var(--on-primary); position: relative; overflow: hidden; }
        .pink-scope .btn-filled:hover { background: var(--primary-hover); box-shadow: 0 2px 10px color-mix(in srgb, var(--primary) 40%, transparent); }
        .pink-scope .btn-filled::after { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 30%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent); transform: translateX(-120%) skewX(-20deg); animation: shine 4.5s 1.6s infinite; }
        .pink-scope .btn-tonal { background: var(--container); color: var(--on-container); }
        .pink-scope .btn-tonal:hover { background: var(--container-hi); }
        .pink-scope .btn-text { color: var(--primary); padding-inline: 14px; background: transparent; }
        .pink-scope .btn-text:hover { background: var(--surface); }
        .pink-scope .btn.sm { padding: 10px 20px; font-size: 14px; }

        /* Alpha version notice banner */
        .pink-scope .alpha-banner {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: color-mix(in srgb, var(--container) 80%, white);
          border: 1px solid var(--primary-soft);
          color: var(--on-container);
          font-size: 13px;
          padding: 8px 18px;
          border-radius: 999px;
          margin-bottom: 18px;
          box-shadow: 0 4px 14px rgba(200, 38, 106, 0.12);
          animation: rise .7s backwards;
        }
        .pink-scope .alpha-tag {
          background: var(--primary);
          color: var(--on-primary);
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: .08em;
          padding: 2px 7px;
          border-radius: 999px;
          text-transform: uppercase;
        }
        .pink-scope .alpha-link {
          color: var(--primary);
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color .15s;
        }
        .pink-scope .alpha-link:hover {
          color: var(--primary-hover);
        }
        .pink-scope .alpha-foot-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--container);
          color: var(--on-container);
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 12.5px;
          border: 1px solid var(--primary-soft);
        }

        /* app bar */
        .pink-scope .bar { position: sticky; top: 0; z-index: 40; background: color-mix(in srgb, var(--bg) 92%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
        .pink-scope .bar.lift { box-shadow: 0 2px 18px rgba(120,20,60,.10); }
        .pink-scope .bar .wrap { display: flex; align-items: center; gap: 16px; height: 64px; }
        .pink-scope .logo { font-family: var(--font-display); font-weight: 600; font-size: 23px; letter-spacing: -.02em; text-decoration: none; display: inline-flex; }
        .pink-scope .logo b { color: var(--primary); font-weight: 600; }
        .pink-scope .bar nav { display: flex; gap: 2px; margin-left: 24px; }
        .pink-scope .bar nav a { text-decoration: none; font-size: 15px; font-weight: 500; color: var(--muted); padding: 8px 14px; border-radius: 999px; transition: background .15s, color .15s; }
        .pink-scope .bar nav a:hover { background: var(--surface); color: var(--fg); }
        .pink-scope .bar .spacer { flex: 1; }
        @media (max-width:760px){ .pink-scope .bar nav { display: none; } }
        .pink-scope .prog { position: absolute; left: 0; bottom: -1px; height: 3px; width: 0; background: linear-gradient(90deg, var(--primary-soft), var(--primary)); border-radius: 0 3px 3px 0; }

        /* hero */
        .pink-scope .hero { position: relative; overflow: hidden; background: radial-gradient(60% 50% at 15% 0%, color-mix(in srgb, var(--primary-soft) 38%, transparent), transparent 70%), radial-gradient(50% 45% at 90% 10%, color-mix(in srgb, var(--container-hi) 70%, transparent), transparent 70%); }
        .pink-scope .hero .wrap { position: relative; z-index: 1; }
        .pink-scope .hero-in { text-align: center; padding-block: clamp(44px, 8vw, 88px) 40px; }
        .pink-scope .pill { display: inline-flex; align-items: center; gap: 8px; background: var(--container); color: var(--on-container); font-size: 13.5px; font-weight: 500; padding: 6px 14px 6px 10px; border-radius: 999px; margin-bottom: 22px; animation: rise .7s .05s backwards; }
        .pink-scope .pill i { width: 8px; height: 8px; border-radius: 50%; background: var(--primary); }
        .pink-scope .hero h1 { font-weight: 600; font-size: clamp(38px, 7.4vw, 76px); line-height: 1.04; letter-spacing: -.035em; max-width: 16ch; margin-inline: auto; animation: rise .8s .15s backwards; }
        .pink-scope .hero h1 em { font-style: normal; background: linear-gradient(90deg, var(--primary), var(--primary-soft), var(--primary-hover), var(--primary)); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; animation: sheen 6s linear infinite; }
        .pink-scope .hero p.sub { font-size: clamp(17px, 2.2vw, 21px); color: var(--muted); max-width: 44ch; margin: 22px auto 30px; animation: rise .8s .3s backwards; }
        .pink-scope .cta-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; animation: rise .8s .42s backwards; }
        .pink-scope .hint { font-size: 13.5px; color: var(--muted); margin: 16px 0 0; animation: rise .8s .52s backwards; }

        /* atmosphere blobs with cursor parallax */
        .pink-scope .blob { position: absolute; border-radius: 50%; filter: blur(60px); pointer-events: none; translate: calc(var(--mx, 0) * 30px) calc(var(--my, 0) * 20px); transition: translate .4s ease-out; }
        .pink-scope .b1 { width: 420px; height: 420px; left: -120px; top: -100px; background: var(--primary-soft); opacity: .45; animation: drift 16s ease-in-out infinite alternate; }
        .pink-scope .b2 { width: 360px; height: 360px; right: -100px; top: 60px; background: var(--container-hi); opacity: .9; animation: drift 20s -6s ease-in-out infinite alternate; }
        .pink-scope .b3 { width: 300px; height: 300px; left: 40%; bottom: -120px; background: var(--primary-soft); opacity: .3; animation: drift 18s -3s ease-in-out infinite alternate; }

        /* Web OS mock */
        .pink-scope .desk { position: relative; border-radius: 28px; padding: clamp(14px, 3vw, 34px) clamp(14px, 3vw, 34px) 18px; margin-bottom: clamp(40px, 6vw, 72px); background: linear-gradient(140deg, color-mix(in srgb, var(--primary-soft) 55%, var(--container)), var(--container-hi) 60%, var(--container)); border: 1px solid var(--line); animation: rise 1s .55s backwards; }
        .pink-scope .win { background: var(--bg); border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 18px 50px rgba(120,20,60,.18); overflow: hidden; text-align: left; }
        .pink-scope .win .tb { display: flex; align-items: center; gap: 7px; padding: 11px 14px; background: var(--surface); border-bottom: 1px solid var(--line); }
        .pink-scope .win .tb i { width: 11px; height: 11px; border-radius: 50%; background: var(--container-hi); }
        .pink-scope .win .tb i:first-child { background: var(--primary-soft); }
        .pink-scope .win .tb span { flex: 1; text-align: center; font-size: 13px; font-weight: 500; color: var(--muted); margin-right: 40px; }
        .pink-scope .win .body { padding: 14px; }
        .pink-scope .win .status { display: flex; gap: 18px; flex-wrap: wrap; padding: 9px 14px; border-top: 1px solid var(--line); background: var(--surface); font: 500 12px var(--font-mono); color: var(--muted); }
        .pink-scope .win .status b { color: var(--primary); font-weight: 500; }
        .pink-scope .desk .win.main { max-width: 860px; margin-inline: auto; }
        .pink-scope .win.float { position: absolute; right: clamp(14px, 4vw, 60px); bottom: 96px; width: min(300px, 34%); box-shadow: 0 22px 60px rgba(120,20,60,.28); animation: bob 6s ease-in-out infinite; translate: calc(var(--mx, 0) * -16px) calc(var(--my, 0) * -10px); transition: translate .35s ease-out; }
        .pink-scope .win.float .body { display: grid; gap: 10px; }
        .pink-scope .skel { height: 8px; border-radius: 4px; background: linear-gradient(90deg, var(--container) 30%, var(--container-hi) 50%, var(--container) 70%); background-size: 200% 100%; animation: sheen 2.6s linear infinite; }
        .pink-scope .skel.w1 { width: 92%; }
        .pink-scope .skel.w2 { width: 70%; }
        .pink-scope .skel.w3 { width: 81%; }
        .pink-scope .bar-p { height: 8px; border-radius: 4px; background: var(--container); overflow: hidden; }
        .pink-scope .bar-p span { display: block; height: 100%; width: 72%; background: var(--primary); border-radius: 4px; animation: grow 1.4s .3s ease-out backwards; }
        .pink-scope .mini { font-size: 12px; color: var(--muted); display: flex; justify-content: space-between; gap: 8px; }
        .pink-scope .dock { display: flex; justify-content: center; gap: 10px; margin: 22px auto 0; width: max-content; max-width: 100%; padding: 8px 12px; border-radius: 20px; background: color-mix(in srgb, var(--bg) 60%, transparent); border: 1px solid color-mix(in srgb, var(--bg) 70%, transparent); translate: calc(var(--mx, 0) * 8px) 0; transition: translate .35s ease-out; }
        .pink-scope .dock span { width: 42px; height: 42px; border-radius: 13px; background: var(--bg); color: var(--primary); display: grid; place-items: center; box-shadow: 0 2px 6px rgba(120,20,60,.12); transition: transform .25s cubic-bezier(.3, 1.6, .5, 1), background .2s; cursor: pointer; }
        .pink-scope .dock span:hover { transform: translateY(-10px) scale(1.18); }
        .pink-scope .dock span.on { background: var(--primary); color: var(--on-primary); }
        @media (max-width:760px){ .pink-scope .win.float { display: none; } .pink-scope .dock span { width: 38px; height: 38px; } }
        .pink-scope .sym { width: 22px; height: 22px; }

        /* DAG */
        .pink-scope .dag svg { display: block; width: 100%; height: auto; }
        .pink-scope .dag .edge { stroke: var(--line); stroke-width: 2; fill: none; transition: stroke .6s; stroke-dasharray: 420; animation: draw 1.3s .8s ease-out backwards; }
        .pink-scope .dag .edge.on { stroke: var(--primary-soft); }
        .pink-scope .dag text { font-family: var(--font-body); font-size: 13px; font-weight: 500; fill: var(--fg); pointer-events: none; transition: fill .5s; }
        .pink-scope .node { transform-box: fill-box; transform-origin: center; animation: pop .6s calc(.6s + var(--d, 0s)) cubic-bezier(.3, 1.5, .5, 1) backwards; }
        .pink-scope .node .c { fill: var(--bg); stroke: var(--line); stroke-width: 2; transition: fill .5s, stroke .5s; }
        .pink-scope .node.s-done .c { fill: var(--primary); stroke: var(--primary); }
        .pink-scope .node.s-done text { fill: var(--on-primary); }
        .pink-scope .node.s-review .c { stroke: var(--primary); stroke-width: 2.5; stroke-dasharray: 5 4; animation: dashmove 1.4s linear infinite; }
        .pink-scope .node.s-open .c { fill: var(--container); stroke: var(--primary-soft); stroke-width: 2.5; animation: breathe 2s ease-in-out infinite; }
        .pink-scope .node.s-lock text { fill: var(--muted); }
        .pink-scope .node .pulse { fill: none; stroke: var(--primary); stroke-width: 2; opacity: 0; transform-box: fill-box; transform-origin: center; pointer-events: none; }
        .pink-scope .node.s-open .pulse, .pink-scope .node.s-review .pulse { animation: ping 1.8s ease-out infinite; }
        .pink-scope .node.act { cursor: pointer; transition: transform .2s; }
        .pink-scope .node.act:hover { transform: scale(1.08); }
        .pink-scope .node:focus-visible { outline: none; }
        .pink-scope .node:focus-visible .c { stroke: var(--primary); stroke-width: 4; }
        .pink-scope .legend { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 10px; font-size: 13px; color: var(--muted); }
        .pink-scope .legend i { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 6px; vertical-align: -1px; }
        .pink-scope .l-done { background: var(--primary); }
        .pink-scope .l-review { border: 2px dashed var(--primary); }
        .pink-scope .l-open { background: var(--container); border: 2px solid var(--primary-soft); }
        .pink-scope .l-lock { border: 2px solid var(--line); }
        .pink-scope .tip { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 8px; font-size: 14px; color: var(--fg); min-height: 38px; }
        .pink-scope .tip b { color: var(--primary); }

        /* marquee */
        .pink-scope .mq { border-block: 1px solid var(--line); padding-block: 16px; overflow: hidden; -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
        .pink-scope .mq-track { display: flex; width: max-content; animation: marquee 42s linear infinite; }
        .pink-scope .mq:hover .mq-track { animation-play-state: paused; }
        .pink-scope .mq-group { display: flex; gap: 12px; padding-right: 12px; }
        .pink-scope .mq-chip { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; background: var(--surface); border: 1px solid var(--line); border-radius: 999px; padding: 9px 18px; font-weight: 500; font-size: 15px; }
        .pink-scope .mq-chip svg { width: 18px; height: 18px; color: var(--primary); }

        /* sections */
        .pink-scope section { padding-block: clamp(56px, 8vw, 104px); }
        .pink-scope .eyebrow { font: 500 12.5px var(--font-mono); letter-spacing: .12em; text-transform: uppercase; color: var(--primary); margin: 0 0 12px; }
        .pink-scope h2 { font-weight: 600; font-size: clamp(30px, 4.6vw, 48px); line-height: 1.1; letter-spacing: -.025em; }
        .pink-scope .lead { color: var(--muted); font-size: 18px; max-width: 58ch; margin: 16px 0 0; }
        .pink-scope .center { text-align: center; }
        .pink-scope .center .lead { margin-inline: auto; }

        /* scroll reveal */
        .pink-scope .rv { opacity: .3; transform: translateY(28px); transition: opacity .7s ease, transform .7s cubic-bezier(.2, .7, .2, 1); }
        .pink-scope .rv.in { opacity: 1; transform: none; }

        /* tabs */
        .pink-scope .tabs { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px; margin: 36px 0 28px; scrollbar-width: thin; justify-content: flex-start; }
        @media (min-width:1000px){ .pink-scope .tabs { justify-content: center; } }
        .pink-scope .tab { flex: none; font: 500 15px var(--font-body); color: var(--fg); background: transparent; border: 1px solid var(--line); padding: 10px 20px; border-radius: 999px; cursor: pointer; transition: background .15s, color .15s, border-color .15s, transform .2s; }
        .pink-scope .tab:hover { background: var(--surface); }
        .pink-scope .tab:active { transform: scale(.96); }
        .pink-scope .tab[aria-selected="true"] { background: var(--container); border-color: var(--container); color: var(--on-container); }

        .pink-scope .panel { display: grid; grid-template-columns: 1fr 1.1fr; gap: clamp(24px, 5vw, 64px); align-items: center; background: var(--surface); border-radius: 32px; padding: clamp(24px, 5vw, 56px); animation: rise .55s backwards; }
        .pink-scope .panel[hidden] { display: none; }
        @media (max-width:860px){ .pink-scope .panel { grid-template-columns: 1fr; } }
        .pink-scope .panel > * { min-width: 0; }
        .pink-scope .panel h3 { font-weight: 600; font-size: clamp(26px, 3.4vw, 36px); line-height: 1.15; letter-spacing: -.02em; }
        .pink-scope .panel p.d { color: var(--muted); font-size: 17px; margin: 14px 0 0; }
        .pink-scope .ticks { list-style: none; margin: 22px 0 0; padding: 0; display: grid; gap: 12px; }
        .pink-scope .ticks li { display: grid; grid-template-columns: 22px 1fr; gap: 12px; font-size: 16px; animation: rise .5s backwards; }
        .pink-scope .ticks li:nth-child(1) { animation-delay: .15s; }
        .pink-scope .ticks li:nth-child(2) { animation-delay: .25s; }
        .pink-scope .ticks li:nth-child(3) { animation-delay: .35s; }
        .pink-scope .ticks li:nth-child(4) { animation-delay: .45s; }
        .pink-scope .ticks svg { width: 22px; height: 22px; color: var(--primary); margin-top: 1px; }
        .pink-scope .ticks span { color: var(--muted); }
        .pink-scope .ticks strong { font-weight: 500; color: var(--fg); }

        .pink-scope .art { background: var(--bg); border: 1px solid var(--line); border-radius: 22px; padding: 18px; min-width: 0; box-shadow: 0 8px 28px rgba(120,20,60,.08); animation: rise .7s .12s backwards; }
        .pink-scope .art .cap { font: 500 12px var(--font-mono); color: var(--muted); letter-spacing: .06em; text-transform: uppercase; margin: 0 0 12px; }
        .pink-scope .box { border: 1px solid var(--line); border-radius: 14px; padding: 14px; background: var(--bg); animation: rise .5s backwards; }
        .pink-scope .art > :nth-child(2) { animation-delay: .2s; }
        .pink-scope .art > :nth-child(3) { animation-delay: .3s; }
        .pink-scope .art > :nth-child(4) { animation-delay: .4s; }
        .pink-scope .stack { display: grid; gap: 12px; }
        .pink-scope .chip { display: inline-block; background: var(--container); color: var(--on-container); font-size: 12.5px; font-weight: 500; padding: 3px 10px; border-radius: 999px; }
        .pink-scope .row { display: flex; align-items: center; gap: 10px; justify-content: space-between; flex-wrap: wrap; }
        .pink-scope .opt { border: 1px solid var(--line); border-radius: 12px; padding: 10px 14px; font-size: 14px; display: flex; gap: 10px; align-items: center; }
        .pink-scope .opt.ok { border-color: var(--primary); background: var(--surface); }
        .pink-scope .opt i { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--line); flex: none; }
        .pink-scope .opt.ok i { border-color: var(--primary); background: var(--primary); }
        .pink-scope .art svg { display: block; width: 100%; height: auto; }
        .pink-scope .art svg text { font-family: var(--font-body); font-size: 14px; fill: var(--fg); font-weight: 500; }
        .pink-scope .mono { font-family: var(--font-mono); font-size: 12.5px; color: var(--muted); word-break: break-all; }
        .pink-scope .dots { display: flex; gap: 6px; flex-wrap: wrap; }
        .pink-scope .dots i { width: 18px; height: 18px; border-radius: 6px; background: var(--container); }
        .pink-scope .dots i.on { background: var(--primary); animation: pop .4s backwards; }
        .pink-scope .dots i:nth-child(1){ animation-delay: .1s; } .pink-scope .dots i:nth-child(2){ animation-delay: .2s; } .pink-scope .dots i:nth-child(3){ animation-delay: .3s; } .pink-scope .dots i:nth-child(4){ animation-delay: .4s; } .pink-scope .dots i:nth-child(5){ animation-delay: .5s; } .pink-scope .dots i:nth-child(6){ animation-delay: .6s; } .pink-scope .dots i:nth-child(7){ animation-delay: .7s; }

        /* In-tab diagram dynamic keyframe classes */
        .pink-scope .stk { animation: bob 3.4s ease-in-out infinite; }
        .pink-scope .spin { animation: spin 50s linear infinite; transform-origin: 200px 150px; }
        .pink-scope .core { transform-box: fill-box; transform-origin: center; animation: beat 2.4s ease-in-out infinite; }
        .pink-scope .cur { animation: wander1 5s ease-in-out infinite; }
        .pink-scope .cur.b { animation: wander2 6s ease-in-out infinite; }
        .pink-scope .gdraw { stroke-dasharray: 1; animation: gdraw 1.4s .2s ease-out backwards; }
        .pink-scope .gnode { transform-box: fill-box; transform-origin: center; animation: pop .5s backwards; }
        .pink-scope .ringc { animation: ringrun 24s linear infinite; }

        /* steps */
        .pink-scope .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 16px; margin-top: 44px; }
        .pink-scope .step { background: var(--surface); border-radius: 28px; padding: 28px; min-width: 0; transition: translate .25s, box-shadow .25s, opacity .7s ease, transform .7s cubic-bezier(.2,.7,.2,1); }
        .pink-scope .step:hover { translate: 0 -6px; box-shadow: 0 14px 30px rgba(120,20,60,.10); }
        .pink-scope .step .n { width: 44px; height: 44px; border-radius: 50%; background: var(--primary); color: var(--on-primary); display: grid; place-items: center; font: 600 20px var(--font-display); margin-bottom: 18px; position: relative; }
        .pink-scope .step .n::after { content: ""; position: absolute; inset: 0; border-radius: 50%; border: 2px solid var(--primary); animation: ping 2.6s ease-out infinite; }
        .pink-scope .step:nth-child(2) .n::after { animation-delay: .6s; }
        .pink-scope .step:nth-child(3) .n::after { animation-delay: 1.2s; }
        .pink-scope .step h3 { font-weight: 600; font-size: 22px; margin-bottom: 8px; }
        .pink-scope .step p { margin: 0; color: var(--muted); }

        /* cards everywhere */
        .pink-scope .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 16px; margin-top: 44px; }
        .pink-scope .cc { border: 1px solid var(--line); border-radius: 24px; padding: 26px; min-width: 0; transition: translate .25s, border-color .25s, box-shadow .25s, opacity .7s ease, transform .7s cubic-bezier(.2,.7,.2,1); }
        .pink-scope .cc:hover { translate: 0 -6px; border-color: var(--primary-soft); box-shadow: 0 14px 30px rgba(120,20,60,.10); }
        .pink-scope .cc .ic { width: 48px; height: 48px; border-radius: 16px; background: var(--container); color: var(--on-container); display: grid; place-items: center; margin-bottom: 16px; transition: transform .3s cubic-bezier(.3, 1.6, .5, 1); }
        .pink-scope .cc:hover .ic { transform: rotate(-8deg) scale(1.1); }
        .pink-scope .cc .ic svg { width: 24px; height: 24px; }
        .pink-scope .cc h3 { font-weight: 600; font-size: 19px; margin-bottom: 6px; }
        .pink-scope .cc p { margin: 0; color: var(--muted); font-size: 15.5px; }

        /* faq */
        .pink-scope .faq { max-width: 760px; margin: 40px auto 0; }
        .pink-scope details { border-bottom: 1px solid var(--line); }
        .pink-scope summary { list-style: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 22px 4px; font: 500 19px var(--font-display); }
        .pink-scope summary::-webkit-details-marker { display: none; }
        .pink-scope summary::after { content: ""; flex: none; width: 12px; height: 12px; border-right: 2.5px solid var(--primary); border-bottom: 2.5px solid var(--primary); transform: rotate(45deg) translate(-2px, -2px); transition: transform .2s; }
        .pink-scope details[open] summary::after { transform: rotate(-135deg) translate(-2px, -2px); }
        .pink-scope details p { margin: 0; padding: 0 4px 22px; color: var(--muted); font-size: 16.5px; max-width: 62ch; }

        /* cta */
        .pink-scope .cta { background: linear-gradient(135deg, var(--container), var(--container-hi)); border-radius: 40px; text-align: center; padding: clamp(44px, 8vw, 88px) 20px; position: relative; overflow: hidden; }
        .pink-scope .cta > *:not(.orb) { position: relative; z-index: 1; }
        .pink-scope .orb { position: absolute; border-radius: 50%; background: var(--primary-soft); pointer-events: none; }
        .pink-scope .o1 { width: 180px; height: 180px; left: -40px; top: -50px; opacity: .4; animation: wander1 9s ease-in-out infinite; }
        .pink-scope .o2 { width: 110px; height: 110px; right: 9%; top: 18%; opacity: .28; animation: wander2 7s ease-in-out infinite; }
        .pink-scope .o3 { width: 230px; height: 230px; right: -60px; bottom: -90px; opacity: .35; animation: wander1 11s ease-in-out infinite; }
        .pink-scope .o4 { width: 70px; height: 70px; left: 14%; bottom: 14%; opacity: .3; animation: wander2 8s ease-in-out infinite; }
        .pink-scope .cta h2 { max-width: 18ch; margin-inline: auto; font-size: clamp(30px, 4.6vw, 48px); }
        .pink-scope .cta p { color: var(--on-container); opacity: .8; margin: 16px auto 30px; font-size: 18px; max-width: 42ch; }

        /* footer */
        .pink-scope footer { background: var(--footer); margin-top: clamp(56px, 8vw, 104px); border-top: 1px solid var(--line); }
        .pink-scope .fcols { display: grid; grid-template-columns: 1.4fr repeat(2, 1fr); gap: 32px; padding-block: 48px 32px; }
        @media (max-width:700px){ .pink-scope .fcols { grid-template-columns: 1fr 1fr; } .pink-scope .fcols > div:first-child { grid-column: 1 / -1; } }
        .pink-scope .fcols h4 { font: 500 14px var(--font-body); margin: 0 0 14px; }
        .pink-scope .fcols ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
        .pink-scope .fcols a { text-decoration: none; color: var(--muted); font-size: 14.5px; }
        .pink-scope .fcols a:hover { color: var(--primary); text-decoration: underline; }
        .pink-scope .fcols p { color: var(--muted); font-size: 14.5px; margin: 12px 0 0; max-width: 30ch; }
        .pink-scope .fbot { border-top: 1px solid var(--line); padding-block: 20px; color: var(--muted); font-size: 13.5px; }

        /* Confetti particle */
        .pink-scope .cf, i.cf { position: fixed; width: 9px; height: 9px; border-radius: 2px; pointer-events: none; z-index: 9999; animation: cf .95s cubic-bezier(.2, .8, .4, 1) forwards; }

        /* ---------- EXACT KEYFRAMES ---------- */
        @keyframes rise { from { opacity: 0; transform: translateY(22px); } }
        @keyframes drift { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,30px) scale(1.12); } 100% { transform: translate(-30px,50px) scale(.95); } }
        @keyframes bob { 50% { transform: translateY(-10px); } }
        @keyframes draw { from { stroke-dashoffset: 420; } }
        @keyframes pop { from { opacity: 0; transform: scale(.5); } }
        @keyframes ping { from { opacity: .6; transform: scale(1); } to { opacity: 0; transform: scale(1.55); } }
        @keyframes dashmove { to { stroke-dashoffset: -18; } }
        @keyframes breathe { 50% { stroke: var(--primary); } }
        @keyframes sheen { from { background-position: 0 0; } to { background-position: 200% 0; } }
        @keyframes shine { 0%, 65% { transform: translateX(-120%) skewX(-20deg); } 100% { transform: translateX(420%) skewX(-20deg); } }
        @keyframes marquee { to { transform: translateX(-50%); } }
        @keyframes grow { from { width: 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes beat { 50% { transform: scale(1.1); } }
        @keyframes wander1 { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(34px,-26px); } }
        @keyframes wander2 { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-40px,22px); } }
        @keyframes gdraw { from { stroke-dashoffset: 1; } }
        @keyframes ringrun { from { stroke-dashoffset: 62; } to { stroke-dashoffset: 188; } }
        @keyframes cf { to { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0; } }
      `}</style>

      {/* SVG Symbols */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <symbol id="i-graph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="9" r="2.5"/><circle cx="9" cy="18" r="2.5"/><path d="M8 7l8 1.5M7.5 8.3L8.5 15.5M16.5 11l-6 5.5"/></symbol>
        <symbol id="i-studio" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l9-4 9 4-9 4-9-4z"/><path d="M7 10.5V15c0 1.5 2.200 3 5 3s5-1.500 5-3v-4.500"/></symbol>
        <symbol id="i-sphere" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.200"/></symbol>
        <symbol id="i-spar" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.500"/><path d="M3 20c0-3.300 2.200-5.500 5-5.500s5 2.200 5 5.500M14.500 15c2.800-.5 6 .9 6.500 5"/></symbol>
        <symbol id="i-git" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="5" r="2.200"/><circle cx="6" cy="19" r="2.200"/><circle cx="18" cy="9" r="2.200"/><path d="M6 7.200v9.600M18 11.200c0 4-6 3-11 6"/></symbol>
        <symbol id="i-folio" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2.500"/><path d="M9 7V5.500A1.500 1.500 0 0 1 10.500 4h3A1.500 1.500 0 0 1 15 5.500V7M3 13h18"/></symbol>
        <symbol id="i-focus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.500 2M9.500 2.500h5"/></symbol>
        <symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" strokeWidth="1.8"/><path d="M8 12.500l3 3 5-6"/></symbol>
        <symbol id="i-desk" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="13" rx="2.500"/><path d="M8 21h8M12 17v4"/></symbol>
        <symbol id="i-phone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2.500" width="10" height="19" rx="2.500"/><path d="M11 18.500h2"/></symbol>
        <symbol id="i-sync" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 8a8 8 0 0 0-14-2.500L4 8M4 4v4h4M4 16a8 8 0 0 0 14 2.500L20 16M20 20v-4h-4"/></symbol>
        <symbol id="i-key" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/></symbol>
      </svg>

      {/* Sticky App Bar with Progress */}
      <div className="bar">
        <div className="wrap">
          <a className="logo" href="#top" id="top">Pink<b>In</b>Au</a>
          <nav aria-label="Разделы">
            <a href="#features">Возможности</a>
            <a href="#how">Как это работает</a>
            <a href="#faq">Вопросы</a>
          </nav>
          <span className="spacer"></span>
          <button type="button" onClick={onStartFree} className="btn btn-filled sm">Попробовать</button>
        </div>
        <div className="prog" id="prog"></div>
      </div>

      <main>
        {/* HERO SECTION */}
        <div className="hero" ref={heroRef}>
          <div className="blob b1" aria-hidden="true"></div>
          <div className="blob b2" aria-hidden="true"></div>
          <div className="blob b3" aria-hidden="true"></div>

          <div className="wrap">
            <div className="hero-in">
              <div className="alpha-banner">
                <span className="alpha-tag">Alpha Preview</span>
                <span>⚠️ Ранняя альфа-версия. Если нашли баги или есть пожелания — пишите: <a href="https://t.me/pinkinauceo" target="_blank" rel="noopener noreferrer" className="alpha-link">@pinkinauceo</a></span>
              </div>

              <div>
                <span className="pill"><i></i>Pink Learn от PinkInAu</span>
              </div>
              <h1>Учитесь так, как <em>работает память</em></h1>
              <p className="sub">Платформа, которая превращает тему в граф знаний, а каждый модуль в готовую работу для портфолио.</p>
              <div className="cta-row">
                <button type="button" onClick={onEnterDemoDesktop || onStartFree} className="btn btn-filled">
                  Открыть демо без пароля
                </button>
                <button type="button" onClick={onLogin} className="btn btn-tonal">
                  Войти через Google
                </button>
              </div>
              <p className="hint">Вход в один клик. Гостевой режим работает без регистрации.</p>
            </div>

            <div className="desk" aria-label="Пример окна Pink Learn">
              <div className="win main">
                <div className="tb"><i></i><i></i><i></i><span>Граф: Алгоритмы и структуры данных</span></div>
                <div className="body dag">
                  <svg viewBox="0 0 560 280" role="group" id="dagsvg" aria-label="Интерактивный граф обучения. Нажмите на светящийся узел, чтобы пройти его.">
                    <path className={`edge ${dagState.n0 === 'done' ? 'on' : ''}`} id="e1" d="M70 140 C120 140 120 70 175 70"/>
                    <path className={`edge ${dagState.n0 === 'done' ? 'on' : ''}`} id="e2" d="M70 140 C120 140 120 210 175 210"/>
                    <path className={`edge ${dagState.n1 === 'done' ? 'on' : ''}`} id="e3" d="M235 70 C300 70 300 105 350 105"/>
                    <path className={`edge ${dagState.n2 === 'done' ? 'on' : ''}`} id="e4" d="M235 210 C300 210 300 175 350 175"/>
                    <path className={`edge ${dagState.n3 === 'done' ? 'on' : ''}`} id="e5" d="M410 105 C455 105 455 140 480 140"/>
                    <path className={`edge ${dagState.n4 === 'done' ? 'on' : ''}`} id="e6" d="M410 175 C455 175 455 140 480 140"/>

                    <g className={`node s-${dagState.n0} ${dagState.n0 === 'open' || dagState.n0 === 'review' ? 'act' : ''}`} data-id="n0" style={{ ['--d' as any]: '0s' }} onClick={(e) => handleNodeClick('n0', e)}>
                      <circle className="pulse" cx="42" cy="140" r="30"/><circle className="c" cx="42" cy="140" r="30"/><text x="42" y="145" textAnchor="middle">Основы</text>
                    </g>
                    <g className={`node s-${dagState.n1} ${dagState.n1 === 'open' || dagState.n1 === 'review' ? 'act' : ''}`} data-id="n1" style={{ ['--d' as any]: '.12s' }} onClick={(e) => handleNodeClick('n1', e)}>
                      <circle className="pulse" cx="205" cy="70" r="32"/><circle className="c" cx="205" cy="70" r="32"/><text x="205" y="75" textAnchor="middle">Теория</text>
                    </g>
                    <g className={`node s-${dagState.n2} ${dagState.n2 === 'open' || dagState.n2 === 'review' ? 'act' : ''}`} data-id="n2" style={{ ['--d' as any]: '.24s' }} onClick={(e) => handleNodeClick('n2', e)}>
                      <circle className="pulse" cx="205" cy="210" r="32"/><circle className="c" cx="205" cy="210" r="32"/><text x="205" y="215" textAnchor="middle">Практика</text>
                    </g>
                    <g className={`node s-${dagState.n3} ${dagState.n3 === 'open' || dagState.n3 === 'review' ? 'act' : ''}`} data-id="n3" style={{ ['--d' as any]: '.36s' }} onClick={(e) => handleNodeClick('n3', e)}>
                      <circle className="pulse" cx="380" cy="105" r="32"/><circle className="c" cx="380" cy="105" r="32"/><text x="380" y="110" textAnchor="middle">Спарринг</text>
                    </g>
                    <g className={`node s-${dagState.n4} ${dagState.n4 === 'open' || dagState.n4 === 'review' ? 'act' : ''}`} data-id="n4" style={{ ['--d' as any]: '.48s' }} onClick={(e) => handleNodeClick('n4', e)}>
                      <circle className="pulse" cx="380" cy="175" r="32"/><circle className="c" cx="380" cy="175" r="32"/><text x="380" y="180" textAnchor="middle">Квиз</text>
                    </g>
                    <g className={`node s-${dagState.n5} ${dagState.n5 === 'open' || dagState.n5 === 'review' ? 'act' : ''}`} data-id="n5" style={{ ['--d' as any]: '.6s' }} onClick={(e) => handleNodeClick('n5', e)}>
                      <circle className="pulse" cx="510" cy="140" r="34"/><circle className="c" cx="510" cy="140" r="34"/><text x="510" y="145" textAnchor="middle">Capstone</text>
                    </g>
                  </svg>
                  <div className="legend">
                    <span><i className="l-done"></i>Пройдено</span>
                    <span><i className="l-review"></i>Пора повторить</span>
                    <span><i className="l-open"></i>Доступно</span>
                    <span><i className="l-lock"></i>Закрыто</span>
                  </div>
                  <div className="tip" aria-live="polite">
                    <span id="tip">{tipText}</span>
                    {isFinished && (
                      <button className="btn btn-text sm" id="resetDag" type="button" onClick={handleResetDag}>
                        Пройти заново
                      </button>
                    )}
                  </div>
                </div>
                <div className="status">
                  <span>XP <b id="xp">{currentXp.toLocaleString('ru-RU')}</b></span>
                  <span>Стрик <b>12 дней</b></span>
                  <span>Повторить <b id="revn">{reviewCount ? `${reviewCount} тема` : 'всё повторено'}</b></span>
                </div>
              </div>

              <div className="win float" aria-hidden="true">
                <div className="tb"><i></i><i></i><i></i><span>Чистый лист</span></div>
                <div className="body">
                  <div className="skel w1"></div><div className="skel w2"></div><div className="skel w3"></div>
                  <div className="mini"><span>Полнота ответа</span><b>72%</b></div>
                  <div className="bar-p"><span></span></div>
                </div>
              </div>

              <div className="dock" aria-hidden="true">
                <span className={selectedTab === 'graph' ? 'on' : ''} onClick={() => setSelectedTab('graph')}><svg className="sym"><use href="#i-graph"/></svg></span>
                <span className={selectedTab === 'studio' ? 'on' : ''} onClick={() => setSelectedTab('studio')}><svg className="sym"><use href="#i-studio"/></svg></span>
                <span className={selectedTab === 'sphere' ? 'on' : ''} onClick={() => setSelectedTab('sphere')}><svg className="sym"><use href="#i-sphere"/></svg></span>
                <span className={selectedTab === 'spar' ? 'on' : ''} onClick={() => setSelectedTab('spar')}><svg className="sym"><use href="#i-spar"/></svg></span>
                <span className={selectedTab === 'focus' ? 'on' : ''} onClick={() => setSelectedTab('focus')}><svg className="sym"><use href="#i-focus"/></svg></span>
              </div>
            </div>
          </div>
        </div>

        {/* MARQUEE */}
        <div className="mq" aria-label="Что внутри Pink Learn">
          <div className="mq-track">
            <div className="mq-group">
              <span className="mq-chip"><svg><use href="#i-graph"/></svg>Граф знаний</span>
              <span className="mq-chip"><svg><use href="#i-studio"/></svg>Чистый лист</span>
              <span className="mq-chip"><svg><use href="#i-desk"/></svg>Песочницы</span>
              <span className="mq-chip"><svg><use href="#i-check"/></svg>Адаптивные квизы</span>
              <span className="mq-chip"><svg><use href="#i-sphere"/></svg>Сфера знаний</span>
              <span className="mq-chip"><svg><use href="#i-spar"/></svg>Спарринг</span>
              <span className="mq-chip"><svg><use href="#i-sync"/></svg>Общая доска</span>
              <span className="mq-chip"><svg><use href="#i-git"/></svg>Git знаний</span>
              <span className="mq-chip"><svg><use href="#i-folio"/></svg>Портфолио</span>
              <span className="mq-chip"><svg><use href="#i-focus"/></svg>Помодоро</span>
              <span className="mq-chip"><svg><use href="#i-key"/></svg>Привычки и стрики</span>
              <span className="mq-chip"><svg><use href="#i-phone"/></svg>Мобильные блоки</span>
            </div>
            <div className="mq-group" aria-hidden="true">
              <span className="mq-chip"><svg><use href="#i-graph"/></svg>Граф знаний</span>
              <span className="mq-chip"><svg><use href="#i-studio"/></svg>Чистый лист</span>
              <span className="mq-chip"><svg><use href="#i-desk"/></svg>Песочницы</span>
              <span className="mq-chip"><svg><use href="#i-check"/></svg>Адаптивные квизы</span>
              <span className="mq-chip"><svg><use href="#i-sphere"/></svg>Сфера знаний</span>
              <span className="mq-chip"><svg><use href="#i-spar"/></svg>Спарринг</span>
              <span className="mq-chip"><svg><use href="#i-sync"/></svg>Общая доска</span>
              <span className="mq-chip"><svg><use href="#i-git"/></svg>Git знаний</span>
              <span className="mq-chip"><svg><use href="#i-folio"/></svg>Портфолио</span>
              <span className="mq-chip"><svg><use href="#i-focus"/></svg>Помодоро</span>
              <span className="mq-chip"><svg><use href="#i-key"/></svg>Привычки и стрики</span>
              <span className="mq-chip"><svg><use href="#i-phone"/></svg>Мобильные блоки</span>
            </div>
          </div>
        </div>

        {/* FEATURES TAB SECTION */}
        <section id="features">
          <div className="wrap">
            <div className="center">
              <p className="eyebrow">Всё в одном продукте</p>
              <h2>Семь модулей, один рабочий стол</h2>
              <p className="lead">Граф, студия, спарринг и портфолио открываются как окна в одном окружении и делят общие данные.</p>
            </div>

            <div className="tabs" role="tablist" aria-label="Модули Pink Learn">
              <button className="tab" role="tab" id="tab-graph" aria-controls="p-graph" aria-selected={selectedTab === 'graph'} onClick={() => setSelectedTab('graph')}>Граф</button>
              <button className="tab" role="tab" id="tab-studio" aria-controls="p-studio" aria-selected={selectedTab === 'studio'} onClick={() => setSelectedTab('studio')}>Фокус-студия</button>
              <button className="tab" role="tab" id="tab-sphere" aria-controls="p-sphere" aria-selected={selectedTab === 'sphere'} onClick={() => setSelectedTab('sphere')}>Сфера знаний</button>
              <button className="tab" role="tab" id="tab-spar" aria-controls="p-spar" aria-selected={selectedTab === 'spar'} onClick={() => setSelectedTab('spar')}>Спарринг</button>
              <button className="tab" role="tab" id="tab-git" aria-controls="p-git" aria-selected={selectedTab === 'git'} onClick={() => setSelectedTab('git')}>Git знаний</button>
              <button className="tab" role="tab" id="tab-folio" aria-controls="p-folio" aria-selected={selectedTab === 'folio'} onClick={() => setSelectedTab('folio')}>Портфолио</button>
              <button className="tab" role="tab" id="tab-focus" aria-controls="p-focus" aria-selected={selectedTab === 'focus'} onClick={() => setSelectedTab('focus')}>Продуктивность</button>
            </div>

            {/* graph */}
            <div className="panel" role="tabpanel" id="p-graph" aria-labelledby="tab-graph" hidden={selectedTab !== 'graph'}>
              <div>
                <h3>Тема выглядит как карта, а не как список</h3>
                <p className="d">Каждая тема разбита на атомарные кванты: теория, осознанная практика, парный спарринг и проект Capstone.</p>
                <ul className="ticks">
                  <li><svg><use href="#i-check"/></svg><div><strong>Блоки открываются по баллу.</strong> <span>Следующий узел доступен после проходного порога в предыдущих.</span></div></li>
                  <li><svg><use href="#i-check"/></svg><div><strong>Тепловая карта памяти.</strong> <span>Цвет узла следует кривой забывания Эббингауза и подсказывает, что повторить сейчас.</span></div></li>
                  <li><svg><use href="#i-check"/></svg><div><strong>Стикеры на узлах.</strong> <span>Заметки видны вам и коллегам при совместном обучении.</span></div></li>
                  <li><svg><use href="#i-check"/></svg><div><strong>Помощь, если застряли.</strong> <span>Система сама вставляет облегчающий промежуточный проект.</span></div></li>
                </ul>
              </div>
              <div className="art">
                <p className="cap">Тепловая карта понимания</p>
                <div className="dag">
                  <svg viewBox="0 0 400 230">
                    <path className="edge on" d="M60 115 C90 115 90 55 130 55"/><path className="edge on" d="M60 115 C90 115 90 175 130 175"/>
                    <path className="edge on" d="M180 55 C220 55 220 115 250 115"/><path className="edge on" d="M180 175 C220 175 220 115 250 115"/>
                    <path className="edge" d="M300 115 C320 115 320 115 340 115"/>
                    <circle className="n-done" cx="40" cy="115" r="24"/>
                    <circle className="n-done" cx="155" cy="55" r="26"/>
                    <circle className="n-review" cx="155" cy="175" r="26"/>
                    <circle className="n-open" cx="275" cy="115" r="26"/>
                    <circle className="n-lock" cx="365" cy="115" r="24"/>
                    <g className="stk"><rect x="268" y="150" width="86" height="40" rx="8" fill="var(--container)"/>
                    <text x="278" y="168" style={{ fontSize: '12px' }}>Стикер:</text><text x="278" y="183" style={{ fontSize: '12px' }}>спросить у Макса</text></g>
                  </svg>
                </div>
              </div>
            </div>

            {/* studio */}
            <div className="panel" role="tabpanel" id="p-studio" aria-labelledby="tab-studio" hidden={selectedTab !== 'studio'}>
              <div>
                <h3>Фокус-студия: учитесь без воды</h3>
                <p className="d">Сжатая выжимка инвариантов, примеров и ментальных моделей. Дальше вы проверяете себя и делаете реальную работу.</p>
                <ul className="ticks">
                  <li><svg><use href="#i-check"/></svg><div><strong>«Чистый лист».</strong> <span>Вы воспроизводите тему по памяти без подсказок, ИИ находит пробелы и объясняет, чего не хватило.</span></div></li>
                  <li><svg><use href="#i-check"/></svg><div><strong>Интерактивные песочницы.</strong> <span>Симуляторы, редакторы кода и диаграммы прямо внутри модуля.</span></div></li>
                  <li><svg><use href="#i-check"/></svg><div><strong>Адаптивные квизы на Gemini.</strong> <span>Вопросы подстраиваются под ваш уровень.</span></div></li>
                  <li><svg><use href="#i-check"/></svg><div><strong>Артефакт на выходе.</strong> <span>Код, схема, перевод или аналитический отчёт.</span></div></li>
                </ul>
              </div>
              <div className="art stack">
                <p className="cap" style={{ margin: 0 }}>Чистый лист</p>
                <div className="box stack" style={{ gap: '9px' }}><div className="skel w1"></div><div className="skel w2"></div><div className="skel w3"></div></div>
                <div className="box stack" style={{ gap: '10px' }}>
                  <div className="row"><span style={{ fontWeight: 500 }}>Анализ ИИ</span><span className="chip">Полнота 72%</span></div>
                  <div className="bar-p"><span></span></div>
                  <span style={{ fontSize: '14px', color: 'var(--muted)' }}>Пробелы: инварианты и граничный случай</span>
                </div>
                <div className="opt ok"><i></i>Вопрос подобран под ваш уровень</div>
              </div>
            </div>

            {/* sphere */}
            <div className="panel" role="tabpanel" id="p-sphere" aria-labelledby="tab-sphere" hidden={selectedTab !== 'sphere'}>
              <div>
                <h3>Сфера знаний: связи между дисциплинами</h3>
                <p className="d">Модуль вдохновлён «Игрой в бисер» Германа Гессе. Знания кристаллизуются в три слоя.</p>
                <ul className="ticks">
                  <li><svg><use href="#i-check"/></svg><div><strong>Ядро.</strong> <span>Фундаментальные законы и формулы.</span></div></li>
                  <li><svg><use href="#i-check"/></svg><div><strong>Мантия.</strong> <span>Прикладные инженерные и профессиональные навыки.</span></div></li>
                  <li><svg><use href="#i-check"/></svg><div><strong>Орбита.</strong> <span>Ваши проекты и портфолио.</span></div></li>
                  <li><svg><use href="#i-check"/></svg><div><strong>Кастальенский синтез.</strong> <span>ИИ находит скрытое родство дисциплин, например теории музыки и алгоритмов.</span></div></li>
                </ul>
              </div>
              <div className="art">
                <p className="cap">Лучи влияния</p>
                <svg viewBox="0 0 400 300" role="img" aria-label="Три слоя: ядро, мантия, орбита">
                  <circle cx="200" cy="150" r="135" fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray="4 5"/>
                  <circle cx="200" cy="150" r="88" fill="var(--container)" opacity=".7"/>
                  <circle className="core" cx="200" cy="150" r="42" fill="var(--primary)"/>
                  <g className="spin"><path d="M200 150L318 82M200 150L96 66M200 150L110 238M200 150L300 232" stroke="var(--primary-soft)" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="318" cy="82" r="10" fill="var(--bg)" stroke="var(--primary)" strokeWidth="3"/>
                  <circle cx="96" cy="66" r="10" fill="var(--bg)" stroke="var(--primary)" strokeWidth="3"/>
                  <circle cx="110" cy="238" r="10" fill="var(--bg)" stroke="var(--primary)" strokeWidth="3"/>
                  <circle cx="300" cy="232" r="10" fill="var(--bg)" stroke="var(--primary)" strokeWidth="3"/></g>
                  <text x="200" y="155" textAnchor="middle" style={{ fill: 'var(--on-primary)' }}>Ядро</text>
                  <text x="200" y="112" textAnchor="middle" style={{ fontSize: '13px', fill: 'var(--on-container)' }}>Мантия</text>
                  <text x="200" y="20" textAnchor="middle" style={{ fontSize: '13px', fill: 'var(--muted)' }}>Орбита</text>
                </svg>
              </div>
            </div>

            {/* spar */}
            <div className="panel" role="tabpanel" id="p-spar" aria-labelledby="tab-spar" hidden={selectedTab !== 'spar'}>
              <div>
                <h3>Спарринг: учиться вместе быстрее</h3>
                <p className="d">Совместная практика закрепляет материал лучше, чем чтение. Pink Learn помогает найти напарника и провести сессию.</p>
                <ul className="ticks">
                  <li><svg><use href="#i-check"/></svg><div><strong>Умный подбор.</strong> <span>Напарник со схожими целями, доменом и уровнем.</span></div></li>
                  <li><svg><use href="#i-check"/></svg><div><strong>Видно, что делает напарник.</strong> <span>Курсоры, клики и открытые окна синхронизируются в реальном времени.</span></div></li>
                  <li><svg><use href="#i-check"/></svg><div><strong>Общая доска и видеосвязь.</strong> <span>Рисуйте схемы и говорите, не выходя из приложения.</span></div></li>
                  <li><svg><use href="#i-check"/></svg><div><strong>ИИ-экзаменатор.</strong> <span>Оценивает защиту проекта обоими участниками и выносит вердикт.</span></div></li>
                </ul>
              </div>
              <div className="art">
                <p className="cap">Общая доска</p>
                <svg viewBox="0 0 400 260" role="img" aria-label="Две схемы на общей доске и курсоры двух участников">
                  <rect x="24" y="30" width="112" height="52" rx="10" fill="var(--container)"/><text x="80" y="61" textAnchor="middle" style={{ fill: 'var(--on-container)' }}>Клиент</text>
                  <rect x="244" y="30" width="112" height="52" rx="10" fill="var(--container)"/><text x="300" y="61" textAnchor="middle" style={{ fill: 'var(--on-container)' }}>Сервер</text>
                  <rect x="134" y="170" width="112" height="52" rx="10" fill="var(--bg)" stroke="var(--primary)" strokeWidth="2.5"/><text x="190" y="201" textAnchor="middle">База</text>
                  <path d="M136 56H244M300 82V120C300 150 250 190 246 196M80 82V120C80 150 130 190 134 196" stroke="var(--primary-soft)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <g className="cur"><path d="M262 112l0 22 6-5 4 10 4-2-4-10 8 0z" fill="var(--primary)"/>
                  <rect x="276" y="138" width="62" height="22" rx="11" fill="var(--primary)"/><text x="307" y="153" textAnchor="middle" style={{ fontSize: '12px', fill: 'var(--on-primary)' }}>Напарник</text></g>
                  <g className="cur b"><path d="M96 112l0 22 6-5 4 10 4-2-4-10 8 0z" fill="var(--primary-soft)"/>
                  <rect x="110" y="138" width="36" height="22" rx="11" fill="var(--primary-soft)"/><text x="128" y="153" textAnchor="middle" style={{ fontSize: '12px', fill: 'var(--on-container)' }}>Вы</text></g>
                </svg>
              </div>
            </div>

            {/* git */}
            <div className="panel" role="tabpanel" id="p-git" aria-labelledby="tab-git" hidden={selectedTab !== 'git'}>
              <div>
                <h3>Git знаний: версии вашего понимания</h3>
                <p className="d">Прогресс в навыке можно сохранять так же аккуратно, как код.</p>
                <ul className="ticks">
                  <li><svg><use href="#i-check"/></svg><div><strong>Коммиты понимания.</strong> <span>Контрольные точки с диффами и заметками.</span></div></li>
                  <li><svg><use href="#i-check"/></svg><div><strong>Ветки гипотез.</strong> <span>Пробуйте альтернативные подходы к проекту и сравнивайте.</span></div></li>
                  <li><svg><use href="#i-check"/></svg><div><strong>История трансформации.</strong> <span>Полная хронология пути от новичка до эксперта.</span></div></li>
                </ul>
              </div>
              <div className="art">
                <p className="cap">История мастерства</p>
                <svg viewBox="0 0 400 240" role="img" aria-label="Ветка main с коммитами и ветка гипотезы">
                  <path className="gdraw" pathLength="1" d="M40 60H360" stroke="var(--primary)" strokeWidth="3" fill="none"/>
                  <path className="gdraw" pathLength="1" style={{ animationDelay: '.9s' }} d="M140 60C160 60 160 150 190 150H280C300 150 300 60 320 60" stroke="var(--primary-soft)" strokeWidth="3" fill="none"/>
                  <circle className="gnode" style={{ animationDelay: '.2s' }} cx="40" cy="60" r="9" fill="var(--primary)"/><circle className="gnode" style={{ animationDelay: '.6s' }} cx="140" cy="60" r="9" fill="var(--primary)"/><circle className="gnode" style={{ animationDelay: '1.5s' }} cx="320" cy="60" r="9" fill="var(--primary)"/>
                  <circle className="gnode" style={{ animationDelay: '1.1s' }} cx="190" cy="150" r="9" fill="var(--primary-soft)"/><circle className="gnode" style={{ animationDelay: '1.3s' }} cx="280" cy="150" r="9" fill="var(--primary-soft)"/>
                  <text x="40" y="38" textAnchor="middle" style={{ fontSize: '12px' }}>Основы</text>
                  <text x="140" y="38" textAnchor="middle" style={{ fontSize: '12px' }}>Рекурсия</text>
                  <text x="320" y="38" textAnchor="middle" style={{ fontSize: '12px' }}>Слияние</text>
                  <text x="235" y="188" textAnchor="middle" style={{ fontSize: '12px', fill: 'var(--muted)' }}>ветка: другой подход</text>
                  <text x="40" y="220" style={{ fontSize: '12px', fill: 'var(--muted)' }}>main</text>
                </svg>
              </div>
            </div>

            {/* folio */}
            <div className="panel" role="tabpanel" id="p-folio" aria-labelledby="tab-folio" hidden={selectedTab !== 'folio'}>
              <div>
                <h3>Портфолио, которое собирается само</h3>
                <p className="d">Каждый сданный артефакт попадает на вашу публичную страницу с оценкой ИИ и исходным кодом.</p>
                <ul className="ticks">
                  <li><svg><use href="#i-check"/></svg><div><strong>Одна ссылка.</strong> <span>Отправьте работодателю или коллегам доказанные работы.</span></div></li>
                  <li><svg><use href="#i-check"/></svg><div><strong>Социальный профиль и стена.</strong> <span>Смотрите чужие траектории, комментируйте артефакты, обменивайтесь опытом.</span></div></li>
                </ul>
              </div>
              <div className="art stack">
                <p className="cap" style={{ margin: 0 }}>Публичная страница</p>
                <div className="box mono">/portfolio?portfolio=UID</div>
                <div className="box"><div className="row"><strong style={{ fontWeight: 500 }}>Балансировщик нагрузки</strong><span className="chip">ИИ: 92</span></div><div style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '4px' }}>Код и архитектурная схема</div></div>
                <div className="box"><div className="row"><strong style={{ fontWeight: 500 }}>Анализ запросов к базе</strong><span className="chip">ИИ: 88</span></div><div style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '4px' }}>Аналитический отчёт</div></div>
              </div>
            </div>

            {/* focus */}
            <div className="panel" role="tabpanel" id="p-focus" aria-labelledby="tab-focus" hidden={selectedTab !== 'focus'}>
              <div>
                <h3>Продуктивность встроена в обучение</h3>
                <p className="d">Таймер, привычки и задачи работают рядом с графом и знают о ваших этапах.</p>
                <ul className="ticks">
                  <li><svg><use href="#i-check"/></svg><div><strong>Командный Помодоро.</strong> <span>Запускайте фокус-сессию вместе с группой или напарником.</span></div></li>
                  <li><svg><use href="#i-check"/></svg><div><strong>Привычки и стрики.</strong> <span>Ежедневная серия с защитой от выгорания.</span></div></li>
                  <li><svg><use href="#i-check"/></svg><div><strong>Задачи и заметки.</strong> <span>Планировщик спринтов с привязкой к этапам графа.</span></div></li>
                  <li><svg><use href="#i-check"/></svg><div><strong>Карма и XP.</strong> <span>Очки за закрытые модули, победы в спаррингах и помощь другим.</span></div></li>
                </ul>
              </div>
              <div className="art stack">
                <div className="box row" style={{ flexWrap: 'nowrap' }}>
                  <div><div className="cap" style={{ margin: '0 0 4px' }}>Помодоро</div><div id="pomo" style={{ font: '600 34px var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>{formatPomoTime(pomoSeconds)}</div></div>
                  <svg width="64" height="64" viewBox="0 0 72 72" style={{ flex: 'none', width: '64px', height: '64px' }} aria-hidden="true"><circle cx="36" cy="36" r="30" fill="none" stroke="var(--container)" strokeWidth="8"/><circle className="ringc" cx="36" cy="36" r="30" fill="none" stroke="var(--primary)" strokeWidth="8" strokeLinecap="round" strokeDasharray="188" strokeDashoffset="62" transform="rotate(-90 36 36)"/></svg>
                </div>
                <div className="box stack" style={{ gap: '10px' }}><div className="row"><span style={{ fontWeight: 500 }}>Привычка: 25 минут практики</span><span className="chip">12 дней</span></div><div className="dots"><i className="on"></i><i className="on"></i><i className="on"></i><i className="on"></i><i className="on"></i><i className="on"></i><i></i></div></div>
                <div className="box stack" style={{ gap: '10px' }}><div className="row"><span style={{ fontWeight: 500 }}>Карма</span><span className="chip">1 240 XP</span></div><div className="bar-p"><span style={{ width: '64%' }}></span></div></div>
              </div>
            </div>
          </div>
        </section>

        {/* 3 STEPS */}
        <section id="how" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="center">
              <p className="eyebrow">Старт</p>
              <h2>Три шага до первого артефакта</h2>
            </div>
            <div className="steps">
              <div className="step"><div className="n">1</div><h3>Войдите в один клик</h3><p>Через аккаунт Google или в гостевом демо-режиме. Пароль не нужен.</p></div>
              <div className="step"><div className="n">2</div><h3>Идите по графу</h3><p>Закрывайте блоки, сдавайте «Чистый лист» и повторяйте узлы, которые подсвечены.</p></div>
              <div className="step"><div className="n">3</div><h3>Покажите результат</h3><p>Артефакты собираются в публичное портфолио, ссылкой на которое можно поделиться.</p></div>
            </div>
          </div>
        </section>

        {/* PLATFORM CARDS */}
        <section style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="center">
              <p className="eyebrow">Платформа</p>
              <h2>Работает там, где удобно вам</h2>
            </div>
            <div className="cards">
              <div className="cc"><div className="ic"><svg><use href="#i-desk"/></svg></div><h3>Рабочий стол в браузере</h3><p>Плавающие окна, док приложений, строка состояния и многозадачность.</p></div>
              <div className="cc"><div className="ic"><svg><use href="#i-phone"/></svg></div><h3>Блоки на телефоне</h3><p>Интерфейс сам перестраивается в привычный мобильный формат с полным набором функций.</p></div>
              <div className="cc"><div className="ic"><svg><use href="#i-sync"/></svg></div><h3>Мгновенная синхронизация</h3><p>Граф, заметки, задачи, XP и настройки сохраняются в облаке в реальном времени.</p></div>
              <div className="cc"><div className="ic"><svg><use href="#i-key"/></svg></div><h3>Безопасный вход</h3><p>Google-аккаунт в один клик или гостевой режим без пароля.</p></div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="center">
              <p className="eyebrow">Вопросы</p>
              <h2>Коротко о главном</h2>
            </div>
            <div className="faq">
              <details open><summary>Нужна ли регистрация?</summary><p>Нет. Можно войти через Google-аккаунт в один клик или открыть гостевой демо-режим без пароля.</p></details>
              <details><summary>Как открываются новые блоки в графе?</summary><p>Узел становится доступным, когда закрыты все предшествующие блоки с баллом не ниже проходного порога.</p></details>
              <details><summary>Что такое «Чистый лист»?</summary><p>Это режим, в котором вы по памяти записываете ключевые идеи темы. ИИ проверяет полноту ответа, показывает пробелы и даёт точную обратную связь.</p></details>
              <details><summary>Можно ли учиться с телефона?</summary><p>Да. На смартфоне рабочий стол автоматически превращается в блочный интерфейс со всеми функциями.</p></details>
              <details><summary>Как показать результаты другим?</summary><p>Все сданные артефакты собираются на публичной странице портфолио. Ссылкой можно поделиться с работодателем или коллегами.</p></details>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="cta">
              <i className="orb o1" aria-hidden="true"></i><i className="orb o2" aria-hidden="true"></i><i className="orb o3" aria-hidden="true"></i><i className="orb o4" aria-hidden="true"></i>
              <h2>Постройте свой первый граф знаний</h2>
              <p>Откройте демо и пройдите первый блок за несколько минут.</p>
              <button type="button" onClick={onStartFree} className="btn btn-filled">
                Открыть Pink Learn
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <div className="fcols">
            <div><a className="logo" href="#top">Pink<b>In</b>Au</a><p>IT-компания, которая делает продукты для обучения и совместной работы.</p></div>
            <div><h4>Pink Learn</h4><ul>
              <li><a href="#features" onClick={() => setSelectedTab('graph')}>Граф обучения</a></li>
              <li><a href="#features" onClick={() => setSelectedTab('studio')}>Фокус-студия</a></li>
              <li><a href="#features" onClick={() => setSelectedTab('sphere')}>Сфера знаний</a></li>
              <li><a href="#features" onClick={() => setSelectedTab('spar')}>Спарринг</a></li>
            </ul></div>
            <div><h4>Ещё</h4><ul>
              <li><a href="#features" onClick={() => setSelectedTab('git')}>Git знаний</a></li>
              <li><a href="#features" onClick={() => setSelectedTab('folio')}>Портфолио</a></li>
              <li><a href="#features" onClick={() => setSelectedTab('focus')}>Продуктивность</a></li>
              <li><a href="#faq">Вопросы</a></li>
            </ul></div>
          </div>
          <div className="fbot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>© 2026 PinkInAu. Все права защищены.</div>
            <div className="alpha-foot-badge">
              <span>⚡ <b>Альфа-версия:</b> если нашли баги, пишите в Telegram:</span>
              <a href="https://t.me/pinkinauceo" target="_blank" rel="noopener noreferrer" className="alpha-link">@pinkinauceo</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
