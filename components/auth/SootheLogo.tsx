import React from 'react';
import Svg, { Rect } from 'react-native-svg';

interface SootheLogoProps {
  size?: number;
  color?: string;
}

const SootheLogo: React.FC<SootheLogoProps> = ({ size = 80, color = 'white' }) => {
  const scale = size / 175;
  return (
    <Svg width={175 * scale} height={166 * scale} viewBox="0 0 175 166" fill="none">
      <Rect x="80.1724" y="30.9236" width="13.8406" height="134.6" rx="6.92032" fill={color} />
      <Rect x="60.1292" y="15.7471" width="13.8406" height="132.094" rx="6.92032" fill={color} />
      <Rect x="100.215" y="15.7471" width="13.8406" height="132.094" rx="6.92032" fill={color} />
      <Rect x="40.0862" y="0" width="13.8406" height="128.08" rx="6.92032" fill={color} />
      <Rect x="120.258" y="0" width="13.8406" height="128.08" rx="6.92032" fill={color} />
      <Rect x="20.0432" y="0" width="13.8406" height="106.288" rx="6.92032" fill={color} />
      <Rect x="140.301" y="0" width="13.8406" height="106.288" rx="6.92032" fill={color} />
      <Rect x="0" y="12.2572" width="13.8406" height="63.0462" rx="6.92032" fill={color} />
      <Rect x="160.345" y="12.2572" width="13.8406" height="63.0462" rx="6.92032" fill={color} />
    </Svg>
  );
};

export default SootheLogo;
