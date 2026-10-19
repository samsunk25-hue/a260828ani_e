/**
 * 서술형 답안 검사 (최종 과제)
 * 키워드만 나열해도 통과되지 않도록, 키워드 포함 + 문장 서술 + 인과 연결을 함께 본다.
 */
export const KEYWORDS = ['세포호흡', '산소와 영양소', '이산화탄소와 노폐물', '에너지', '생명 활동'];

const compact = (t) => t.replace(/\s+/g, '');

export const keywordChecks = {
  '세포호흡': (t) => compact(t).includes('세포호흡'),
  '산소와 영양소': (t) => t.includes('산소') && t.includes('영양소'),
  '이산화탄소와 노폐물': (t) => compact(t).includes('이산화탄소') && compact(t).includes('노폐물'),
  '에너지': (t) => t.includes('에너지'),
  '생명 활동': (t) => compact(t).includes('생명활동') || (t.includes('생명') && t.includes('활동')),
};

export const feedbackMessages = {
  '세포호흡': "순환계가 멈추면 세포에 물질이 도달하지 못해 '세포호흡'이 중단된다는 점을 연결해 보세요.",
  '산소와 영양소': "순환계가 마비되면 혈액을 통한 '산소와 영양소'의 운반이 멈춘다는 점을 언급해 보세요.",
  '이산화탄소와 노폐물': "세포호흡 후 발생한 '이산화탄소와 노폐물'이 몸 밖으로 배출되지 못하고 쌓이게 된다는 점을 추가해 보세요.",
  '에너지': "세포호흡이 멈춤에 따라 생명 유지에 필요한 '에너지'가 생성되지 못한다는 결과를 포함해 보세요.",
  '생명 활동': "최종적으로 에너지가 부족해지면 동물의 '생명 활동'이 멈추게 된다는 치명적인 결론을 서술해 보세요.",
};

// 인과·순서를 나타내는 연결 표현
const CAUSAL = ['때문', '그래서', '따라서', '그러므로', '결국', '결과', '으로 인해', '로 인해', '인하여', '되면', '하면', '으면', '않아', '못해', '못하', '멈추', '중단', '그러면', '이어서', '다음'];

const MIN_CHARS = 80;      // 공백 제외 글자 수
const MIN_SENTENCES = 2;   // 문장 수
const MAX_KEYWORD_RATIO = 0.45; // 키워드 글자 비율이 이보다 높으면 '나열'로 본다

const countSentences = (t) => t.split(/[.!?。]|다\s|요\s|다$|요$/).map(s => s.trim()).filter(s => s.length >= 4).length;

/**
 * @returns {{ ok: boolean, missing: string[], problems: string[] }}
 */
export const evaluateAnswer = (text) => {
  const t = (text || '').trim();
  const missing = KEYWORDS.filter(k => !keywordChecks[k](t));
  const problems = [];

  const chars = compact(t).length;
  if (chars < MIN_CHARS) {
    problems.push(`설명이 너무 짧습니다. 공백을 빼고 ${MIN_CHARS}자 이상으로, 원인과 결과가 드러나게 써 보세요. (현재 ${chars}자)`);
  }

  const sentences = countSentences(t);
  if (sentences < MIN_SENTENCES) {
    problems.push('완결된 문장으로 서술하세요. 단어나 키워드만 나열한 답안은 인정되지 않습니다. (문장은 "~한다.", "~된다." 처럼 끝맺어 주세요)');
  }

  const keywordChars = KEYWORDS.reduce((sum, k) => sum + (keywordChecks[k](t) ? compact(k).length : 0), 0);
  if (chars > 0 && keywordChars / chars > MAX_KEYWORD_RATIO) {
    problems.push('키워드만 적혀 있고 설명이 부족합니다. 각 키워드가 서로 어떻게 이어지는지 문장으로 풀어 쓰세요.');
  }

  const hasCausal = CAUSAL.some(c => t.includes(c));
  if (!hasCausal) {
    problems.push('인과관계가 드러나지 않습니다. "~때문에", "그래서", "~되면 … 못한다" 같은 표현으로 앞뒤를 연결해 보세요.');
  }

  return { ok: missing.length === 0 && problems.length === 0, missing, problems };
};
