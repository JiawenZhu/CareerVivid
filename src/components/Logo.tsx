
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-8 w-8" }) => {
  const { theme, resolvedTheme } = useTheme();

  const LOGO_DARK = "https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Flogo_dark_mode.png?alt=media";
  // Bright mode shares the bright logo treatment from the light variant.
  const LOGO_BRIGHT = "https://firebasestorage.googleapis.com/v0/b/jastalk-firebase.firebasestorage.app/o/public%2Flogo_assets%2Flogo_light_mode.png?alt=media";

  const src =
    theme === 'dark'
      ? LOGO_DARK
      : theme === 'bright'
        ? LOGO_BRIGHT
        : resolvedTheme === 'dark'
          ? LOGO_DARK
          : LOGO_BRIGHT;

  // If the user provided a className, we use it, but we replace fixed widths with w-auto so the text logo does not squish
  const defaultClass = className ? className.replace(/\bw-\d+\b/g, 'w-auto') : "h-8 w-auto";

  return (
    <img
      src={src}
      alt="CareerVivid Logo"
      // Brand rule: the mark is always circular. The source PNG is a square
      // tile, so clip it round everywhere it renders.
      className={`aspect-square rounded-full object-cover ${defaultClass}`}
      // @ts-ignore - fetchpriority is a valid attribute for performance optimization
      fetchpriority="high"
    />
  );
};

export default Logo;
