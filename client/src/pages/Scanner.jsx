// src/pages/Scanner.jsx
// ---------------------------------------------------------
// Complete Food Scanner & Confirmation Workflow.
// Flow:
// 1. Photo Capture / Upload
// 2. AI Identification via Gemini Vision
// 3. User Confirmation & Editing:
//    - Adjust grams
//    - Edit food name / search USDA/Indian DB
//    - Add/remove items
// 4. Server-side nutrition recalculation
// 5. Save confirmed meal directly to Diary
// ---------------------------------------------------------

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import foodService from '../services/foodService';
import mealService from '../services/mealService';
import {
  Upload,
  Camera,
  X,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  Search,
  Sparkles,
} from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Scanner() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // States
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('upload'); // 'upload' | 'confirm'

  // Analysis results
  const [imageUrl, setImageUrl] = useState('');
  const [mealType, setMealType] = useState('Lunch');
  const [foods, setFoods] = useState([]);
  const [overallUncertainty, setOverallUncertainty] = useState([]);
  const [totals, setTotals] = useState({ energy: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  // Search autocomplete state for food replacement
  const [searchIndex, setSearchIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // ── Handle file selection ───────────────────────────────
  const handleFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
      setError('Please upload a valid JPG, PNG, or WebP image.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Image is too large. Maximum size is 10 MB.');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  };

  // ── Analyze with Gemini ─────────────────────────────────
  const handleAnalyze = async () => {
    if (!file) return;

    setAnalyzing(true);
    setError('');

    try {
      const response = await foodService.analyzeImage(file);
      const data = response.data;

      if (!data.isFood) {
        setError(data.message || 'No food items were detected in this image. Please try another photo.');
        setAnalyzing(false);
        return;
      }

      setImageUrl(data.imageUrl);
      setOverallUncertainty(data.overallUncertainty || []);

      // Initialize confirmed foods with suggested portion grams
      const initialFoods = data.items.map((item) => ({
        name: item.name,
        databaseFoodId: item.databaseFoodId,
        source: item.source || 'usda',
        confirmedGrams: item.suggestedGrams || 100,
        estimatedGrams: item.estimatedQuantityGrams,
        confidence: item.confidence,
        uncertainties: item.uncertainties || [],
        nutrientsPer100g: item.nutrientsPer100g,
        calculatedNutrients: item.calculatedNutrients,
      }));

      setFoods(initialFoods);
      recalculateTotals(initialFoods);
      setStep('confirm');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err?.response?.data?.error || 'Failed to analyze meal image. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Recalculate totals client-side and server-side ──────
  const recalculateTotals = async (items) => {
    try {
      const res = await foodService.calculateNutrition(items);
      setFoods(res.data.foods);
      setTotals(res.data.totals);
    } catch {
      // Fallback local sum
      let sumKcal = 0, sumP = 0, sumC = 0, sumF = 0;
      for (const item of items) {
        const g = Number(item.confirmedGrams) || 0;
        const n = item.nutrientsPer100g || {};
        sumKcal += ((n.energy || 0) * g) / 100;
        sumP += ((n.protein || 0) * g) / 100;
        sumC += ((n.carbs || 0) * g) / 100;
        sumF += ((n.fat || 0) * g) / 100;
      }
      setTotals({
        energy: Math.round(sumKcal),
        protein: Math.round(sumP * 10) / 10,
        carbs: Math.round(sumC * 10) / 10,
        fat: Math.round(sumF * 10) / 10,
      });
    }
  };

  // ── Food item edits ─────────────────────────────────────
  const updateGrams = (index, newGrams) => {
    const updated = [...foods];
    updated[index].confirmedGrams = Math.max(Number(newGrams) || 1, 1);
    setFoods(updated);
    recalculateTotals(updated);
  };

  const removeFood = (index) => {
    const updated = foods.filter((_, i) => i !== index);
    setFoods(updated);
    recalculateTotals(updated);
  };

  const addCustomFood = () => {
    const newFood = {
      name: 'Custom Food Item',
      databaseFoodId: 'custom',
      source: 'custom_entry',
      confirmedGrams: 100,
      nutrientsPer100g: { energy: 150, protein: 5, carbs: 20, fat: 5, fiber: 2 },
      calculatedNutrients: { energy: 150, protein: 5, carbs: 20, fat: 5, fiber: 2 },
      confidence: 'unconfirmed',
      uncertainties: ['User added manually'],
    };
    const updated = [...foods, newFood];
    setFoods(updated);
    recalculateTotals(updated);
  };

  // ── Database search and replace ─────────────────────────
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await foodService.searchFoods(query);
      setSearchResults(res.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectMatchedFood = (itemIndex, match) => {
    const updated = [...foods];
    updated[itemIndex].name = match.name;
    updated[itemIndex].databaseFoodId = match.externalId;
    updated[itemIndex].source = match.source;
    updated[itemIndex].nutrientsPer100g = match.nutrientsPer100g;
    setFoods(updated);
    recalculateTotals(updated);
    setSearchIndex(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  // ── Save confirmed meal to diary ────────────────────────
  const handleSaveMeal = async () => {
    if (foods.length === 0) {
      setError('Please have at least one food item before logging.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await mealService.createMeal({
        mealType,
        imageUrl,
        consumedAt: new Date().toISOString(),
        foods,
      });

      navigate('/diary');
    } catch (err) {
      console.error('Failed to save meal:', err);
      setError(err?.response?.data?.error || 'Failed to save meal to diary.');
    } finally {
      setSaving(false);
    }
  };

  const resetScanner = () => {
    setFile(null);
    setPreview(null);
    setStep('upload');
    setFoods([]);
    setError('');
  };

  return (
    <div className="page-container page-container--narrow">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Food Scanner</h1>
          <p className="page-subtitle">
            {step === 'upload' ? 'Upload or capture a photo of your meal' : 'Review & confirm detected foods and portion sizes'}
          </p>
        </div>
        {step === 'confirm' && (
          <button className="btn btn-outline btn-sm" onClick={resetScanner}>
            Scan New Photo
          </button>
        )}
      </div>

      <ErrorMessage message={error} type="error" onClose={() => setError('')} />

      {/* ⚠️ Clear Accuracy Disclaimer */}
      <div className="disclaimer-banner disclaimer-banner--warning">
        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>Calorie Accuracy Notice:</strong> AI image recognition identifies visible foods,
          but <em>cannot verify exact weight, hidden cooking oil, butter, or sugar</em> from a photo alone.
          Verify and adjust grams below before logging.
        </span>
      </div>

      {/* ── STEP 1: Upload or Capture ── */}
      {step === 'upload' && (
        <>
          {!preview ? (
            <div
              className="upload-zone"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <Upload size={44} className="upload-zone-icon" />
              <p className="upload-zone-title">Click or drop meal photo here</p>
              <p className="upload-zone-subtitle">Supports JPG, PNG, WebP up to 10 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="upload-preview">
              <button className="upload-preview-clear" onClick={resetScanner} aria-label="Remove photo">
                <X size={18} />
              </button>
              <img src={preview} alt="Meal preview" className="upload-preview-img" />

              <div className="upload-preview-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  style={{ minWidth: '180px' }}
                >
                  {analyzing ? (
                    'Analyzing with Gemini…'
                  ) : (
                    <>
                      <Sparkles size={18} /> Analyze Meal Photo
                    </>
                  )}
                </button>
                <button className="btn btn-outline" onClick={resetScanner} disabled={analyzing}>
                  Choose Different
                </button>
              </div>

              {analyzing && (
                <div style={{ marginTop: '20px' }}>
                  <LoadingSpinner size="md" message="Gemini Vision is identifying food items, ingredients, and portion ranges…" />
                </div>
              )}
            </div>
          )}

          {/* Camera capture trigger */}
          {!preview && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                className="btn btn-outline btn-block"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera size={18} /> Take Photo with Camera
              </button>
            </div>
          )}
        </>
      )}

      {/* ── STEP 2: Review, Edit & Confirm ── */}
      {step === 'confirm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Meal type selector */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <label style={{ fontWeight: 600, fontSize: '0.95rem' }}>Select Meal Slot:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`btn btn-sm ${mealType === slot ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setMealType(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Detected food items list */}
          <div className="section" style={{ marginTop: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Detected Foods ({foods.length})</h2>
              <button type="button" className="btn btn-outline btn-sm" onClick={addCustomFood}>
                <Plus size={15} /> Add Food
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {foods.map((food, idx) => (
                <div key={idx} className="card" style={{ padding: '18px 20px', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '1.05rem', color: 'var(--color-text)' }}>{food.name}</strong>
                        <span
                          style={{
                            fontSize: '0.725rem',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: food.source === 'indian_db' ? '#dcfce7' : '#e0f2fe',
                            color: food.source === 'indian_db' ? '#166534' : '#0369a1',
                            fontWeight: 600,
                          }}
                        >
                          Source: {food.source === 'indian_db' ? 'Curated Indian DB' : 'USDA Database'}
                        </span>
                        <span
                          style={{
                            fontSize: '0.725rem',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: '#f1f5f9',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          Confidence: {food.confidence}
                        </span>
                      </div>

                      {/* Uncertainties flag */}
                      {food.uncertainties && food.uncertainties.length > 0 && (
                        <p style={{ fontSize: '0.775rem', color: '#b45309', marginTop: '4px' }}>
                          ℹ️ {food.uncertainties[0]}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeFood(idx)}
                      title="Remove item"
                      style={{ color: 'var(--color-error)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Portion Grams & Nutrients Row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '150px 1fr',
                      gap: '16px',
                      alignItems: 'center',
                      marginTop: '14px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                        Weight (Grams):
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="2000"
                        className="form-input"
                        value={food.confirmedGrams}
                        onChange={(e) => updateGrams(idx, e.target.value)}
                        style={{ padding: '6px 10px', fontSize: '0.9rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                      <span><strong>{food.calculatedNutrients?.energy || 0}</strong> kcal</span>
                      <span>Protein: <strong>{food.calculatedNutrients?.protein || 0}g</strong></span>
                      <span>Carbs: <strong>{food.calculatedNutrients?.carbs || 0}g</strong></span>
                      <span>Fat: <strong>{food.calculatedNutrients?.fat || 0}g</strong></span>
                    </div>
                  </div>

                  {/* Search replacement toggle */}
                  <div style={{ marginTop: '10px' }}>
                    {searchIndex === idx ? (
                      <div style={{ marginTop: '8px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Search USDA or Indian foods database…"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{ fontSize: '0.875rem' }}
                          />
                          <button className="btn btn-outline btn-sm" onClick={() => setSearchIndex(null)}>
                            Close
                          </button>
                        </div>

                        {searching && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>Searching database…</p>}

                        {searchResults.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                            {searchResults.map((match) => (
                              <button
                                key={match.externalId}
                                type="button"
                                className="btn btn-outline btn-sm"
                                style={{ justifyContent: 'space-between', textAlign: 'left' }}
                                onClick={() => selectMatchedFood(idx, match)}
                              >
                                <span>{match.name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                                  {match.nutrientsPer100g.energy} kcal / 100g ({match.source})
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.775rem', color: 'var(--color-primary)', padding: 0 }}
                        onClick={() => {
                          setSearchIndex(idx);
                          setSearchQuery(food.name);
                          handleSearch(food.name);
                        }}
                      >
                        <Search size={13} /> Change database match
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total summary bar */}
          <div className="card" style={{ background: '#f0fdf4', borderColor: 'var(--color-primary-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-primary-hover)', display: 'block' }}>
                  Confirmed Meal Totals:
                </span>
                <strong style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>
                  {totals.energy} kcal
                </strong>
              </div>

              <div style={{ display: 'flex', gap: '18px', fontSize: '0.9rem' }}>
                <span>Protein: <strong>{totals.protein}g</strong></span>
                <span>Carbs: <strong>{totals.carbs}g</strong></span>
                <span>Fat: <strong>{totals.fat}g</strong></span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button className="btn btn-outline" onClick={resetScanner} disabled={saving}>
              Discard
            </button>
            <button className="btn btn-primary" onClick={handleSaveMeal} disabled={saving} style={{ minWidth: '180px' }}>
              {saving ? (
                'Logging Meal…'
              ) : (
                <>
                  <CheckCircle size={18} /> Confirm &amp; Log to Diary
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
