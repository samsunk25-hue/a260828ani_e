import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TriangleAlert, Bot, Sparkles, DoorOpen, Trophy, Palette, Copy, Check, Loader2, Home } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { formatTime } from '../../utils/time';
import { rankRecords, MODE_LABEL } from '../../utils/ranking';

const keywords = ['세포호흡', '산소와 영양소', '이산화탄소와 노폐물', '에너지', '생명 활동'];

const keywordChecks = {
  '세포호흡': (txt) => txt.replace(/\s+/g, '').includes('세포호흡'),
  '산소와 영양소': (txt) => txt.includes('산소') && txt.includes('영양소'),
  '이산화탄소와 노폐물': (txt) => txt.replace(/\s+/g, '').includes('이산화탄소') && txt.replace(/\s+/g, '').includes('노폐물'),
  '에너지': (txt) => txt.includes('에너지'),
  '생명 활동': (txt) => txt.includes('생명') && txt.includes('활동'),
};

const feedbackMessages = {
  '세포호흡': "순환계가 멈추면 세포에 물질이 도달하지 못해 '세포호흡'이 중단된다는 점을 연결해 보세요.",
  '산소와 영양소': "순환계가 마비되면 혈액을 통한 '산소와 영양소'의 운반이 멈춘다는 점을 언급해 보세요.",
  '이산화탄소와 노폐물': "세포호흡 후 발생한 '이산화탄소와 노폐물'이 몸 밖으로 배출되지 못하고 쌓이게 된다는 점을 추가해 보세요.",
  '에너지': "세포호흡이 멈춤에 따라 생명 유지에 필요한 '에너지'가 생성되지 못한다는 결과를 포함해 보세요.",
  '생명 활동': "최종적으로 에너지가 부족해지면 동물의 '생명 활동'이 멈추게 된다는 치명적인 결론을 서술해 보세요.",
};

const PostGameAssessment = () => {
  const { inventory, finishGame, finalTime, finalScore, leaderboard, resetGame, mode } = useGameStore();
  const isHard = mode === 'hard';
  const ranked = rankRecords(leaderboard, mode);
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState(null); // { ok: boolean, body: string }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isEscaping, setIsEscaping] = useState(false);
  const [hasEscaped, setHasEscaped] = useState(false);
  const [copied, setCopied] = useState(false);

  const hits = keywords.filter(k => keywordChecks[k](text));

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const missing = keywords.filter(k => !keywordChecks[k](text));
      if (missing.length === 0) {
        setFeedback({ ok: true, body: '훌륭합니다! 순환계 마비가 생명 활동에 미치는 인과관계를 모두 정확히 포함하여 논리적으로 서술했습니다.' });
        setShowPrompt(true);
      } else {
        const guide = missing.map(k => `- ${feedbackMessages[k]}`).join('\n');
        setFeedback({
          ok: false,
          body: `아쉽네요. 다음 부분의 논리가 누락되었거나 연결이 부족합니다: [${missing.join(', ')}]\n\n논리적 비약을 채우기 위한 가이드:\n${guide}`,
        });
      }
      setIsSubmitting(false);
    }, 1500);
  };

  const generatedPrompt = `(Masterpiece, highly detailed:1.2), A conceptual infographic about a futuristic bio-energy cooperative. Inside a giant stylized human body, glowing tubes transporting nutrients and oxygen, ${inventory.map(i => i.name).join(', ')}, bright neon colors, deep space background, educational poster style, Unreal Engine 5 render, cinematic lighting.`;

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable: text is still selectable */
    }
  };

  return (
    <motion.div
      className="postgame-wrap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass glass-strong postgame"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <span className="postgame-alert">
          <TriangleAlert size={14} />
          FINAL MISSION
        </span>

        <h1 className="postgame-title text-gradient">경고! 순환계 기능 이상 발생!</h1>

        <p className="postgame-desc">
          순환계가 마비되면 우리 몸에 어떤 일이 일어날까요? 획득한 메타포와 아래의 핵심 키워드 5가지를
          모두 포함하여 인과관계에 맞게 서술형으로 작성하세요.
        </p>

        <div className="keyword-row" aria-label="핵심 키워드">
          {keywords.map(kw => {
            const hit = hits.includes(kw);
            return (
              <span key={kw} className={`keyword ${hit ? 'hit' : ''}`}>
                {hit && <Check size={13} strokeWidth={3} />}
                {kw}
              </span>
            );
          })}
        </div>

        <textarea
          className="textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="예: 순환계가 마비되면 산소와 영양소가..."
          disabled={hasEscaped}
        />

        {!hasEscaped && (
          <button
            type="button"
            className="btn btn-primary btn-block btn-lg"
            onClick={handleSubmit}
            disabled={isSubmitting || text.trim().length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="spin" />
                AI 분석 중...
              </>
            ) : (
              <>
                <Bot size={18} />
                서술형 답안 제출 · AI 피드백 받기
              </>
            )}
          </button>
        )}

        <AnimatePresence>
          {feedback && (
            <motion.div
              key={feedback.body}
              className={`feedback ${feedback.ok ? 'ok' : ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {feedback.ok ? <Sparkles size={18} /> : <Bot size={18} />}
              <div>
                <div className="feedback-title">AI 튜터 피드백</div>
                <div className="feedback-body">{feedback.body}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {showPrompt && !hasEscaped && (
          <motion.div className="escape-cta" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <button type="button" className="btn btn-primary btn-lg" onClick={() => setIsEscaping(true)}>
              <DoorOpen size={20} />
              몸속 방탈출하기!
            </button>
          </motion.div>
        )}

        {hasEscaped && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <section className="result-card gold">
              <h2><Trophy size={18} /> 명예의 전당 · {MODE_LABEL[mode]} 모드</h2>
              {isHard && finalScore != null && (
                <p className="final-score">
                  최종 점수 <strong>{finalScore.toLocaleString()}점</strong>
                  <span>(행동 점수 + 남은 생명력 보너스 + 시간 보너스)</span>
                </p>
              )}
              <div className="leaderboard">
                <table>
                  <thead>
                    <tr>
                      <th>순위</th>
                      <th>탐험대원</th>
                      {isHard && <th className="right">점수</th>}
                      <th className="right">탈출 시간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((record, index) => (
                      <tr key={`${record.date}-${index}`} className={record.time === finalTime ? 'me' : ''}>
                        <td>
                          <span className="rank">
                            {index + 1}위
                            {index === 0 && <Trophy size={13} />}
                          </span>
                        </td>
                        <td>{record.nickname || '이름 없음'}</td>
                        {isHard && <td className="right mono">{(record.score ?? 0).toLocaleString()}</td>}
                        <td className="right mono">{formatTime(record.time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="result-card orange">
              <h3><Palette size={18} /> AI 이미지 프롬프트 추출 완료</h3>
              <p>
                작성하신 논리를 바탕으로 인포그래픽 제작용 프롬프트가 생성되었습니다. 투닝(TOONING)이나
                미드저니 등에 붙여넣어 나만의 생명과학 인포그래픽을 만들어보세요.
              </p>
              <div className="prompt-box">
                <code>{generatedPrompt}</code>
                <button
                  type="button"
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  onClick={copyPrompt}
                  aria-label="프롬프트 복사"
                  title="프롬프트 복사"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>
            </section>

            <button type="button" className="btn btn-block" onClick={resetGame}>
              <Home size={18} />
              메인 화면으로 (랭킹 보기)
            </button>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {isEscaping && !hasEscaped && (
          <motion.div
            className="escape-flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onAnimationComplete={() => {
              setTimeout(() => {
                finishGame();
                setHasEscaped(true);
                setIsEscaping(false);
              }, 2500);
            }}
          >
            <motion.h1
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            >
              탈출 성공!
            </motion.h1>
            <motion.p
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
            >
              동물의 생명활동과 에너지 단원 마스터!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PostGameAssessment;
