import React from 'react';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// Web用のアイコンコンポーネント（Material Iconsフォントを使用）
const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000', style }) => {
  return (
    <span
      className="material-icons"
      style={{
        fontSize: size,
        color: color,
        lineHeight: 1,
        ...style,
      }}
    >
      {name}
    </span>
  );
};

export default Icon;