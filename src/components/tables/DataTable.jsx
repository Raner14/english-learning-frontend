import './DataTable.css';

/**
 * Reusable table component.
 *
 * columns: array of { key, label, render? }
 *   - key: the field name on each row object
 *   - label: column heading text
 *   - render(value, row): optional — return JSX or a string for custom cell content
 *
 * data: array of row objects
 * emptyMessage: text shown when data is empty
 */
function DataTable({ columns = [], data = [], emptyMessage = 'No data available.' }) {
  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead className="data-table__head">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="data-table__head-cell">
                {col.label ?? col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="data-table__empty-cell">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={row.id ?? rowIndex} className="data-table__row">
                {columns.map((col) => (
                  <td key={col.key} className="data-table__cell">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
