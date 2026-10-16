import React from 'react';
import { Billboard, Text } from '@react-three/drei';

/**
 * 카메라를 항상 정면으로 바라보는 3D 텍스트 라벨.
 * 장면을 회전(OrbitControls)하거나 부모 그룹이 회전해도 글자가 뒤집히거나
 * 옆으로 눕지 않는다. drei <Text>와 같은 props를 그대로 받는다.
 */
const Label = ({ position = [0, 0, 0], children, ...textProps }) => (
  <Billboard position={position} follow lockX={false} lockY={false} lockZ={false}>
    <Text anchorX="center" anchorY="middle" {...textProps}>
      {children}
    </Text>
  </Billboard>
);

export default Label;
