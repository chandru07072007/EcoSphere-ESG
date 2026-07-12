import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ============================================================
// ANIMATED COUNTER HOOK
// ============================================================
const useCountUp = (target, duration = 1200) => {
  const [count, setCount] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const start = 0;
    const end = parseFloat(target) || 0;
    if (end === 0) { setCount(0); return; }

    const startTime = performance.now();
    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * end);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(update);
      } else {
        setCount(end);
      }
    };
    frameRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return count;
};

// ============================================================
// SCORE CARD COMPONENT
// ============================================================
const ScoreCard = ({
  icon: Icon,
  label,
  value,
  unit = '',
  trend,         // number (positive = up, negative = down)
  trendLabel,
  colorVariant = 'emerald', // emerald | blue | amber | danger | gray
  prefix = '',
  decimals = 0,
  loading = false,
}) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const animatedValue = useCountUp(numericValue);

  const colorMap = {
    emerald: { icon: 'var(--emerald)',  bg: 'var(--emerald-glow)',  border: 'rgba(0,212,170,0.15)' },
    blue:    { icon: 'var(--blue)',     bg: 'var(--blue-glow)',     border: 'rgba(79,142,247,0.15)' },
    amber:   { icon: 'var(--amber)',    bg: 'var(--amber-glow)',    border: 'rgba(247,168,79,0.15)' },
    danger:  { icon: 'var(--danger)',   bg: 'var(--danger-glow)',   border: 'rgba(224,92,92,0.15)' },
    gray:    { icon: 'var(--text-secondary)', bg: 'rgba(74,85,104,0.15)', border: 'rgba(74,85,104,0.15)' },
  };

  const colors = colorMap[colorVariant] || colorMap.emerald;

  const formatValue = (val) => {
    if (decimals > 0) return val.toFixed(decimals);
    return Math.round(val).toLocaleString();
  };

  const trendPositive = trend > 0;
  const trendNeutral  = trend === 0 || trend === undefined;

  if (loading) {
    return (
      <div className="stat-card">
        <div className="skeleton skeleton-card" style={{ height: 120 }} />
      </div>
    );
  }

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -3 }}
    >
      {/* Icon */}
      {Icon && (
        <div
          className="stat-icon"
          style={{ background: colors.bg, color: colors.icon }}
        >
          <Icon size={20} />
        </div>
      )}

      {/* Value */}
      <div className="stat-value">
        {prefix}
        {formatValue(animatedValue)}
        {unit && (
          <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 4 }}>
            {unit}
          </span>
        )}
      </div>

      {/* Label */}
      <div className="stat-label">{label}</div>

      {/* Trend */}
      {trend !== undefined && (
        <div
          className={`stat-trend ${trendNeutral ? '' : trendPositive ? 'up' : 'down'}`}
          style={trendNeutral ? { color: 'var(--text-muted)', background: 'rgba(74,85,104,0.1)' } : {}}
        >
          {trendNeutral ? (
            <Minus size={11} />
          ) : trendPositive ? (
            <TrendingUp size={11} />
          ) : (
            <TrendingDown size={11} />
          )}
          {trendLabel || `${Math.abs(trend)}%`}
        </div>
      )}
    </motion.div>
  );
};

export default ScoreCard;
