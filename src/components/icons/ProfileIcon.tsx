import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

type Props = { color: string };

export default function ProfileIcon({ color }: Props) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.5} />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
