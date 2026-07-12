import React, { useEffect, useState } from 'react';
import { Plus, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import DataTable from '../../components/UI/DataTable';
import Modal from '../../components/UI/Modal';
import StatusBadge from '../../components/UI/StatusBadge';
import { getCarbonTransactions, createCarbonTransaction } from '../../services/environmentalService';
import { getEmissionFactors, getDepartments } from '../../services/masterDataService';
import { format } from 'date-fns';
import useAppStore from '../../store/useAppStore';

const sourceTypes = ['electricity', 'transport', 'waste', 'water', 'fuel', 'refrigerant', 'other'];

const CarbonTransactions = () => {
  const { settings } = useAppStore();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emissionFactors, setEmissionFactors] = useState([]);
  const [departments, setDepartments] = useState([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchTransactions();
    getEmissionFactors().then(setEmissionFactors).catch(() => {});
    getDepartments().then(setDepartments).catch(() => {});
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await getCarbonTransactions();
      setTransactions(res?.items || res || []);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await createCarbonTransaction(data);
      toast.success('Transaction recorded');
      fetchTransactions();
      setModalOpen(false);
      reset();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create transaction');
    } finally { setSubmitting(false); }
  };

  const sourceColors = {
    electricity: '#00D4AA', transport: '#4F8EF7', waste: '#F7A84F',
    water: '#A855F7', fuel: '#E05C5C', refrigerant: '#94A3B8', other: '#7B8DB0',
  };

  const columns = [
    { key: 'date', header: 'Date', sortable: true, render: (v) => v ? format(new Date(v), 'MMM d, yyyy') : '—' },
    { key: 'source_type', header: 'Source Type', sortable: true, render: (v) => (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 10px', borderRadius: 99,
        background: `${sourceColors[v] || '#7B8DB0'}22`,
        color: sourceColors[v] || '#7B8DB0',
        fontWeight: 600, fontSize: '0.75rem',
        border: `1px solid ${sourceColors[v] || '#7B8DB0'}44`,
      }}>
        {v || '—'}
      </span>
    )},
    { key: 'department_id', header: 'Department', sortable: true, render: (v) => {
      const dept = departments.find((d) => (d._id || d.id) === v);
      return dept ? dept.name : '—';
    }},
    { key: 'quantity', header: 'Quantity', sortable: true, render: (v) => v != null ? v.toLocaleString() : '—' },
    { key: 'unit', header: 'Unit', render: (v) => v || '—' },
    { key: 'amount_co2e', header: 'CO₂e (kg)', sortable: true, render: (v) => (
      <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{v?.toLocaleString() || '—'}</span>
    )},
    { key: 'auto_generated', header: 'Method', render: (v) => (
      <span className={`badge ${v ? 'badge-emerald' : 'badge-blue'}`}>
        {v ? '⚡ Auto' : 'Manual'}
      </span>
    )},
    { key: 'notes', header: 'Notes', render: (v) => (
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', maxWidth: 160, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {v || '—'}
      </span>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Carbon Transactions</h1>
            <p className="page-subtitle">All recorded emission events</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {settings.autoEmission && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'var(--emerald-glow)', border: '1px solid rgba(0,212,170,0.2)' }}>
                <Zap size={13} color="var(--emerald)" />
                <span style={{ color: 'var(--emerald)', fontSize: '0.8125rem', fontWeight: 600 }}>Auto-Emission ON</span>
              </div>
            )}
            <button className="btn btn-primary" onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} /> New Transaction
            </button>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        loading={loading}
        exportFilename="carbon-transactions"
        emptyMessage="No transactions found"
        emptySubMessage="Record your first carbon transaction to get started."
      />

      {/* Create Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); reset(); }}
        title="New Carbon Transaction"
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setModalOpen(false); reset(); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit(onSubmit)} disabled={submitting}>
              {submitting ? <><div className="spinner spinner-sm" /> Saving...</> : 'Record Transaction'}
            </button>
          </>
        }
      >
        <form>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Source Type *</label>
              <select className="form-select" {...register('source_type', { required: 'Required' })}>
                <option value="">Select source</option>
                {sourceTypes.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
              {errors.source_type && <div className="form-error">{errors.source_type.message}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-select" {...register('department_id')}>
                <option value="">My Department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input type="number" step="0.01" className="form-input" placeholder="e.g. 150" {...register('quantity', { required: 'Required', min: { value: 0, message: 'Must be positive' } })} />
              {errors.quantity && <div className="form-error">{errors.quantity.message}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-select" {...register('unit')}>
                <option value="kWh">kWh</option>
                <option value="liters">Liters</option>
                <option value="kg">kg</option>
                <option value="km">km</option>
                <option value="m3">m³</option>
                <option value="tons">Tons</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Emission Factor (optional)</label>
            <select className="form-select" {...register('emission_factor_id')}>
              <option value="">Use default factor</option>
              {emissionFactors.map((ef) => (
                <option key={ef.id} value={ef.id}>{ef.source_type} — {ef.coefficient} kg CO₂e/{ef.unit}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" {...register('date')} defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" rows={3} placeholder="Optional notes..." {...register('notes')} />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CarbonTransactions;
