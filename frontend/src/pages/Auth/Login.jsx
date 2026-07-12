import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Leaf, LogIn, AlertCircle, Award, BookOpen, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { login as loginService } from '../../services/authService';
import useAppStore from '../../store/useAppStore';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAppStore();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await loginService(data.email, data.password);
      login(res.user || res, res.access_token || res.token);
      toast.success(`Welcome back, ${res.user?.name || 'User'}!`);
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      let msg = 'Invalid credentials';
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
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "var(--font-sans)",
    }}>
      {/* 🏛️ Top Government Header Banner */}
      <div style={{
        background: 'var(--blue)',
        color: 'var(--text-inverse)',
        padding: '8px 24px',
        fontSize: '0.75rem',
        fontWeight: 600,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '4px solid var(--amber)',
        letterSpacing: '0.05em',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Award size={14} color="var(--amber)" />
          <span>APIMINDS COMPANY & CORPORATE PARTNERS • ECOSPHERE NATIONAL ESG CERTIFICATION PROGRAM (ECOSPHERE-ESG)</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>Ministry of Environment, Forest and Climate Change</span>
          <span>|</span>
          <span>Ministry of Education</span>
          <span>|</span>
          <span>Private Corporate Registry</span>
        </div>
      </div>

      {/* Main Portal Body */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 24px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 960,
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border)',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          overflow: 'hidden',
        }}>
          {/* Left Panel: Information and Instructions */}
          <div style={{
            background: 'var(--bg-card-hover)',
            padding: 40,
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{
                  background: 'var(--blue)',
                  padding: 8,
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <BookOpen size={24} color="var(--text-inverse)" />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--blue)', lineHeight: 1 }}>
                    EcoSphere-ESG
                  </h1>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--amber)', letterSpacing: '0.05em' }}>
                    ONLINE ESG COMPLIANCE REGISTRY
                  </span>
                </div>
              </div>

              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
                Instructions for Portal Users
              </h2>
              <ul style={{ paddingLeft: 16, fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 12, lineHeight: 1.5 }}>
                <li>Use your registered institutional or corporate email address to sign in.</li>
                <li>Ensure compliance data is logged on or before the monthly deadline to avoid audit alerts.</li>
                <li>Access environmental course certificates, badge criteria, and scoring metrics via your active dashboard.</li>
                <li>In case of issues with digital policy acknowledgements, contact your department head.</li>
              </ul>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-primary)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--blue)' }}>
                <ShieldCheck size={20} color="var(--blue)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--blue)' }}>
                  Secure SSL Authenticated Session (256-Bit Encryption)
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel: Login Form */}
          <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>Sign In</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to access your National ESG course ledger</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem' }}>Username / Email ID</label>
                <input
                  className={`form-input ${errors.email ? 'border-danger' : ''}`}
                  type="email"
                  placeholder="you@company.com"
                  {...register('email', {
                    required: 'Email ID is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email format' },
                  })}
                  style={{
                    borderRadius: 'var(--radius-sm)',
                    borderColor: errors.email ? 'var(--danger)' : 'var(--border)',
                    fontSize: '0.85rem',
                  }}
                />
                {errors.email && (
                  <div className="form-error" style={{ fontSize: '0.75rem' }}>
                    <AlertCircle size={12} />
                    {errors.email.message}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter password"
                    {...register('password', { required: 'Password is required' })}
                    style={{
                      borderRadius: 'var(--radius-sm)',
                      borderColor: errors.password ? 'var(--danger)' : 'var(--border)',
                      paddingRight: 44,
                      fontSize: '0.85rem',
                    }}
                  />
                  <button
                    type="button"
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                    }}
                    onClick={() => setShowPw((p) => !p)}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && (
                  <div className="form-error" style={{ fontSize: '0.75rem' }}>
                    <AlertCircle size={12} />
                    {errors.password.message}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  marginTop: 12,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--blue)',
                  color: 'var(--text-inverse)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                disabled={loading}
              >
                {loading ? 'Authenticating...' : <><LogIn size={15} /> Sign In</>}
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Institutional account registration:{' '}
              <Link to="/register" style={{ color: 'var(--blue)', fontWeight: 700 }}>
                Sign Up Here
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 🏛️ General Government Portal Footer */}
      <div style={{
        background: 'var(--bg-card-hover)',
        color: 'var(--text-secondary)',
        padding: '32px 24px',
        textAlign: 'center',
        borderTop: '1px solid var(--border)',
        fontSize: '0.75rem',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          marginBottom: 16,
          fontWeight: 600,
        }}>
          <a href="#terms" style={{ color: 'var(--blue)', textDecoration: 'none' }}>Terms of Service</a>
          <span>|</span>
          <a href="#privacy" style={{ color: 'var(--blue)', textDecoration: 'none' }}>Privacy Policy</a>
          <span>|</span>
          <a href="#help" style={{ color: 'var(--blue)', textDecoration: 'none' }}>Help Desk / Support</a>
        </div>
        
        <div style={{ fontWeight: 500, color: 'var(--text-muted)' }}>
          © 2026 EcoSphere National ESG Certification Program. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Login;
