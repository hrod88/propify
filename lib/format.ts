/**
 * lib/format.ts — Utilidades de formato puro (sin dependencias de servidor)
 * Seguro para importar desde Client Components.
 */

/** Formatea un número como moneda CLP chilena: $1.234.567 */
export const formatCLP = (monto: number): string =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto)
