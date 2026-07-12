import React from 'react';
import {
  BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
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
          <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: p.fill || p.color }} />
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
// BAR CHART COMPONENT
// ============================================================
const BarChartComponent = ({
  data = [],
  xKey = 'name',
  yKey = 'value',
  color = '#00D4AA',
  title,
  unit,
  height = 240,
  multiBar = false,    // If true, data should have multiple value keys
  barKeys = [],        // Array of { key, color, label }
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="skeleton" style={{ height, borderRadius: 8 }} />
    );
  }

  return (
    <div>
      {title && (
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
          {title}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBar
          data={data}
          margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
        >
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
            cursor={{ fill: 'rgba(79,142,247,0.06)' }}
          />

          {multiBar && barKeys.length > 0 ? (
            barKeys.map((bar) => (
              <Bar
                key={bar.key}
                dataKey={bar.key}
                fill={bar.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
                animationDuration={800}
              />
            ))
          ) : (
            <Bar
              dataKey={yKey}
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
              animationDuration={800}
              isAnimationActive={true}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || color}
                />
              ))}
            </Bar>
          )}
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent;
