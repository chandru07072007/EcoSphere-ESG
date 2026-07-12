import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Leaf, UserPlus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { register as registerService } from '../../services/authService';
import { getDepartments } from '../../services/masterDataService';
import { sendWelcomeEmail } from '../../services/emailService';

const Register = () => {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerService({
        name: data.name,
        email: data.email,
        password: data.password,
        department_id: data.department_id || null,
        role: data.role || 'employee',
      });
      // Optionally send welcome email
      try { await sendWelcomeEmail(data.email, data.name); } catch {}
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      const detail = err.response?.data?.detail;
      let msg = 'Registration failed';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Gradient orbs */}
      <div style={{
        position: 'absolute', top: '-5%', right: '10%',
        width: 450, height: 450,
        background: 'radial-gradient(circle, rgba(79,142,247,0.1) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '5%', left: '10%',
        width: 350, height: 350,
        background: 'radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}
      >
        <div className="card-glass" style={{ padding: 40 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52,
              background: 'linear-gradient(135deg, var(--blue), var(--blue-dark))',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 8px 24px var(--blue-glow)',
            }}>
              <Leaf size={24} color="white" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Create Account</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              Join EcoSphere ESG Platform
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                placeholder="John Doe"
                {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name too short' } })}
                style={errors.name ? { borderColor: 'var(--danger)' } : {}}
              />
              {errors.name && <div className="form-error"><AlertCircle size={12} />{errors.name.message}</div>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@company.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
                })}
                style={errors.email ? { borderColor: 'var(--danger)' } : {}}
              />
              {errors.email && <div className="form-error"><AlertCircle size={12} />{errors.email.message}</div>}
            </div>

            {/* Department */}
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-select" {...register('department_id')}>
                <option value="">Select Department (optional)</option>
                {departments.map((d) => (
                  <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Role */}
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" {...register('role')}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 8 characters"
                  style={{ paddingRight: 44, ...(errors.password ? { borderColor: 'var(--danger)' } : {}) }}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Min 8 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <div className="form-error"><AlertCircle size={12} />{errors.password.message}</div>}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Repeat password"
                style={errors.confirmPassword ? { borderColor: 'var(--danger)' } : {}}
                {...register('confirmPassword', {
                  required: 'Please confirm password',
                  validate: (val) => val === password || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && <div className="form-error"><AlertCircle size={12} />{errors.confirmPassword.message}</div>}
            </div>

            <motion.button
              type="submit"
              className="btn btn-blue w-full"
              style={{ width: '100%', marginTop: 8 }}
              disabled={loading}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <><div className="spinner spinner-sm" /> Creating account...</>
              ) : (
                <><UserPlus size={16} /> Create Account</>
              )}
            </motion.button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--emerald)', fontWeight: 600 }}>Sign In</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
