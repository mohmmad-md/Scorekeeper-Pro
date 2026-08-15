import React from 'react';

interface DiamondProps {
  runners: {
    1: string | null;
    2: string | null;
    3: string | null;
  };
  homeColor: string;
  awayColor: string;
  isTopInning: boolean;
  sprayDirection?: 'Left' | 'Center' | 'Right';
  size?: 'sm' | 'md' | 'lg';
  onBaseClick?: (base: 1 | 2 | 3) => void;
  selectedBase?: 1 | 2 | 3 | null;
  // Map from player ID to player name
  playerNames?: Record<string, string>;
}

export const DiamondVisualization: React.FC<DiamondProps> = ({
  runners,
  homeColor,
  awayColor,
  isTopInning,
  sprayDirection,
  size = 'sm',
  onBaseClick,
  selectedBase,
  playerNames = {}
}) => {
  const runnerColor = isTopInning ? awayColor : homeColor;

  const sizeClasses = {
    sm: 'w-44 h-44',
    md: 'w-56 h-56',
    lg: 'w-72 h-72'
  };

  const getRunnerName = (playerId: string | null): string => {
    if (!playerId) return '';
    return playerNames[playerId] || playerId;
  };

  const baseSize = size === 'sm' ? 14 : size === 'md' ? 18 : 22;
  const dotSize = size === 'sm' ? 8 : size === 'md' ? 10 : 14;
  const fontSize = size === 'sm' ? '9px' : size === 'md' ? '10px' : '12px';

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      <svg className="w-full h-full" viewBox="0 0 200 200">
        {/* Grass background */}
        <rect x="0" y="0" width="200" height="200" rx="12" fill="#15803d" />
        
        {/* Infield dirt */}
        <polygon points="100,160 160,100 100,40 40,100" fill="#92400e" opacity="0.6" />
        
        {/* Base path lines */}
        <line x1="100" y1="160" x2="160" y2="100" stroke="white" strokeWidth="2" opacity="0.6" />
        <line x1="160" y1="100" x2="100" y2="40" stroke="white" strokeWidth="2" opacity="0.6" />
        <line x1="100" y1="40" x2="40" y2="100" stroke="white" strokeWidth="2" opacity="0.6" />
        <line x1="40" y1="100" x2="100" y2="160" stroke="white" strokeWidth="2" opacity="0.6" />

        {/* Runner trails (green = safe) */}
        {runners[1] && (
          <line x1="100" y1="160" x2="160" y2="100" stroke="#22c55e" strokeWidth="3" />
        )}
        {runners[2] && (
          <line x1="160" y1="100" x2="100" y2="40" stroke="#22c55e" strokeWidth="3" />
        )}
        {runners[3] && (
          <line x1="100" y1="40" x2="40" y2="100" stroke="#22c55e" strokeWidth="3" />
        )}

        {/* Spray direction */}
        {sprayDirection === 'Left' && (
          <line x1="100" y1="160" x2="25" y2="30" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4" />
        )}
        {sprayDirection === 'Center' && (
          <line x1="100" y1="160" x2="100" y2="15" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4" />
        )}
        {sprayDirection === 'Right' && (
          <line x1="100" y1="160" x2="175" y2="30" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4" />
        )}

        {/* Home Plate */}
        <rect x={100 - baseSize/2} y={160 - baseSize/2} width={baseSize} height={baseSize} 
          fill="white" transform={`rotate(45, 100, 160)`} stroke="#94a3b8" strokeWidth="1" />

        {/* 1st Base */}
        <g 
          onClick={() => onBaseClick?.(1)} 
          style={{ cursor: onBaseClick ? 'pointer' : 'default' }}
        >
          <rect 
            x={160 - baseSize/2} y={100 - baseSize/2} width={baseSize} height={baseSize}
            fill={selectedBase === 1 ? '#3b82f6' : 'white'} 
            transform={`rotate(45, 160, 100)`}
            stroke={selectedBase === 1 ? '#60a5fa' : '#94a3b8'} 
            strokeWidth={selectedBase === 1 ? 3 : 1}
          />
          {runners[1] && (
            <circle cx="160" cy="100" r={dotSize/2} fill={runnerColor} stroke="white" strokeWidth="2">
              <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
            </circle>
          )}
        </g>

        {/* 2nd Base */}
        <g 
          onClick={() => onBaseClick?.(2)} 
          style={{ cursor: onBaseClick ? 'pointer' : 'default' }}
        >
          <rect 
            x={100 - baseSize/2} y={40 - baseSize/2} width={baseSize} height={baseSize}
            fill={selectedBase === 2 ? '#3b82f6' : 'white'} 
            transform={`rotate(45, 100, 40)`}
            stroke={selectedBase === 2 ? '#60a5fa' : '#94a3b8'} 
            strokeWidth={selectedBase === 2 ? 3 : 1}
          />
          {runners[2] && (
            <circle cx="100" cy="40" r={dotSize/2} fill={runnerColor} stroke="white" strokeWidth="2">
              <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
            </circle>
          )}
        </g>

        {/* 3rd Base */}
        <g 
          onClick={() => onBaseClick?.(3)} 
          style={{ cursor: onBaseClick ? 'pointer' : 'default' }}
        >
          <rect 
            x={40 - baseSize/2} y={100 - baseSize/2} width={baseSize} height={baseSize}
            fill={selectedBase === 3 ? '#3b82f6' : 'white'} 
            transform={`rotate(45, 40, 100)`}
            stroke={selectedBase === 3 ? '#60a5fa' : '#94a3b8'} 
            strokeWidth={selectedBase === 3 ? 3 : 1}
          />
          {runners[3] && (
            <circle cx="40" cy="100" r={dotSize/2} fill={runnerColor} stroke="white" strokeWidth="2">
              <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
            </circle>
          )}
        </g>

        {/* Player Name Labels on bases */}
        {runners[1] && (
          <text x="160" y="85" textAnchor="middle" fill="white" fontSize={fontSize} fontWeight="bold"
            stroke="black" strokeWidth="0.5" paintOrder="stroke">
            {getRunnerName(runners[1])}
          </text>
        )}
        {runners[2] && (
          <text x="100" y="28" textAnchor="middle" fill="white" fontSize={fontSize} fontWeight="bold"
            stroke="black" strokeWidth="0.5" paintOrder="stroke">
            {getRunnerName(runners[2])}
          </text>
        )}
        {runners[3] && (
          <text x="40" y="85" textAnchor="middle" fill="white" fontSize={fontSize} fontWeight="bold"
            stroke="black" strokeWidth="0.5" paintOrder="stroke">
            {getRunnerName(runners[3])}
          </text>
        )}

        {/* Base labels */}
        <text x="170" y="118" textAnchor="middle" fill="white" fontSize="8" opacity="0.5">1B</text>
        <text x="100" y="58" textAnchor="middle" fill="white" fontSize="8" opacity="0.5">2B</text>
        <text x="30" y="118" textAnchor="middle" fill="white" fontSize="8" opacity="0.5">3B</text>
        <text x="100" y="180" textAnchor="middle" fill="white" fontSize="8" opacity="0.5">HOME</text>
      </svg>

      {/* Selected runner indicator */}
      {selectedBase && runners[selectedBase] && (
        <div className="absolute bottom-0 left-0 right-0 bg-blue-600/90 text-white text-center text-[10px] font-bold py-0.5 rounded-b-lg">
          Selected: {getRunnerName(runners[selectedBase])} on {selectedBase}B
        </div>
      )}
    </div>
  );
};
