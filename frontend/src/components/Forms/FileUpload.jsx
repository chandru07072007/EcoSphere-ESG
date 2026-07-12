import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';

// ============================================================
// FILE UPLOAD DROPZONE COMPONENT
// ============================================================
const FileUpload = ({
  onUpload,
  accept = '*/*',
  maxSizeMB = 10,
  label = 'Upload File',
  hint,
  multiple = false,
}) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const allowedTypes = accept === 'image/*'
    ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    : null;

  const validateFile = (file) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large. Max size is ${maxSizeMB}MB.`;
    }
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return `Invalid file type. Accepted: ${accept}`;
    }
    return null;
  };

  const processFile = async (file) => {
    const err = validateFile(file);
    if (err) { setError(err); return; }
    setError('');

    // Preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview({ type: 'image', src: e.target.result, name: file.name, size: file.size });
      reader.readAsDataURL(file);
    } else {
      setPreview({ type: 'file', name: file.name, size: file.size });
    }

    // Simulate upload progress
    setUploading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) { clearInterval(interval); return 90; }
        return p + 10;
      });
    }, 80);

    try {
      await onUpload(file);
      setProgress(100);
      setTimeout(() => { setUploading(false); setProgress(0); }, 600);
    } catch (e) {
      setError('Upload failed. Please try again.');
      setUploading(false);
      setProgress(0);
      clearInterval(interval);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files[0]) processFile(files[0]);
  };

  const handleChange = (e) => {
    const files = Array.from(e.target.files);
    if (files[0]) processFile(files[0]);
    e.target.value = '';
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div>
      <div
        className={`file-upload-zone ${dragOver ? 'drag-over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="file-upload-icon">
          <Upload size={28} color="var(--text-muted)" />
        </div>
        <div className="file-upload-title">{label}</div>
        <div className="file-upload-sub">
          {hint || `Drag & drop or click to browse · Max ${maxSizeMB}MB`}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          style={{ display: 'none' }}
          onChange={handleChange}
        />
      </div>

      {error && (
        <div className="form-error" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}

      {preview && (
        <div className="file-upload-preview">
          {preview.type === 'image' ? (
            <img
              src={preview.src}
              alt="preview"
              style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
            />
          ) : (
            <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card-hover)', borderRadius: 8 }}>
              <FileText size={20} color="var(--text-secondary)" />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{preview.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatSize(preview.size)}</div>
            {uploading && (
              <div className="file-upload-progress" style={{ marginTop: 6 }}>
                <div className="file-upload-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
          <button
            className="btn-ghost btn"
            onClick={(e) => { e.stopPropagation(); setPreview(null); setProgress(0); }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
