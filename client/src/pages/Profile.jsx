// src/pages/Profile.jsx
// ---------------------------------------------------------
// User profile management & calorie calculation.
// Features:
//   - Load profile data from /api/profile
//   - Live interactive BMR / TDEE estimation
//   - Toggle between auto-calculated goal vs manual calorie override
//   - Clear disclaimer that calculations are estimates, not medical advice
// ---------------------------------------------------------

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import profileService from '../services/profileService';
import { User, Save, Info, Calculator, CheckCircle2 } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

const ACTIVITY_LEVELS = [
  { value: 'sedentary',    label: 'Sedentary (desk job, little exercise)' },
  { value: 'light',        label: 'Lightly active (1–3 days/week)' },
  { value: 'moderate',     label: 'Moderately active (3–5 days/week)' },
  { value: 'active',       label: 'Very active (6–7 days/week)' },
  { value: 'extra_active', label: 'Extra active (physical job + heavy training)' },
];

const GOALS = [
  { value: 'lose',     label: '🔽 Lose weight (-400 kcal)' },
  { value: 'maintain', label: '⚖️ Maintain weight' },
  { value: 'gain',     label: '🔼 Gain weight (+350 kcal)' },
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('male');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [goal, setGoal] = useState('maintain');

  // Manual goal override
  const [useManualGoal, setUseManualGoal] = useState(false);
  const [manualCalorieGoal, setManualCalorieGoal] = useState('2000');

  // Live calculation preview
  const [calculation, setCalculation] = useState(null);

  // ── 1. Fetch profile on mount ────────────────────────────
  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const response = await profileService.getProfile();
        const userData = response.data.user;
        const calcData = response.data.calculatedEstimate;

        if (!mounted) return;

        setName(userData.name || '');
        if (userData.profile) {
          setAge(userData.profile.age || '');
          setSex(userData.profile.sex || 'male');
          setHeightCm(userData.profile.heightCm || '');
          setWeightKg(userData.profile.weightKg || '');
          setActivityLevel(userData.profile.activityLevel || 'moderate');
          setGoal(userData.profile.goal || 'maintain');
        }

        if (userData.calorieGoal) {
          setManualCalorieGoal(String(userData.calorieGoal));
        }

        setCalculation(calcData);
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError('Could not load profile. Using local defaults.');
      } finally {
        if (mounted) setInitialLoading(false);
      }
    };

    loadProfile();
    return () => { mounted = false; };
  }, []);

  // ── 2. Live preview calculation ─────────────────────────
  const fetchPreview = useCallback(async () => {
    if (!weightKg || !heightCm || !age) {
      setCalculation(null);
      return;
    }

    try {
      const response = await profileService.previewCalculation({
        age: Number(age),
        sex,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        activityLevel,
        goal,
      });
      setCalculation(response.data);
    } catch {
      // Ignore background preview errors
    }
  }, [age, sex, heightCm, weightKg, activityLevel, goal]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPreview();
    }, 250); // Debounce preview requests
    return () => clearTimeout(timer);
  }, [fetchPreview]);

  // ── 3. Save profile ─────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name,
        profile: {
          age: age ? Number(age) : null,
          sex,
          heightCm: heightCm ? Number(heightCm) : null,
          weightKg: weightKg ? Number(weightKg) : null,
          activityLevel,
          goal,
        },
        useManualCalorieGoal: useManualGoal,
        calorieGoal: useManualGoal ? Number(manualCalorieGoal) : undefined,
      };

      const response = await profileService.updateProfile(payload);
      const updatedUser = response.data.user;

      updateUser(updatedUser);
      setCalculation(response.data.calculation);
      setSuccess('Profile and nutrition targets updated successfully!');
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0]?.message ||
        'Failed to save profile. Please check your inputs.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="page-container page-container--narrow" style={{ padding: '80px 0', textAlign: 'center' }}>
        <LoadingSpinner size="lg" message="Loading your profile..." />
      </div>
    );
  }

  return (
    <div className="page-container page-container--narrow">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile & Nutrition Goals</h1>
          <p className="page-subtitle">Configure your personal metrics for accurate calorie recommendations</p>
        </div>
      </div>

      <ErrorMessage message={error} type="error" onClose={() => setError('')} />
      <ErrorMessage message={success} type="success" onClose={() => setSuccess('')} />

      {/* Accuracy & Medical Disclaimer */}
      <div className="disclaimer-banner">
        <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>Informational Estimates:</strong> Body metrics are entirely optional.
          Calorie recommendations are calculated using the <em>Mifflin-St Jeor equation</em> and standard
          activity multipliers. These are general guidelines, not medical advice.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="card profile-form">

        {/* Account Information */}
        <section className="form-section">
          <h2 className="form-section-title"><User size={18} /> Account Details</h2>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Display Name</label>
            <input
              id="name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={user?.email || ''}
              disabled
            />
            <p className="form-hint">Email is tied to your account and cannot be modified.</p>
          </div>
        </section>

        {/* Physical Metrics */}
        <section className="form-section">
          <h2 className="form-section-title">
            Body Metrics <span className="badge-optional">Optional</span>
          </h2>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="age">Age (years)</label>
              <input
                id="age"
                type="number"
                min="10"
                max="120"
                className="form-input"
                placeholder="e.g. 24"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="sex">Biological Sex</label>
              <select
                id="sex"
                className="form-input form-select"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
              >
                <option value="male">Male (BMR +5)</option>
                <option value="female">Female (BMR -161)</option>
              </select>
              <p className="form-hint">Required for the biological Mifflin-St Jeor equation.</p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="heightCm">Height (cm)</label>
              <input
                id="heightCm"
                type="number"
                min="100"
                max="250"
                className="form-input"
                placeholder="e.g. 175"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="weightKg">Weight (kg)</label>
              <input
                id="weightKg"
                type="number"
                min="20"
                max="300"
                step="0.1"
                className="form-input"
                placeholder="e.g. 70"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Activity & Goals */}
        <section className="form-section">
          <h2 className="form-section-title">Daily Activity & Target Goal</h2>
          <div className="form-group">
            <label className="form-label" htmlFor="activityLevel">Physical Activity Level</label>
            <select
              id="activityLevel"
              className="form-input form-select"
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
            >
              {ACTIVITY_LEVELS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Dietary Objective</label>
            <div className="goal-options">
              {GOALS.map((g) => (
                <label
                  key={g.value}
                  className={`goal-option ${goal === g.value ? 'goal-option--active' : ''}`}
                >
                  <input
                    type="radio"
                    name="goal"
                    value={g.value}
                    checked={goal === g.value}
                    onChange={(e) => setGoal(e.target.value)}
                    className="sr-only"
                  />
                  {g.label}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Calculation Preview Box */}
        {calculation && calculation.hasCustomMetrics && (
          <div className="calorie-estimate-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary-hover)' }}>
              <Calculator size={18} />
              <h3 style={{ margin: 0 }}>Scientific Calorie Estimation</h3>
            </div>

            <div className="calorie-estimate-row" style={{ marginTop: '8px' }}>
              <span>Basal Metabolic Rate (BMR):</span>
              <strong>{calculation.bmr} kcal/day</strong>
            </div>

            <div className="calorie-estimate-row">
              <span>Maintenance (TDEE):</span>
              <strong>{calculation.tdee} kcal/day</strong>
            </div>

            <div
              className="calorie-estimate-row"
              style={{
                fontSize: '1.05rem',
                borderTop: '1px solid var(--color-primary-border)',
                paddingTop: '6px',
                marginTop: '4px',
              }}
            >
              <span>Recommended Daily Goal:</span>
              <strong style={{ color: 'var(--color-primary)' }}>
                {calculation.suggestedCalorieGoal} kcal/day
              </strong>
            </div>

            {/* Suggested Macro Breakdown */}
            {calculation.macroGoals && (
              <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                Balanced Macros (25% / 50% / 25%): &nbsp;
                <strong>{calculation.macroGoals.proteinGrams}g</strong> Protein · &nbsp;
                <strong>{calculation.macroGoals.carbsGrams}g</strong> Carbs · &nbsp;
                <strong>{calculation.macroGoals.fatGrams}g</strong> Fat
              </div>
            )}
          </div>
        )}

        {/* Manual Goal Override Toggle */}
        <section className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              id="manualToggle"
              type="checkbox"
              checked={useManualGoal}
              onChange={(e) => setUseManualGoal(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
            <label htmlFor="manualToggle" style={{ fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer' }}>
              Set a custom daily calorie goal manually (override calculation)
            </label>
          </div>

          {useManualGoal && (
            <div className="form-group" style={{ marginTop: '14px' }}>
              <label className="form-label" htmlFor="manualGoalInput">Custom Calorie Goal (kcal/day)</label>
              <input
                id="manualGoalInput"
                type="number"
                min="800"
                max="6000"
                className="form-input"
                value={manualCalorieGoal}
                onChange={(e) => setManualCalorieGoal(e.target.value)}
                placeholder="e.g. 2200"
                required={useManualGoal}
              />
              <p className="form-hint">Must be between 800 and 6000 kcal/day.</p>
            </div>
          )}
        </section>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? (
            'Saving Profile…'
          ) : (
            <>
              <Save size={16} /> Save Profile &amp; Calorie Goal
            </>
          )}
        </button>
      </form>
    </div>
  );
}
