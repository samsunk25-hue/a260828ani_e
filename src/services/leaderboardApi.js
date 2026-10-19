/**
 * 전체 사용자 랭킹 (Firestore REST API, SDK 없이 가볍게 사용)
 * - 컬렉션: scores_easy / scores_hard
 * - 보안 규칙: 누구나 읽기, 검증된 새 기록만 추가, 수정·삭제 불가 (firestore.rules)
 */
const PROJECT_ID = 'giant-body-escape';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export const TOP_N = 5;

const collectionFor = (mode) => (mode === 'hard' ? 'scores_hard' : 'scores_easy');

const toFields = (record) => ({
  nickname: { stringValue: String(record.nickname).slice(0, 16) },
  mode: { stringValue: record.mode },
  time: { integerValue: String(Math.round(record.time)) },
  score: { integerValue: String(Math.round(record.score ?? 0)) },
  maxCombo: { integerValue: String(Math.round(record.maxCombo ?? 0)) },
  date: { integerValue: String(Math.round(record.date)) },
});

const num = (v) => (v === undefined ? 0 : Number(v.integerValue ?? v.doubleValue ?? 0));

const fromDoc = (doc) => {
  const f = doc.fields || {};
  return {
    id: doc.name?.split('/').pop(),
    nickname: f.nickname?.stringValue ?? '',
    mode: f.mode?.stringValue ?? 'easy',
    time: num(f.time),
    score: num(f.score),
    maxCombo: num(f.maxCombo),
    date: num(f.date),
  };
};

const withTimeout = (ms) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(id) };
};

/** 난이도별 상위 기록. 쉬움은 시간 빠른 순, 어려움은 점수 높은 순(동점이면 시간). */
export const fetchTopScores = async (mode, n = TOP_N) => {
  const orderBy = mode === 'hard'
    ? [{ field: { fieldPath: 'score' }, direction: 'DESCENDING' }]
    : [{ field: { fieldPath: 'time' }, direction: 'ASCENDING' }];

  const t = withTimeout(8000);
  try {
    const res = await fetch(`${BASE}:runQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: t.signal,
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: collectionFor(mode) }],
          orderBy,
          limit: Math.max(n * 4, 20), // 동점 정리를 위해 넉넉히 받아 클라이언트에서 다시 정렬
        },
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()).map(r => r.document).filter(Boolean).map(fromDoc);
    const sorted = mode === 'hard'
      ? rows.sort((a, b) => b.score - a.score || a.time - b.time)
      : rows.sort((a, b) => a.time - b.time);
    return sorted.slice(0, n);
  } finally {
    t.done();
  }
};

/** 기록 1건 올리기. 성공하면 저장된 문서 id를 돌려준다. */
export const submitScore = async (record) => {
  const t = withTimeout(8000);
  try {
    const res = await fetch(`${BASE}/${collectionFor(record.mode)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: t.signal,
      body: JSON.stringify({ fields: toFields(record) }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).name?.split('/').pop();
  } finally {
    t.done();
  }
};
