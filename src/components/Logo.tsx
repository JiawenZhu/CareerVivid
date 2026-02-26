
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-8 w-8" }) => {
  const { resolvedTheme } = useTheme();

  const src = resolvedTheme === 'dark'
    ? "https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Flogo_dark_mode.png?alt=media&token=25d3963d-2c64-4bfc-bb96-41bc305cf1e5"
    : "https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Flogo_light_mode.png?alt=media&token=627ec9de-a950-41f7-9138-dd7a33518c55";

  // If the user provided a className, we use it, but we replace fixed widths with w-auto so the text logo does not squish
  const defaultClass = className ? className.replace(/\bw-\d+\b/g, 'w-auto') : "h-8 w-auto";

  return (
    <img
      src={src}
      alt="CareerVivid Logo"
      className={defaultClass}
      // @ts-ignore - fetchpriority is a valid attribute for performance optimization
      fetchpriority="high"
    />
  );
};

export default Logo;
