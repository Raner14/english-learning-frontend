import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSettings, updateSettings } from '../../services/settingsService';
import { getMyTeacherProfile, updateTeacher } from '../../services/teacherService';
import { getPreferences, savePreferences } from '../../services/matchingService';
import { deleteUser } from '../../services/userService';
import { logout as logoutRequest } from '../../services/authService';
import PageLoader from '../../components/common/PageLoader';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/Card';
import Button from '../../components/common/Button';
import './SettingsPage.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SPECIALTIES_OPTIONS = [
  'Grammar', 'Tech English', 'Interview Prep',
  'Speaking', 'Vocabulary', 'Writing', 'Listening',
];
const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];
const AVAILABILITY_OPTIONS = [
  { value: '', label: '— not set —' },
  { value: 'mornings', label: 'Mornings' },
  { value: 'evenings', label: 'Evenings' },
  { value: 'flexible', label: 'Flexible' },
  { value: 'weekends', label: 'Weekends' },
];
const FEEDBACK_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
];

const BLANK_TEACHER_FORM = {
  bio: '',
  experience: '',
  pricePerWeek: '',
  available: false,
  onlineOnly: false,
  availability: '',
  feedbackFrequency: 'weekly',
  specialties: [],
  teachingLevels: [],
};

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
}

function profileToForm(t) {
  return {
    bio: t.bio || '',
    experience: t.experience || '',
    pricePerWeek: t.pricePerWeek !== null && t.pricePerWeek !== undefined ? String(t.pricePerWeek) : '',
    available: t.available ?? false,
    onlineOnly: t.onlineOnly ?? false,
    availability: t.availability || '',
    feedbackFrequency: t.feedbackFrequency || 'weekly',
    specialties: t.specialties || [],
    teachingLevels: t.teachingLevels || [],
  };
}

function toggleItem(arr, item) {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
}

function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  // Personal settings
  const [form, setForm] = useState({ displayName: '', email: '', theme: 'light' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Student learning preferences
  const [prefsForm, setPrefsForm] = useState({ learning_goal: '', mainGoal: 'general_english' });
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSaveError, setPrefsSaveError] = useState('');

  // Teacher profile
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [teacherForm, setTeacherForm] = useState(BLANK_TEACHER_FORM);
  const [teacherSaving, setTeacherSaving] = useState(false);
  const [teacherSaveError, setTeacherSaveError] = useState('');

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const promises = [getSettings()];
    if (isTeacher) promises.push(getMyTeacherProfile());
    if (isStudent) promises.push(getPreferences().catch(() => null));

    Promise.all(promises)
      .then(([settingsData, extraData]) => {
        const theme = settingsData.theme === 'dark' ? 'dark' : 'light';
        setForm({ displayName: settingsData.displayName || '', email: settingsData.email || '', theme });
        applyTheme(theme);
        if (isTeacher && extraData) {
          setTeacherProfile(extraData);
          setTeacherForm(profileToForm(extraData));
        }
        if (isStudent && extraData) {
          setPrefsForm({
            learning_goal: extraData.learning_goal || '',
            mainGoal: extraData.mainGoal || 'general_english',
          });
        }
      })
      .catch((err) => {
        setPageError(err?.response?.data?.error?.message || 'Failed to load settings.');
      })
      .finally(() => setPageLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
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
    setSaveError('');

    try {
      await updateSettings({
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        theme: form.theme,
      });
      applyTheme(form.theme);
      window.dispatchEvent(new Event('settings-updated'));
      toast('Settings saved.');
    } catch (err) {
      setSaveError(err?.response?.data?.error?.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleTeacherFieldChange(field, value) {
    setTeacherForm((prev) => ({ ...prev, [field]: value }));
    setTeacherSaveError('');
  }

  async function handleTeacherSave(e) {
    e.preventDefault();
    setTeacherSaving(true);
    setTeacherSaveError('');

    try {
      await updateTeacher(teacherProfile.teacherId, {
        bio: teacherForm.bio.trim() || null,
        experience: teacherForm.experience.trim(),
        pricePerWeek: Number(teacherForm.pricePerWeek),
        available: teacherForm.available,
        onlineOnly: teacherForm.onlineOnly,
        availability: teacherForm.availability || null,
        feedbackFrequency: teacherForm.feedbackFrequency,
        specialties: teacherForm.specialties,
        teachingLevels: teacherForm.teachingLevels,
      });
      toast('Teacher profile saved.');
    } catch (err) {
      setTeacherSaveError(err?.response?.data?.error?.message || 'Failed to save teacher profile.');
    } finally {
      setTeacherSaving(false);
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

      {/* ── Personal Information ───────────────────── */}
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

          {saveError && (
            <p className="settings-card__error" role="alert">{saveError}</p>
          )}

          <Button type="submit" isLoading={saving} disabled={saving}>
            Save Changes
          </Button>
        </form>
      </Card>

      {/* ── Learning Preferences (student role only) ── */}
      {isStudent && (
        <Card className="settings-card">
          <h2 className="settings-card__heading">Learning Preferences</h2>
          <p className="settings-card__description">
            These preferences are used to recommend lessons and match you with teachers.
          </p>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setPrefsSaving(true);
            setPrefsSaveError('');
            try {
              await savePreferences({
                budget_max: 100,
                learning_goal: prefsForm.learning_goal.trim(),
                onboarding_text: prefsForm.learning_goal.trim(),
                currentLevel: 'Beginner',
                mainGoal: prefsForm.mainGoal,
              });
              toast('Learning preferences saved.');
            } catch (err) {
              setPrefsSaveError(err?.response?.data?.error?.message || 'Failed to save preferences.');
            } finally {
              setPrefsSaving(false);
            }
          }} noValidate>
            <div className="settings-field">
              <label htmlFor="mainGoal" className="settings-label">Main Learning Goal</label>
              <select
                id="mainGoal"
                className="settings-input"
                value={prefsForm.mainGoal}
                onChange={(e) => setPrefsForm(prev => ({ ...prev, mainGoal: e.target.value }))}
              >
                <option value="general_english">General English</option>
                <option value="interview_prep">Interview Preparation</option>
                <option value="tech_english">Tech English</option>
                <option value="speaking">Speaking & Fluency</option>
                <option value="writing">Writing</option>
                <option value="grammar">Grammar</option>
              </select>
            </div>

            <div className="settings-field">
              <label htmlFor="learning_goal" className="settings-label">What do you want to improve?</label>
              <textarea
                id="learning_goal"
                className="settings-input settings-textarea"
                value={prefsForm.learning_goal}
                onChange={(e) => setPrefsForm(prev => ({ ...prev, learning_goal: e.target.value }))}
                rows={3}
                placeholder="e.g. I want to improve my English for technical interviews and daily standups"
              />
            </div>

            {prefsSaveError && (
              <p className="settings-card__error" role="alert">{prefsSaveError}</p>
            )}

            <Button type="submit" isLoading={prefsSaving} disabled={prefsSaving}>
              Save Preferences
            </Button>
          </form>
        </Card>
      )}

      {/* ── Teacher Profile (teacher role only) ───── */}
      {isTeacher && teacherProfile && (
        <Card className="settings-card">
          <h2 className="settings-card__heading">Teacher Profile</h2>

          <form onSubmit={handleTeacherSave} noValidate>
            <div className="settings-field">
              <label htmlFor="tp-bio" className="settings-label">
                Bio <span className="settings-label__optional">(optional)</span>
              </label>
              <textarea
                id="tp-bio"
                className="settings-input settings-textarea"
                value={teacherForm.bio}
                onChange={(e) => handleTeacherFieldChange('bio', e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Tell students about yourself…"
              />
              <p className="settings-char-count">{teacherForm.bio.length}/500</p>
            </div>

            <div className="settings-field">
              <label htmlFor="tp-experience" className="settings-label">Experience</label>
              <input
                id="tp-experience"
                type="text"
                className="settings-input"
                value={teacherForm.experience}
                onChange={(e) => handleTeacherFieldChange('experience', e.target.value)}
                placeholder="e.g. 5 years in Tech English"
                maxLength={120}
                required
              />
            </div>

            <div className="settings-field">
              <label htmlFor="tp-price" className="settings-label">Price per Week ($)</label>
              <input
                id="tp-price"
                type="number"
                className="settings-input"
                value={teacherForm.pricePerWeek}
                onChange={(e) => handleTeacherFieldChange('pricePerWeek', e.target.value)}
                min={0}
                required
              />
            </div>

            <div className="settings-field">
              <label htmlFor="tp-feedback" className="settings-label">Feedback Frequency</label>
              <select
                id="tp-feedback"
                className="settings-input"
                value={teacherForm.feedbackFrequency}
                onChange={(e) => handleTeacherFieldChange('feedbackFrequency', e.target.value)}
              >
                {FEEDBACK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="settings-field">
              <label htmlFor="tp-availability" className="settings-label">
                Availability <span className="settings-label__optional">(optional)</span>
              </label>
              <select
                id="tp-availability"
                className="settings-input"
                value={teacherForm.availability}
                onChange={(e) => handleTeacherFieldChange('availability', e.target.value)}
              >
                {AVAILABILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="settings-field">
              <p className="settings-label">Toggles</p>
              <div className="settings-toggles">
                <label className={`settings-toggle${teacherForm.available ? ' settings-toggle--on' : ''}`}>
                  <input
                    type="checkbox"
                    className="settings-toggle__input"
                    checked={teacherForm.available}
                    onChange={(e) => handleTeacherFieldChange('available', e.target.checked)}
                  />
                  <span className="settings-toggle__track" />
                  <span className="settings-toggle__label">Accepting students</span>
                </label>
                <label className={`settings-toggle${teacherForm.onlineOnly ? ' settings-toggle--on' : ''}`}>
                  <input
                    type="checkbox"
                    className="settings-toggle__input"
                    checked={teacherForm.onlineOnly}
                    onChange={(e) => handleTeacherFieldChange('onlineOnly', e.target.checked)}
                  />
                  <span className="settings-toggle__track" />
                  <span className="settings-toggle__label">Online sessions only</span>
                </label>
              </div>
            </div>

            <div className="settings-field">
              <p className="settings-label">Specialties</p>
              <div className="settings-chips">
                {SPECIALTIES_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`settings-chip${teacherForm.specialties.includes(s) ? ' settings-chip--on' : ''}`}
                    onClick={() => handleTeacherFieldChange('specialties', toggleItem(teacherForm.specialties, s))}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-field">
              <p className="settings-label">Teaching Levels</p>
              <div className="settings-chips">
                {LEVEL_OPTIONS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    className={`settings-chip${teacherForm.teachingLevels.includes(lvl) ? ' settings-chip--on' : ''}`}
                    onClick={() => handleTeacherFieldChange('teachingLevels', toggleItem(teacherForm.teachingLevels, lvl))}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {teacherSaveError && (
              <p className="settings-card__error" role="alert">{teacherSaveError}</p>
            )}

            <Button type="submit" isLoading={teacherSaving} disabled={teacherSaving}>
              Save Profile
            </Button>
          </form>
        </Card>
      )}

      {/* ── Danger Zone ───────────────────────────── */}
      <Card className="settings-card settings-card--danger">
        <h2 className="settings-card__heading settings-card__heading--danger">Danger Zone</h2>
        <p className="settings-card__description">
          Permanently deletes your account and all associated data. This cannot be undone.
        </p>

        {isAdmin ? (
          <Button variant="danger" disabled title="Admin accounts cannot be deleted">
            🔒 Delete Account
          </Button>
        ) : (
          <>
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
          </>
        )}
      </Card>
    </div>
  );
}

export default SettingsPage;
