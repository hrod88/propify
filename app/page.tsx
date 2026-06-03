'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  Building2, Check, X, Menu, ArrowRight, ChevronRight,
  DollarSign, Wrench, Bell, Lock, Package, Calendar,
  Shield, Zap, Crown,
} from 'lucide-react'

// ─── CSS: animaciones scroll + responsive ─────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* Animaciones de scroll — bidireccionales (entra y sale) */
  [data-animate] {
    transition: opacity .75s cubic-bezier(.16,1,.3,1),
                transform .75s cubic-bezier(.16,1,.3,1);
  }
  [data-animate="left"]   { opacity:0; transform:translateX(-56px); }
  [data-animate="right"]  { opacity:0; transform:translateX(56px);  }
  [data-animate="up"]     { opacity:0; transform:translateY(48px);  }
  [data-animate="down"]   { opacity:0; transform:translateY(-36px); }
  [data-animate="zoom"]   { opacity:0; transform:scale(.91);        }
  [data-animate].in-view  { opacity:1; transform:none;              }

  /* Progress bar de scroll */
  .scroll-bar { position:fixed; top:0; left:0; height:3px; background:linear-gradient(90deg,#2563ae,#4ade80); z-index:9998; pointer-events:none; transition:width .08s linear; }

  /* Ambient bg tint (overlay multiply) */
  .bg-tint { position:fixed; inset:0; z-index:2; pointer-events:none; mix-blend-mode:multiply; opacity:.06; transition:background-color 1.6s ease; }

  /* Morph word */
  .morph-word { display:inline-block; transition:opacity .32s ease, transform .32s ease; }
  .morph-out  { opacity:0 !important; transform:translateY(-10px) !important; }

  /* Clip-path reveal (para títulos de sección) */
  [data-animate="reveal"] { opacity:1 !important; transform:none !important;
    clip-path:inset(0 102% 0 0);
    transition: clip-path .9s cubic-bezier(.16,1,.3,1) !important;
  }
  [data-animate="reveal"].in-view { clip-path:inset(0 0% 0 0); }

  /* Pop-in para el popup */
  @keyframes popIn {
    from { opacity:0; transform:scale(.92) translateY(20px); }
    to   { opacity:1; transform:none; }
  }
  .pop-in { animation: popIn .45s cubic-bezier(.16,1,.3,1) both; }

  /* Grid del hero */
  .hero-grid    { display:grid; grid-template-columns:1fr 1fr; gap:72px; align-items:center; }
  .feat-grid    { display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center; }
  .stats-grid   { display:grid; grid-template-columns:repeat(4,1fr); gap:24px; text-align:center; }
  .steps-grid   { display:grid; grid-template-columns:repeat(4,1fr); gap:32px; }
  .modules-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
  .pricing-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; max-width:900px; margin:0 auto; }
  .footer-grid  { display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:40px; margin-bottom:40px; }

  /* Nav responsive */
  .nav-links, .nav-ctas { display:flex; align-items:center; gap:28px; }
  .nav-burger            { display:none; }

  @media (max-width:900px) {
    .hero-grid  { grid-template-columns:1fr; gap:40px; }
    .feat-grid  { grid-template-columns:1fr; gap:40px; }
    .feat-reverse > *:first-child { order:2; }
    .feat-reverse > *:last-child  { order:1; }
    .stats-grid   { grid-template-columns:repeat(2,1fr); }
    .steps-grid   { grid-template-columns:repeat(2,1fr); }
    .modules-grid { grid-template-columns:repeat(2,1fr); }
    .pricing-grid { grid-template-columns:1fr; }
    .footer-grid  { grid-template-columns:1fr 1fr; }
    .mockup-3d    { transform:none !important; }
  }
  @media (max-width:640px) {
    .stats-grid, .steps-grid, .modules-grid, .footer-grid { grid-template-columns:1fr; }
    .nav-links, .nav-ctas { display:none; }
    .nav-burger            { display:flex; }
  }
`

// ─── Dashboard Mockup (hero visual) ───────────────────────────
function DashboardMockup() {
  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 40px 100px rgba(0,0,0,.45)',
      border: '1px solid rgba(255,255,255,.12)',
    }} className="mockup-3d">
      {/* Browser chrome */}
      <div style={{ background: '#0f172a', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
        {['#ef4444','#f59e0b','#22c55e'].map(c => (
          <span key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, display: 'inline-block' }} />
        ))}
        <div style={{ flex: 1, background: '#1e293b', borderRadius: 5, height: 20, marginLeft: 8, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
          <span style={{ fontSize: 9, color: '#64748b' }}>🔒 propify.app/dashboard</span>
        </div>
      </div>

      {/* App layout */}
      <div style={{ background: '#f8fafc', display: 'flex' }}>
        {/* Sidebar */}
        <div style={{ width: 44, background: '#0f2341', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 7 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(255,255,255,.9)', marginBottom: 6 }} />
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{ width: 26, height: 26, borderRadius: 7, background: i === 0 ? '#2563ae' : 'rgba(255,255,255,.1)' }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 12 }}>
          {/* Header gradient */}
          <div style={{ background: 'linear-gradient(135deg,#0f2341,#2563ae)', borderRadius: 10, padding: '9px 12px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ height: 8, width: 130, background: 'rgba(255,255,255,.85)', borderRadius: 4, marginBottom: 3 }} />
              <div style={{ height: 5, width: 80, background: 'rgba(255,255,255,.35)', borderRadius: 4 }} />
            </div>
            <div style={{ height: 5, width: 90, background: 'rgba(255,255,255,.15)', borderRadius: 10 }} />
          </div>

          {/* KPI main */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5, marginBottom: 6 }}>
            {[
              { bg: '#dbeafe', c: '#2563ae', v: '1/226' },
              { bg: '#dcfce7', c: '#16a34a', v: '$27M'  },
              { bg: '#fee2e2', c: '#dc2626', v: '$0'    },
              { bg: '#fef3c7', c: '#d97706', v: '3'     },
            ].map((k, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 8, padding: '6px 7px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: k.bg, marginBottom: 4 }} />
                <div style={{ fontSize: 10, fontWeight: 700, color: k.c }}>{k.v}</div>
                <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, marginTop: 3 }} />
              </div>
            ))}
          </div>

          {/* KPI mini */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5, marginBottom: 8 }}>
            {['#059669','#7c3aed','#db2777','#0891b2'].map((c, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 8, padding: '5px 7px', border: '1px solid #e2e8f0', borderTop: `2px solid ${c}` }}>
                <div style={{ height: 8, background: '#1e293b', borderRadius: 2, marginBottom: 3, width: '60%' }} />
                <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2 }} />
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 5 }}>
            <div style={{ background: 'white', borderRadius: 8, padding: '8px 10px', border: '1px solid #e2e8f0' }}>
              <div style={{ height: 6, width: 70, background: '#1e293b', borderRadius: 3, marginBottom: 8 }} />
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 52 }}>
                {[32,54,44,68,58,84].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '3px 3px 0 0', background: ['#bfdbfe','#93c5fd','#60a5fa','#3b82f6','#2563ae','#1e3a5f'][i] }} />
                ))}
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: 8, padding: '8px 10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ height: 6, width: 48, background: '#1e293b', borderRadius: 3, marginBottom: 8 }} />
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'conic-gradient(#10b981 0deg 252deg,#f59e0b 252deg 320deg,#dc2626 320deg 360deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#1e293b' }}>78%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Feature Mockup: Gastos Comunes ───────────────────────────
function MockupGastos() {
  const rows = [
    { d: 'Dpto 101', m: '$75.000', e: 'Pagado',    c: '#16a34a', bg: '#dcfce7' },
    { d: 'Dpto 102', m: '$75.000', e: 'Pendiente', c: '#d97706', bg: '#fef3c7' },
    { d: 'Dpto 103', m: '$75.000', e: 'Pagado',    c: '#16a34a', bg: '#dcfce7' },
    { d: 'Dpto 104', m: '$75.000', e: 'Vencido',   c: '#dc2626', bg: '#fee2e2' },
  ]
  return (
    <div style={{ background: 'white', borderRadius: 18, padding: 22, boxShadow: '0 20px 56px rgba(0,0,0,.12)', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Gastos Comunes</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Junio 2026</div>
        </div>
        <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>78% cobrado</span>
      </div>
      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 4, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: '78%', background: '#10b981', borderRadius: 4 }} />
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < rows.length - 1 ? '1px solid #f8fafc' : 'none' }}>
          <span style={{ fontSize: 12, color: '#475569' }}>{r.d}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{r.m}</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 9px', borderRadius: 99, background: r.bg, color: r.c }}>{r.e}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Feature Mockup: Mantenciones ─────────────────────────────
function MockupMantenciones() {
  const items = [
    { p: 'URGENTE', t: 'Fuga cocina · Dpto 108', c: '#dc2626', bg: '#fee2e2', border: '#dc2626', card: '#fff7ed' },
    { p: 'ALTA',    t: 'Ascensor detenido',       c: '#d97706', bg: '#fef3c7', border: '#d97706', card: '#fffbeb' },
    { p: 'NORMAL',  t: 'Pintura escalera norte',  c: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', card: '#f8fafc' },
  ]
  return (
    <div style={{ background: 'white', borderRadius: 18, padding: 22, boxShadow: '0 20px 56px rgba(0,0,0,.12)', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Mantenciones Activas</div>
        <span style={{ fontSize: 10, padding: '2px 9px', borderRadius: 99, background: '#fee2e2', color: '#dc2626', fontWeight: 700 }}>3 activas</span>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 11px', borderRadius: 10, background: item.card, marginBottom: 7, borderLeft: `3px solid ${item.border}` }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: item.bg, color: item.c, display: 'inline-block', marginBottom: 3 }}>{item.p}</span>
            <div style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{item.t}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Feature Mockup: Comunicaciones ───────────────────────────
function MockupComunicaciones() {
  return (
    <div style={{ background: 'white', borderRadius: 18, padding: 22, boxShadow: '0 20px 56px rgba(0,0,0,.12)', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 14 }}>Nueva Comunicación</div>
      {[
        { l: 'Asunto', v: 'Corte de agua programado' },
        { l: 'Para',   v: 'Todos los residentes (226)' },
        { l: 'Tipo',   v: 'Circular informativa' },
      ].map((f, i) => (
        <div key={i} style={{ marginBottom: 9 }}>
          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>{f.l}</div>
          <div style={{ fontSize: 12, color: '#1e293b', padding: '7px 10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>{f.v}</div>
        </div>
      ))}
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Mensaje</div>
        <div style={{ fontSize: 11, color: '#64748b', padding: '9px 10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', lineHeight: 1.7 }}>
          Estimados residentes, les informamos que el miércoles 4 de junio habrá corte de agua desde las 8:00 hasta las 18:00 hrs...
        </div>
      </div>
      <button style={{ width: '100%', marginTop: 14, padding: '10px 0', borderRadius: 10, background: 'linear-gradient(135deg,#0f2341,#2563ae)', color: 'white', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
        📢 Enviar a 226 residentes
      </button>
    </div>
  )
}

// ─── Contador animado (stats) ─────────────────────────────────
function AnimatedCounter({ value, color }: { value: string; color: string }) {
  const [display, setDisplay] = useState(() => {
    const m = value.match(/^([^\d]*)(\d+)([^\d]*)$/)
    return m ? m[1] + '0' + m[3] : value
  })
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const m = value.match(/^([^\d]*)(\d+)([^\d]*)$/)
    if (!m) { setDisplay(value); return }
    const [, pre, numStr, suf] = m
    const target = parseInt(numStr)

    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started.current) return
      started.current = true
      const duration = 1600
      const t0 = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - t0) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setDisplay(pre + Math.round(eased * target) + suf)
        if (p < 1) requestAnimationFrame(tick)
        else setDisplay(value)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [value])

  return (
    <div ref={ref} style={{ fontSize: 44, fontWeight: 900, color, letterSpacing: '-.03em', lineHeight: 1 }}>
      {display}
    </div>
  )
}

// ─── Handlers 3-D tilt (hover) ────────────────────────────────
const TILT = {
  onMouseEnter(e: React.MouseEvent<HTMLDivElement>) {
    e.currentTarget.style.transition = 'transform .2s ease, box-shadow .2s ease'
  },
  onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - .5
    const y = (e.clientY - r.top) / r.height - .5
    e.currentTarget.style.transform = `perspective(520px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) scale(1.03)`
    e.currentTarget.style.boxShadow = '0 22px 60px rgba(0,0,0,.16)'
  },
  onMouseLeave(e: React.MouseEvent<HTMLDivElement>) {
    e.currentTarget.style.transition = 'transform .35s ease, box-shadow .35s ease'
    e.currentTarget.style.transform = ''
    e.currentTarget.style.boxShadow = ''
  },
}

// ─── Palabras del hero (morphing) ─────────────────────────────
const MORPH_WORDS = ['edificio', 'comunidad', 'futuro']

// ─── Typewriter: texto que se escribe al entrar en viewport ───
function TypewriterText({ text, style }: { text: string; style?: React.CSSProperties }) {
  const [shown, setShown] = useState('')
  const ref   = useRef<HTMLParagraphElement>(null)
  const done  = useRef(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || done.current) return
      done.current = true
      let i = 0
      const id = setInterval(() => { i++; setShown(text.slice(0, i)); if (i >= text.length) clearInterval(id) }, 26)
    }, { threshold: 0.6 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [text])
  return (
    <p ref={ref} style={style}>
      {shown}
      <span style={{ opacity: shown.length < text.length ? 1 : 0, transition: 'opacity .1s' }}>|</span>
    </p>
  )
}

// ─── SVG check animado (path drawing) ─────────────────────────
function SvgCheck() {
  const [drawn, setDrawn] = useState(false)
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setDrawn(true)
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <svg ref={ref} width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ margin: '0 auto 28px', display: 'block' }}>
      <circle cx="32" cy="32" r="30" stroke="rgba(255,255,255,.25)" strokeWidth="2" />
      <path
        d="M20 32 L28 40 L44 24"
        stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: 44, strokeDashoffset: drawn ? 0 : 44, transition: 'stroke-dashoffset 1.1s cubic-bezier(.16,1,.3,1)' }}
      />
    </svg>
  )
}

// ─── Exit Intent Popup ─────────────────────────────────────────
function ExitPopup({ onClose }: { onClose: () => void }) {
  const [form, setForm]     = useState({ nombre: '', email: '', edificio: '', interes: 'demo' as 'demo' | 'pago' })
  const [loading, setLoad]  = useState(false)
  const [sent, setSent]     = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoad(true)
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } catch { /* silencioso — el dato igual se puede guardar en reintentos */ }
    setSent(true)
    setLoad(false)
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div className="pop-in" style={{ background: 'white', borderRadius: 22, padding: 36, maxWidth: 460, width: '100%', position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,.3)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={15} color="#64748b" />
        </button>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 10 }}>¡Gracias por tu interés!</h3>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>
              Nos pondremos en contacto contigo pronto para mostrarte todo lo que Propify puede hacer por tu edificio.
            </p>
            <button onClick={onClose} style={{ marginTop: 22, padding: '11px 28px', borderRadius: 10, background: 'linear-gradient(135deg,#0f2341,#2563ae)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
              Perfecto ✓
            </button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 54, height: 54, borderRadius: 15, background: 'linear-gradient(135deg,#0f2341,#2563ae)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Building2 size={26} color="white" />
              </div>
              <h3 style={{ fontSize: 21, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>¡Espera antes de irte!</h3>
              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.7 }}>
                Déjanos tu contacto y te mostramos cómo Propify puede transformar la gestión de tu edificio. <strong style={{ color: '#1e293b' }}>Empieza gratis hoy.</strong>
              </p>
            </div>

            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                required placeholder="Tu nombre"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                style={{ padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#f8fafc', color: '#1e293b' }}
              />
              <input
                required type="email" placeholder="Email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={{ padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#f8fafc', color: '#1e293b' }}
              />
              <input
                placeholder="Nombre del edificio (opcional)"
                value={form.edificio}
                onChange={e => setForm(f => ({ ...f, edificio: e.target.value }))}
                style={{ padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#f8fafc', color: '#1e293b' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['demo', 'pago'] as const).map(v => (
                  <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, border: `2px solid ${form.interes === v ? '#2563ae' : '#e2e8f0'}`, background: form.interes === v ? '#eff6ff' : 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: form.interes === v ? '#2563ae' : '#64748b', transition: 'all .2s' }}>
                    <input type="radio" name="interes" value={v} checked={form.interes === v} onChange={() => setForm(f => ({ ...f, interes: v }))} style={{ display: 'none' }} />
                    {v === 'demo' ? '🎯 Ver demo' : '💳 Suscribirme'}
                  </label>
                ))}
              </div>

              <button
                type="submit" disabled={loading}
                style={{ padding: '13px 0', borderRadius: 10, background: 'linear-gradient(135deg,#0f2341,#2563ae)', color: 'white', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {loading ? 'Enviando…' : 'Quiero empezar gratis →'}
              </button>

              <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', padding: '4px 0' }}>
                No gracias, ya sé lo que hago
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────
export default function LandingPage() {
  const [scrolled,       setScrolled]       = useState(false)
  const [mobileMenu,     setMobileMenu]     = useState(false)
  const [showPopup,      setShowPopup]      = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [parallaxY,      setParallaxY]      = useState(0)
  const [morphIdx,       setMorphIdx]       = useState(0)
  const [morphVisible,   setMorphVisible]   = useState(true)
  const [bgTint,         setBgTint]         = useState('#dbeafe')

  // Scroll animations (bidireccionales — también al subir)
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => e.target.classList.toggle('in-view', e.isIntersecting)),
      { threshold: 0.12 },
    )
    document.querySelectorAll('[data-animate]').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  // Scroll unificado: navbar + progress bar + parallax + bg tint
  useEffect(() => {
    const fn = () => {
      const sy  = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      const sp  = max > 0 ? (sy / max) * 100 : 0
      setScrolled(sy > 60)
      setParallaxY(sy)
      setScrollProgress(sp)
      setBgTint(
        sp < 15 ? '#dbeafe' :   // azul — hero / stats
        sp < 38 ? '#dcfce7' :   // verde — features
        sp < 60 ? '#ede9fe' :   // violeta — cómo funciona / módulos
        sp < 80 ? '#fef3c7' :   // amarillo — precios
                  '#dbeafe'     // azul — CTA / footer
      )
    }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Morphing de texto en el hero (cicla cada 2.5 s)
  useEffect(() => {
    const id = setInterval(() => {
      setMorphVisible(false)
      setTimeout(() => {
        setMorphIdx(i => (i + 1) % MORPH_WORDS.length)
        setMorphVisible(true)
      }, 350)
    }, 2500)
    return () => clearInterval(id)
  }, [])

  // Exit intent — aparece cada vez que se carga la página
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setShowPopup(true)
      }
    }
    document.addEventListener('mouseleave', fn)
    return () => document.removeEventListener('mouseleave', fn)
  }, [])

  // ── Colores helpers ────────────────────────────────────────
  const brand     = 'linear-gradient(135deg,#0f2341 0%,#1e3a5f 55%,#2563ae 100%)'
  const navColor  = (dark: string, light: string) => scrolled ? dark : light
  const heroScale = Math.max(1, 1.06 - (parallaxY / 300) * 0.06)

  return (
    <>
      <style>{CSS}</style>

      {/* Progress bar de scroll */}
      <div className="scroll-bar" style={{ width: `${scrollProgress}%` }} />

      {/* Ambient tint que cambia de color al scrollear */}
      <div className="bg-tint" style={{ backgroundColor: bgTint }} />

      {/* ════════════════════════ NAVBAR ════════════════════════ */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, transition: 'background .3s, box-shadow .3s', background: scrolled ? 'rgba(255,255,255,.96)' : 'transparent', backdropFilter: scrolled ? 'blur(14px)' : 'none', boxShadow: scrolled ? '0 1px 0 rgba(0,0,0,.07)' : 'none' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: brand, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={17} color="white" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: navColor('#0f2341', 'white'), letterSpacing: '-.02em' }}>Propify</span>
          </Link>

          {/* Links desktop */}
          <nav className="nav-links">
            {[['Características', '#features'], ['Precios', '/precios'], ['Blog', '#']].map(([t, h]) => (
              <Link key={t} href={h} style={{ fontSize: 14, fontWeight: 500, color: navColor('#475569', 'rgba(255,255,255,.8)'), textDecoration: 'none' }}>{t}</Link>
            ))}
          </nav>

          {/* CTAs desktop */}
          <div className="nav-ctas" style={{ gap: 12 }}>
            <Link href="/login" style={{ fontSize: 14, fontWeight: 500, color: navColor('#475569', 'rgba(255,255,255,.8)'), textDecoration: 'none' }}>Iniciar sesión</Link>
            <Link href="/registro" style={{ fontSize: 13, fontWeight: 700, padding: '8px 18px', borderRadius: 9, background: scrolled ? brand : 'rgba(255,255,255,.15)', color: 'white', textDecoration: 'none', border: scrolled ? 'none' : '1px solid rgba(255,255,255,.28)' }}>
              Empezar gratis →
            </Link>
          </div>

          {/* Hamburger mobile */}
          <button className="nav-burger" onClick={() => setMobileMenu(m => !m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: navColor('#0f2341', 'white'), display: 'flex', alignItems: 'center' }}>
            {mobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div style={{ background: 'white', padding: '16px 24px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[['Características', '#features'], ['Precios', '/precios'], ['Blog', '#']].map(([t, h]) => (
              <Link key={t} href={h} style={{ fontSize: 15, fontWeight: 500, color: '#475569', textDecoration: 'none' }} onClick={() => setMobileMenu(false)}>{t}</Link>
            ))}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/login" style={{ fontSize: 15, color: '#475569', textDecoration: 'none', fontWeight: 500 }}>Iniciar sesión</Link>
              <Link href="/registro" style={{ fontSize: 14, fontWeight: 700, padding: '11px 0', borderRadius: 10, background: brand, color: 'white', textDecoration: 'none', textAlign: 'center', display: 'block' }}>Empezar gratis →</Link>
            </div>
          </div>
        )}
      </header>

      {/* ═════════════════════════ HERO ═════════════════════════ */}
      <section style={{ minHeight: '100vh', background: brand, display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', paddingTop: 64 }}>
        {/* Grid sutil de fondo */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
        {/* Orbes de luz — parallax */}
        <div style={{ position: 'absolute', top: '18%', right: '12%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(37,99,174,.35) 0%,transparent 70%)', pointerEvents: 'none', transform: `translateY(${parallaxY * 0.22}px)` }} />
        <div style={{ position: 'absolute', bottom: '8%', left: '8%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,163,127,.2) 0%,transparent 70%)', pointerEvents: 'none', transform: `translateY(${parallaxY * -0.14}px)` }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '88px 24px', transform: `scale(${heroScale})`, transformOrigin: 'center top' }} className="hero-grid">

          {/* Texto izquierda */}
          <div>
            <div data-animate="down" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 99, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', marginBottom: 26 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.85)' }}>La plataforma de administración de edificios más moderna de Chile</span>
            </div>

            <h1 data-animate="up" style={{ fontSize: 'clamp(34px,5vw,62px)', fontWeight: 900, color: 'white', lineHeight: 1.1, letterSpacing: '-.03em', marginBottom: 22 }}>
              La gestión de tu{' '}
              <span
                className={'morph-word' + (morphVisible ? '' : ' morph-out')}
                style={{ background: 'linear-gradient(90deg,#60a5fa,#4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                {MORPH_WORDS[morphIdx]}
              </span>,{' '}
              <span style={{ background: 'linear-gradient(90deg,#60a5fa,#4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                simplificada.
              </span>
            </h1>

            <p data-animate="up" style={{ fontSize: 18, color: 'rgba(255,255,255,.72)', lineHeight: 1.75, marginBottom: 38, transitionDelay: '.1s' }}>
              Gastos comunes, mantenciones, residentes y control de acceso — todo en una plataforma intuitiva. Desde <strong style={{ color: 'white' }}>$0/mes.</strong>
            </p>

            <div data-animate="up" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', transitionDelay: '.2s' }}>
              <Link href="/registro" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: 'white', color: '#0f2341', fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 8px 28px rgba(0,0,0,.22)' }}>
                Empezar gratis <ArrowRight size={16} />
              </Link>
              <Link href="/precios" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: 'rgba(255,255,255,.1)', color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,.22)', backdropFilter: 'blur(8px)' }}>
                Ver planes
              </Link>
            </div>

            <div data-animate="up" style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 34, transitionDelay: '.3s' }}>
              <div style={{ display: 'flex' }}>
                {[220, 200, 180, 160].map((h, i) => (
                  <div key={i} style={{ width: 30, height: 30, borderRadius: '50%', background: `hsl(${h},65%,55%)`, border: '2.5px solid rgba(255,255,255,.6)', marginLeft: i > 0 ? -9 : 0 }} />
                ))}
              </div>
              <div>
                <div style={{ display: 'flex', gap: 1 }}>{'★★★★★'.split('').map((s, i) => <span key={i} style={{ color: '#fbbf24', fontSize: 13 }}>{s}</span>)}</div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 2 }}>+200 administradores confían en Propify</p>
              </div>
            </div>
          </div>

          {/* Mockup derecha */}
          <div data-animate="right">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ═══════════════════════ STATS ══════════════════════════ */}
      <section style={{ background: 'white', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '52px 24px' }} className="stats-grid">
          {[
            { v: '500+',  l: 'Unidades gestionadas', c: '#2563ae' },
            { v: '24/7',  l: 'Disponibilidad',        c: '#16a34a' },
            { v: '98%',   l: 'Satisfacción',          c: '#7c3aed' },
            { v: '$0',    l: 'Para empezar',          c: '#d97706' },
          ].map((s, i) => (
            <div key={i} data-animate="up" style={{ transitionDelay: `${i * .09}s` }}>
              <AnimatedCounter value={s.v} color={s.c} />
              <div style={{ fontSize: 14, color: '#64748b', marginTop: 6, fontWeight: 500 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════ FEATURES ═══════════════════════════ */}
      <div id="features">

        {/* Feature 1 — Gastos Comunes (texto izq, mockup der) */}
        <section style={{ background: '#f8fafc', padding: '108px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }} className="feat-grid">
            <div data-animate="left">
              <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.1em' }}>Finanzas</span>
              <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 800, color: '#0f2341', lineHeight: 1.2, marginTop: 8, marginBottom: 18, letterSpacing: '-.02em' }}>
                Gastos comunes sin complicaciones
              </h2>
              <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.8, marginBottom: 28 }}>
                Emite, cobra y controla los gastos mensuales de cada unidad. Visualiza quién pagó, quién debe y cuánto has recaudado — en tiempo real.
              </p>
              {['Emisión automática mensual','Seguimiento de pagos por unidad','Cobro en línea con WebPay','Reportes y exportación CSV'].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={11} color="#16a34a" />
                  </div>
                  <span style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>{f}</span>
                </div>
              ))}
            </div>
            <div data-animate="right" style={{ position: 'sticky', top: 120 }}><MockupGastos /></div>
          </div>
        </section>

        {/* Feature 2 — Mantenciones (mockup izq, texto der) */}
        <section style={{ background: 'white', padding: '108px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }} className="feat-grid feat-reverse">
            <div data-animate="left" style={{ position: 'sticky', top: 120 }}><MockupMantenciones /></div>
            <div data-animate="right">
              <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '.1em' }}>Mantenciones</span>
              <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 800, color: '#0f2341', lineHeight: 1.2, marginTop: 8, marginBottom: 18, letterSpacing: '-.02em' }}>
                Solicitudes resueltas más rápido
              </h2>
              <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.8, marginBottom: 28 }}>
                Los residentes reportan problemas directo desde la app. Tú los priorizas, asignas y das seguimiento — sin perder ninguna solicitud.
              </p>
              {['Prioridades: urgente, alta, normal','Asignación a proveedores','Historial de solicitudes','Notificaciones automáticas'].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={11} color="#d97706" />
                  </div>
                  <span style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature 3 — Comunicaciones (texto izq, mockup der) */}
        <section style={{ background: '#f8fafc', padding: '108px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }} className="feat-grid">
            <div data-animate="left">
              <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '.1em' }}>Comunicaciones</span>
              <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 800, color: '#0f2341', lineHeight: 1.2, marginTop: 8, marginBottom: 18, letterSpacing: '-.02em' }}>
                Mantén a todos informados
              </h2>
              <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.8, marginBottom: 28 }}>
                Envía circulares, avisos y comunicados a todos tus residentes con un clic. Registro completo de todas las comunicaciones enviadas.
              </p>
              {['Circulares masivas a residentes','Avisos de corte de servicios','Notificaciones de paquetes','Historial de comunicaciones'].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={11} color="#7c3aed" />
                  </div>
                  <span style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>{f}</span>
                </div>
              ))}
            </div>
            <div data-animate="right" style={{ position: 'sticky', top: 120 }}><MockupComunicaciones /></div>
          </div>
        </section>
      </div>

      {/* ══════════════════ CÓMO FUNCIONA ═══════════════════════ */}
      <section style={{ background: 'white', padding: '108px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }} data-animate="up">
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2563ae', textTransform: 'uppercase', letterSpacing: '.1em' }}>Proceso</span>
            <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 800, color: '#0f2341', marginTop: 8, letterSpacing: '-.02em' }}>Empieza en minutos</h2>
          </div>
          <div className="steps-grid">
            {[
              { n: '01', t: 'Crea tu cuenta',      d: 'Regístrate gratis en menos de 2 minutos. Sin tarjeta de crédito.',                   c: '#2563ae', bg: '#dbeafe' },
              { n: '02', t: 'Configura tu edificio', d: 'Nuestro wizard guiado te lleva paso a paso. Listo en 10 minutos.',                 c: '#16a34a', bg: '#dcfce7' },
              { n: '03', t: 'Invita residentes',    d: 'Envía invitaciones por email. Cada residente tiene su portal propio.',              c: '#7c3aed', bg: '#ede9fe' },
              { n: '04', t: 'Gestiona todo',        d: 'Dashboard en tiempo real con todo lo que necesitas para administrar tu edificio.',   c: '#d97706', bg: '#fef3c7' },
            ].map((s, i) => (
              <div key={i} data-animate="up" style={{ textAlign: 'center', transitionDelay: `${i * .11}s` }}>
                <div style={{ width: 58, height: 58, borderRadius: 16, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 20, fontWeight: 900, color: s.c }}>
                  {s.n}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f2341', marginBottom: 9 }}>{s.t}</h3>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.75 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ MÓDULOS ═════════════════════════ */}
      <section style={{ background: '#f8fafc', padding: '108px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }} data-animate="up">
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2563ae', textTransform: 'uppercase', letterSpacing: '.1em' }}>Módulos</span>
            <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 800, color: '#0f2341', marginTop: 8, letterSpacing: '-.02em' }}>
              Todo lo que necesitas, en un solo lugar
            </h2>
          </div>
          <div className="modules-grid">
            {[
              { Icon: DollarSign, c: '#16a34a', bg: '#dcfce7', t: 'Gastos Comunes',   d: 'Emite y cobra los gastos mensuales con facilidad.' },
              { Icon: Wrench,     c: '#d97706', bg: '#fef3c7', t: 'Mantenciones',     d: 'Solicitudes, prioridades y seguimiento en tiempo real.' },
              { Icon: Bell,       c: '#7c3aed', bg: '#ede9fe', t: 'Comunicaciones',   d: 'Circulares y avisos a todos tus residentes.' },
              { Icon: Lock,       c: '#2563ae', bg: '#dbeafe', t: 'Control Acceso',   d: 'Registro de visitas y control de entradas/salidas.' },
              { Icon: Package,    c: '#db2777', bg: '#fce7f3', t: 'Paquetes',         d: 'Gestión de correspondencia y encomiendas.' },
              { Icon: Calendar,   c: '#0891b2', bg: '#cffafe', t: 'Reservas',         d: 'Espacios comunes disponibles para reservar 24/7.' },
            ].map((m, i) => (
              <div key={i} data-animate="up" style={{ transitionDelay: `${i * .07}s` }}>
                <div {...TILT} style={{ background: 'white', borderRadius: 18, padding: 24, border: '1px solid #e2e8f0', cursor: 'default', height: '100%' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <m.Icon size={20} color={m.c} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f2341', marginBottom: 8 }}>{m.t}</h3>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>{m.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ PRECIOS ════════════════════════ */}
      <section style={{ background: 'white', padding: '108px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }} data-animate="up">
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2563ae', textTransform: 'uppercase', letterSpacing: '.1em' }}>Precios</span>
            <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 800, color: '#0f2341', marginTop: 8, letterSpacing: '-.02em' }}>Sin sorpresas. Sin letra chica.</h2>
            <p style={{ fontSize: 16, color: '#64748b', marginTop: 14 }}>Empieza gratis y escala cuando lo necesites.</p>
          </div>

          <div className="pricing-grid">
            {[
              { nombre: 'Gratuito', precio: '$0',      period: '',     Icon: Shield, c: '#64748b', bg: '#f8fafc', bord: '#e2e8f0', popular: false,
                features: ['Hasta 10 unidades','Gastos comunes básicos','Registro de visitas','Soporte por email'] },
              { nombre: 'Básico',   precio: '$29.990', period: '/mes', Icon: Zap,    c: '#2563ae', bg: '#eff6ff', bord: '#93c5fd', popular: true,
                features: ['Hasta 50 unidades','Todo del Gratuito','Invitación residentes','WebPay integrado','Comunicaciones ilimitadas'] },
              { nombre: 'Pro',      precio: '$59.990', period: '/mes', Icon: Crown,  c: '#7c3aed', bg: '#faf5ff', bord: '#c4b5fd', popular: false,
                features: ['Unidades ilimitadas','Todo del Básico','Reportes avanzados','API + integraciones','Soporte 24/7'] },
            ].map((plan, i) => (
              <div key={i} data-animate="up" style={{ borderRadius: 22, padding: 28, border: `2px solid ${plan.popular ? plan.bord : '#e2e8f0'}`, background: plan.popular ? plan.bg : 'white', position: 'relative', transitionDelay: `${i * .1}s`, boxShadow: plan.popular ? '0 10px 36px rgba(37,99,174,.13)' : 'none' }}
                onMouseEnter={e => { e.currentTarget.style.transition = 'transform .2s ease, box-shadow .2s ease' }}
                onMouseMove={e => { const r=e.currentTarget.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-.5; const y=(e.clientY-r.top)/r.height-.5; e.currentTarget.style.transform=`perspective(520px) rotateX(${-y*8}deg) rotateY(${x*8}deg) scale(1.02)`; e.currentTarget.style.boxShadow='0 22px 60px rgba(0,0,0,.18)' }}
                onMouseLeave={e => { e.currentTarget.style.transition='transform .35s ease, box-shadow .35s ease'; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
              >
                {plan.popular && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: brand, color: 'white', fontSize: 10, fontWeight: 800, padding: '3px 14px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                    MÁS POPULAR
                  </div>
                )}
                <plan.Icon size={22} color={plan.c} />
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f2341', marginTop: 12 }}>{plan.nombre}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginTop: 4, marginBottom: 16 }}>
                  <span style={{ fontSize: 34, fontWeight: 900, color: plan.c }}>{plan.precio}</span>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{plan.period}</span>
                </div>
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, marginBottom: 20 }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                      <Check size={13} color={plan.c} />
                      <span style={{ fontSize: 13, color: '#475569' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/registro" style={{ display: 'block', textAlign: 'center', padding: '11px 0', borderRadius: 10, background: plan.popular ? brand : '#f8fafc', color: plan.popular ? 'white' : '#0f2341', fontWeight: 700, fontSize: 13, textDecoration: 'none', border: plan.popular ? 'none' : '1px solid #e2e8f0' }}>
                  Comenzar {plan.nombre === 'Gratuito' ? 'gratis' : 'ahora'}
                </Link>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link href="/precios" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: '#2563ae', textDecoration: 'none' }}>
              Ver comparación completa de planes <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════ CTA FINAL ═══════════════════════ */}
      <section style={{ background: brand, padding: '108px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative' }} data-animate="zoom">
          <SvgCheck />
          <h2 style={{ fontSize: 'clamp(30px,4vw,52px)', fontWeight: 900, color: 'white', lineHeight: 1.15, letterSpacing: '-.03em', marginBottom: 18 }}>
            Únete a la nueva generación de edificios inteligentes
          </h2>
          <TypewriterText
            text="Propify es la plataforma más completa de Chile para administrar edificios. Empieza hoy, sin compromiso."
            style={{ fontSize: 18, color: 'rgba(255,255,255,.7)', lineHeight: 1.75, marginBottom: 42 }}
          />
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/registro" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 34px', borderRadius: 12, background: 'white', color: '#0f2341', fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 32px rgba(0,0,0,.25)' }}>
              Empezar gratis <ArrowRight size={18} />
            </Link>
            <button onClick={() => setShowPopup(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 34px', borderRadius: 12, background: 'rgba(255,255,255,.12)', color: 'white', fontWeight: 700, fontSize: 16, border: '1px solid rgba(255,255,255,.22)', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
              Solicitar demo
            </button>
          </div>
        </div>
      </section>

      {/* ════════════════════════ FOOTER ════════════════════════ */}
      <footer style={{ background: '#0f2341', color: 'rgba(255,255,255,.55)', padding: '52px 24px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={17} color="white" />
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: '-.02em' }}>Propify</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.8, maxWidth: 280 }}>
                La plataforma más moderna para administrar edificios en Chile. Gestión inteligente para comunidades inteligentes.
              </p>
            </div>
            {[
              { t: 'Producto', items: ['Características','Precios','Integraciones','Changelog'] },
              { t: 'Empresa',  items: ['Nosotros','Blog','Contacto','Trabaja con nosotros'] },
              { t: 'Legal',    items: ['Privacidad','Términos de uso','Cookies','GDPR'] },
            ].map(col => (
              <div key={col.t}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.8)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.08em' }}>{col.t}</div>
                {col.items.map(item => (
                  <div key={item} style={{ marginBottom: 10 }}>
                    <Link href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', textDecoration: 'none' }}>{item}</Link>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 12 }}>© 2026 Propify. Todos los derechos reservados.</p>
            <p style={{ fontSize: 12 }}>Hecho con ❤️ en Chile 🇨🇱</p>
          </div>
        </div>
      </footer>

      {/* ══════════════════ EXIT INTENT POPUP ═══════════════════ */}
      {showPopup && <ExitPopup onClose={() => setShowPopup(false)} />}
    </>
  )
}
