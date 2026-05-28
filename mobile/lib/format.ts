/** Formatea a CLP chileno — igual que la versión web */
export function formatCLP(monto: number): string {
  return new Intl.NumberFormat('es-CL', {
    style:    'currency',
    currency: 'CLP',
  }).format(monto)
}

/** MESES abreviados */
export const MESES = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
export const MESES_FULL = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
