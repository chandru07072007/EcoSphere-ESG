import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, ClipboardList } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

import { getAudits, createAudit, getPolicies } from '../../services/governanceService';
import { getDepartments } from '../../services/masterDataService';
import DataTable from '../../components/UI/DataTable';
import Modal from '../../components/UI/Modal';

const Audits = () => {
  const { user } = useAppStore();
  const isAuditor = user?.role === 'admin' || user?.role === 'manager';

  const [audits, setAudits] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await getAudits();
      setAudits(data);
      const p = await getPolicies();
      setPolicies(p);
      const d = await getDepartments();
      setDepartments(d);
    } catch (err) {
      toast.error('Failed to load audits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      auditor_id: user.id || user._id,
      date: new Date().toISOString(),
    };
    try {
      await createAudit(payload);
      toast.success('Audit report filed successfully');
      setModalOpen(false);
      reset();
      fetchAll();
    } catch (err) {
      toast.error('Failed to file audit');
    }
  };

  const columns = [
    {
      key: 'date',
      header: 'Audit Date',
      sortable: true,
      render: (d) => d ? new Date(d).toLocaleDateString() : '—',
    },
    { key: 'policy_id', header: 'Policy Reference' },
    { key: 'department_id', header: 'Audited Department' },
    { key: 'findings', header: 'Audit Findings' },
    { key: 'auditor_id', header: 'Auditor ID' },
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Compliance Audits</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>Log and track internal environmental and governance standards reviews</p>
        </div>
        {isAuditor && (
          <button className="btn btn-primary" onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> File Report
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={audits}
        loading={loading}
        exportFilename="audits-log"
      />

      {/* Audit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log New Audit Report">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="form-label">Audited Policy Standard</label>
              <select className="form-select" {...register('policy_id', { required: true })}>
                {policies.map((p) => (
                  <option key={p._id || p.id} value={p._id || p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Audited Department</label>
              <select className="form-select" {...register('department_id', { required: true })}>
                {departments.map((d) => (
                  <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Review Findings & Comments</label>
              <textarea className="form-input" {...register('findings', { required: true })} placeholder="Describe details of department checks..." rows={4} style={{ resize: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">File Report</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Audits;