import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

// 3D 장면의 분자 모형과 같은 색/배치로 그린 아이콘 (산소 빨강, 탄소 검정, 이중 결합 막대)
const ATOM_COLOR = { O: '#ff4d4d', C: '#3a3a3a' };

const AtomCircle = ({ cx, cy, r, type }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill={ATOM_COLOR[type]} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
    <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.28} fill="rgba(255,255,255,0.45)" />
  </g>
);

const Bond = ({ x1, x2, y }) => (
  <g stroke="#f2f2f2" strokeWidth="2" strokeLinecap="round">
    <line x1={x1} y1={y - 2.5} x2={x2} y2={y - 2.5} />
    <line x1={x1} y1={y + 2.5} x2={x2} y2={y + 2.5} />
  </g>
);

const MoleculeIcon = ({ kind }) => {
  if (kind === 'o2') {
    return (
      <svg viewBox="0 0 48 28" width="40" height="24" aria-hidden="true">
        <Bond x1={16} x2={32} y={14} />
        <AtomCircle cx={15} cy={14} r={9} type="O" />
        <AtomCircle cx={33} cy={14} r={9} type="O" />
      </svg>
    );
  }
  // co2: O=C=O
  return (
    <svg viewBox="0 0 64 28" width="48" height="22" aria-hidden="true">
      <Bond x1={12} x2={32} y={14} />
      <Bond x1={32} x2={52} y={14} />
      <AtomCircle cx={11} cy={14} r={8} type="O" />
      <AtomCircle cx={32} cy={14} r={9} type="C" />
      <AtomCircle cx={53} cy={14} r={8} type="O" />
    </svg>
  );
};

const ItemIcon = ({ icon }) => {
  if (typeof icon === 'string' && icon.startsWith('mol:')) {
    return <MoleculeIcon kind={icon.slice(4)} />;
  }
  return <span className="item-emoji">{icon}</span>;
};

const Inventory = () => {
  const inventory = useGameStore(state => state.inventory);

  return (
    <div className="glass inventory" aria-label="획득한 물질" title="미션을 완료하면 자동으로 쌓입니다. 다음 방으로 가는 열쇠예요.">
      <div className="inventory-label">
        <Package size={14} />
        <span>
          획득한 물질
          <small>미션 완료 시 자동 수집</small>
        </span>
      </div>

      <div className="inventory-items">
        <AnimatePresence mode="popLayout">
          {inventory.length === 0 && (
            <motion.div
              key="empty"
              className="inventory-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="slot" />
              <span className="slot" />
              <span className="slot" />
              <span>아직 없음 · 미션을 완료하면 여기에 쌓여요</span>
            </motion.div>
          )}

          {inventory.map((item) => (
            <motion.div
              key={item.id}
              layout
              className="inventory-item"
              title={item.name}
              initial={{ opacity: 0, y: 18, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            >
              <span className="item-icon"><ItemIcon icon={item.icon} /></span>
              <span className="item-name">{item.name}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Inventory;
