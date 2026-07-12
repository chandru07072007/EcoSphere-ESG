import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';

import {
  getEmissionFactors,
  createEmissionFactor,
  updateEmissionFactor,
  deleteEmissionFactor,
} from '../../services/masterDataService';
import DataTable from '../../components/UI/DataTable';
import Modal from '../../components/UI/Modal';

const EmissionFactors = () => {
  const [factors, setFactors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingFactor, setEditingFactor] = useState(null);
  const [deletingFactor, setDeletingFactor] = useState(null);

  const { register, handleSubmit, reset } = useForm();

  const fetchFactors = async () => {
    setLoading(true);
    try {
      const data = await getEmissionFactors();
      setFactors(data);
    } catch (err) {
      toast.error('Failed to load emission factors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactors();
  }, []);

  const openCreateModal = () => {
    setEditingFactor(null);
    reset({
      name: '',
      source_type: 'purchase',
      coefficient: 0,
      unit: 'kg CO2e',
      description: '',
      effective_date: new Date().toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const openEditModal = (factor) => {
    setEditingFactor(factor);
    reset({
      name: factor.name,
      source_type: factor.source_type,
      coefficient: factor.coefficient,
      unit: factor.unit,
      description: factor.description || '',
      effective_date: factor.effective_date ? factor.effective_date.split('T')[0] : '',
    });
    setModalOpen(true);
  };

  const openDeleteModal = (factor) => {
    setDeletingFactor(factor);
    setDeleteOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingFactor) {
        await updateEmissionFactor(editingFactor._id || editingFactor.id, data);
        toast.success('Emission factor updated successfully');
      } else {
        await createEmissionFactor(data);
        toast.success('Emission factor created successfully');
      }
      setModalOpen(false);
      fetchFactors();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'An error occurred');
    }
  };

  const handleDelete = async () => {
    if (!deletingFactor) return;
    try {
      await deleteEmissionFactor(deletingFactor._id || deletingFactor.id);
      toast.success('Emission factor deleted successfully');
      setDeleteOpen(false);
      fetchFactors();
    } catch (err) {
      toast.error('Failed to delete emission factor');
    }
  };

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'source_type', header: 'Source Type', sortable: true },
    { key: 'coefficient', header: 'Coefficient', sortable: true },
    { key: 'unit', header: 'Unit', sortable: true },
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Emission Factors</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>Configure CO2 equivalent calculation parameters</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> Add Factor
        </button>
      </div>

      <DataTable
        columns={columns}
        data={factors}
        loading={loading}
        exportFilename="emission-factors"
        rowActions={(row) => (
          <>
            <button className="btn btn-sm btn-secondary" onClick={() => openEditModal(row)} style={{ padding: 6 }}>
              <Edit2 size={12} />
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => openDeleteModal(row)} style={{ padding: 6 }}>
              <Trash2 size={12} />
            </button>
          </>
        )}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingFactor ? 'Edit Emission Factor' : 'Create Emission Factor'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="form-label">Name</label>
              <input
                className="form-input"
                type="text"
                {...register('name', { required: true })}
                placeholder="e.g. Grid Electricity"
              />
            </div>
            <div>
              <label className="form-label">Source Type</label>
              <select className="form-select" {...register('source_type')}>
                <option value="purchase">Purchase</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="fleet">Fleet</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="form-label">Coefficient (Multiplier)</label>
              <input
                className="form-input"
                type="number"
                step="any"
                {...register('coefficient', { required: true })}
                placeholder="e.g. 0.85"
              />
            </div>
            <div>
              <label className="form-label">Unit</label>
              <input
                className="form-input"
                type="text"
                {...register('unit', { required: true })}
                placeholder="e.g. kg CO2e / kWh"
              />
            </div>
            <div>
              <label className="form-label">Description</label>
              <input
                className="form-input"
                type="text"
                {...register('description')}
                placeholder="Notes on computation standard used"
              />
            </div>
            <div>
              <label className="form-label">Effective Date</label>
              <input
                className="form-input"
                type="date"
                {...register('effective_date')}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingFactor ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Confirm Delete"
      >
        <p style={{ color: 'var(--text-primary)', marginBottom: 20 }}>
          Are you sure you want to delete emission factor <strong>{deletingFactor?.name}</strong>? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setDeleteOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default EmissionFactors;