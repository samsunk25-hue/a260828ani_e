import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshWobbleMaterial, DragControls, Html } from '@react-three/drei';
import Label from '../scene/Label';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';

/* ---------------------------------------------------------
   효소 정의
   --------------------------------------------------------- */
const ENZYMES = {
  amylase: { ko: '아밀레이스', en: 'Amylase', color: '#39ff14', aliases: ['아밀레이스', '아밀라아제', '아밀라제', 'amylase'] },
  pepsin:  { ko: '펩신',      en: 'Pepsin',  color: '#ff3366', aliases: ['펩신', 'pepsin'] },
  trypsin: { ko: '트립신',    en: 'Trypsin', color: '#00ccff', aliases: ['트립신', 'trypsin'] },
  bile:    { ko: '쓸개즙',    en: 'Bile',    color: '#adff2f', aliases: ['쓸개즙', '담즙', 'bile'] },
  lipase:  { ko: '라이페이스', en: 'Lipase',  color: '#ffcc00', aliases: ['라이페이스', '리파아제', '리파제', 'lipase'] },
};

const normalize = (s) => (s || '').toLowerCase().replace(/\s+/g, '');
const enzymeFromText = (text) => {
  const n = normalize(text);
  if (!n) return null;
  return Object.keys(ENZYMES).find(k => ENZYMES[k].aliases.some(a => normalize(a) === n)) || null;
};

// 음식물별 분해 순서: step 0 → step 1 → 완료
const FOODS = {
  starch:  { steps: ['amylase', 'amylase'], emoji: ['🍞', '🥨'], label: ['녹말 (빵)', '엿당 (프레첼)'],      reward: { id: 'glucose', name: '포도당', icon: '🥨' } },
  protein: { steps: ['pepsin', 'trypsin'],  emoji: ['🥩', '🥓'], label: ['단백질 (고기)', '중간산물 (베이컨)'], reward: { id: 'amino_acid', name: '아미노산', icon: '🥓' } },
  fat:     { steps: ['bile', 'lipase'],     emoji: ['🧀', '🧈'], label: ['지방 (치즈)', '유화된 지방 (버터)'], reward: { id: 'fatty_acid', name: '지방산', icon: '🧀' } },
};

const FOOD_SLOTS_X = [-4, 0, 4];
const ENZYME_SLOTS_X = [-6.25, -3.75, -1.25, 1.25, 3.75, 6.25];
const FOOD_Z = -0.8; // 효소(z=0)가 항상 음식물 앞을 지나가도록 음식물은 살짝 뒤에 둔다

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ---------------------------------------------------------
   이모지를 WebGL 스프라이트로 그린다 (DOM 오버레이가 아니므로 깊이 정렬이 된다)
   --------------------------------------------------------- */
const useEmojiTexture = (emoji) => useMemo(() => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.font = `${size * 0.78}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.04);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}, [emoji]);

const EmojiSprite = ({ emoji, size = 3 }) => {
  const texture = useEmojiTexture(emoji);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite scale={[size, size, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
};

const TargetFood = ({ position, emoji, label, visible, selectable, selected, onSelect }) => {
  const group = useRef();
  const [hover, setHover] = useState(false);

  useFrame((state) => {
    if (!visible || !group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.position.y = position[1] + Math.sin(t * 3 + position[0]) * 0.2;
    const s = selected ? 1.12 + Math.sin(t * 6) * 0.04 : hover && selectable ? 1.08 : 1;
    group.current.scale.setScalar(s);
  });

  useEffect(() => {
    if (selectable) document.body.style.cursor = hover ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hover, selectable]);

  if (!visible) return null;

  return (
    <group
      position={position}
      ref={group}
      onClick={(e) => { if (selectable) { e.stopPropagation(); onSelect(); } }}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <EmojiSprite emoji={emoji} />
      {selected && (
        <mesh position={[0, 0, -0.2]}>
          <ringGeometry args={[1.7, 1.85, 48]} />
          <meshBasicMaterial color="#22e3ff" transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      )}
      <Label position={[0, -1.9, 0.9]} fontSize={0.3} color="white" outlineWidth={0.03} outlineColor="#000000">
        {label}
      </Label>
      {selectable && !selected && (
        <Label position={[0, 1.9, 0.9]} fontSize={0.22} color="#22e3ff" outlineWidth={0.03} outlineColor="#000000">
          클릭해서 효소 입력
        </Label>
      )}
    </group>
  );
};

const DraggableEnzyme = ({ position, color, label, onDrop }) => {
  const setIsDragging = useGameStore(state => state.setIsDragging);
  const mesh = useRef();
  const [round, setRound] = useState(0);

  const handleDragEnd = () => {
    setIsDragging(false);
    if (mesh.current) {
      const worldPos = new THREE.Vector3();
      mesh.current.getWorldPosition(worldPos);
      onDrop(worldPos);
    }
    // 드롭 후 항상 원래 자리로 (DragControls 래퍼 리마운트)
    setRound(r => r + 1);
  };

  return (
    <DragControls key={round} dragLimits={[undefined, undefined, [0, 0]]} onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd}>
      <group ref={mesh} position={position}>
        <Sphere args={[0.4, 32, 32]}>
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
        </Sphere>
        <Label position={[0, -0.7, 0.3]} fontSize={0.25} color="white" outlineWidth={0.03} outlineColor="#000000">
          {label}
        </Label>
      </group>
    </DragControls>
  );
};

/* 어려움 모드: 음식물을 고른 뒤 효소 이름을 직접 입력 */
const EnzymePrompt = ({ foodLabel, onSubmit, onCancel, feedback }) => {
  const [text, setText] = useState('');
  const inputRef = useRef();
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <Html position={[0, 4.3, 1]} center zIndexRange={[60, 50]}>
      <form
        className="glass glass-strong enzyme-prompt"
        onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onSubmit(text); setText(''); } }}
      >
        <div className="enzyme-prompt-q">
          <strong>{foodLabel}</strong>을(를) 분해하려면 어떤 효소(또는 소화액)가 필요할까요?
        </div>
        <div className="enzyme-prompt-row">
          <input
            ref={inputRef}
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="효소 이름 입력 (한글/영어)"
            maxLength={20}
            autoComplete="off"
            onPaste={(e) => e.preventDefault()}
          />
          <button type="submit" className="btn btn-primary" disabled={!text.trim()}>확인</button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>취소</button>
        </div>
        {feedback && <div className={`enzyme-prompt-fb ${feedback.ok ? 'ok' : 'no'}`}>{feedback.text}</div>}
      </form>
    </Html>
  );
};

/* ---------------------------------------------------------
   Stage
   --------------------------------------------------------- */
const DigestiveStage = () => {
  const addToInventory = useGameStore(state => state.addToInventory);
  const mode = useGameStore(state => state.mode);
  const registerHit = useGameStore(state => state.registerHit);
  const registerMiss = useGameStore(state => state.registerMiss);
  const isHard = mode === 'hard';

  // 음식물·효소 위치는 방에 들어올 때마다 무작위
  const [layout] = useState(() => ({
    foodX: shuffle(FOOD_SLOTS_X),
    enzymeX: shuffle(ENZYME_SLOTS_X),
  }));

  const [molecules, setMolecules] = useState(() => ({
    starch:  { step: 0, visible: true, position: [layout.foodX[0], 0, FOOD_Z] },
    protein: { step: 0, visible: true, position: [layout.foodX[1], 0, FOOD_Z] },
    fat:     { step: 0, visible: true, position: [layout.foodX[2], 0, FOOD_Z] },
  }));
  const moleculesRef = useRef(molecules);
  useEffect(() => { moleculesRef.current = molecules; }, [molecules]);

  const [selectedFood, setSelectedFood] = useState(null);
  const [promptFeedback, setPromptFeedback] = useState(null);

  /** 효소를 특정 음식물에 적용. 'hit' | 'miss' */
  const applyEnzyme = (enzymeType, foodKey) => {
    const m = moleculesRef.current[foodKey];
    const def = FOODS[foodKey];
    if (!m?.visible) return 'miss';
    if (def.steps[m.step] !== enzymeType) return 'miss';

    if (m.step === 0) {
      setMolecules(prev => ({ ...prev, [foodKey]: { ...prev[foodKey], step: 1 } }));
    } else {
      setMolecules(prev => ({ ...prev, [foodKey]: { ...prev[foodKey], visible: false } }));
      addToInventory(def.reward);
    }
    return 'hit';
  };

  const report = (result) => {
    if (result === 'hit') registerHit();
    else registerMiss();
  };

  // 쉬움 모드: 드래그 앤 드롭
  const handleDrop = (enzymeType, dropPosition) => {
    const dropVec = new THREE.Vector3(dropPosition.x, dropPosition.y, 0);
    const state = moleculesRef.current;
    let nearest = null;
    let best = 4.0;
    Object.keys(state).forEach(k => {
      const m = state[k];
      if (!m.visible) return;
      const d = dropVec.distanceTo(new THREE.Vector3(m.position[0], m.position[1], 0));
      if (d < best) { best = d; nearest = k; }
    });
    if (!nearest) return; // 빈 곳에 놓은 건 실수로 치지 않는다
    report(applyEnzyme(enzymeType, nearest));
  };

  // 어려움 모드: 음식물 클릭 → 효소 이름 입력
  const handleTyped = (text) => {
    if (!selectedFood) return;
    const enzymeType = enzymeFromText(text);
    const foodLabel = FOODS[selectedFood].label[moleculesRef.current[selectedFood].step];
    if (!enzymeType) {
      report('miss');
      setPromptFeedback({ ok: false, text: `"${text}"는 알 수 없는 이름입니다. 효소 또는 소화액의 정확한 이름을 써 보세요.` });
      return;
    }
    const result = applyEnzyme(enzymeType, selectedFood);
    report(result);
    if (result === 'hit') {
      const after = moleculesRef.current[selectedFood];
      const finished = after.step === 1; // 방금 step 1을 처리했으면 분해 완료
      setPromptFeedback({ ok: true, text: `정답! ${ENZYMES[enzymeType].ko}가 ${foodLabel}을(를) 분해했습니다.` });
      setTimeout(() => { setSelectedFood(null); setPromptFeedback(null); }, finished ? 900 : 1200);
    } else {
      setPromptFeedback({ ok: false, text: `${ENZYMES[enzymeType].ko}는 ${foodLabel}에 작용하지 않습니다. 다시 생각해 보세요.` });
    }
  };

  const enzymeOrder = ['amylase', 'amylase', 'pepsin', 'trypsin', 'bile', 'lipase'];

  return (
    <group>
      {/* Organic Tunnel Environment (Stomach/Intestine) */}
      <mesh position={[0, 0, -10]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[8, 6, 40, 32, 10, true]} />
        <MeshWobbleMaterial color="#881122" side={THREE.BackSide} factor={0.1} speed={1} roughness={0.7} />
      </mesh>

      {/* Target Foods */}
      {Object.keys(FOODS).map(key => {
        const m = molecules[key];
        const def = FOODS[key];
        return (
          <TargetFood
            key={key}
            visible={m.visible}
            position={m.position}
            emoji={def.emoji[m.step]}
            label={def.label[m.step]}
            selectable={isHard}
            selected={selectedFood === key}
            onSelect={() => { setSelectedFood(key); setPromptFeedback(null); }}
          />
        );
      })}

      {/* 쉬움 모드: 드래그할 효소 구슬 (위치 무작위) */}
      {!isHard && enzymeOrder.map((type, i) => (
        <DraggableEnzyme
          key={`${type}-${i}`}
          position={[layout.enzymeX[i], 3.5, 0]}
          color={ENZYMES[type].color}
          label={ENZYMES[type].ko}
          onDrop={(pos) => handleDrop(type, pos)}
        />
      ))}

      {/* 어려움 모드: 안내 + 입력창 */}
      {isHard && !selectedFood && (
        <Label position={[0, 3.6, 0.5]} fontSize={0.32} color="#22e3ff" outlineWidth={0.03} outlineColor="#000000">
          음식물을 클릭하고, 필요한 효소 이름을 직접 입력하세요
        </Label>
      )}
      {isHard && selectedFood && molecules[selectedFood].visible && (
        <EnzymePrompt
          foodLabel={FOODS[selectedFood].label[molecules[selectedFood].step]}
          feedback={promptFeedback}
          onSubmit={handleTyped}
          onCancel={() => { setSelectedFood(null); setPromptFeedback(null); }}
        />
      )}
    </group>
  );
};

export default DigestiveStage;
