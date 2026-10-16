const pad = (n) => String(n).padStart(2, '0');

/** ms → "MM:SS.hh" */
export const formatTime = (ms) => {
  if (!ms || ms < 0) return '00:00.00';
  const totalSeconds = Math.floor(ms / 1000);
  return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}.${pad(Math.floor((ms % 1000) / 10))}`;
};

/** timestamp → "2026.10.16" */
export const formatDate = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
};
