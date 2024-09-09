import React from 'react';
import { useTheme } from 'next-themes';

const CrystalBallSVG: React.FC = () => {
  const { theme } = useTheme();

  const isDarkMode = theme === 'dark';

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-16 h-16">
      {/* Crystal ball base */}
      <path
        d="M30 80 Q50 90 70 80"
        fill="none"
        stroke={isDarkMode ? "white" : "black"}
        strokeWidth="3"
      />
      
      {/* Crystal ball */}
      <circle
        cx="50"
        cy="45"
        r="35"
        fill={isDarkMode ? "black" : "white"}
        stroke={isDarkMode ? "white" : "black"}
        strokeWidth="3"
      />
      
      {/* Simple star inside the ball */}
      <path
        d="M50 20 l2 6 6 -2 -2 6 6 2 -6 2 2 6 -6 -2 -2 6 -2 -6 -6 2 2 -6 -6 -2 6 -2 -2 -6 6 2z"
        fill={isDarkMode ? "white" : "black"}
      />
    </svg>
  );
};

export default CrystalBallSVG;