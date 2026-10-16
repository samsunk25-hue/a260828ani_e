import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Check, X, ArrowRight, HeartCrack } from 'lucide-react';
import { pickQuiz } from '../../data/quiz';
import { useGameStore, HARD_RULES } from '../../store/useGameStore';

/**
 * 어려움 모드 방 이동 관문. 정답을 맞혀야 다음 방으로 갈 수 있다.
 * 오답마다 생명력이 깎이고, 정답이면 점수와 회복을 받는다.
 */
const QuizGate = ({ stageId, onPass, onClose }) => {
  const changeHp = useGameStore(state => state.changeHp);
  const addScore = useGameStore(state => state.addScore);
  const [quiz] = useState(() => pickQuiz(stageId));
  const [wrong, setWrong] = useState([]);
  const [solved, setSolved] = useState(false);

  if (!quiz) {
    onPass();
    return null;
  }

  const choose = (opt) => {
    if (solved || wrong.includes(opt)) return;
    if (opt === quiz.answer) {
      setSolved(true);
      addScore(HARD_RULES.quizScore);
      changeHp(HARD_RULES.quizHeal);
    } else {
      setWrong(w => [...w, opt]);
      changeHp(-HARD_RULES.quizPenalty);
    }
  };

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="glass glass-strong quiz"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-title"
        initial={{ y: 20, scale: 0.97, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: -10, scale: 0.97, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="quiz-head">
          <span className="stage-badge">
            <BrainCircuit size={13} />
            관문 퀴즈
          </span>
          <span className="quiz-meta">
            <HeartCrack size={13} /> 오답 -{HARD_RULES.quizPenalty} · 정답 +{HARD_RULES.quizScore}점, 생명력 +{HARD_RULES.quizHeal}
          </span>
        </div>

        <h2 id="quiz-title" className="quiz-q">{quiz.q}</h2>

        <div className="quiz-options">
          {quiz.options.map((opt) => {
            const isWrong = wrong.includes(opt);
            const isAnswer = solved && opt === quiz.answer;
            return (
              <button
                key={opt}
                type="button"
                className={`quiz-option ${isWrong ? 'wrong' : ''} ${isAnswer ? 'correct' : ''}`}
                onClick={() => choose(opt)}
                disabled={solved || isWrong}
              >
                <span className="quiz-mark">
                  {isAnswer ? <Check size={14} strokeWidth={3} /> : isWrong ? <X size={14} strokeWidth={3} /> : null}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {(solved || wrong.length > 0) && (
          <motion.p
            className={`quiz-explain ${solved ? 'ok' : ''}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {solved ? `정답! ${quiz.explain}` : '틀렸어요. 다른 보기를 골라 보세요.'}
          </motion.p>
        )}

        <div className="quiz-actions">
          {!solved && (
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              나중에 풀기
            </button>
          )}
          {solved && (
            <button type="button" className="btn btn-primary btn-block" onClick={onPass}>
              다음 방으로 이동
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuizGate;
