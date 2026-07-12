import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Tag, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import DataTable from '../../components/UI/DataTable';
import Modal from '../../components/UI/Modal';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/masterDataService';
import toast from 'react-hot-toast';

const TYPES = [
  { value: 'E', label: 'Environmental', color: 'emerald' },
  { value: 'S', label: 'Social', color: 'blue' },
  { value: 'G', label: 'Governance', color: 'amber' },
];

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', type: 'E', description: '' },
  });

  const fetchData = async () => {
    setLoading(true);
    try { setCategories(await getCategories()); }
    catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const onSubmit = async (data) => {
    try {
      if (editingCat) { await updateCategory(editingCat.id, data); toast.success('Updated'); }
      else { await createCategory(data); toast.success('Created'); }
      closeModal(); fetchData();
    } catch { toast.error('Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try { await deleteCategory(id); toast.success('Deleted'); fetchData(); }
    catch { toast.error('Delete failed'); }
  };

  const openEdit = (cat) => {
    setEditingCat(cat);
    reset({ name: cat.name, type: cat.type, description: cat.description || '' });
    setModalOpen(true);
  };

  const openCreate = () => { setEditingCat(null); reset({ name: '', type: 'E', description: '' }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingCat(null); };

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'type', header: 'Type', render: (v) => { const t = TYPES.find(x => x.value === v); return <span className={`badge badge-${t?.color || 'emerald'}`}>{t?.label || v}</span>; }},
    { key: 'description', header: 'Description' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"><Tag size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} /> Categories</h1>
        <p className="page-subtitle">Manage categories for CSR activities, challenges, and governance items</p>
      </div>

      <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="card-header">
          <div className="card-title">All Categories</div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Category</button>
        </div>

        <DataTable
          columns={columns}
          data={categories}
          loading={loading}
          emptyMessage="No categories configured"
          actions={[
            { label: 'Edit', icon: Edit, onClick: (row, e) => { e.stopPropagation(); openEdit(row); } },
            { label: 'Delete', icon: Trash2, variant: 'danger', onClick: (row, e) => { e.stopPropagation(); handleDelete(row.id); } },
          ]}
        />
      </motion.div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingCat ? 'Edit Category' : 'Create Category'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" {...register('name', { required: 'Name is required' })} />
            {errors.name && <div className="form-error">{errors.name.message}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Type *</label>
            <select className="form-select" {...register('type', { required: 'Required' })}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} {...register('description')} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <Loader2 size={16} className="spin" /> : (editingCat ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Categories;