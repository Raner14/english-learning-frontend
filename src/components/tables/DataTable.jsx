function DataTable({ columns = [], data = [] }) {
  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        background: '#ffffff',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f8fafc' }}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  padding: '14px 16px',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  color: '#0f172a',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.id ?? rowIndex}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  style={{
                    padding: '14px 16px',
                    fontSize: '0.95rem',
                    color: '#334155',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;