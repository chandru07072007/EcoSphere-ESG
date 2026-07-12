import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { differenceInDays, format } from 'date-fns';
import Modal from '../../components/UI/Modal';
import ProgressBar from '../../components/UI/ProgressBar';
import StatusBadge from '../../components/UI/StatusBadge';
import { getGoals, createGoal, updateGoal } from '../../services/environmentalService';

const STATUS_FILTERS = ['all', 'on-track', 'at-risk', 'achieved'];

const SustainabilityGoals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const data = await getGoals();
      setGoals(data || []);
    } catch { toast.error('Failed to load goals'); }
    finally { setLoading(false); }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await createGoal(data);
      toast.success('Goal created!');
      fetchGoals();
      setModalOpen(false);
      reset();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create goal');
    } finally { setSubmitting(false); }
  };

  const getGoalStatus = (goal) => {
    const pct = goal.target_value > 0 ? (goal.actual_value / goal.target_value) * 100 : 0;
    const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;
    if (pct >= 100) return 'achieved';
    if (daysLeft !== null && daysLeft < 0) return 'overdue';
    if (pct >= 60) return 'on-track';
    return 'at-risk';
  };

  const filtered = goals.filter((g) => filter === 'all' || getGoalStatus(g) === filter);

  const statusIcon = { 'on-track': CheckCircle, 'at-risk': AlertTriangle, achieved: CheckCircle, overdue: AlertTriangle };
  const statusColor = { 'on-track': 'var(--emerald)', 'at-risk': 'var(--amber)', achieved: 'var(--blue)', overdue: 'var(--danger)' };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Sustainability Goals</h1>
          <p className="page-subtitle">Track progress toward your environmental targets</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> Add Goal
        </button>
      </div>

      {/* Filter tabs */}
      <div className="tabs-list" style={{ marginBottom: 24 }}>
        {STATUS_FILTERS.map((s) => (
          <div
            key={s}
            className={`tab-item ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All Goals' : s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
            <span style={{ marginLeft: 6, fontSize: '0.75rem', opacity: 0.7 }}>
              ({s === 'all' ? goals.length : goals.filter((g) => getGoalStatus(g) === s).length})
            </span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid-2">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 180, borderRadius: 14 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Target size={48} className="empty-state-icon" />
          <div className="empty-state-title">No goals found</div>
          <div className="empty-state-sub">Create your first sustainability goal to start tracking progress.</div>
        </div>
      ) : (
        <motion.div
          className="grid-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {filtered.map((goal, i) => {
            const pct = goal.target_value > 0 ? Math.round((goal.actual_value / goal.target_value) * 100) : 0;
            const status = getGoalStatus(goal);
            const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;
            const gap = (goal.target_value || 0) - (goal.actual_value || 0);
            const StatusIcon = statusIcon[status] || Target;

            return (
              <motion.div
                key={goal.id}
                className="card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{goal.title || goal.name}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{goal.category || goal.description}</div>
                  </div>
                  <StatusBadge status={status} />
                </div>

                <ProgressBar
                  value={pct}
                  label={`${(goal.actual_value || 0).toLocaleString()} / ${(goal.target_value || 0).toLocaleString()} ${goal.unit || ''}`}
                  showValue={false}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                  <div style={{ fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Progress: </span>
                    <span style={{ fontWeight: 700, color: pct >= 70 ? 'var(--emerald)' : pct >= 40 ? 'var(--amber)' : 'var(--danger)' }}>
                      {pct}%
                    </span>
                  </div>
                  {gap > 0 && (
                    <div style={{ fontSize: '0.8125rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Gap: </span>
                      <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                        -{gap.toLocaleString()} {goal.unit || 'kg CO₂e'}
                      </span>
                    </div>
                  )}
                </div>

                {daysLeft !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: '0.8125rem' }}>
                    <Clock size={13} color={daysLeft < 0 ? 'var(--danger)' : daysLeft < 14 ? 'var(--amber)' : 'var(--text-muted)'} />
                    <span style={{ color: daysLeft < 0 ? 'var(--danger)' : daysLeft < 14 ? 'var(--amber)' : 'var(--text-muted)' }}>
                      {daysLeft < 0 ? `Overdue by ${Math.abs(daysLeft)} days` : daysLeft === 0 ? 'Due today' : `${daysLeft} days left`}
                    </span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
                      {goal.deadline ? format(new Date(goal.deadline), 'MMM d, yyyy') : ''}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Create Goal Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); reset(); }}
        title="Add Sustainability Goal"
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setModalOpen(false); reset(); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit(onSubmit)} disabled={submitting}>
              {submitting ? <><div className="spinner spinner-sm" /> Saving...</> : 'Create Goal'}
            </button>
          </>
        }
      >
        <form>
          <div className="form-group">
            <label className="form-label">Goal Title *</label>
            <input className="form-input" placeholder="e.g. Reduce Scope 1 Emissions by 20%" {...register('title', { required: 'Required' })} />
            {errors.title && <div className="form-error">{errors.title.message}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" {...register('category')}>
              <option value="">Select category</option>
              {['Carbon Reduction', 'Energy', 'Water', 'Waste', 'Biodiversity', 'Other'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Target Value *</label>
              <input type="number" step="0.01" className="form-input" placeholder="e.g. 1000" {...register('target_value', { required: 'Required' })} />
              {errors.target_value && <div className="form-error">{errors.target_value.message}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-select" {...register('unit')}>
                <option value="kg CO2e">kg CO₂e</option>
                <option value="tons CO2e">Tons CO₂e</option>
                <option value="kWh">kWh</option>
                <option value="liters">Liters</option>
                <option value="%">%</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Deadline *</label>
            <input type="date" className="form-input" {...register('deadline', { required: 'Required' })} />
            {errors.deadline && <div className="form-error">{errors.deadline.message}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={3} placeholder="Goal description..." {...register('description')} />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SustainabilityGoals;
