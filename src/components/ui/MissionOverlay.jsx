import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ArrowRight, Check, MousePointer2, BrainCircuit } from 'lucide-react';
import { useGameStore, HARD_RULES } from '../../store/useGameStore';
import QuizGate from './QuizGate';

const missions = {
  digestive: {
    stage: 1,
    title: '소화의 방',
    desc: '화면에 떠 있는 쓸개즙과 소화 효소(아밀레이스, 펩신, 트립신, 라이페이스)를 떨어뜨려 거대한 음식물(빵, 고기, 치즈)을 최종 영양소로 분해하세요. 중간산물은 한 번 더 분해해야 합니다.',
    descHard: '효소 이름이 영어로만 표시됩니다. 음식물(빵, 고기, 치즈)을 최종 영양소까지 분해하세요. 잘못된 효소를 떨어뜨리면 생명력이 줄어듭니다.',
    goals: [
      { id: 'glucose', label: '포도당 획득' },
      { id: 'amino_acid', label: '아미노산 획득' },
      { id: 'fatty_acid', label: '지방산 획득' },
    ],
    how: '효소 구슬을 마우스로 누른 채 끌어서 음식물 위에 놓으세요. 맞는 효소면 음식물이 분해됩니다.',
    howHard: '효소 구슬을 끌어서 음식물 위에 놓으세요. 어떤 효소가 무엇을 분해하는지는 스스로 판단해야 합니다.',
    next: 'respiratory',
    hint: '우리 몸의 각 소화 기관은 특정한 영양소만 분해하는 전문 효소들을 가지고 있습니다. 빵을 더 잘게 나누기 위해 가장 먼저 필요한 효소는 무엇일까요?',
  },
  respiratory: {
    stage: 2,
    title: '호흡의 방',
    desc: '포도송이 모양의 폐포(Alveolus)와 모세혈관(Capillary) 사이의 기체 교환을 완성하세요. 산소(O₂)와 이산화탄소(CO₂)를 각각 이동해야 할 올바른 위치로 드래그 앤 드롭하세요.',
    descHard: '기체는 화학식으로만 표시되며, 움직이면 안 되는 기체도 섞여 있습니다. 폐포와 모세혈관 사이의 기체 교환을 올바르게 완성하세요.',
    goals: [
      { id: 'oxygen', label: '산소 운반 완료' },
      { id: 'co2', label: '이산화탄소 배출 완료' },
    ],
    how: '산소(O2) 분자 2개는 폐포에서 모세혈관으로, 이산화탄소(CO2) 분자 2개는 모세혈관에서 폐포로 끌어다 놓으세요.',
    howHard: '분자 모형을 보고 어떤 기체가 어느 방향으로 확산되는지 판단해 끌어다 놓으세요. 교환되지 않는 기체는 건드리지 마세요.',
    next: 'circulatory',
    hint: '기체는 농도가 높은 곳에서 낮은 곳으로 확산됩니다. 방금 신선한 공기를 들이마셨다면, 산소가 가장 많은 곳은 어디일까요?',
  },
  circulatory: {
    stage: 3,
    title: '순환의 방',
    desc: '심장의 4개 방(좌우 심방, 심실)과 온몸을 도는 혈액의 순환 경로를 완성하세요. 깜빡이는 다음 목적지를 확인하고, 혈액 토큰을 올바른 순서대로 드래그하여 이동시키세요.',
    descHard: '다음 목적지가 표시되지 않습니다. 폐에서 출발한 혈액이 심장과 온몸을 어떤 순서로 도는지 스스로 떠올려 혈액 토큰을 옮기세요. 역류하면 생명력이 줄어듭니다.',
    goals: [{ id: 'energy', label: '세포에 에너지 전달' }],
    how: '혈액 구슬을 깜빡이는 다음 방(또는 세포, 폐)으로 끌어다 놓으세요. 순서: 폐 → 좌심방 → 좌심실 → 세포 → 우심방 → 우심실 → 폐',
    howHard: '혈액 구슬을 다음 목적지로 끌어다 놓으세요. 폐에서 시작해 심장을 거쳐 온몸의 세포로, 다시 심장을 거쳐 폐로 돌아오는 한 바퀴를 완성해야 합니다.',
    next: 'excretory',
    hint: "심장으로 들어오는 피는 윗방('심방')에서 대기하다가, 아랫방('심실')의 강한 수축력으로 뿜어집니다. 폐에서 산소를 가득 얻은 깨끗한 피는 온몸으로 가기 위해 어느 쪽 심방으로 들어올까요?",
  },
  excretory: {
    stage: 4,
    title: '배설의 방',
    desc: '네프론(사구체, 보먼주머니, 세뇨관, 모세혈관) 구조를 관찰하고, 물질들을 알맞은 위치로 직접 드래그하여 [여과]와 [재흡수/배설] 과정을 완료하세요.',
    descHard: '목표 영역이 표시되지 않으며, 여과되지 않아야 할 물질이 하나 더 섞여 있습니다. 네프론 구조를 보고 [여과]와 [재흡수/배설]을 완료하세요.',
    goals: [{ id: 'urea', label: '요소 배설 완료' }],
    how: '1단계: 단백질은 혈관 위에, 포도당·요소는 보먼주머니 안에 놓으세요. 2단계: 포도당은 모세혈관으로, 요소는 세뇨관 끝(오줌 배출)으로 끌어다 놓으세요.',
    howHard: '1단계(여과): 혈관 속 물질 중 여과되는 것은 보먼주머니로, 여과되지 않는 것은 혈관 위에 두세요. 2단계(재흡수·배설): 각 물질이 가야 할 곳으로 옮기세요.',
    next: 'post-game',
    hint: '크기가 작은 물질들은 높은 압력에 의해 사구체에서 밖으로 밀려납니다(여과). 하지만 우리 몸에 꼭 필요한 포도당과 아미노산은 오줌으로 빠져나가기 전에 다시 혈관으로 되돌려 받아야겠죠?',
  },
};

// 방(currentStage)이 바뀌면 key로 리마운트되어 힌트/퀴즈 상태가 자동으로 초기화된다
const MissionPanel = ({ currentStage }) => {
  const setStage = useGameStore(state => state.setStage);
  const inventory = useGameStore(state => state.inventory);
  const mode = useGameStore(state => state.mode);
  const changeHp = useGameStore(state => state.changeHp);
  const [showHint, setShowHint] = useState(false);
  const [hintPaid, setHintPaid] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);

  const mission = missions[currentStage];
  if (!mission) return null;

  const isHard = mode === 'hard';
  const has = (id) => inventory.some(i => i.id === id);
  const canProceed = mission.goals.every(g => has(g.id));

  const toggleHint = () => {
    if (!showHint && isHard && !hintPaid) {
      changeHp(-HARD_RULES.hintCost);
      setHintPaid(true);
    }
    setShowHint(v => !v);
  };

  const goNext = () => {
    if (isHard) setQuizOpen(true);
    else setStage(mission.next);
  };

  const nextLabel = mission.next === 'post-game' ? '최종 과제로 이동' : '다음 방으로 이동';

  return (
    <>
      <motion.section
        className="glass mission-panel"
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        aria-labelledby="mission-title"
      >
        <header className="mission-head">
          <div className="mission-badges">
            <span className="stage-badge">Stage {mission.stage} / 4</span>
            <span className={`mode-badge ${mode}`}>{isHard ? '어려움' : '쉬움'}</span>
          </div>
          <h2 id="mission-title" className="mission-title">{mission.title}</h2>
        </header>

        <p className="mission-desc">{isHard ? mission.descHard : mission.desc}</p>

        <div className="how-box">
          <div className="how-title">
            <MousePointer2 size={14} />
            조작 방법
          </div>
          <p>{isHard ? mission.howHard : mission.how}</p>
          <p className="how-sub">물질을 누른 채 끌어서 놓기 · 빈 배경을 드래그하면 화면이 살짝 회전 · 휠로 확대/축소</p>
        </div>

        <div className="goal-list">
          <div className="goal-label">목표</div>
          {mission.goals.map(g => {
            const done = has(g.id);
            return (
              <div key={g.id} className={`goal ${done ? 'done' : ''}`}>
                <span className="check">{done && <Check size={11} strokeWidth={3} />}</span>
                {g.label}
              </div>
            );
          })}
        </div>

        <div className="mission-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={toggleHint}
            aria-expanded={showHint}
            style={{ alignSelf: 'flex-start' }}
          >
            <Lightbulb size={16} />
            {showHint ? '힌트 닫기' : isHard && !hintPaid ? `힌트 보기 (생명력 -${HARD_RULES.hintCost})` : '힌트 보기'}
          </button>

          <AnimatePresence initial={false}>
            {showHint && (
              <motion.div
                className="hint-box"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="hint-box-inner">
                  <Lightbulb size={16} />
                  <span>{mission.hint}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {canProceed && (
              <motion.button
                type="button"
                className="btn btn-primary btn-block"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={goNext}
              >
                {isHard ? <BrainCircuit size={18} /> : null}
                {isHard ? `관문 퀴즈 풀고 ${nextLabel}` : nextLabel}
                <ArrowRight size={18} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      <AnimatePresence>
        {quizOpen && (
          <QuizGate
            key="quiz"
            stageId={currentStage}
            onPass={() => { setQuizOpen(false); setStage(mission.next); }}
            onClose={() => setQuizOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

const MissionOverlay = () => {
  const currentStage = useGameStore(state => state.currentStage);
  return <MissionPanel key={currentStage} currentStage={currentStage} />;
};

export default MissionOverlay;
