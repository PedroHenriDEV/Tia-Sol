export type EventUrgency = {
  label: string;
  reminder: string | null;
  className: string;
  softClassName: string;
};

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getEventUrgency(eventDate: string, today = new Date()): EventUrgency {
  const todayKey = localDateKey(today);
  const todayTime = new Date(todayKey + 'T12:00:00').getTime();
  const eventTime = new Date(eventDate + 'T12:00:00').getTime();
  const days = Math.round((eventTime - todayTime) / 86400000);

  if (days < 0) return { label: 'Passado', reminder: null, className: 'bg-slate-100 text-slate-600', softClassName: 'border-slate-200 bg-slate-50' };
  if (days === 0) return { label: 'Hoje', reminder: 'Evento hoje', className: 'bg-emerald-100 text-emerald-700', softClassName: 'border-emerald-200 bg-emerald-50' };
  if (days <= 7) return { label: `Faltam ${days} dias`, reminder: `Lembrete: faltam ${days} dias`, className: 'bg-red-100 text-red-700', softClassName: 'border-red-200 bg-red-50' };
  if (days <= 10) return { label: `Faltam ${days} dias`, reminder: `Lembrete: faltam ${days} dias`, className: 'bg-orange-100 text-orange-700', softClassName: 'border-orange-200 bg-orange-50' };
  if (days <= 30) return { label: `Faltam ${days} dias`, reminder: null, className: 'bg-amber-100 text-amber-700', softClassName: 'border-amber-200 bg-amber-50' };
  if (days <= 60) return { label: `Faltam ${days} dias`, reminder: null, className: 'bg-blue-100 text-blue-700', softClassName: 'border-blue-200 bg-blue-50' };
  return { label: `Faltam ${days} dias`, reminder: null, className: 'bg-slate-100 text-slate-600', softClassName: 'border-slate-200 bg-slate-50' };
}
