import { useState, useEffect } from 'react';
import { getAllUsers, registerUser, updateUser, deleteUser } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import PageLoader from '../../components/common/PageLoader';
import PlaceholderView from '../../components/common/PlaceholderView';
import { useToast } from '../../context/ToastContext';
import './UsersPage.css';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const BLANK_CREATE = { firstName: '', lastName: '', email: '', password: '', userRole: 'student', sex: 'male' };

const ROLE_COLORS = {
  student: 'users-page__role--student',
  teacher: 'users-page__role--teacher',
  admin: 'users-page__role--admin',
};

function UsersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(BLANK_CREATE);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Search / filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '' });
  const [savingId, setSavingId] = useState(null);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .catch((err) => setError(err?.response?.data?.error?.message || 'Failed to load users.'))
      .finally(() => setLoading(false));
  }, []);

  if (user?.role !== 'admin') return <PlaceholderView title="Manage Users" />;
  if (loading) return <PageLoader text="Loading users..." />;

  const q = searchQuery.trim().toLowerCase();
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch =
      !q ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  function handleCreateChange(e) {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
    setCreateError('');
  }

  function handleCreateCancel() {
    setShowCreate(false);
    setCreateForm(BLANK_CREATE);
    setCreateError('');
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    if (!createForm.firstName.trim() || !createForm.lastName.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setCreateError('All fields are required.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const result = await registerUser({
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        userRole: createForm.userRole,
        sex: createForm.sex,
      });
      setUsers((prev) => [
        {
          userID: result.userId,
          firstName: result.firstName,
          lastName: result.lastName,
          email: createForm.email.trim(),
          role: result.userRole,
          createDate: new Date().toISOString(),
        },
        ...prev,
      ]);
      setCreateForm(BLANK_CREATE);
      setShowCreate(false);
      toast('User created.');
    } catch (err) {
      setCreateError(err?.response?.data?.error?.message || 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  }

  function handleEditStart(u) {
    setEditingId(u.userID);
    setEditForm({ firstName: u.firstName, lastName: u.lastName });
    setSaveError('');
    setConfirmId(null);
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEditCancel() {
    setEditingId(null);
    setSaveError('');
  }

  async function handleEditSave(userId) {
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      setSaveError('First and last name are required.');
      return;
    }
    setSavingId(userId);
    setSaveError('');
    try {
      await updateUser(userId, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.userID === userId
            ? { ...u, firstName: editForm.firstName.trim(), lastName: editForm.lastName.trim() }
            : u
        )
      );
      setEditingId(null);
    } catch (err) {
      setSaveError(err?.response?.data?.error?.message || 'Failed to save changes.');
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(userId) {
    setDeletingId(userId);
    setConfirmId(null);
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.userID !== userId));
      toast('User deleted.');
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="users-page">
      <div className="users-page__header">
        <div className="users-page__header-left">
          <h1 className="users-page__title">Manage Users</h1>
          <span className="users-page__count">{users.length} users total</span>
        </div>

        {!showCreate && (
          <button
            type="button"
            className="users-page__add-btn"
            onClick={() => { setShowCreate(true); setEditingId(null); setSaveError(''); }}
            disabled={editingId !== null}
          >
            + Add User
          </button>
        )}
      </div>

      {/* Search + role filter bar */}
      {!showCreate && (
        <div className="users-filter-bar">
          <input
            type="search"
            className="users-filter-bar__search"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="users-filter-bar__roles" role="group" aria-label="Filter by role">
            {['all', 'student', 'teacher', 'admin'].map((r) => (
              <button
                key={r}
                type="button"
                className={`users-filter-bar__role-btn${roleFilter === r ? ' users-filter-bar__role-btn--active' : ''}`}
                onClick={() => setRoleFilter(r)}
              >
                {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
          {(searchQuery || roleFilter !== 'all') && (
            <span className="users-filter-bar__result-count">
              {filteredUsers.length} of {users.length}
            </span>
          )}
        </div>
      )}

      {showCreate && (
        <div className="users-create-form">
          <h2 className="users-create-form__title">New User</h2>
          <form onSubmit={handleCreateSubmit} noValidate>
            <div className="users-create-form__grid">
              <div className="users-create-form__field">
                <label className="users-create-form__label">First Name</label>
                <input
                  name="firstName"
                  className="users-create-form__input"
                  value={createForm.firstName}
                  onChange={handleCreateChange}
                  placeholder="First name"
                />
              </div>
              <div className="users-create-form__field">
                <label className="users-create-form__label">Last Name</label>
                <input
                  name="lastName"
                  className="users-create-form__input"
                  value={createForm.lastName}
                  onChange={handleCreateChange}
                  placeholder="Last name"
                />
              </div>
              <div className="users-create-form__field">
                <label className="users-create-form__label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="users-create-form__input"
                  value={createForm.email}
                  onChange={handleCreateChange}
                  placeholder="email@example.com"
                />
              </div>
              <div className="users-create-form__field">
                <label className="users-create-form__label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="users-create-form__input"
                  value={createForm.password}
                  onChange={handleCreateChange}
                  placeholder="Password"
                />
              </div>
              <div className="users-create-form__field">
                <label className="users-create-form__label">Role</label>
                <select
                  name="userRole"
                  className="users-create-form__select"
                  value={createForm.userRole}
                  onChange={handleCreateChange}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="users-create-form__field">
                <label className="users-create-form__label">Sex</label>
                <select
                  name="sex"
                  className="users-create-form__select"
                  value={createForm.sex}
                  onChange={handleCreateChange}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
            {createError && <p className="users-create-form__error">{createError}</p>}
            <div className="users-create-form__actions">
              <button
                type="submit"
                className="users-create-form__btn"
                disabled={creating}
              >
                {creating ? 'Creating…' : 'Create User'}
              </button>
              <button
                type="button"
                className="users-create-form__btn users-create-form__btn--ghost"
                onClick={handleCreateCancel}
                disabled={creating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <p className="users-page__error">{error}</p>}
      {saveError && <p className="users-page__save-error">{saveError}</p>}

      <div className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="users-table__empty">
                  No users match your search.
                </td>
              </tr>
            )}
            {filteredUsers.map((u) => {
              const isEditing = editingId === u.userID;
              return (
                <tr
                  key={u.userID}
                  className={[
                    deletingId === u.userID ? 'users-table__row--deleting' : '',
                    isEditing ? 'users-table__row--editing' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <td className="users-table__id">{u.userID}</td>

                  <td className="users-table__name">
                    {isEditing ? (
                      <span className="users-table__edit-name">
                        <input
                          name="firstName"
                          className="users-table__edit-input"
                          value={editForm.firstName}
                          onChange={handleEditChange}
                          placeholder="First"
                        />
                        <input
                          name="lastName"
                          className="users-table__edit-input"
                          value={editForm.lastName}
                          onChange={handleEditChange}
                          placeholder="Last"
                        />
                      </span>
                    ) : (
                      `${u.firstName} ${u.lastName}`
                    )}
                  </td>

                  <td className="users-table__email">{u.email}</td>

                  <td>
                    <span className={`users-page__role ${ROLE_COLORS[u.role] || ''}`}>
                      {u.role}
                    </span>
                  </td>

                  <td>{formatDate(u.createDate)}</td>

                  <td className="users-table__actions">
                    {isEditing ? (
                      <span className="users-table__btn-group">
                        <button
                          type="button"
                          className="users-table__btn users-table__btn--save"
                          onClick={() => handleEditSave(u.userID)}
                          disabled={savingId === u.userID}
                        >
                          {savingId === u.userID ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="users-table__btn users-table__btn--cancel"
                          onClick={handleEditCancel}
                          disabled={savingId === u.userID}
                        >
                          Cancel
                        </button>
                      </span>
                    ) : confirmId === u.userID ? (
                      <span className="users-table__confirm">
                        <span className="users-table__confirm-label">Delete?</span>
                        <button
                          type="button"
                          className="users-table__btn users-table__btn--danger"
                          onClick={() => handleDelete(u.userID)}
                          disabled={deletingId === u.userID}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          className="users-table__btn users-table__btn--cancel"
                          onClick={() => setConfirmId(null)}
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <span className="users-table__btn-group">
                        <button
                          type="button"
                          className="users-table__btn users-table__btn--edit"
                          onClick={() => handleEditStart(u)}
                          disabled={deletingId !== null || editingId !== null || showCreate}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="users-table__btn users-table__btn--delete"
                          onClick={() => setConfirmId(u.userID)}
                          disabled={deletingId !== null || editingId !== null || showCreate || u.role === 'admin'}
                        >
                          Delete
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsersPage;
