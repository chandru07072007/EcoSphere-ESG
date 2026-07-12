import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { ChevronRight, ChevronLeft, Download, FileBarChart, Check } from 'lucide-react';
import { buildCustomReport, exportReport } from '../../services/analyticsService';

const CustomReportBuilder = () => {
  const [step, setStep] = useState(1);
  const [reportPreview, setReportPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      module: 'E',
      department_id: '',
      start_date: '',
      end_date: '',
    },
  });

  const currentModule = watch('module');

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await buildCustomReport(data);
      setReportPreview(response.data || response);
      setStep(3);
    } catch (err) {
      toast.error('Failed to generate report preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format) => {
    try {
      toast.loading('Compiling file...');
      const module = watch('module');
      const start = watch('start_date');
      const end = watch('end_date');
      const dept = watch('department_id');
      
      const reportType = module.toLowerCase() === 'e' ? 'environmental' : module.toLowerCase() === 's' ? 'social' : 'governance';
      
      await exportReport(reportType, format, {
        department_id: dept || undefined,
        start_date: start || undefined,
        end_date: end || undefined,
      });
      
      toast.dismiss();
      toast.success('Report downloaded successfully!');
    } catch (err) {
      toast.dismiss();
      toast.error('Download failed');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 30 }}>
        <h1 className="page-title">Custom Report Builder</h1>
        <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>Granularly filter and export compliance sheets tailored to your auditors</p>
      </div>

      {/* Step Indicators */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: 'var(--border)', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '50%', left: 0, width: `${(step - 1) * 50}%`, height: 2, background: 'var(--emerald)', zIndex: 0, transition: 'width 0.3s ease' }} />
        
        {[1, 2, 3].map((num) => (
          <div
            key={num}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: step >= num ? 'var(--emerald)' : 'var(--bg-card)',
              border: '2px solid var(--border)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1,
              fontWeight: 'bold',
              color: step >= num ? '#000' : 'var(--text-secondary)',
            }}
          >
            {step > num ? <Check size={14} /> : num}
          </div>
        ))}
      </div>

      <div className="card card-glass" style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* STEP 1: MODULES */}
          {step === 1 && (
            <div>
              <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Step 1: Select ESG Focus Area</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: 16 }}>
                  <input type="radio" value="E" {...register('module')} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Environmental (E)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CO2 equivalent emission tracking, fleet logistics, grid metrics</div>
                  </div>
                </label>
                <label className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: 16 }}>
                  <input type="radio" value="S" {...register('module')} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Social (S)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CSR participations, employee XP history, gamified leaderboard points</div>
                  </div>
                </label>
                <label className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: 16 }}>
                  <input type="radio" value="G" {...register('module')} />
                  <div>
                    <div style={{ fontWeight: 600 }}>Governance (G)</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Policy digital signatures, audits log, compliance overdue tickets</div>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn btn-primary" onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: FILTERS */}
          {step === 2 && (
            <div>
              <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Step 2: Apply Filters</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="form-label">Department Scope (ID)</label>
                  <input className="form-input" type="text" {...register('department_id')} placeholder="e.g. 609e2e... (Optional)" />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Start Date</label>
                    <input className="form-input" type="date" {...register('start_date')} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">End Date</label>
                    <input className="form-input" type="date" {...register('end_date')} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={handlePrev} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ChevronLeft size={14} /> Back
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Compiling Preview...' : 'Generate Preview'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & EXPORT */}
          {step === 3 && (
            <div>
              <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Step 3: Preview & Download</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 20 }}>
                A custom {currentModule} report has been compiled. You can preview details and select your output format below.
              </p>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 8, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 24, maxHeight: 200, overflowY: 'auto' }}>
                <pre>{JSON.stringify(reportPreview, null, 2)}</pre>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-primary" onClick={() => handleDownload('pdf')} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Download size={14} /> PDF
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => handleDownload('excel')} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Download size={14} /> Excel
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => handleDownload('csv')} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Download size={14} /> CSV
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={handlePrev} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ChevronLeft size={14} /> Back
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CustomReportBuilder;