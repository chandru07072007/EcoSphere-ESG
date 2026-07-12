import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';

const ROWS_PER_PAGE = 10;

// ============================================================
// CSV EXPORT HELPER
// ============================================================
const exportToCSV = (columns, data, filename = 'export') => {
  const headers = columns.filter((c) => !c.noExport).map((c) => c.header);
  const rows = data.map((row) =>
    columns
      .filter((c) => !c.noExport)
      .map((c) => {
        const val = c.exportValue ? c.exportValue(row) : row[c.key];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val ?? '';
      })
  );
  const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// ============================================================
// SKELETON ROWS
// ============================================================
const SkeletonRows = ({ columns, count = 5 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <tr key={i}>
        {columns.map((col) => (
          <td key={col.key} style={{ padding: '14px 16px' }}>
            <div className="skeleton skeleton-text" style={{ width: `${60 + Math.random() * 30}%` }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// ============================================================
// DATA TABLE COMPONENT
// ============================================================
const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  searchable = true,
  exportable = true,
  exportFilename = 'data',
  rowActions,
  emptyMessage = 'No data found',
  emptySubMessage = 'Try adjusting your filters or add new data.',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, searchQuery, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const paginated = sorted.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const handleSort = (key) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const startRow = (currentPage - 1) * ROWS_PER_PAGE + 1;
  const endRow = Math.min(currentPage * ROWS_PER_PAGE, sorted.length);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Toolbar */}
      {(searchable || exportable) && (
        <div className="table-toolbar" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
          <div className="table-toolbar-left">
            {searchable && (
              <div className="search-input-wrapper">
                <Search className="search-input-icon" size={14} />
                <input
                  className="form-input"
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={handleSearch}
                  style={{ paddingLeft: 34, minWidth: 240, padding: '8px 12px 8px 34px' }}
                />
              </div>
            )}
          </div>
          <div className="table-toolbar-right">
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {sorted.length} {sorted.length === 1 ? 'result' : 'results'}
            </span>
            {exportable && (
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => exportToCSV(columns, sorted, exportFilename)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={13} />
                Export CSV
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={{
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    width: col.width,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {col.header}
                    {col.sortable && (
                      <span style={{ color: sortKey === col.key ? 'var(--emerald)' : 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <ChevronUp size={10} style={{ opacity: sortKey === col.key && sortDir === 'asc' ? 1 : 0.3 }} />
                        <ChevronDown size={10} style={{ opacity: sortKey === col.key && sortDir === 'desc' ? 1 : 0.3 }} />
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {rowActions && <th style={{ width: 80 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows columns={columns} count={5} />
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (rowActions ? 1 : 0)} style={{ padding: '60px 20px' }}>
                  <div className="empty-state">
                    <div className="empty-state-title">{emptyMessage}</div>
                    <div className="empty-state-sub">{emptySubMessage}</div>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr key={row.id ?? idx}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                  {rowActions && (
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {rowActions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && sorted.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {startRow}–{endRow} of {sorted.length}
          </div>
          <div className="pagination-buttons">
            <button
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft size={13} />
            </button>

            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page;
              if (totalPages <= 7) {
                page = i + 1;
              } else if (currentPage <= 4) {
                page = i + 1;
                if (i === 6) page = totalPages;
              } else if (currentPage >= totalPages - 3) {
                page = totalPages - 6 + i;
              } else {
                page = [1, currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2, totalPages][i];
              }
              return (
                <button
                  key={page}
                  className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              );
            })}

            <button
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
