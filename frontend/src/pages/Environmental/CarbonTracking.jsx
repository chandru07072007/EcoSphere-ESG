import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, TrendingDown, Building2, RefreshCw } from 'lucide-react';
import ScoreCard from '../../components/UI/ScoreCard';
import BarChartComponent from '../../components/Charts/BarChart';
import LineChartComponent from '../../components/Charts/LineChart';
import DataTable from '../../components/UI/DataTable';
import StatusBadge from '../../components/UI/StatusBadge';
import { getCarbonTracking, getCarbonTransactions } from '../../services/environmentalService';
import { getDepartments } from '../../services/masterDataService';
import { format } from 'date-fns';

const CarbonTracking = () => {
  const [tracking, setTracking] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    department: '',
    dateFrom: '',
    dateTo: '',
    source_type: '',
  });

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {});
    fetchData();
  }, []);

  const fetchData = async (params = {}) => {
    setLoading(true);
    const [trackRes, txRes] = await Promise.allSettled([
      getCarbonTracking(params),
      getCarbonTransactions({ ...params, limit: 100 }),
    ]);
    if (trackRes.status === 'fulfilled') setTracking(trackRes.value);
    if (txRes.status === 'fulfilled') setTransactions(txRes.value?.items || txRes.value || []);
    setLoading(false);
  };

  const applyFilters = () => {
    fetchData(filters);
  };

  const columns = [
    { key: 'date', header: 'Date', sortable: true, render: (v) => v ? format(new Date(v), 'MMM d, yyyy') : '—' },
    { key: 'department', header: 'Department', sortable: true },
    { key: 'source_type', header: 'Source', sortable: true, render: (v) => (
      <span className="badge badge-blue">{v || '—'}</span>
    )},
    { key: 'quantity', header: 'Quantity', sortable: true },
    { key: 'unit', header: 'Unit' },
    { key: 'co2e_kg', header: 'CO₂e (kg)', sortable: true, render: (v) => (
      <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{v?.toLocaleString() || '—'}</span>
    )},
    { key: 'emission_factor', header: 'Factor' },
  ];

  const byDeptData = tracking?.by_department || [];
  const trendData   = tracking?.trend || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Carbon Tracking</h1>
        <p className="page-subtitle">Monitor and analyze carbon emissions across departments</p>
      </div>

      {/* Filters */}
      <motion.div
        className="card"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ marginBottom: 24 }}
      >
        <div className="filter-bar" style={{ paddingTop: 0 }}>
          <select
            className="form-select"
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          >
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select
            className="form-select"
            value={filters.source_type}
            onChange={(e) => setFilters({ ...filters, source_type: e.target.value })}
          >
            <option value="">All Sources</option>
            {['electricity', 'transport', 'waste', 'water', 'fuel', 'other'].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>From:</label>
            <input
              type="date"
              className="form-input"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>To:</label>
            <input
              type="date"
              className="form-input"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={applyFilters} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} /> Apply
          </button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <ScoreCard
          icon={Leaf}
          label="Total CO₂e This Period"
          value={tracking?.total_co2e ?? 0}
          unit=" kg"
          colorVariant="danger"
          loading={loading}
        />
        <ScoreCard
          icon={Building2}
          label="Top Emitter Dept"
          value={0}
          trendLabel={tracking?.top_emitter || 'N/A'}
          colorVariant="amber"
          loading={loading}
        />
        <ScoreCard
          icon={TrendingDown}
          label="Reduction vs Last Month"
          value={Math.abs(tracking?.reduction_pct ?? 0)}
          unit="%"
          trend={tracking?.reduction_pct}
          trendLabel="reduction"
          colorVariant="emerald"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Emissions by Department</div>
          </div>
          <BarChartComponent data={byDeptData} xKey="department" yKey="co2e_kg" color="#E05C5C" unit="kg CO₂e" loading={loading} />
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Emissions Trend</div>
          </div>
          <LineChartComponent
            data={trendData}
            xKey="date"
            lines={[{ key: 'co2e_kg', color: '#00D4AA', label: 'CO₂e (kg)' }]}
            unit="kg"
            loading={loading}
          />
        </div>
      </div>

      {/* Detailed Table */}
      <div className="card-title" style={{ marginBottom: 12 }}>Transaction Detail</div>
      <DataTable
        columns={columns}
        data={transactions}
        loading={loading}
        exportFilename="carbon-tracking"
        emptyMessage="No transactions found"
        emptySubMessage="Adjust your filters to see data."
      />
    </div>
  );
};

export default CarbonTracking;
