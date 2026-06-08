import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSettings, updateSettings } from '../../services/settingsService';
import { deleteUser } from '../../services/userService';
import { logout as logoutRequest } from '../../services/authService';
import PageLoader from '../../components/common/PageLoader';
import Card from '../../components/Card';
import Button from '../../components/common/Button';
import './SettingsPage.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
}

function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [form, setForm] = useState({ displayName: '', email: '', theme: 'light' });
  const [errors, setErrors] = useState({});

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    getSettings()
      .then((data) => {
        const theme = data.theme === 'dark' ? 'dark' : 'light';
        setForm({ displayName: data.displayName || '', email: data.email || '', theme });
        applyTheme(theme);
      })
      .catch((err) => {
        setPageError(err?.response?.data?.error?.message || 'Failed to load settings.');
      })
      .finally(() => setPageLoading(false));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setSaveSuccess(false);
    setSaveError('');
  }

  function validate() {
    const next = {};
    if (!form.displayName.trim()) {
      next.displayName = 'Display name is required.';
    } else if (form.displayName.trim().length < 2) {
      next.displayName = 'Display name must be at least 2 characters.';
    }
    if (!form.email.trim()) {
      next.email = 'Email is required.';
    } else if (!EMAIL_RE.test(form.email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      await updateSettings({
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        theme: form.theme,
      });
      applyTheme(form.theme);
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err?.response?.data?.error?.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteUser(user.id);
      try { await logoutRequest(); } catch { /* ignore */ }
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setDeleteError(err?.response?.data?.error?.message || 'Failed to delete account. Please try again.');
      setDeleting(false);
    }
  }

  if (pageLoading) return <PageLoader text="Loading settings..." />;

  if (pageError) {
    return (
      <div className="settings-page">
        <p className="settings-page__load-error">{pageError}</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <h1 className="settings-page__title">Settings</h1>

      <Card className="settings-card">
        <h2 className="settings-card__heading">Personal Information</h2>

        <form onSubmit={handleSave} noValidate>
          <div className="settings-field">
            <label htmlFor="displayName" className="settings-label">Display Name</label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              value={form.displayName}
              onChange={handleChange}
              className={`settings-input${errors.displayName ? ' settings-input--error' : ''}`}
              autoComplete="name"
            />
            {errors.displayName && (
              <p className="settings-field__error">{errors.displayName}</p>
            )}
          </div>

          <div className="settings-field">
            <label htmlFor="email" className="settings-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={`settings-input${errors.email ? ' settings-input--error' : ''}`}
              autoComplete="email"
            />
            {errors.email && (
              <p className="settings-field__error">{errors.email}</p>
            )}
          </div>

          <div className="settings-field">
            <p className="settings-label">Theme</p>
            <div className="settings-theme-options">
              <label className={`settings-theme-option${form.theme === 'light' ? ' settings-theme-option--active' : ''}`}>
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={form.theme === 'light'}
                  onChange={handleChange}
                  className="settings-theme-option__radio"
                />
                <span>&#9728; Light</span>
              </label>
              <label className={`settings-theme-option${form.theme === 'dark' ? ' settings-theme-option--active' : ''}`}>
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={form.theme === 'dark'}
                  onChange={handleChange}
                  className="settings-theme-option__radio"
                />
                <span>&#9790; Dark</span>
              </label>
            </div>
          </div>

          {saveSuccess && (
            <p className="settings-card__success" role="status">Settings saved successfully!</p>
          )}
          {saveError && (
            <p className="settings-card__error" role="alert">{saveError}</p>
          )}

          <Button type="submit" isLoading={saving} disabled={saving}>
            Save Changes
          </Button>
        </form>
      </Card>

      <Card className="settings-card settings-card--danger">
        <h2 className="settings-card__heading settings-card__heading--danger">Danger Zone</h2>
        <p className="settings-card__description">
          Permanently deletes your account and all associated data. This cannot be undone.
        </p>

        {deleteError && (
          <p className="settings-card__error" role="alert">{deleteError}</p>
        )}

        {!showDeleteConfirm ? (
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            Delete Account
          </Button>
        ) : (
          <div className="settings-delete-confirm">
            <p className="settings-delete-confirm__prompt">
              Are you sure? This action is permanent and cannot be undone.
            </p>
            <div className="settings-delete-confirm__actions">
              <Button
                variant="danger"
                isLoading={deleting}
                disabled={deleting}
                onClick={handleDeleteAccount}
              >
                Yes, delete my account
              </Button>
              <Button
                variant="primary"
                disabled={deleting}
                onClick={() => { setShowDeleteConfirm(false); setDeleteError(''); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default SettingsPage;
