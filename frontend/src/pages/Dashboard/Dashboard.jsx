import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Users, Shield, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import ScoreCard from '../../components/UI/ScoreCard';
import DonutChart from '../../components/Charts/DonutChart';
import BarChartComponent from '../../components/Charts/BarChart';
import LineChartComponent from '../../components/Charts/LineChart';
import StatusBadge from '../../components/UI/StatusBadge';
import { getDashboardSummary } from '../../services/analyticsService';
import { getOverdueIssues } from '../../services/governanceService';
import { getCarbonTransactions } from '../../services/environmentalService';
import { getLeaderboard } from '../../services/socialService';
import { format } from 'date-fns';

// ============================================================
// STAGGER CONTAINER
// ============================================================
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ============================================================
// MOCK FALLBACK DATA
// ============================================================
const mockBarData = [
  { name: 'Electricity', value: 4200, color: '#00D4AA' },
  { name: 'Transport', value: 3100, color: '#4F8EF7' },
  { name: 'Waste', value: 1800, color: '#F7A84F' },
  { name: 'Water', value: 900, color: '#A855F7' },
  { name: 'Other', value: 600, color: '#7B8DB0' },
];

const mockLineData = [
  { name: 'Jan', value: 4800 },
  { name: 'Feb', value: 4200 },
  { name: 'Mar', value: 5100 },
  { name: 'Apr', value: 3900 },
  { name: 'May', value: 4600 },
  { name: 'Jun', value: 3400 },
];

// ============================================================
// DASHBOARD PAGE
// ============================================================
const Dashboard = () => {
  const { user, settings } = useAppStore();
  const [summary, setSummary] = useState(null);
  const [overdueIssues, setOverdueIssues] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        getDashboardSummary(),
        getOverdueIssues(),
        getCarbonTransactions({ limit: 5 }),
        getLeaderboard({ limit: 5 }),
      ]);
      if (results[0].status === 'fulfilled') setSummary(results[0].value);
      if (results[1].status === 'fulfilled') setOverdueIssues(results[1].value?.slice(0, 4) || []);
      if (results[2].status === 'fulfilled') setTransactions(results[2].value?.items || results[2].value || []);
      if (results[3].status === 'fulfilled') setLeaderboard(results[3].value?.slice(0, 5) || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const esgWeights = settings.esgWeights;
  const donutData = [
    { name: 'Environmental', value: esgWeights.e },
    { name: 'Social',        value: esgWeights.s },
    { name: 'Governance',    value: esgWeights.g },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 28 }}
      >
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
          {greeting()}, {user?.name?.split(' ')[0] || 'User'} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          Here's your ESG performance overview for today, {format(new Date(), 'MMMM d, yyyy')}
        </p>
      </motion.div>

      {/* ── ROW 1: Score Cards ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid-4"
        style={{ marginBottom: 24 }}
      >
        <motion.div variants={item}>
          <ScoreCard
            icon={TrendingUp}
            label="Overall ESG Score"
            value={summary?.overall_score ?? 74}
            unit="/100"
            trend={summary?.score_trend ?? 3}
            trendLabel="vs last month"
            colorVariant="emerald"
            loading={loading}
          />
        </motion.div>
        <motion.div variants={item}>
          <ScoreCard
            icon={Leaf}
            label="Carbon This Month"
            value={summary?.carbon_this_month ?? 12450}
            unit=" kg"
            trend={summary?.carbon_trend ?? -8}
            trendLabel="reduction"
            colorVariant="blue"
            loading={loading}
          />
        </motion.div>
        <motion.div variants={item}>
          <ScoreCard
            icon={Users}
            label="Active Challenges"
            value={summary?.active_challenges ?? 6}
            trend={summary?.challenges_trend ?? 2}
            colorVariant="amber"
            loading={loading}
          />
        </motion.div>
        <motion.div variants={item}>
          <ScoreCard
            icon={Shield}
            label="Open Issues"
            value={summary?.open_issues ?? 4}
            trend={summary?.issues_trend}
            colorVariant="danger"
            loading={loading}
          />
        </motion.div>
      </motion.div>

      {/* ── ROW 2: Donut Chart + Leaderboard ── */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <motion.div
          className="card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="card-header">
            <div>
              <div className="card-title">ESG Pillar Breakdown</div>
              <div className="card-subtitle">Weighted score distribution</div>
            </div>
          </div>
          <DonutChart
            data={donutData}
            totalScore={summary?.overall_score ?? 74}
          />
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{ padding: 0, overflow: 'hidden' }}
        >
          <div className="card-header" style={{ padding: '20px 24px' }}>
            <div className="card-title">Department Leaderboard</div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Department</th>
                <th>XP Points</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {[1,2,3,4].map(j => (
                      <td key={j} style={{ padding: 14 }}>
                        <div className="skeleton skeleton-text" style={{ width: '70%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : leaderboard.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No data</td></tr>
              ) : (
                leaderboard.map((entry, idx) => (
                  <tr key={entry.employee_id || idx}>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: idx === 0 ? '#F7A84F' : idx === 1 ? '#94A3B8' : idx === 2 ? '#CD7F32' : 'var(--text-muted)',
                      }}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{entry.employee_name || entry.name || 'Employee'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{entry.department || '—'}</td>
                    <td>
                      <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>
                        {(entry.total_xp || entry.points || 0).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </motion.div>
      </div>

      {/* ── ROW 3: Bar Chart + Recent Transactions ── */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="card-header">
            <div>
              <div className="card-title">Carbon by Source</div>
              <div className="card-subtitle">kg CO₂e this month</div>
            </div>
          </div>
          <BarChartComponent
            data={summary?.carbon_by_source || mockBarData}
            xKey="name"
            yKey="value"
            color="#00D4AA"
            unit="kg"
            loading={loading}
          />
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <div className="card-header">
            <div className="card-title">Recent Transactions</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />
              ))
            ) : transactions.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '0.875rem' }}>
                No transactions yet
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  background: 'var(--bg-card-hover)',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: 'var(--emerald-glow)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Activity size={14} color="var(--emerald)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{tx.source_type || 'Carbon Event'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {tx.department || ''} · {tx.date ? format(new Date(tx.date), 'MMM d') : ''}
                    </div>
                  </div>
                  <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.875rem' }}>
                    +{tx.co2e_kg || tx.quantity || 0} kg
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* ── ROW 4: Carbon Trend ── */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        style={{ marginBottom: 24 }}
      >
        <div className="card-header">
          <div>
            <div className="card-title">Emissions Trend</div>
            <div className="card-subtitle">Monthly CO₂e overview</div>
          </div>
        </div>
        <LineChartComponent
          data={summary?.emissions_trend || mockLineData}
          xKey="name"
          lines={[{ key: 'value', color: '#00D4AA', label: 'CO₂e (kg)' }]}
          unit="kg"
          loading={loading}
        />
      </motion.div>

      {/* ── ROW 5: Overdue Compliance Issues ── */}
      {overdueIssues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
          <div style={{
            background: 'var(--danger-glow)',
            border: '1px solid rgba(224,92,92,0.3)',
            borderRadius: 14,
            padding: '16px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <AlertTriangle size={16} color="var(--danger)" />
              <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.9375rem' }}>
                Overdue Compliance Issues
              </span>
              <span className="badge badge-danger" style={{ marginLeft: 'auto' }}>
                {overdueIssues.length} overdue
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {overdueIssues.map((issue) => (
                <div key={issue.id} style={{
                  background: 'rgba(224,92,92,0.1)',
                  border: '1px solid rgba(224,92,92,0.2)',
                  borderRadius: 8,
                  padding: '8px 14px',
                  minWidth: 180,
                }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{issue.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 2 }}>
                    Due: {issue.due_date ? format(new Date(issue.due_date), 'MMM d') : 'Unknown'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
