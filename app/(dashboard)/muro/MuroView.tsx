'use client'

/**
 * MuroView.tsx — Muro Comunitario
 * Feed social del edificio: posts, comentarios, likes, posts fijados.
 */

import { useState, useRef } from 'react'
import {
  MessageSquare, Heart, Pin, Send, Megaphone,
  AlertTriangle, Calendar, Users, Plus, X, ChevronDown,
  Trash2, Image as ImageIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { MuroPost, MuroComentario, TipoPost } from '@/types'

const tipoCfg: Record<TipoPost, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  general: { label: 'General',  color: '#64748b', bg: '#f1f5f9', Icon: MessageSquare },
  aviso:   { label: 'Aviso',    color: '#2563ae', bg: '#dbeafe', Icon: Megaphone     },
  evento:  { label: 'Evento',   color: '#7c3aed', bg: '#ede9fe', Icon: Calendar      },
  urgente: { label: '🚨 Urgente', color: '#dc2626', bg: '#fee2e2', Icon: AlertTriangle },
}

interface Props {
  posts:          MuroPost[]
  edificioNombre: string
  edificioId:     string
}

export default function MuroView({ posts: inicial, edificioNombre, edificioId }: Props) {
  const [posts, setPosts]         = useState<MuroPost[]>(inicial)
  const [filtro, setFiltro]       = useState<TipoPost | 'todos'>('todos')
  const [showNew, setShowNew]     = useState(false)
  const [newContenido, setNewC]   = useState('')
  const [newTipo, setNewTipo]     = useState<TipoPost>('general')
  const [autorNombre, setAutor]   = useState('Administración')
  const [posting, setPosting]     = useState(false)
  const [expandidos, setExpand]   = useState<Set<string>>(new Set())
  const [comentarios, setComs]    = useState<Record<string, string>>({})

  const filtrados = posts.filter(p => filtro === 'todos' || p.tipo === filtro)

  async function publicar(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!newContenido.trim()) return
    setPosting(true)
    const payload = {
      edificioId, contenido: newContenido.trim(),
      tipo: newTipo, autorNombre, autorRol: 'administrador',
      likes: 0, fijado: false,
    }
    const { data } = await supabase.from('muro_posts').insert(payload).select().single()
    if (data) setPosts(prev => [{ ...(data as MuroPost), comentarios: [] }, ...prev])
    setNewC(''); setShowNew(false); setPosting(false)
  }

  async function toggleLike(post: MuroPost) {
    const { data } = await supabase.from('muro_posts')
      .update({ likes: post.likes + 1 }).eq('id', post.id).select().single()
    if (data) setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: (data as MuroPost).likes } : p))
  }

  async function toggleFijar(post: MuroPost) {
    const { data } = await supabase.from('muro_posts')
      .update({ fijado: !post.fijado }).eq('id', post.id).select().single()
    if (data) setPosts(prev => prev.map(p => p.id === post.id ? { ...p, fijado: !p.fijado } : p)
      .sort((a, b) => (b.fijado ? 1 : 0) - (a.fijado ? 1 : 0)))
  }

  async function eliminarPost(id: string) {
    if (!confirm('¿Eliminar publicación?')) return
    await supabase.from('muro_posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  async function comentar(postId: string) {
    const texto = comentarios[postId]?.trim()
    if (!texto) return
    const payload = { postId, contenido: texto, autorNombre }
    const { data } = await supabase.from('muro_comentarios').insert(payload).select().single()
    if (data) {
      setPosts(prev => prev.map(p => p.id === postId
        ? { ...p, comentarios: [...(p.comentarios ?? []), data as MuroComentario] }
        : p))
      setComs(prev => ({ ...prev, [postId]: '' }))
    }
  }

  function toggleComentarios(id: string) {
    setExpand(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `hace ${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `hace ${hrs}h`
    return new Date(date).toLocaleDateString('es-CL')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Muro Comunitario</h1>
          <p className="text-gray-500 text-sm mt-0.5">{edificioNombre}</p>
        </div>
        <button onClick={() => setShowNew(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
          {showNew ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showNew ? 'Cancelar' : 'Publicar'}
        </button>
      </div>

      {/* ── Formulario nueva publicación ── */}
      {showNew && (
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
          <form onSubmit={publicar} className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>A</div>
              <input value={autorNombre} onChange={e => setAutor(e.target.value)}
                className="flex-1 text-sm font-semibold text-gray-700 border-none outline-none bg-transparent"
                placeholder="Tu nombre..." />
            </div>
            <textarea value={newContenido} onChange={e => setNewC(e.target.value)}
              rows={3} placeholder="¿Qué quieres comunicar a la comunidad?"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none" />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {(Object.keys(tipoCfg) as TipoPost[]).map(t => (
                  <button key={t} type="button" onClick={() => setNewTipo(t)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                    style={newTipo === t ? { background: tipoCfg[t].bg, color: tipoCfg[t].color } : { background: '#f1f5f9', color: '#64748b' }}>
                    {tipoCfg[t].label}
                  </button>
                ))}
              </div>
              <button type="submit" disabled={posting || !newContenido.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
                <Send className="w-3.5 h-3.5" /> Publicar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filtros ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['todos', 'general', 'aviso', 'evento', 'urgente'] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtro === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f === 'todos' ? 'Todos' : tipoCfg[f].label}
          </button>
        ))}
      </div>

      {/* ── Posts ── */}
      {filtrados.length === 0 ? (
        <div className="py-16 text-center">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay publicaciones aún</p>
          <button onClick={() => setShowNew(true)} className="mt-4 text-blue-600 text-sm hover:underline">
            Sé el primero en publicar
          </button>
        </div>
      ) : filtrados.map(post => {
        const cfg       = tipoCfg[post.tipo]
        const abierto   = expandidos.has(post.id)
        const numComs   = post.comentarios?.length ?? 0

        return (
          <div key={post.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
            post.fijado ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100'}`}>
            {/* Pin banner */}
            {post.fijado && (
              <div className="bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-600 flex items-center gap-1.5 border-b border-blue-100">
                <Pin className="w-3 h-3" /> Publicación fijada
              </div>
            )}

            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>
                    {post.autorNombre[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{post.autorNombre}</p>
                    <p className="text-xs text-gray-400">{timeAgo(post.creadoEn)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    <cfg.Icon className="w-3 h-3" /> {cfg.label}
                  </span>
                  <button onClick={() => toggleFijar(post)}
                    className={`p-1.5 rounded-lg transition-colors ${post.fijado ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}`}
                    title="Fijar publicación"><Pin className="w-3.5 h-3.5" /></button>
                  <button onClick={() => eliminarPost(post.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Contenido */}
              <p className="text-gray-800 text-sm leading-relaxed mb-4 whitespace-pre-line">{post.contenido}</p>

              {/* Acciones */}
              <div className="flex items-center gap-4 pt-3 border-t border-gray-50">
                <button onClick={() => toggleLike(post)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors">
                  <Heart className="w-4 h-4" /> {post.likes}
                </button>
                <button onClick={() => toggleComentarios(post.id)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                  <MessageSquare className="w-4 h-4" /> {numComs} comentarios
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${abierto ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Comentarios */}
              {abierto && (
                <div className="mt-4 space-y-3">
                  {post.comentarios?.map(c => (
                    <div key={c.id} className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                        {c.autorNombre[0]}
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-xs font-semibold text-gray-700 mb-0.5">{c.autorNombre}</p>
                        <p className="text-sm text-gray-700">{c.contenido}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563ae)' }}>A</div>
                    <input value={comentarios[post.id] ?? ''} onChange={e => setComs(p => ({ ...p, [post.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); comentar(post.id) } }}
                      placeholder="Escribe un comentario..."
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400" />
                    <button onClick={() => comentar(post.id)}
                      className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
