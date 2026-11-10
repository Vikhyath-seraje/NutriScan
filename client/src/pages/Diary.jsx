// src/pages/Diary.jsx
// ---------------------------------------------------------
// Live Meal Diary Page
// Features:
//   - Day-by-day navigation (Previous/Next day)
//   - Live meal loading from GET /api/meals?date=YYYY-MM-DD
//   - Expandable breakdown of foods, gram weights, and calories
//   - Delete meal with confirmation dialog
// ---------------------------------------------------------

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import mealService from '../services/mealService';
import { formatCalories, formatDate } from '../utils/formatters';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Trash2,
  ScanLine,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const MEAL_TYPE_COLORS = {
  Breakfast: '#f59e0b',
  Lunch: '#3b82f6',
  Dinner: '#8b5cf6',
  Snacks: '#10b981',
};

export default function Diary() {
  const [date, setDate] = useState(new Date());
  const [meals, setMeals] = useState([]);
  const [dayTotals, setDayTotals] = useState({ energy: 0, protein: 0, carbs: 0, fat: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const dateString = date.toISOString().split('T')[0];
  const isToday = date.toDateString() === new Date().toDateString();

  const loadMeals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await mealService.getMeals(dateString);
      setMeals(res.data.meals || []);
      setDayTotals(res.data.dayTotals || { energy: 0, protein: 0, carbs: 0, fat: 0 });
    } catch (err) {
      console.error('Failed to load meals:', err);
      setError('Could not load meals for this date.');
    } finally {
      setLoading(false);
    }
  }, [dateString]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  const prevDay = () => {
    setDate((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() - 1);
      return n;
    });
  };

  const nextDay = () => {
    setDate((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() + 1);
      return n;
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this meal log?')) {
      return;
    }
    try {
      await mealService.deleteMeal(id);
      loadMeals();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Could not delete meal. Please try again.');
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((curr) => (curr === id ? null : id));
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Food &amp; Meal Diary</h1>
          <p className="page-subtitle">Track your historical daily nutrition logs</p>
        </div>
        <Link to="/scanner" className="btn btn-primary">
          <ScanLine size={18} /> Log Meal
        </Link>
      </div>

      <ErrorMessage message={error} type="error" onClose={() => setError('')} />

      {/* Date Navigator */}
      <div className="date-nav">
        <button className="btn btn-ghost btn-sm" onClick={prevDay} aria-label="Previous day">
          <ChevronLeft size={20} />
        </button>
        <div className="date-nav-label">
          <BookOpen size={16} />
          <span>{isToday ? 'Today — ' : ''}{formatDate(date)}</span>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={nextDay}
          disabled={isToday}
          aria-label="Next day"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Daily Total Summary Bar */}
      <div className="diary-total-bar">
        <span>Total Intake for Day:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <strong>{formatCalories(dayTotals.energy)}</strong>
          <span style={{ fontSize: '0.875rem' }}>
            Protein: {dayTotals.protein}g · Carbs: {dayTotals.carbs}g · Fat: {dayTotals.fat}g
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <LoadingSpinner size="md" message="Loading meal records…" />
        </div>
      ) : meals.length > 0 ? (
        <div className="diary-list">
          {meals.map((meal) => {
            const isExpanded = expandedId === meal._id;

            return (
              <div key={meal._id} className="diary-entry">
                <div
                  className="diary-entry-header"
                  onClick={() => toggleExpand(meal._id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && toggleExpand(meal._id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      className="diary-meal-badge"
                      style={{ background: MEAL_TYPE_COLORS[meal.mealType] || '#6b7280' }}
                    >
                      {meal.mealType}
                    </span>
                    <span className="diary-entry-foods">
                      {meal.foods.map((f) => `${f.name} (${f.confirmedGrams}g)`).join(', ')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <strong>{formatCalories(meal.totals.energy)}</strong>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="diary-entry-body">
                    {meal.imageUrl && (
                      <div style={{ marginBottom: '14px' }}>
                        <img
                          src={meal.imageUrl}
                          alt="Meal snapshot"
                          style={{
                            maxWidth: '180px',
                            maxHeight: '130px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            border: '1px solid var(--color-border)',
                          }}
                        />
                      </div>
                    )}

                    <table className="diary-table">
                      <thead>
                        <tr>
                          <th>Food Item</th>
                          <th>Database Source</th>
                          <th>Weight</th>
                          <th>Calories</th>
                          <th>Protein</th>
                          <th>Carbs</th>
                          <th>Fat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meal.foods.map((item, idx) => (
                          <tr key={idx}>
                            <td><strong>{item.name}</strong></td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              {item.source === 'indian_db' ? 'Indian DB' : 'USDA'}
                            </td>
                            <td>{item.confirmedGrams} g</td>
                            <td>{item.calculatedNutrients?.energy || 0} kcal</td>
                            <td>{item.calculatedNutrients?.protein || 0} g</td>
                            <td>{item.calculatedNutrients?.carbs || 0} g</td>
                            <td>{item.calculatedNutrients?.fat || 0} g</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3}><strong>Meal Totals:</strong></td>
                          <td><strong>{meal.totals.energy} kcal</strong></td>
                          <td><strong>{meal.totals.protein} g</strong></td>
                          <td><strong>{meal.totals.carbs} g</strong></td>
                          <td><strong>{meal.totals.fat} g</strong></td>
                        </tr>
                      </tfoot>
                    </table>

                    <div className="diary-actions" style={{ marginTop: '16px' }}>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(meal._id)}
                      >
                        <Trash2 size={14} /> Delete Meal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <BookOpen size={44} className="empty-state-icon" />
          <h3>No Meals Logged for this Date</h3>
          <p>Photograph or enter your meal to view nutrition breakdown and track macros.</p>
          <Link to="/scanner" className="btn btn-primary">
            <ScanLine size={16} /> Scan Meal Now
          </Link>
        </div>
      )}
    </div>
  );
}
