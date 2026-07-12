import React from 'react';

// ============================================================
// STATUS → COLOR MAP
// ============================================================
const statusMap = {
  // Emerald / success
  approved:   { variant: 'emerald', label: 'Approved' },
  active:     { variant: 'emerald', label: 'Active' },
  resolved:   { variant: 'emerald', label: 'Resolved' },
  completed:  { variant: 'emerald', label: 'Completed' },
  published:  { variant: 'emerald', label: 'Published' },
  'on-track': { variant: 'emerald', label: 'On Track' },
  achieved:   { variant: 'emerald', label: 'Achieved' },

  // Amber / warning
  pending:     { variant: 'amber', label: 'Pending' },
  'at-risk':   { variant: 'amber', label: 'At Risk' },
  review:      { variant: 'amber', label: 'Under Review' },
  'under review': { variant: 'amber', label: 'Under Review' },
  high:        { variant: 'amber', label: 'High' },
  medium:      { variant: 'blue',  label: 'Medium' },

  // Danger / error
  denied:    { variant: 'danger', label: 'Denied' },
  closed:    { variant: 'danger', label: 'Closed' },
  critical:  { variant: 'danger', label: 'Critical' },
  overdue:   { variant: 'danger', label: 'Overdue' },
  expired:   { variant: 'danger', label: 'Expired' },
  failed:    { variant: 'danger', label: 'Failed' },

  // Blue / info
  draft:  { variant: 'blue', label: 'Draft' },
  open:   { variant: 'blue', label: 'Open' },
  low:    { variant: 'gray', label: 'Low' },

  // Gray / neutral
  archived: { variant: 'gray', label: 'Archived' },
  inactive: { variant: 'gray', label: 'Inactive' },
  disabled: { variant: 'gray', label: 'Disabled' },
};

// ============================================================
// STATUS BADGE COMPONENT
// ============================================================
const StatusBadge = ({ status, label: customLabel, size = 'sm' }) => {
  const key = typeof status === 'string' ? status.toLowerCase() : '';
  const config = statusMap[key] || { variant: 'gray', label: status || '—' };
  const displayLabel = customLabel || config.label;

  const variantStyles = {
    emerald: {
      background: 'var(--emerald-glow)',
      color: 'var(--emerald)',
      borderColor: 'rgba(0,212,170,0.25)',
    },
    blue: {
      background: 'var(--blue-glow)',
      color: 'var(--blue)',
      borderColor: 'rgba(79,142,247,0.25)',
    },
    amber: {
      background: 'var(--amber-glow)',
      color: 'var(--amber)',
      borderColor: 'rgba(247,168,79,0.25)',
    },
    danger: {
      background: 'var(--danger-glow)',
      color: 'var(--danger)',
      borderColor: 'rgba(224,92,92,0.25)',
    },
    gray: {
      background: 'rgba(74,85,104,0.15)',
      color: 'var(--text-secondary)',
      borderColor: 'rgba(74,85,104,0.2)',
    },
  };

  const styles = variantStyles[config.variant] || variantStyles.gray;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: size === 'sm' ? '3px 9px' : '5px 12px',
        borderRadius: '9999px',
        fontSize: size === 'sm' ? '0.72rem' : '0.8125rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        border: '1px solid',
        letterSpacing: '0.01em',
        ...styles,
      }}
    >
      <span
        style={{
          width: size === 'sm' ? 5 : 7,
          height: size === 'sm' ? 5 : 7,
          borderRadius: '50%',
          background: styles.color,
          flexShrink: 0,
        }}
      />
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
