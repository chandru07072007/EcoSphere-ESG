import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Edit, Trash2, Loader2, Send, Eye, CheckCircle, Clock, Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import DataTable from '../../components/UI/DataTable';
import Modal from '../../components/UI/Modal';
import StatusBadge from '../../components/UI/StatusBadge';
import FileUpload from '../../components/Forms/FileUpload';
import { getPolicies, createPolicy, updatePolicy, publishPolicy, acknowledgePolicy, getPolicyAcknowledgements, deletePolicy } from '../../services/governanceService';
import { getDepartments } from '../../services/masterDataService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [viewAcknowledgements, setViewAcknowledgements] = useState(null);
  const [ackLoading, setAckLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { title: '', scope: '', version: '1.0', content: '', department_ids: [] },
  });

  const fetchData = async () => {
    setLoading(true);
    try { const res = await getPolicies(); setPolicies(res); } catch { toast.error('Failed to load policies'); } finally { setLoading(false); }
  };

  const fetchDeps = async () => {
    try { const res = await getDepartments(); setDepartments(res); } catch {}
  };

  useEffect(() => { fetchData(); fetchDeps(); }, []);

  const onSubmit = async (data) => {
    try {
      if (editingPolicy) { await updatePolicy(editingPolicy.id, data); toast.success('Updated'); }
      else { await createPolicy(data); toast.success('Created'); }
      closeModal(); fetchData();
    } catch { toast.error('Operation failed'); }
  };

  const handlePublish = async (id) => {
    if (!window.confirm('Publish this policy? This will notify all relevant employees.')) return;
    try { await publishPolicy(id); toast.success('Published'); fetchData(); } catch { toast.error('Publish failed'); }
  };

  const handleAcknowledge = async (id) => {
    try { await acknowledgePolicy(id); toast.success('Acknowledged'); fetchData(); } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this policy?')) return;
    try { await deletePolicy(id); toast.success('Deleted'); fetchData(); } catch { toast.error('Delete failed'); }
  };

  const loadAcknowledgements = async (policyId) => {
    setViewAcknowledgements(policyId);
    setAckLoading(true);
    try { await getPolicyAcknowledgements(policyId); } finally { setAckLoading(false); }
  };

  const openEdit = (policy) => { setEditingPolicy(policy); reset({ title: policy.title, scope: policy.scope, version: policy.version, content: policy.content, department_ids: policy.department_ids || [] }); setModalOpen(true); };
  const openCreate = () => { setEditingPolicy(null); reset({ title: '', scope: '', version: '1.0', content: '', department_ids: [] }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingPolicy(null); };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"><FileText size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Policies</h1>
        <p className="page-subtitle">Company policies, regulations, and compliance documents</p>
      </div>

      <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="card-header">
          <div className="card-title">All Policies</div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Create Policy</button>
        </div>

        <DataTable
          columns={[
            { key: 'title', header: 'Title', sortable: true },
            { key: 'scope', header: 'Scope' },
            { key: 'version', header: 'Version', width: 100 },
            { key: 'published_at', header: 'Published', render: (v) => v ? format(new Date(v), 'MMM d, yyyy') : <span className="badge badge-amber">Draft</span> },
            { key: 'acknowledgement_count', header: 'Acknowledged', render: (v, row) => `${v} / ${row.total_required}` },
            { key: 'department_ids', header: 'Departments', render: (v) => <span className="text-muted">{v?.join(', ') || 'All'}</span> },
          ]}
          data={policies}
          loading={loading}
          emptyMessage="No policies created"
          actions={[
            { label: 'View', icon: Eye, onClick: (row, e) => { e.stopPropagation(); /* view details */ } },
            { label: 'Edit', icon: Edit, show: (row) => !row.published_at, onClick: (row, e) => { e.stopPropagation(); openEdit(row); } },
            { label: 'Publish', icon: Send, variant: 'success', show: (row) => !row.published_at, onClick: (row, e) => { e.stopPropagation(); handlePublish(row.id); } },
            { label: 'Acknowledge', icon: CheckCircle, variant: 'primary', show: (row) => row.published_at, onClick: (row, e) => { e.stopPropagation(); handleAcknowledge(row.id); } },
            { label: 'Acks', icon: Users, onClick: (row, e) => { e.stopPropagation(); loadAcknowledgements(row.id); } },
            { label: 'Delete', icon: Trash2, variant: 'danger', show: (row) => !row.published_at, onClick: (row, e) => { e.stopPropagation(); handleDelete(row.id); } },
          ]}
        />
      </motion.div>

      {/* Acknowledgements Modal */}
      {viewAcknowledgements && (
        <Modal isOpen={true} onClose={() => setViewAcknowledgements(null)} title="Policy Acknowledgements" size="lg">
          {ackLoading ? <div className="text-center py-8"><Loader2 size={24} className="spin" /></div> : (
            <DataTable
              columns={[
                { key: 'employee_name', header: 'Employee' },
                { key: 'acknowledged_at', header: 'Acknowledged', render: (v) => format(new Date(v), 'MMM d, yyyy HH:mm') },
              ]}
              data={[]}
              loading={ackLoading}
              emptyMessage="No acknowledgements yet"
            />
          )}
        </Modal>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editingPolicy ? 'Edit Policy' : 'Create Policy'} size="xl">
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" {...register('title', { required: 'Title is required' })} />
            {errors.title && <div className="form-error">{errors.title.message}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Scope *</label>
            <input className="form-input" {...register('scope', { required: 'Scope is required' })} placeholder="e.g., All employees and contractors" />
            {errors.scope && <div className="form-error">{errors.scope.message}</div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Version</label>
              <input className="form-input" {...register('version')} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Departments</label>
            <select className="form-select" multiple {...register('department_ids')}>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <small className="form-hint">Hold Ctrl/Cmd to select multiple. Empty = all departments.</small>
          </div>
          <div className="form-group">
            <label className="form-label">Content *</label>
            <textarea className="form-input" rows={12} {...register('content', { required: 'Content is required' })} placeholder="Enter the full policy text here..." />
            {errors.content && <div className="form-error">{errors.content.message}</div>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <Loader2 size={16} className="spin" /> : (editingPolicy ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Policies;