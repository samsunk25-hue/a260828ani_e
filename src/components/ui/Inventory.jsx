import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

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
              <span className="item-icon">{item.icon}</span>
              <span className="item-name">{item.name}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Inventory;
