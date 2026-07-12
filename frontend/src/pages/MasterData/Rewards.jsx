import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';

import {
  getRewardsMasterData,
  createRewardMasterData,
  updateRewardMasterData,
  deleteRewardMasterData,
} from '../../services/masterDataService';
import DataTable from '../../components/UI/DataTable';
import Modal from '../../components/UI/Modal';

const Rewards = () => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [deletingReward, setDeletingReward] = useState(null);

  const { register, handleSubmit, reset } = useForm();

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const data = await getRewardsMasterData();
      setRewards(data);
    } catch (err) {
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const openCreateModal = () => {
    setEditingReward(null);
    reset({
      name: '',
      description: '',
      points_cost: 100,
      stock: 10,
      image_url: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (reward) => {
    setEditingReward(reward);
    reset({
      name: reward.name,
      description: reward.description,
      points_cost: reward.points_cost,
      stock: reward.stock,
      image_url: reward.image_url || '',
    });
    setModalOpen(true);
  };

  const openDeleteModal = (reward) => {
    setDeletingReward(reward);
    setDeleteOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingReward) {
        await updateRewardMasterData(editingReward._id || editingReward.id, data);
        toast.success('Reward updated successfully');
      } else {
        await createRewardMasterData(data);
        toast.success('Reward created successfully');
      }
      setModalOpen(false);
      fetchRewards();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'An error occurred');
    }
  };

  const handleDelete = async () => {
    if (!deletingReward) return;
    try {
      await deleteRewardMasterData(deletingReward._id || deletingReward.id);
      toast.success('Reward deleted successfully');
      setDeleteOpen(false);
      fetchRewards();
    } catch (err) {
      toast.error('Failed to delete reward');
    }
  };

  const columns = [
    {
      key: 'image_url',
      header: 'Preview',
      width: '80px',
      render: (img) => img ? <img src={img} alt="Reward" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} /> : '—',
    },
    { key: 'name', header: 'Reward Title', sortable: true },
    { key: 'description', header: 'Description' },
    { key: 'points_cost', header: 'Point Cost', sortable: true },
    { key: 'stock', header: 'Stock Available', sortable: true },
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Rewards Catalog</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>Manage sustainability redemption items and point values</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> Add Reward
        </button>
      </div>

      <DataTable
        columns={columns}
        data={rewards}
        loading={loading}
        exportFilename="rewards-catalog"
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
        title={editingReward ? 'Edit Reward Item' : 'Create Reward Item'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="form-label">Item Title</label>
              <input
                className="form-input"
                type="text"
                {...register('name', { required: true })}
                placeholder="e.g. Bamboo Flask"
              />
            </div>
            <div>
              <label className="form-label">Description</label>
              <input
                className="form-input"
                type="text"
                {...register('description', { required: true })}
                placeholder="Details of the reward"
              />
            </div>
            <div>
              <label className="form-label">Point Cost</label>
              <input
                className="form-input"
                type="number"
                {...register('points_cost', { required: true })}
                placeholder="Points needed"
              />
            </div>
            <div>
              <label className="form-label">Stock Count</label>
              <input
                className="form-input"
                type="number"
                {...register('stock', { required: true })}
                placeholder="Units available"
              />
            </div>
            <div>
              <label className="form-label">Image URL</label>
              <input
                className="form-input"
                type="text"
                {...register('image_url')}
                placeholder="URL to preview image"
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingReward ? 'Save Changes' : 'Create'}
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
          Are you sure you want to delete reward <strong>{deletingReward?.name}</strong>? This action cannot be undone.
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

export default Rewards;