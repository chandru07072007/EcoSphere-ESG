import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';

import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../../services/masterDataService';
import DataTable from '../../components/UI/DataTable';
import Modal from '../../components/UI/Modal';
import StatusBadge from '../../components/UI/StatusBadge';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deletingDept, setDeletingDept] = useState(null);

  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchDepts = async () => {
    setLoading(true);
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const openCreateModal = () => {
    setEditingDept(null);
    reset({
      name: '',
      code: '',
      head_id: '',
      parent_id: '',
      employee_count: 0,
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    reset({
      name: dept.name,
      code: dept.code,
      head_id: dept.head_id || '',
      parent_id: dept.parent_id || '',
      employee_count: dept.employee_count || 0,
      status: dept.status || 'active',
    });
    setModalOpen(true);
  };

  const openDeleteModal = (dept) => {
    setDeletingDept(dept);
    setDeleteOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingDept) {
        await updateDepartment(editingDept._id || editingDept.id, data);
        toast.success('Department updated successfully');
      } else {
        await createDepartment(data);
        toast.success('Department created successfully');
      }
      setModalOpen(false);
      fetchDepts();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'An error occurred');
    }
  };

  const handleDelete = async () => {
    if (!deletingDept) return;
    try {
      await deleteDepartment(deletingDept._id || deletingDept.id);
      toast.success('Department deleted successfully');
      setDeleteOpen(false);
      fetchDepts();
    } catch (err) {
      toast.error('Failed to delete department');
    }
  };

  const columns = [
    { key: 'code', header: 'Code', sortable: true, width: '100px' },
    { key: 'name', header: 'Department Name', sortable: true },
    { key: 'employee_count', header: 'Employees', sortable: true },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (status) => <StatusBadge status={status} />,
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>Manage organizational divisions and employee allocations</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> Add Department
        </button>
      </div>

      <DataTable
        columns={columns}
        data={departments}
        loading={loading}
        exportFilename="departments"
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
        title={editingDept ? 'Edit Department' : 'Create Department'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="form-label">Code</label>
              <input
                className="form-input"
                type="text"
                {...register('code', { required: true })}
                placeholder="e.g. ENG"
              />
            </div>
            <div>
              <label className="form-label">Name</label>
              <input
                className="form-input"
                type="text"
                {...register('name', { required: true })}
                placeholder="e.g. Engineering"
              />
            </div>
            <div>
              <label className="form-label">Head of Department (User ID)</label>
              <input
                className="form-input"
                type="text"
                {...register('head_id')}
                placeholder="Manager/HOd User ID"
              />
            </div>
            <div>
              <label className="form-label">Parent Department (Department ID)</label>
              <input
                className="form-input"
                type="text"
                {...register('parent_id')}
                placeholder="Parent department ID"
              />
            </div>
            <div>
              <label className="form-label">Employee Count</label>
              <input
                className="form-input"
                type="number"
                {...register('employee_count')}
                placeholder="Count"
              />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" {...register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingDept ? 'Save Changes' : 'Create'}
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
          Are you sure you want to delete department <strong>{deletingDept?.name}</strong>? This action cannot be undone.
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

export default Departments;