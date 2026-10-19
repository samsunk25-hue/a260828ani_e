import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TriangleAlert, Bot, Sparkles, DoorOpen, Trophy, Palette, Copy, Check, Loader2, Home, Globe, EyeOff, Ban } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { formatTime } from '../../utils/time';
import { MODE_LABEL } from '../../utils/ranking';
import { KEYWORDS, keywordChecks, feedbackMessages, evaluateAnswer } from '../../utils/answerCheck';
import { submitScore } from '../../services/leaderboardApi';
import { GlobalRankingCard } from './IntroScreen';

const block = (e) => e.preventDefault();

const PostGameAssessment = () => {
  const inventory = useGameStore(state => state.inventory);
  const finishGame = useGameStore(state => state.finishGame);
  const finalTime = useGameStore(state => state.finalTime);
  const finalScore = useGameStore(state => state.finalScore);
  const pendingResult = useGameStore(state => state.pendingResult);
  const saveResultLocally = useGameStore(state => state.saveResultLocally);
  const clearPendingResult = useGameStore(state => state.clearPendingResult);
  const resetGame = useGameStore(state => state.resetGame);
  const mode = useGameStore(state => state.mode);
  const isHard = mode === 'hard';

  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState(null); // { ok: boolean, body: string }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isEscaping, setIsEscaping] = useState(false);
  const [hasEscaped, setHasEscaped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [blockedNote, setBlockedNote] = useState(false);

  // 랭킹 등록 선택: null(미정) | 'publishing' | 'published' | 'failed' | 'skipped'
  const [shareState, setShareState] = useState(null);
  const [publishedDate, setPublishedDate] = useState(null);

  const hits = KEYWORDS.filter(k => keywordChecks[k](text));

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const result = evaluateAnswer(text);
      if (result.ok) {
        setFeedback({ ok: true, body: '훌륭합니다! 순환계 마비가 생명 활동에 미치는 인과관계를 모두 정확히 포함하여 논리적으로 서술했습니다.' });
        setShowPrompt(true);
      } else {
        const parts = [];
        if (result.missing.length > 0) {
          parts.push(`누락되었거나 연결이 부족한 키워드: [${result.missing.join(', ')}]`);
          parts.push('논리적 비약을 채우기 위한 가이드:\n' + result.missing.map(k => `- ${feedbackMessages[k]}`).join('\n'));
        }
        if (result.problems.length > 0) {
          parts.push('서술 방식 점검:\n' + result.problems.map(p => `- ${p}`).join('\n'));
        }
        setFeedback({ ok: false, body: '아쉽네요. 아직 통과 기준에 미치지 못했습니다.\n\n' + parts.join('\n\n') });
      }
      setIsSubmitting(false);
    }, 1200);
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

  const onBlockedInput = (e) => {
    e.preventDefault();
    setBlockedNote(true);
    setTimeout(() => setBlockedNote(false), 2000);
  };

  const publish = async () => {
    if (!pendingResult) return;
    setShareState('publishing');
    try {
      await submitScore(pendingResult);
      saveResultLocally();
      setPublishedDate(pendingResult.date);
      clearPendingResult();
      setShareState('published');
    } catch {
      setShareState('failed');
    }
  };

  const skipPublish = () => {
    clearPendingResult();
    setShareState('skipped');
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
          모두 포함하여 인과관계에 맞게 <strong>완결된 문장으로</strong> 서술하세요. 키워드만 나열하면 통과되지 않습니다.
        </p>

        <div className="keyword-row" aria-label="핵심 키워드">
          {KEYWORDS.map(kw => {
            const hit = hits.includes(kw);
            return (
              <span key={kw} className={`keyword ${hit ? 'hit' : ''}`}>
                {hit && <Check size={13} strokeWidth={3} />}
                {kw}
              </span>
            );
          })}
        </div>

        <div className="textarea-wrap">
          <textarea
            className="textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="예: 순환계가 마비되면 혈액이 흐르지 못해 세포에 산소와 영양소가 전달되지 않는다. 그래서 …"
            disabled={hasEscaped}
            onPaste={onBlockedInput}
            onDrop={onBlockedInput}
            onCopy={block}
            onCut={block}
            onContextMenu={block}
            spellCheck={false}
          />
          <div className={`textarea-note ${blockedNote ? 'show' : ''}`}>
            <Ban size={12} /> 복사·붙여넣기는 사용할 수 없어요. 직접 입력해 주세요.
          </div>
        </div>

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
            {/* 내 결과 */}
            <section className="result-card gold">
              <h2><Trophy size={18} /> 탈출 성공 · {MODE_LABEL[mode]} 모드</h2>
              <div className="result-stats">
                <div><dt>탈출 시간</dt><dd className="mono">{formatTime(finalTime)}</dd></div>
                {isHard && <div><dt>최종 점수</dt><dd>{(finalScore ?? 0).toLocaleString()}점</dd></div>}
                {isHard && <div><dt>최고 콤보</dt><dd>×{pendingResult?.maxCombo ?? 0}</dd></div>}
              </div>
              {isHard && <p className="result-note">최종 점수 = 행동 점수 + 남은 생명력 보너스 + 시간 보너스</p>}

              {/* 랭킹 등록 선택 */}
              {shareState !== 'published' && shareState !== 'skipped' && (
                <div className="share-box">
                  <p className="share-q">
                    <Globe size={15} /> 이 기록을 <strong>전체 사용자 랭킹</strong>에 올릴까요? 별명과 시간{isHard ? ', 점수' : ''}가 모든 사용자에게 보입니다.
                  </p>
                  {shareState === 'failed' && (
                    <p className="share-fail">전송에 실패했습니다. 네트워크를 확인하고 다시 시도하거나, 올리지 않기를 선택하세요.</p>
                  )}
                  <div className="share-actions">
                    <button type="button" className="btn btn-primary" onClick={publish} disabled={shareState === 'publishing'}>
                      {shareState === 'publishing' ? <Loader2 size={16} className="spin" /> : <Globe size={16} />}
                      {shareState === 'publishing' ? '올리는 중…' : '랭킹에 올리기'}
                    </button>
                    <button type="button" className="btn" onClick={skipPublish} disabled={shareState === 'publishing'}>
                      <EyeOff size={16} />
                      올리지 않기
                    </button>
                  </div>
                </div>
              )}
              {shareState === 'published' && <p className="share-done"><Check size={14} /> 전체 랭킹에 등록되었습니다.</p>}
              {shareState === 'skipped' && <p className="share-done muted"><EyeOff size={14} /> 기록을 올리지 않았습니다. (어려움 모드 해금은 유지됩니다)</p>}
            </section>

            {(shareState === 'published' || shareState === 'skipped') && (
              <GlobalRankingCard initialMode={mode} highlightDate={publishedDate} />
            )}

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
