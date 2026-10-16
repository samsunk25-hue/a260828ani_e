import React, { useRef, useState, useMemo } from 'react';
import { Sphere, DragControls, Edges } from '@react-three/drei';
import Label from '../scene/Label';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';

/* ---------------------------------------------------------
   레이아웃 (x, y) — 모든 판정은 화면 평면 기준
   사구체 G = (-4, 1)
   들어오는 혈관(수입 세동맥): 왼쪽 바깥 → 사구체
   나가는 혈관(수출 세동맥): 사구체 → 오른쪽/아래로 내려가 세뇨관을 감싸는 모세혈관(y=-3)으로 이어짐
   세뇨관: 보먼주머니 바닥 → 아래 → 오른쪽(y=-1.5) → 오줌 배출
   구조물과 분자는 거의 같은 평면(z≈0)에 두어 화면을 돌려도 상대 위치가 유지된다.
   --------------------------------------------------------- */
const G = [-4, 1];
const TUBULE_Y = -1.5;
const CAPILLARY_Y = -3;
const MOL_Z = 0.35; // 분자가 놓이는 평면 (구조물 바로 앞)

const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

const VesselTube = ({ points, radius, color, opacity = 0.85 }) => {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map(p => V(...p)), false, 'catmullrom', 0.3), [points]);
  return (
    <mesh>
      <tubeGeometry args={[curve, 96, radius, 14, false]} />
      <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.35} depthWrite={false} />
    </mesh>
  );
};

const NephronStructure = () => {
  // 수입 세동맥: 왼쪽에서 사구체로
  const afferent = useMemo(() => [[-8.5, 1.7], [-6.5, 1.6], [-5.2, 1.4], [-4.6, 1.2]], []);
  // 수출 세동맥 → 세뇨관 주위 모세혈관: 사구체 오른쪽으로 나와 아래로 내려가 바닥을 따라 오른쪽으로
  const efferentToCapillary = useMemo(
    () => [[-3.4, 1.2], [-2.4, 1.4], [-1.3, 0.9], [-1.0, -0.6], [-1.0, -2.3], [-0.3, CAPILLARY_Y], [2.5, CAPILLARY_Y], [5.5, CAPILLARY_Y]],
    []
  );
  // 세뇨관: 보먼주머니 바닥에서 시작해 아래로, 그리고 오른쪽으로
  const tubule = useMemo(
    () => [[G[0], -0.3], [G[0], -0.9], [-3.4, TUBULE_Y], [0, TUBULE_Y], [3, TUBULE_Y], [5.2, TUBULE_Y]],
    []
  );

  return (
    <group>
      {/* 혈관 (사구체 → 모세혈관이 하나로 이어진다) */}
      <VesselTube points={afferent} radius={0.3} color="#c41a2e" />
      <VesselTube points={efferentToCapillary} radius={0.3} color="#c41a2e" />

      {/* 사구체 (Glomerulus): 모세혈관 뭉치 */}
      <group position={[G[0], G[1], 0]}>
        <Sphere args={[1.0, 20, 20]}>
          <meshStandardMaterial color="#ff2233" wireframe />
        </Sphere>
        <Sphere args={[0.85, 24, 24]}>
          <meshStandardMaterial color="#ff4455" transparent opacity={0.25} depthWrite={false} />
        </Sphere>
      </group>
      <Label position={[G[0], G[1] + 1.55, 0.6]} fontSize={0.3} color="#ff8899" outlineWidth={0.03} outlineColor="#000000">
        사구체 (Glomerulus)
      </Label>

      {/* 보먼주머니 (Bowman's capsule): 사구체를 감싸는 컵 */}
      <Sphere args={[1.45, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} position={[G[0], G[1] + 0.1, 0]} rotation={[Math.PI, 0, 0]}>
        <meshStandardMaterial color="#ffcc00" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
      </Sphere>
      <Label position={[G[0] - 2.1, G[1] - 1.1, 0.6]} fontSize={0.28} color="#ffcc00" outlineWidth={0.03} outlineColor="#000000">
        보먼주머니
      </Label>

      {/* 세뇨관 (Tubule) */}
      <VesselTube points={tubule} radius={0.42} color="#ffcc00" opacity={0.3} />
      <Label position={[2.5, TUBULE_Y + 0.75, 0.6]} fontSize={0.3} color="#ffcc00" outlineWidth={0.03} outlineColor="#000000">
        세뇨관 (Tubule)
      </Label>

      {/* 모세혈관 (Capillary) 라벨 — 관 자체는 수출 세동맥에서 이어진 튜브 */}
      <Label position={[2.5, CAPILLARY_Y - 0.75, 0.6]} fontSize={0.3} color="#ff8899" outlineWidth={0.03} outlineColor="#000000">
        모세혈관 (Capillary)
      </Label>

      {/* 오줌 배출 */}
      <Label position={[6.6, TUBULE_Y, 0.6]} fontSize={0.3} color="white" outlineWidth={0.03} outlineColor="#000000">
        오줌(Urine) 배출 ➔
      </Label>
    </group>
  );
};

/* 분자 모양 */
const Hexagon = ({ size, color }) => (
  <mesh rotation={[Math.PI / 2, 0, 0]}>
    <cylinderGeometry args={[size, size, 0.18, 6]} />
    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} roughness={0.35} />
    <Edges color="#fff3b0" lineWidth={1} />
  </mesh>
);

const Ball = ({ size, color }) => (
  <Sphere args={[size, 24, 24]}>
    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.4} />
  </Sphere>
);

/**
 * 드래그 가능한 분자.
 * DragControls는 자기 래퍼 그룹의 matrix를 직접 움직이므로, 드롭이 끝날 때마다 key를 바꿔
 * 래퍼를 리마운트한다. 성공하면 부모가 준 새 position에서, 실패하면 원래 position에서 다시 시작한다.
 * z는 dragLimits로 고정해 화면을 돌려도 분자가 구조물 평면을 벗어나지 않는다.
 */
const DraggableMolecule = ({ id, position, color, label, size, shape = 'ball', onDrop, disabled }) => {
  const setIsDragging = useGameStore(state => state.setIsDragging);
  const mesh = useRef();
  const [round, setRound] = useState(0);

  const handleDragEnd = () => {
    setIsDragging(false);
    if (mesh.current) {
      const worldPos = new THREE.Vector3();
      mesh.current.getWorldPosition(worldPos);
      onDrop(id, worldPos);
    }
    setRound(r => r + 1);
  };

  return (
    <DragControls
      key={`${id}-${round}`}
      dragLimits={[undefined, undefined, [0, 0]]}
      onDragStart={() => !disabled && setIsDragging(true)}
      onDragEnd={handleDragEnd}
    >
      <group position={position} ref={mesh}>
        {shape === 'hexagon' ? <Hexagon size={size} color={color} /> : <Ball size={size} color={color} />}
        <Label position={[0, -size - 0.32, 0.3]} fontSize={0.25} color="white" outlineWidth={0.03} outlineColor="#000000">
          {label}
        </Label>
      </group>
    </DragControls>
  );
};

/* 판정 영역 중심 */
const ZONE = {
  bloodVessel: [-2.2, 1.3],   // 사구체를 지나 나가는 혈관 (단백질은 여기 남는다)
  bowman: [G[0], G[1] - 0.9], // 보먼주머니 안
  capillary: [1.2, CAPILLARY_Y],
  excretion: [4.6, TUBULE_Y],
};

const Zone = ({ center, color }) => (
  <mesh position={[center[0], center[1], -1.2]}>
    <sphereGeometry args={[1.5, 24, 24]} />
    <meshBasicMaterial color={color} transparent opacity={0.1} depthWrite={false} />
  </mesh>
);

const ExcretoryStage = () => {
  const addToInventory = useGameStore(state => state.addToInventory);

  // phase 0: 여과(Filtration), phase 1: 재흡수(Reabsorption), phase 2: 완료(Complete)
  const [phase, setPhase] = useState(0);

  // 분자들은 들어오는 혈관(수입 세동맥) 위에서 출발한다
  const [protein, setProtein] = useState({ pos: [-7.8, 1.7, MOL_Z], status: 'blood' });
  const [glucose, setGlucose] = useState({ pos: [-6.5, 1.6, MOL_Z], status: 'blood' });
  const [urea, setUrea] = useState({ pos: [-5.5, 1.5, MOL_Z], status: 'blood' });

  const near = (dropVec, [x, y], r = 1.7) => dropVec.distanceTo(V(x, y)) < r;

  const handleDrop = (id, dropPos) => {
    const dropVec = V(dropPos.x, dropPos.y);

    if (phase === 0) {
      // 1. 여과: 단백질은 혈관에 남고, 포도당과 요소는 보먼주머니로
      if (id === 'protein' && near(dropVec, ZONE.bloodVessel)) {
        setProtein({ pos: [-2.2, 1.4, MOL_Z], status: 'filtered' });
        checkPhase0Complete(true, glucose.status === 'filtered', urea.status === 'filtered');
        return true;
      }
      if (id === 'glucose' && near(dropVec, ZONE.bowman)) {
        setGlucose({ pos: [-2.3, TUBULE_Y, MOL_Z], status: 'filtered' });
        checkPhase0Complete(protein.status === 'filtered', true, urea.status === 'filtered');
        return true;
      }
      if (id === 'urea' && near(dropVec, ZONE.bowman)) {
        setUrea({ pos: [-1.2, TUBULE_Y, MOL_Z], status: 'filtered' });
        checkPhase0Complete(protein.status === 'filtered', glucose.status === 'filtered', true);
        return true;
      }
    } else if (phase === 1) {
      // 2. 재흡수: 포도당은 모세혈관으로 100% 재흡수, 요소는 세뇨관 끝으로 배출
      if (id === 'glucose' && near(dropVec, ZONE.capillary)) {
        setGlucose({ pos: [1.2, CAPILLARY_Y, MOL_Z], status: 'reabsorbed' });
        checkPhase1Complete(true, urea.status === 'excreted');
        return true;
      }
      if (id === 'urea' && near(dropVec, ZONE.excretion)) {
        setUrea({ pos: [4.6, TUBULE_Y, MOL_Z], status: 'excreted' });
        checkPhase1Complete(glucose.status === 'reabsorbed', true);
        return true;
      }
    }
    return false; // 잘못된 이동 → 리마운트되며 원래 자리로 돌아간다
  };

  const checkPhase0Complete = (p, g, u) => {
    if (p && g && u) setTimeout(() => setPhase(1), 1000);
  };

  const checkPhase1Complete = (g, u) => {
    if (g && u) {
      setPhase(2);
      setTimeout(() => {
        addToInventory({ id: 'urea', name: '요소 (노폐물)', icon: '💧' });
      }, 1000);
    }
  };

  return (
    <group>
      <NephronStructure />

      {/* 안내 문구: 구조물과 겹치지 않도록 위쪽에 따로 둔다 */}
      <Label position={[0, 4.75, 1]} fontSize={0.45} color="#00f3ff" outlineWidth={0.03} outlineColor="#000000">
        {phase === 0 ? '1단계: 여과 (사구체 ➔ 보먼주머니)' : phase === 1 ? '2단계: 재흡수 (세뇨관 ➔ 모세혈관)' : '배설 완료!'}
      </Label>
      {phase === 0 && (
        <Label position={[0, 4.0, 1]} fontSize={0.25} color="white" outlineWidth={0.03} outlineColor="#000000">
          단백질은 크기가 커서 여과되지 않고 혈관에 남습니다. 포도당과 요소는 보먼주머니로 여과시키세요.
        </Label>
      )}
      {phase === 1 && (
        <Label position={[0, 4.0, 1]} fontSize={0.25} color="white" outlineWidth={0.03} outlineColor="#000000">
          필요한 영양소(포도당)는 모세혈관으로 100% 재흡수시키고, 노폐물(요소)은 끝까지 배출시키세요.
        </Label>
      )}

      {/* Molecules */}
      <DraggableMolecule id="protein" position={protein.pos} color="#2255ff" label="단백질" size={0.5} onDrop={handleDrop} disabled={protein.status !== 'blood'} />
      <DraggableMolecule id="glucose" position={glucose.pos} color="#ffcc00" label="포도당" size={0.34} shape="hexagon" onDrop={handleDrop} disabled={glucose.status === 'reabsorbed' || (phase === 0 && glucose.status === 'filtered')} />
      <DraggableMolecule id="urea" position={urea.pos} color="#bbbbbb" label="요소" size={0.2} onDrop={handleDrop} disabled={urea.status === 'excreted' || (phase === 0 && urea.status === 'filtered')} />

      {/* Target Highlights based on Phase */}
      {phase === 0 && (
        <group>
          <Zone center={ZONE.bloodVessel} color="#2255ff" />
          <Zone center={ZONE.bowman} color="#ffcc00" />
        </group>
      )}
      {phase === 1 && (
        <group>
          <Zone center={ZONE.capillary} color="#ffcc00" />
          <Zone center={ZONE.excretion} color="#bbbbbb" />
        </group>
      )}
    </group>
  );
};

export default ExcretoryStage;
