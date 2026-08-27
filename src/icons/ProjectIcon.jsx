import React from 'react';
import { ICON_REGISTRY } from './registry';

const ProjectIcon = ({ name, size = 20, className = '', ...props }) => {
  const iconId = ICON_REGISTRY[name] || 'folder';

  return (
    <svg
      width={size}
      height={size}
      fill="currentColor"
      className={`project-icon ${className}`}
      {...props}
    >
      <use href={`/icons/bootstrap-icons.svg#${iconId}`} />
    </svg>
  );
};

export default ProjectIcon;