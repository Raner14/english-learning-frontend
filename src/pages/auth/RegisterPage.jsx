import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../services/userService';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  userRole: 'student',
  sex: 'male',
};

function validate(form) {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = 'First name is required.';
  if (!form.lastName.trim()) errors.lastName = 'Last name is required.';
  if (!form.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!form.password) {
    errors.password = 'Password is required.';
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }
  return errors;
}

function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>{label}</label>
      {children}
      {error && <p style={{ margin: 0, fontSize: '0.8rem', color: '#dc2626' }}>{error}</p>}
    </div>
  );
}

const inputStyle = (hasError) => ({
  padding: '10px 12px',
  borderRadius: '10px',
  border: `1.5px solid ${hasError ? '#dc2626' : '#bae6fd'}`,
  fontSize: '0.93rem',
  outline: 'none',
  background: '#f0f9ff',
  color: '#0f172a',
  boxSizing: 'border-box',
  width: '100%',
});

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setServerError('');

    try {
      await registerUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        userRole: form.userRole,
        sex: form.sex,
      });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setServerError(
        err?.response?.data?.error?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        padding: '36px 32px',
        borderRadius: '24px',
        background: '#ffffff',
        boxShadow: '0 18px 40px rgba(14, 165, 233, 0.12)',
      }}>
        <h1 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '1.6rem', fontWeight: 800 }}>
          Create account
        </h1>
        <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '0.9rem' }}>
          Join Lingua and start learning.
        </p>

        {serverError && (
          <p style={{
            margin: '0 0 18px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: '#fef2f2',
            color: '#dc2626',
            fontSize: '0.88rem',
          }}>
            {serverError}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="First name" error={errors.firstName}>
              <input
                name="firstName"
                type="text"
                value={form.firstName}
                onChange={handleChange}
                style={inputStyle(!!errors.firstName)}
                autoComplete="given-name"
              />
            </Field>
            <Field label="Last name" error={errors.lastName}>
              <input
                name="lastName"
                type="text"
                value={form.lastName}
                onChange={handleChange}
                style={inputStyle(!!errors.lastName)}
                autoComplete="family-name"
              />
            </Field>
          </div>

          <Field label="Email" error={errors.email}>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              style={inputStyle(!!errors.email)}
              autoComplete="email"
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              style={inputStyle(!!errors.password)}
              autoComplete="new-password"
              placeholder="Min. 6 characters"
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="I am a…">
              <select
                name="userRole"
                value={form.userRole}
                onChange={handleChange}
                style={{ ...inputStyle(false), cursor: 'pointer' }}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </Field>

            <Field label="Gender">
              <select
                name="sex"
                value={form.sex}
                onChange={handleChange}
                style={{ ...inputStyle(false), cursor: 'pointer' }}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '4px',
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              background: submitting ? '#7dd3fc' : '#0ea5e9',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: submitting ? 'default' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ margin: '20px 0 0', textAlign: 'center', fontSize: '0.88rem', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#0ea5e9', fontWeight: 700, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
