import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Text, MeshWobbleMaterial, DragControls } from '@react-three/drei';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';

const AlveolusCluster = () => {
  const group = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    group.current.scale.setScalar(1 + Math.sin(t * 2) * 0.05); // Breathing effect
  });

  // grape-like cluster
  const spheres = [
    [0, 0, 0], [1.2, 0.5, 0], [-1.2, -0.5, 0], 
    [0, 1.2, 0.5], [0, -1.2, -0.5], [0.8, -0.8, 0.8], [-0.8, 0.8, -0.8]
  ];

  return (
    <group ref={group}>
      {spheres.map((pos, i) => (
        <Sphere key={i} args={[1.2, 32, 32]} position={pos}>
          <MeshWobbleMaterial color="#ffe6e6" factor={0.1} speed={2} transparent opacity={0.9} roughness={0.4} />
        </Sphere>
      ))}
    </group>
  );
};

const DraggableGas = ({ id, initialPosition, color, label, onDrop }) => {
  const setIsDragging = useGameStore(state => state.setIsDragging);
  const mesh = useRef();
  const initPos = new THREE.Vector3(...initialPosition);

  const handleDragStart = () => setIsDragging(true);
  
  const handleDragEnd = () => {
    setIsDragging(false);
    if (mesh.current) {
      const worldPos = new THREE.Vector3();
      mesh.current.getWorldPosition(worldPos);
      
      const isSuccess = onDrop(id, worldPos);
      if (!isSuccess) {
        // Snap back if wrong
        mesh.current.position.copy(initPos);
      }
    }
  };

  return (
    <DragControls onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <group position={initialPosition} ref={mesh}>
        <Sphere args={[0.3, 16, 16]}>
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
        </Sphere>
        <Text position={[0, -0.6, 0]} fontSize={0.25} color="white" anchorX="center" anchorY="middle">
          {label}
        </Text>
      </group>
    </DragControls>
  );
};

const RespiratoryStage = () => {
  const addToInventory = useGameStore(state => state.addToInventory);
  const [placed, setPlaced] = useState({ o2_1: false, o2_2: false, co2_1: false, co2_2: false });

  const handleDrop = (id, position) => {
    const distFromCenter = position.length();
    
    if (id.startsWith('o2')) {
      if (distFromCenter > 3.0) {
        setPlaced(prev => {
          const next = { ...prev, [id]: true };
          if (next.o2_1 && next.o2_2 && next.co2_1 && next.co2_2) completeStage();
          return next;
        });
        return true;
      }
    } else if (id.startsWith('co2')) {
      if (distFromCenter < 2.5) {
        setPlaced(prev => {
          const next = { ...prev, [id]: true };
          if (next.o2_1 && next.o2_2 && next.co2_1 && next.co2_2) completeStage();
          return next;
        });
        return true;
      }
    }
    return false; 
  };

  const completeStage = () => {
    setTimeout(() => {
      addToInventory({ id: 'oxygen', name: '산소', icon: '💨' });
      addToInventory({ id: 'co2', name: '이산화탄소', icon: '☁️' });
    }, 500);
  };

  return (
    <group>
      <AlveolusCluster />
      
      {/* Capillary wrapping around */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 4, -Math.PI / 6, 0]}>
        <torusGeometry args={[4.5, 0.8, 16, 100, Math.PI * 1.5]} />
        <meshStandardMaterial color="#880022" transparent opacity={0.7} roughness={0.3} />
      </mesh>

      {/* Guide Texts */}
      <Text position={[0, 3, 0]} fontSize={0.4} color="#ffb3c6" anchorX="center" anchorY="middle">
        폐포 (Alveolus)
      </Text>
      <Text position={[4.5, 3, 0]} fontSize={0.4} color="#ff3366" anchorX="center" anchorY="middle">
        모세혈관 (Capillary)
      </Text>

      {/* Static Gases (Representing non-diffused remaining gases for density) */}
      <group position={[0.3, 0.3, 1]}>
        <Sphere args={[0.3, 16, 16]}><meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.6} /></Sphere>
      </group>
      <group position={[-0.4, 0.5, 0.5]}>
        <Sphere args={[0.3, 16, 16]}><meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.6} /></Sphere>
      </group>
      <group position={[4.2, 0.5, 0]}>
        <Sphere args={[0.3, 16, 16]}><meshStandardMaterial color="#aaaaaa" emissive="#aaaaaa" emissiveIntensity={0.6} /></Sphere>
      </group>
      <group position={[4.8, -0.5, 0]}>
        <Sphere args={[0.3, 16, 16]}><meshStandardMaterial color="#aaaaaa" emissive="#aaaaaa" emissiveIntensity={0.6} /></Sphere>
      </group>

      {/* Draggable Gases */}
      {!placed.o2_1 && <DraggableGas id="o2_1" initialPosition={[0, 0.5, 2]} color="#00f3ff" label="산소" onDrop={handleDrop} />}
      {!placed.o2_2 && <DraggableGas id="o2_2" initialPosition={[-0.5, -0.2, 1.5]} color="#00f3ff" label="산소" onDrop={handleDrop} />}
      
      {!placed.co2_1 && <DraggableGas id="co2_1" initialPosition={[4.5, 0, 0]} color="#aaaaaa" label="이산화탄소" onDrop={handleDrop} />}
      {!placed.co2_2 && <DraggableGas id="co2_2" initialPosition={[4.0, 1.5, 0]} color="#aaaaaa" label="이산화탄소" onDrop={handleDrop} />}

      {/* Success Visual Feedback */}
      {placed.o2_1 && (
        <group position={[4.5, 1, 0]}>
          <Sphere args={[0.3, 16, 16]}><meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.8} /></Sphere>
        </group>
      )}
      {placed.o2_2 && (
        <group position={[3.5, 2, 0]}>
          <Sphere args={[0.3, 16, 16]}><meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.8} /></Sphere>
        </group>
      )}

      {placed.co2_1 && (
        <group position={[0, 1.5, 2]}>
          <Sphere args={[0.3, 16, 16]}><meshStandardMaterial color="#aaaaaa" emissive="#aaaaaa" emissiveIntensity={0.8} /></Sphere>
        </group>
      )}
      {placed.co2_2 && (
        <group position={[0.5, 1.0, 1.5]}>
          <Sphere args={[0.3, 16, 16]}><meshStandardMaterial color="#aaaaaa" emissive="#aaaaaa" emissiveIntensity={0.8} /></Sphere>
        </group>
      )}

      {/* Success Effect */}
      {placed.o2_1 && placed.o2_2 && placed.co2_1 && placed.co2_2 && (
        <group>
          {Array.from({ length: 20 }).map((_, i) => (
            <mesh key={i} position={[(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial color={i % 2 === 0 ? "#00f3ff" : "#aaaaaa"} />
            </mesh>
          ))}
          <Text position={[0, -3.5, 0]} fontSize={0.6} color="#39ff14" anchorX="center" anchorY="middle">
            ✅ 밀도(농도) 평형 도달! 기체 교환 완료!
          </Text>
        </group>
      )}
    </group>
  );
};

export default RespiratoryStage;
