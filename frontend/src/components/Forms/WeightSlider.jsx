import React from 'react';
import { Leaf, Users, Shield } from 'lucide-react';

// ============================================================
// WEIGHT SLIDER COMPONENT
// E, S, G sliders that must sum to 100
// ============================================================
const pillars = [
  { key: 'e', label: 'Environmental', shortLabel: 'E', icon: Leaf,   color: 'var(--emerald)', track: '#00D4AA' },
  { key: 's', label: 'Social',        shortLabel: 'S', icon: Users,  color: 'var(--blue)',    track: '#4F8EF7' },
  { key: 'g', label: 'Governance',    shortLabel: 'G', icon: Shield, color: 'var(--amber)',   track: '#F7A84F' },
];

const WeightSlider = ({ weights, onChange }) => {
  const total = (weights.e || 0) + (weights.s || 0) + (weights.g || 0);
  const isValid = total === 100;

  const handleChange = (key, newVal) => {
    const val = Math.max(0, Math.min(100, Number(newVal)));
    const others = pillars.filter((p) => p.key !== key).map((p) => p.key);
    const remaining = 100 - val;
    const prevOther1 = weights[others[0]] || 0;
    const prevOther2 = weights[others[1]] || 0;
    const prevOtherTotal = prevOther1 + prevOther2;

    let newOther1, newOther2;
    if (prevOtherTotal === 0) {
      newOther1 = Math.round(remaining / 2);
      newOther2 = remaining - newOther1;
    } else {
      newOther1 = Math.round((prevOther1 / prevOtherTotal) * remaining);
      newOther2 = remaining - newOther1;
    }

    onChange({
      ...weights,
      [key]: val,
      [others[0]]: newOther1,
      [others[1]]: newOther2,
    });
  };

  return (
    <div className="weight-slider-container">
      {pillars.map((pillar) => {
        const Icon = pillar.icon;
        const val = weights[pillar.key] || 0;
        return (
          <div key={pillar.key} className="weight-slider-item">
            <div className="weight-slider-header">
              <span className="weight-slider-label" style={{ color: pillar.color }}>
                <Icon size={15} />
                {pillar.label}
              </span>
              <span
                className="weight-slider-value"
                style={{ color: pillar.color }}
              >
                {val}%
              </span>
            </div>

            <input
              type="range"
              className="weight-slider-range"
              min={0}
              max={100}
              step={1}
              value={val}
              onChange={(e) => handleChange(pillar.key, e.target.value)}
              style={{
                background: `linear-gradient(to right, ${pillar.track} ${val}%, var(--border) ${val}%)`,
              }}
            />
          </div>
        );
      })}

      {/* Total indicator */}
      <div className={`weight-total ${isValid ? 'valid' : 'invalid'}`}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Total</span>
        <span
          style={{
            fontWeight: 700,
            fontSize: '1rem',
            color: isValid ? 'var(--emerald)' : 'var(--danger)',
          }}
        >
          {total}% {isValid ? '✓' : `(${total > 100 ? '+' : ''}${total - 100} off)`}
        </span>
      </div>

      {/* Visual distribution bar */}
      <div style={{ height: 10, borderRadius: 9999, overflow: 'hidden', display: 'flex', gap: 1 }}>
        <div
          style={{
            width: `${weights.e || 0}%`,
            background: 'var(--emerald)',
            transition: 'width 0.3s ease',
          }}
        />
        <div
          style={{
            width: `${weights.s || 0}%`,
            background: 'var(--blue)',
            transition: 'width 0.3s ease',
          }}
        />
        <div
          style={{
            width: `${weights.g || 0}%`,
            background: 'var(--amber)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};

export default WeightSlider;
