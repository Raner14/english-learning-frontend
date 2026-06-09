import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllGrammarRules, deleteGrammarRule } from '../../services/grammarService';
import PageLoader from '../../components/common/PageLoader';
import PlaceholderView from '../../components/common/PlaceholderView';
import './GrammarPage.css';

function GrammarPage() {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Must be before any conditional return — React Rules of Hooks
  useEffect(() => {
    if (user?.role !== 'admin') return;
    getAllGrammarRules()
      .then(setRules)
      .catch((err) => setError(err?.response?.data?.error?.message || 'Failed to load grammar rules.'))
      .finally(() => setLoading(false));
  }, [user?.role]);

  // Admin-only
  if (user?.role !== 'admin') {
    return <PlaceholderView title="Grammar Rules" />;
  }

  async function handleDelete(ruleId) {
    setDeletingId(ruleId);
    setConfirmId(null);
    try {
      await deleteGrammarRule(ruleId);
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to delete grammar rule.');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <PageLoader text="Loading grammar rules…" />;

  return (
    <div className="grammar-page">
      <h1 className="grammar-page__title">Grammar Rules</h1>

      {error && <p className="grammar-page__error">{error}</p>}

      <div className="grammar-page__table-wrap">
        <table className="grammar-table">
          <thead>
            <tr>
              <th>Rule ID</th>
              <th>Category</th>
              <th>Usage</th>
              <th>Formula</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td colSpan={5} className="grammar-table__empty">No grammar rules found.</td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <span className="grammar-table__id">{rule.id.replace(/_/g, ' ')}</span>
                  </td>
                  <td>
                    <span className="grammar-table__category">{rule.category}</span>
                  </td>
                  <td className="grammar-table__usage">{rule.usage}</td>
                  <td className="grammar-table__formula">
                    {rule.forms?.general_formula || '—'}
                  </td>
                  <td className="grammar-table__actions">
                    {confirmId === rule.id ? (
                      <>
                        <button
                          type="button"
                          className="grammar-table__btn grammar-table__btn--confirm"
                          onClick={() => handleDelete(rule.id)}
                          disabled={deletingId === rule.id}
                        >
                          {deletingId === rule.id ? 'Deleting…' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          className="grammar-table__btn grammar-table__btn--cancel"
                          onClick={() => setConfirmId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="grammar-table__btn grammar-table__btn--delete"
                        onClick={() => setConfirmId(rule.id)}
                        disabled={!!deletingId}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GrammarPage;
