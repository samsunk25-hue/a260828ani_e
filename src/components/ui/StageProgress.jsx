import React from 'react';
import { Check } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

const STAGES = [
  { id: 'digestive', label: '소화' },
  { id: 'respiratory', label: '호흡' },
  { id: 'circulatory', label: '순환' },
  { id: 'excretory', label: '배설' },
];

const StageProgress = () => {
  const currentStage = useGameStore(state => state.currentStage);
  const activeIndex = STAGES.findIndex(s => s.id === currentStage);

  return (
    <div className="glass stepper" aria-label="진행 단계">
      {STAGES.map((stage, i) => {
        const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : '';
        return (
          <React.Fragment key={stage.id}>
            {i > 0 && <span className="step-sep" />}
            <span className={`step ${state}`} aria-current={state === 'active' ? 'step' : undefined}>
              {state === 'done' ? <Check size={12} strokeWidth={3} /> : <span className="step-dot" />}
              <span className="step-label">{stage.label}</span>
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StageProgress;
