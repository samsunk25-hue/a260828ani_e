/** 기록의 난이도 (예전 기록은 mode가 없으므로 쉬움으로 본다) */
export const recordMode = (record) => record.mode || 'easy';

/** 난이도별 정렬: 쉬움은 시간 오름차순, 어려움은 점수 내림차순(동점이면 시간) */
export const rankRecords = (leaderboard, mode) => {
  const list = leaderboard.filter(r => recordMode(r) === mode);
  if (mode === 'hard') {
    return [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.time - b.time);
  }
  return [...list].sort((a, b) => a.time - b.time);
};

export const MODE_LABEL = { easy: '쉬움', hard: '어려움' };

const normalizeName = (name) => (name || '').trim().toLowerCase();

/** 이 별명으로 쉬움 모드를 탈출(완주)한 기록이 있는가 — 어려움 모드 해금 조건 */
export const hasClearedEasy = (leaderboard, nickname) => {
  const key = normalizeName(nickname);
  if (!key) return false;
  return leaderboard.some(r => recordMode(r) === 'easy' && normalizeName(r.nickname) === key);
};
