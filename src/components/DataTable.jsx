import { useMemo, useState } from 'react';

const DataTable = ({
  data = [],
  searchKeys = [],
  searchPlaceholder = 'Buscar...',
  pageSize = 10,
  columns = [],
  renderRow,
  emptyMessage = 'No se encontraron resultados.'
}) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const val = key.split('.').reduce((obj, k) => (obj != null ? obj[k] : undefined), item);
        return String(val ?? '').toLowerCase().includes(q);
      })
    );
  }, [data, search, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const startItem = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, filtered.length);
  const hasSearch = searchKeys.length > 0;

  const buildPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - safePage) <= 1) {
        pages.push(i);
      }
    }
    const nodes = [];
    let last = 0;
    for (const p of pages) {
      if (last > 0 && p > last + 1) {
        nodes.push(<span key={`e-${p}`} className="dt-page-ellipsis">...</span>);
      }
      nodes.push(
        <button
          key={p}
          className={`dt-page-num ${p === safePage ? 'active' : ''}`}
          onClick={() => setPage(p)}
        >
          {p}
        </button>
      );
      last = p;
    }
    return nodes;
  };

  return (
    <div className="dt-wrap">
      {(hasSearch || filtered.length > 0) && (
        <div className="dt-toolbar">
          {hasSearch && (
            <input
              type="search"
              className="dt-search"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          )}
          <span className="dt-count">
            {filtered.length > 0
              ? `${startItem}–${endItem} de ${filtered.length}`
              : '0 resultados'}
          </span>
        </div>
      )}

      <div className="table-responsive">
        <table className="data-table">
          {columns.length > 0 && (
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={i}>{col}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length || 1} className="dt-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((item, i) => renderRow(item, i))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="dt-pagination">
          <button
            className="dt-page-btn"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
          >
            Anterior
          </button>
          <div className="dt-page-numbers">{buildPageNumbers()}</div>
          <button
            className="dt-page-btn"
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default DataTable;
