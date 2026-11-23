import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export type AuthIconName = 'mail' | 'lock' | 'key' | 'eye' | 'eye-off' | 'chevron-left' | 'check-circle' | 'circle';

type Props = { name: AuthIconName; color: string; size: number };

/** Line icons for the auth screens, drawn to match the login screen's set. */
export default function AuthIcon({ name, color, size }: Props) {
  const stroke = { stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'mail' ? (
        <>
          <Path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9Z" {...stroke} />
          <Path d="m4 8 8 6 8-6" {...stroke} />
        </>
      ) : null}
      {name === 'lock' ? (
        <>
          <Path d="M7 11V8a5 5 0 1 1 10 0v3" {...stroke} />
          <Path d="M6.5 11h11A1.5 1.5 0 0 1 19 12.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-7A1.5 1.5 0 0 1 6.5 11Z" {...stroke} />
          <Path d="M12 15.5v2.5" {...stroke} />
        </>
      ) : null}
      {name === 'key' ? (
        <>
          <Circle cx={7.5} cy={15.5} r={4.5} {...stroke} />
          <Path d="m10.7 12.3 9.8-9.8M17 6l3 3M14.5 8.5l2 2" {...stroke} />
        </>
      ) : null}
      {name === 'eye' || name === 'eye-off' ? (
        <>
          <Path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" {...stroke} strokeWidth={1.8} />
          <Path d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" {...stroke} strokeWidth={1.8} />
          {name === 'eye-off' ? <Path d="m4 4 16 16" {...stroke} strokeWidth={1.8} /> : null}
        </>
      ) : null}
      {name === 'chevron-left' ? <Path d="m15 18-6-6 6-6" {...stroke} /> : null}
      {name === 'check-circle' ? (
        <>
          <Circle cx={12} cy={12} r={9} {...stroke} />
          <Path d="m8.5 12.5 2.5 2.5 4.5-5" {...stroke} />
        </>
      ) : null}
      {name === 'circle' ? <Circle cx={12} cy={12} r={9} {...stroke} /> : null}
    </Svg>
  );
}
