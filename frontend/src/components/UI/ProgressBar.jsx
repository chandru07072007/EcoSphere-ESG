import React, { useEffect, useRef, useState } from 'react';

// ============================================================
// PROGRESS BAR COMPONENT
// ============================================================
const ProgressBar = ({
  label,
  value = 0,       // Current value (0-100 or raw number)
  max = 100,
  unit = '%',
  showValue = true,
  goalMarker,      // Optional: number representing goal position (0-100)
  height = 8,
  color,           // Override color: 'green' | 'amber' | 'red' | 'blue'
  animated = true,
  className = '',
}) => {
  const [rendered, setRendered] = useState(false);
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  useEffect(() => {
    const timer = setTimeout(() => setRendered(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const getColor = () => {
    if (color) return color;
    if (percentage >= 70) return 'green';
    if (percentage >= 40) return 'amber';
    return 'red';
  };

  const progressColor = getColor();

  return (
    <div className={`progress-container ${className}`}>
      {(label || showValue) && (
        <div className="progress-header">
          {label && <span className="progress-label">{label}</span>}
          {showValue && (
            <span className="progress-value">
              {typeof value === 'number' ? value.toLocaleString() : value}
              {unit}
            </span>
          )}
        </div>
      )}

      <div className="progress-track" style={{ height }}>
        <div
          className={`progress-fill ${progressColor}`}
          style={{
            width: animated ? (rendered ? `${percentage}%` : '0%') : `${percentage}%`,
            transition: animated ? 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          }}
        />

        {goalMarker !== undefined && (
          <div
            className="progress-goal-marker"
            style={{
              left: `${Math.min(100, goalMarker)}%`,
              transform: 'translateX(-50%)',
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
