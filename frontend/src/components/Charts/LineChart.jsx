import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Dot,
} from 'recharts';

// ============================================================
// CUSTOM TOOLTIP
// ============================================================
const CustomTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: 'var(--shadow-card)',
        fontSize: '0.875rem',
      }}>
        <div style={{ color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>{label}</div>
        {payload.map((p) => (
          <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.stroke }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{p.name}</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
              {p.value?.toLocaleString()}
              {unit && <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 3 }}>{unit}</span>}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ============================================================
// LINE CHART COMPONENT
// ============================================================
const LineChartComponent = ({
  data = [],
  xKey = 'name',
  lines = [{ key: 'value', color: '#00D4AA', label: 'Value' }],
  title,
  unit,
  height = 240,
  showArea = true,
  loading = false,
}) => {
  if (loading) {
    return <div className="skeleton" style={{ height, borderRadius: 8 }} />;
  }

  return (
    <div>
      {title && (
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
          {title}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
          <defs>
            {lines.map((line) => (
              <linearGradient key={line.key} id={`gradient-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={line.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={line.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(26,37,64,0.8)"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={(props) => <CustomTooltip {...props} unit={unit} />}
          />
          {lines.length > 1 && (
            <Legend
              wrapperStyle={{ paddingTop: 16, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}
            />
          )}
          {lines.map((line) => (
            <Area
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.label || line.key}
              stroke={line.color}
              strokeWidth={2.5}
              fill={showArea ? `url(#gradient-${line.key})` : 'transparent'}
              dot={(props) => {
                const { cx, cy, payload } = props;
                return (
                  <Dot
                    key={`dot-${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={line.color}
                    stroke="var(--bg-card)"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 6, fill: line.color, stroke: 'var(--bg-card)', strokeWidth: 2 }}
              animationDuration={1000}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartComponent;
