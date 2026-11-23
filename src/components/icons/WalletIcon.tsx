import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

type Props = { color: string };

export default function WalletIcon({ color }: Props) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x={2} y={6} width={20} height={14} rx={2} stroke={color} strokeWidth={1.5} />
      <Path d="M2 10h20" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M16 15a1 1 0 100-2 1 1 0 000 2z" fill={color} />
      <Path d="M6 6V5a2 2 0 012-2h8a2 2 0 012 2v1" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
