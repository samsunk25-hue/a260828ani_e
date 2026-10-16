import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

const Inventory = () => {
  const inventory = useGameStore(state => state.inventory);

  return (
    <div className="glass inventory" aria-label="획득한 아이템">
      <div className="inventory-label">
        <Package size={14} />
        <span>INVENTORY</span>
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
              <span>미션을 완료해 아이템을 수집하세요</span>
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
