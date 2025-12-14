// Web用のVector Iconsモック
import React from 'react';

const createIconComponent = (fontFamily) => {
  return ({ name, size = 24, color = '#000', style, ...props }) => {
    return React.createElement('span', {
      className: 'material-icons',
      style: {
        fontSize: size,
        color: color,
        lineHeight: 1,
        userSelect: 'none',
        ...style,
      },
      ...props,
    }, name);
  };
};

export default createIconComponent('MaterialIcons');