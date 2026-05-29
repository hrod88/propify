'use client'

import { useState, useRef } from 'react'
import { ImageIcon, Plus, Trash2, Upload, Link, X, Check, Loader2 } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase-browser'

interface Props {
  edificioId: string
  fotosIniciales: string[]
}

export default function FotosManager({ edificioId, fotosIniciales }: Props) {
  const [fotos, setFotos]       = useState<string[]>(fotosIniciales)
  const [modo, setModo]         = useState<'url' | 'upload' | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [toast, setToast]       = useState<string | null>(null)
  const fileRef                 = useRef<HTMLInputElement>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function guardarFotos(nuevaLista: string[]) {
    const { error } = await supabaseBrowser
      .from('edificios')
      .update({ fotos: nuevaLista })
      .eq('id', edificioId)
    if (error) console.error('update fotos:', error.message)
  }

  function agregarUrl() {
    const url = urlInput.trim()
    if (!url) return
    if (fotos.includes(url)) { showToast('Esa URL ya está en la galería'); return }
    const nueva = [...fotos, url]
    setFotos(nueva)
    guardarFotos(nueva)
    setUrlInput('')
    setModo(null)
    showToast('Foto agregada')
  }

  async function subirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext      = file.name.split('.').pop()
    const fileName = `${edificioId}/${Date.now()}.${ext}`
    const { error } = await supabaseBrowser.storage
      .from('edificio-fotos')
      .upload(fileName, file, { upsert: true })
    if (error) {
      console.error('upload foto:', error.message)
      showToast('Error al subir. Verifica que el bucket "edificio-fotos" esté creado y sea público.')
      setUploading(false)
      return
    }
    const { data } = supabaseBrowser.storage.from('edificio-fotos').getPublicUrl(fileName)
    const nueva = [...fotos, data.publicUrl]
    setFotos(nueva)
    guardarFotos(nueva)
    setModo(null)
    showToast('Foto subida correctamente')
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function eliminarFoto(url: string) {
    const nueva = fotos.filter(f => f !== url)
    setFotos(nueva)
    guardarFotos(nueva)
    showToast('Foto eliminada')
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#e2e8f0' }}>

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-[70] flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-2xl"
          style={{ background: '#16a34a' }}
        >
          <Check className="w-4 h-4" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b" style={{ borderColor: '#f1f5f9' }}>
        <div>
          <h2 className="font-bold text-gray-900">Galería del Edificio</h2>
          <p className="text-xs text-gray-400 mt-0.5">{fotos.length} foto{fotos.length !== 1 ? 's' : ''}</p>
        </div>
        {modo === null && (
          <div className="flex gap-2">
            <button
              onClick={() => setModo('upload')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ background: '#dbeafe', color: '#2563ae' }}
            >
              <Upload className="w-3.5 h-3.5" />
              Subir foto
            </button>
            <button
              onClick={() => setModo('url')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ background: '#f1f5f9', color: '#475569' }}
            >
              <Link className="w-3.5 h-3.5" />
              Pegar URL
            </button>
          </div>
        )}
      </div>

      {/* Panel agregar */}
      {modo === 'url' && (
        <div className="px-5 py-4 flex items-center gap-2 border-b" style={{ borderColor: '#f1f5f9', background: '#f8fafc' }}>
          <input
            type="url"
            className="flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ borderColor: '#e2e8f0' }}
            placeholder="https://..."
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && agregarUrl()}
            autoFocus
          />
          <button
            onClick={agregarUrl}
            className="px-3 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90"
            style={{ background: '#2563ae' }}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setModo(null); setUrlInput('') }}
            className="px-3 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100"
            style={{ color: '#64748b' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {modo === 'upload' && (
        <div className="px-5 py-4 border-b" style={{ borderColor: '#f1f5f9', background: '#f8fafc' }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={subirArchivo}
          />
          {uploading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#2563ae' }} />
              Subiendo foto...
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90"
                style={{ background: '#2563ae' }}
              >
                <Upload className="w-4 h-4" />
                Elegir archivo
              </button>
              <p className="text-xs text-gray-400">JPG, PNG, WEBP · máx 5 MB</p>
              <button
                onClick={() => setModo(null)}
                className="ml-auto p-2 rounded-xl hover:bg-gray-100"
                style={{ color: '#64748b' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">
            ⚠️ Requiere bucket <code className="bg-gray-100 px-1 rounded">edificio-fotos</code> público en Supabase Storage.
          </p>
        </div>
      )}

      {/* Galería */}
      {fotos.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-3 text-center px-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#f1f5f9' }}>
            <ImageIcon className="w-6 h-6 text-gray-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Sin fotos todavía</p>
            <p className="text-xs text-gray-400 mt-1">Sube fotos del edificio usando los botones de arriba</p>
          </div>
        </div>
      ) : (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {fotos.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Foto ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <button
                  onClick={() => eliminarFoto(url)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-full transition-opacity"
                  style={{ background: '#dc2626' }}
                  title="Eliminar foto"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          ))}
          {/* Botón agregar dentro de la grilla */}
          <button
            onClick={() => setModo('upload')}
            className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            style={{ borderColor: '#e2e8f0', color: '#94a3b8' }}
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs font-medium">Agregar</span>
          </button>
        </div>
      )}
    </div>
  )
}
