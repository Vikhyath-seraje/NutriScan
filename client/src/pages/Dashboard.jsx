// src/pages/Dashboard.jsx
// ---------------------------------------------------------
// Live Dashboard Page with real backend analytics.
// Connects to:
//   - GET /api/dashboard/daily
//   - GET /api/dashboard/weekly
//   - GET /api/dashboard/export-csv
// ---------------------------------------------------------

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import dashboardService from '../services/dashboardService';
import { formatCalories, formatMacro, calcPercentage } from '../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  ScanLine,
  Flame,
  Beef,
  Wheat,
  Droplets,
  TrendingUp,
  Download,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const [dailyData, setDailyData] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [calorieGoal, setCalorieGoal] = useState(2000);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        const [dailyRes, weeklyRes] = await Promise.all([
          dashboardService.getDaily(),
          dashboardService.getWeekly(),
        ]);

        if (!mounted) return;

        setDailyData(dailyRes.data);
        setCalorieGoal(dailyRes.data.calorieGoal || 2000);
        setWeeklyData(weeklyRes.data.days || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setError('Could not fetch real-time dashboard data.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => { mounted = false; };
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      await dashboardService.downloadCSV();
    } catch (err) {
      console.error('CSV export failed:', err);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <LoadingSpinner size="lg" message="Loading your nutrition analytics..." />
      </div>
    );
  }

  const consumed = dailyData?.consumed || { energy: 0, protein: 0, carbs: 0, fat: 0 };
  const macroGoals = dailyData?.macroGoals || { proteinGrams: 150, carbsGrams: 250, fatGrams: 65 };
  const mealBreakdown = dailyData?.mealBreakdown || {};

  const pct = calcPercentage(consumed.energy, calorieGoal);
  const remaining = Math.max(calorieGoal - consumed.energy, 0);
  const over = consumed.energy > calorieGoal;

  // SVG Donut calculation
  const radius = 70;
  const stroke = 12;
  const normalised = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalised;
  const dashOffset = circumference - (circumference * Math.min(pct, 100)) / 100;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Nutrition Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, {user?.name || 'User'}! Today is{' '}
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleExportCSV}
            disabled={exporting}
            title="Download full meal diary as CSV"
          >
            <Download size={15} /> {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <Link to="/scanner" className="btn btn-primary">
            <ScanLine size={18} /> Scan Meal
          </Link>
        </div>
      </div>

      <ErrorMessage message={error} type="error" onClose={() => setError('')} />

      {/* Accuracy Banner */}
      <div className="disclaimer-banner">
        <AlertCircle size={16} style={{ flexShrink: 0 }} />
        <span>
          <strong>Informational Estimates:</strong> Calculated using verified nutrition databases and
          confirmed portion weights. Consult a healthcare provider for medical diet planning.
        </span>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-summary">
        {/* Calorie Ring Card */}
        <div className="card card--center">
          <h2 className="card-title">
            <Flame size={18} /> Daily Energy Balance
          </h2>

          <div className="calorie-ring-wrapper">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={normalised}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth={stroke}
              />
              <circle
                cx="80"
                cy="80"
                r={normalised}
                fill="none"
                stroke={over ? 'var(--color-error)' : 'var(--color-primary)'}
                strokeWidth={stroke}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
              <text x="80" y="72" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--color-text)">
                {consumed.energy}
              </text>
              <text x="80" y="90" textAnchor="middle" fontSize="11" fill="var(--color-text-secondary)">
                kcal eaten
              </text>
              <text
                x="80"
                y="108"
                textAnchor="middle"
                fontSize="11"
                fill={over ? 'var(--color-error)' : 'var(--color-primary)'}
              >
                {over ? `${consumed.energy - calorieGoal} over` : `${remaining} left`}
              </text>
            </svg>
            <div className="calorie-ring-goal">Daily Goal: {formatCalories(calorieGoal)}</div>
          </div>
        </div>

        {/* Macros Breakdown Card */}
        <div className="card">
          <h2 className="card-title">
            <TrendingUp size={18} /> Macronutrient Balance
          </h2>

          <div className="macro-list">
            {/* Protein */}
            <div className="macro-bar">
              <div className="macro-bar-header">
                <span className="macro-bar-label"><Beef size={15} /> Protein</span>
                <span className="macro-bar-value">{formatMacro(consumed.protein)} / {macroGoals.proteinGrams}g</span>
              </div>
              <div className="macro-bar-track">
                <div
                  className="macro-bar-fill"
                  style={{
                    width: `${Math.min((consumed.protein / (macroGoals.proteinGrams || 1)) * 100, 100)}%`,
                    background: '#3b82f6',
                  }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div className="macro-bar">
              <div className="macro-bar-header">
                <span className="macro-bar-label"><Wheat size={15} /> Carbohydrates</span>
                <span className="macro-bar-value">{formatMacro(consumed.carbs)} / {macroGoals.carbsGrams}g</span>
              </div>
              <div className="macro-bar-track">
                <div
                  className="macro-bar-fill"
                  style={{
                    width: `${Math.min((consumed.carbs / (macroGoals.carbsGrams || 1)) * 100, 100)}%`,
                    background: '#f59e0b',
                  }}
                />
              </div>
            </div>

            {/* Fat */}
            <div className="macro-bar">
              <div className="macro-bar-header">
                <span className="macro-bar-label"><Droplets size={15} /> Healthy Fats</span>
                <span className="macro-bar-value">{formatMacro(consumed.fat)} / {macroGoals.fatGrams}g</span>
              </div>
              <div className="macro-bar-track">
                <div
                  className="macro-bar-fill"
                  style={{
                    width: `${Math.min((consumed.fat / (macroGoals.fatGrams || 1)) * 100, 100)}%`,
                    background: '#ef4444',
                  }}
                />
              </div>
            </div>
          </div>

          <p className="macro-note">
            Target ratios: 25% Protein, 50% Carbohydrates, 25% Dietary Fats. Configure in{' '}
            <Link to="/profile" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Profile
            </Link>.
          </p>
        </div>
      </div>

      {/* Today's Meals Breakdown */}
      <div className="section">
        <h2 className="section-title">Today&apos;s Meal Breakdown</h2>
        <div className="meal-grid">
          {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((slot) => {
            const data = mealBreakdown[slot] || { calories: 0, items: [] };
            const hasItems = data.items.length > 0;

            return (
              <div key={slot} className={`meal-card ${!hasItems ? 'meal-card--empty' : ''}`}>
                <div className="meal-card-header">
                  <span className="meal-card-type">{slot}</span>
                  <span className="meal-card-kcal">{hasItems ? `${data.calories} kcal` : '—'}</span>
                </div>
                {hasItems ? (
                  <ul className="meal-card-items">
                    {data.items.slice(0, 4).map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                    {data.items.length > 4 && <li>+{data.items.length - 4} more</li>}
                  </ul>
                ) : (
                  <p className="meal-card-empty-text">No meals logged</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-Day Weekly Trend Chart */}
      <div className="card section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Weekly Calorie Intake (Last 7 Days)</h2>
          <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
            <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} /> Daily Target: {calorieGoal} kcal
          </span>
        </div>

        <div style={{ width: '100%', height: 260, marginTop: '16px' }}>
          <ResponsiveContainer>
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 13 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(val) => [`${val} kcal`, 'Calories']}
                cursor={{ fill: 'rgba(21,128,61,0.06)' }}
              />
              <Bar dataKey="calories" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {weeklyData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.calories > calorieGoal ? 'var(--color-error)' : 'var(--color-primary)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="chart-legend">
          <span className="legend-dot" style={{ background: 'var(--color-primary)' }} />
          Within Goal &nbsp;
          <span className="legend-dot" style={{ background: 'var(--color-error)' }} />
          Exceeded Goal
        </p>
      </div>
    </div>
  );
}
