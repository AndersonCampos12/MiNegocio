import { HttpErrorResponse } from '@angular/common/http';

const MENSAJE_GENERICO = 'Ocurrió un error inesperado. Inténtalo nuevamente.';

export function obtenerMensajeHttp(error: unknown, fallback = MENSAJE_GENERICO): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;

  const mensajeApi = typeof error.error?.mensaje === 'string' ? error.error.mensaje.trim() : '';
  if (mensajeApi && !contieneDetalleInterno(mensajeApi)) return mensajeApi;

  if (error.status === 0) return 'No se pudo conectar con el servidor. Revisa tu conexión.';
  if (error.status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
  if (error.status === 403) return 'No tienes permisos para realizar esta acción.';
  return fallback;
}

function contieneDetalleInterno(mensaje: string): boolean {
  return /prisma\.|invocation|constraint failed|node_modules|\/[\w/-]+\.ts:\d+/i.test(mensaje);
}
