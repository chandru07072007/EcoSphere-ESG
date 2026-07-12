import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip
} from 'recharts';

// ============================================================
// ESG DONUT CHART
// ============================================================
const COLORS = ['#00D4AA', '#4F8EF7', '#F7A84F'];
const LABELS = ['Environmental', 'Social', 'Governance'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '10px 14px',
        boxShadow: 'var(--shadow-card)',
        fontSize: '0.875rem',
      }}>
        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{name}</div>
        <div style={{ color: 'var(--text-secondary)' }}>Weight: <strong style={{ color: 'var(--text-primary)' }}>{value}%</strong></div>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ data }) => (
  <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
    {data.map((entry, i) => (
      <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i] }} />
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          {entry.name}
        </span>
        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: COLORS[i] }}>
          {entry.value}%
        </span>
      </div>
    ))}
  </div>
);

const DonutChart = ({ data, totalScore, title = 'ESG Score' }) => {
  const chartData = data || [
    { name: 'Environmental', value: 40 },
    { name: 'Social',        value: 30 },
    { name: 'Governance',    value: 30 },
  ];

  return (
    <div style={{ width: '100%' }}>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={75}
            outerRadius={110}
            paddingAngle={3}
            dataKey="value"
            animationBegin={0}
            animationDuration={1000}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center score (absolute overlay trick via CSS) */}
      <div
        style={{
          position: 'relative',
          marginTop: -240,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 240,
          pointerEvents: 'none',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {totalScore ?? '--'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>
            {title}
          </div>
        </div>
      </div>

      <CustomLegend data={chartData} />
    </div>
  );
};

export default DonutChart;
