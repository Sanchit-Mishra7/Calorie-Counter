
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Upload, X, Check, Loader2, Sparkles, AlertCircle, Bookmark, PenTool, Search } from 'lucide-react';
import { analyzeFoodImage, getNutritionFromText, getFoodSuggestions } from '../services/geminiService';
import { FoodItem, Meal, QualityScore, MealTemplate } from '../types';

interface MealLoggerProps {
  onSave: (meal: Omit<Meal, 'id' | 'timestamp'>) => void;
  onCancel: () => void;
  templates: MealTemplate[];
  onSaveTemplate: (template: MealTemplate) => void;
}

const getTimeBasedMealType = (): Meal['type'] => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return 'Breakfast';
  if (hour >= 11 && hour < 17) return 'Lunch';
  if (hour >= 17 && hour < 22) return 'Dinner';
  return 'Snack';
};

export const MealLogger: React.FC<MealLoggerProps> = ({ onSave, onCancel, templates, onSaveTemplate }) => {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ items: FoodItem[], quality: QualityScore } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateNameInput, setShowTemplateNameInput] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [mealType, setMealType] = useState<Meal['type']>(getTimeBasedMealType());
  
  // Manual Entry State
  const [manualForm, setManualForm] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });
  const [saveManualAsTemplate, setSaveManualAsTemplate] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAutoCalculating, setIsAutoCalculating] = useState(false);
  
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setAnalysisResult(null);
        setError(null);
        // Auto analyze logic could go here if desired, but user might want to confirm image first
      };
      reader.readAsDataURL(file);
    }
    // Reset input value to allow selecting the same file again if needed
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    if (!imagePreview) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await analyzeFoodImage(imagePreview);
      setAnalysisResult({
        items: result.items,
        quality: result.qualityScore
      });
    } catch (err) {
      setError("Failed to analyze image. Please try again or check your connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateTotals = () => {
    if (!analysisResult) return { cal: 0, p: 0, c: 0, f: 0 };
    return analysisResult.items.reduce((acc, item) => ({
      cal: acc.cal + item.calories,
      p: acc.p + item.protein,
      c: acc.c + item.carbs,
      f: acc.f + item.fat,
    }), { cal: 0, p: 0, c: 0, f: 0 });
  };

  const handleConfirm = () => {
    if (!analysisResult) return;
    const totals = calculateTotals();
    
    onSave({
      type: mealType,
      items: analysisResult.items,
      totalCalories: totals.cal,
      totalProtein: totals.p,
      totalCarbs: totals.c,
      totalFat: totals.f,
      qualityScore: analysisResult.quality,
      imageUrl: imagePreview && imagePreview !== "placeholder" ? imagePreview : undefined
    });
  };

  const handleManualNameChange = (val: string) => {
    setManualForm(prev => ({ ...prev, name: val }));
    setShowSuggestions(true);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (val.length > 2) {
      debounceRef.current = setTimeout(async () => {
        const results = await getFoodSuggestions(val);
        setSuggestions(results);
      }, 500);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setManualForm(prev => ({ ...prev, name: suggestion }));
    setSuggestions([]);
    setShowSuggestions(false);
    handleAutoCalculate(suggestion);
  };

  const handleAutoCalculate = async (foodNameOverride?: string) => {
    const nameToUse = foodNameOverride || manualForm.name;
    if (!nameToUse.trim()) return;

    setIsAutoCalculating(true);
    try {
      const result = await getNutritionFromText(nameToUse);
      setManualForm({
        name: result.name, // Use the specific name from AI
        calories: result.calories.toString(),
        protein: result.protein.toString(),
        carbs: result.carbs.toString(),
        fat: result.fat.toString()
      });
    } catch (error) {
      console.error("Auto calculation failed");
    } finally {
      setIsAutoCalculating(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualForm.name || !manualForm.calories) return;

    const cal = Number(manualForm.calories) || 0;
    const p = Number(manualForm.protein) || 0;
    const c = Number(manualForm.carbs) || 0;
    const f = Number(manualForm.fat) || 0;

    const manualItem: FoodItem = {
      name: manualForm.name,
      calories: cal,
      protein: p,
      carbs: c,
      fat: f,
      portion: '1 serving',
      confidence: 'High'
    };

    const qualityScore: QualityScore = { score: 50, explanation: "Manual entry.", suggestions: [] };

    // Save as Template if checked
    if (saveManualAsTemplate && templateName.trim()) {
       const newTemplate: MealTemplate = {
          id: Math.random().toString(36).substr(2, 9),
          name: templateName,
          items: [manualItem],
          qualityScore: qualityScore,
          totalCalories: cal,
          totalProtein: p,
          totalCarbs: c,
          totalFat: f
       };
       onSaveTemplate(newTemplate);
    }

    onSave({
      type: mealType,
      items: [manualItem],
      totalCalories: cal,
      totalProtein: p,
      totalCarbs: c,
      totalFat: f,
      qualityScore: qualityScore // Default score for manual
    });
  };

  const handleRetake = () => {
    setImagePreview(null);
    setAnalysisResult(null);
  };

  const handleLoadTemplate = (template: MealTemplate) => {
    setAnalysisResult({
      items: template.items,
      quality: template.qualityScore
    });
    setImagePreview("placeholder"); 
  };

  const handleSaveAsTemplate = () => {
    if (!analysisResult || !templateName.trim()) return;
    
    const totals = calculateTotals();
    const newTemplate: MealTemplate = {
      id: Math.random().toString(36).substr(2, 9),
      name: templateName,
      items: analysisResult.items,
      qualityScore: analysisResult.quality,
      totalCalories: totals.cal,
      totalProtein: totals.p,
      totalCarbs: totals.c,
      totalFat: totals.f
    };
    
    onSaveTemplate(newTemplate);
    setShowTemplateNameInput(false);
    setTemplateName('');
  };

  const renderMealTypeSelector = (darkBackground = false) => (
    <div className="mb-4">
      <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${darkBackground ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
        Meal Type
      </label>
      <div className="grid grid-cols-4 gap-2">
        {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setMealType(type)}
            className={`py-2 rounded-lg text-xs font-medium transition-all ${
              mealType === type
                ? 'bg-emerald-600 text-white shadow-md border border-emerald-500'
                : darkBackground 
                  ? 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );

  // Step 1: Mode Selection & Input
  if (!imagePreview && mode === 'ai') {
    return (
      <div className="fixed inset-0 bg-slate-900 dark:bg-slate-950 z-50 flex flex-col">
        <div className="p-4 flex justify-between items-center text-white">
          <h2 className="font-semibold text-lg">Log Meal</h2>
          <button onClick={onCancel}><X className="w-6 h-6" /></button>
        </div>
        
        <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
          {/* Tabs */}
          <div className="flex p-1 bg-slate-800 rounded-xl mb-4">
             <button 
               className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-medium text-sm transition-all"
               onClick={() => setMode('ai')}
             >
               AI Recognition
             </button>
             <button 
               className="flex-1 py-2 rounded-lg text-slate-400 font-medium text-sm hover:text-white transition-all"
               onClick={() => setMode('manual')}
             >
               Manual Entry
             </button>
          </div>

          <div className="text-center space-y-2 mt-2">
            <h3 className="text-2xl font-bold text-white">Upload Food Photo</h3>
            <p className="text-slate-400 max-w-xs mx-auto text-sm">Upload a photo from your gallery and let AI calculate nutrition.</p>
          </div>

          <div className="w-full max-w-sm mx-auto space-y-4">
             {/* Green Gallery Upload Box */}
             <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={galleryInputRef}
                  onChange={handleFileChange}
                />
                <button 
                  className="w-full h-40 border-2 border-emerald-500 bg-emerald-900/20 rounded-3xl flex flex-col items-center justify-center space-y-3 hover:bg-emerald-900/30 transition-all cursor-pointer group-hover:shadow-lg group-hover:shadow-emerald-900/50"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-emerald-400 font-bold text-lg">Upload from Gallery</span>
                </button>
             </div>
          </div>

          {/* Quick Add Templates */}
          {templates.length > 0 && (
            <div className="w-full max-w-sm mx-auto mt-6">
              <h3 className="text-slate-400 text-sm font-semibold mb-3 uppercase tracking-wider">Quick Add Template</h3>
              <div className="grid grid-cols-2 gap-3">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleLoadTemplate(template)}
                    className="bg-slate-800 hover:bg-slate-700 p-3 rounded-xl text-left transition-colors group"
                  >
                    <div className="font-semibold text-white group-hover:text-emerald-400 truncate">{template.name}</div>
                    <div className="text-xs text-slate-400">{template.totalCalories} kcal • Score: {template.qualityScore.score}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'manual') {
    return (
       <div className="fixed inset-0 bg-slate-900 dark:bg-slate-950 z-50 flex flex-col">
        <div className="p-4 flex justify-between items-center text-white">
          <h2 className="font-semibold text-lg">Log Meal</h2>
          <button onClick={onCancel}><X className="w-6 h-6" /></button>
        </div>
        
        <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
          {/* Tabs */}
          <div className="flex p-1 bg-slate-800 rounded-xl mb-4">
             <button 
               className="flex-1 py-2 rounded-lg text-slate-400 font-medium text-sm hover:text-white transition-all"
               onClick={() => setMode('ai')}
             >
               AI Recognition
             </button>
             <button 
               className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-medium text-sm transition-all"
               onClick={() => setMode('manual')}
             >
               Manual Entry
             </button>
          </div>

          <div className="space-y-4">
             {renderMealTypeSelector(true)}

             <div className="relative z-20">
               <label className="text-slate-300 text-sm mb-1 block">Food Name</label>
               <div className="flex gap-2">
                 <div className="relative flex-1">
                    <input 
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-emerald-500 outline-none"
                      placeholder="e.g. Avocado Toast"
                      value={manualForm.name}
                      onChange={e => handleManualNameChange(e.target.value)}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true);
                      }}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-30">
                        {suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                            onClick={() => handleSelectSuggestion(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                 </div>
                 <Button 
                    type="button" 
                    onClick={() => handleAutoCalculate()} 
                    disabled={!manualForm.name || isAutoCalculating}
                    className="px-3 bg-indigo-600 hover:bg-indigo-700 shadow-none rounded-xl"
                    title="Auto-Calculate Nutrition"
                 >
                    {isAutoCalculating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                 </Button>
               </div>
               <p className="text-[10px] text-slate-500 mt-1">Type a name to get suggestions, or click the sparkles to auto-fill nutrition.</p>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-slate-300 text-sm mb-1 block">Calories</label>
                 <input 
                   type="number"
                   className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-emerald-500 outline-none"
                   placeholder="0"
                   value={manualForm.calories}
                   onChange={e => setManualForm({...manualForm, calories: e.target.value})}
                 />
               </div>
               <div>
                 <label className="text-slate-300 text-sm mb-1 block">Protein (g)</label>
                 <input 
                   type="number"
                   className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-emerald-500 outline-none"
                   placeholder="0"
                   value={manualForm.protein}
                   onChange={e => setManualForm({...manualForm, protein: e.target.value})}
                 />
               </div>
               <div>
                 <label className="text-slate-300 text-sm mb-1 block">Carbs (g)</label>
                 <input 
                   type="number"
                   className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-emerald-500 outline-none"
                   placeholder="0"
                   value={manualForm.carbs}
                   onChange={e => setManualForm({...manualForm, carbs: e.target.value})}
                 />
               </div>
               <div>
                 <label className="text-slate-300 text-sm mb-1 block">Fat (g)</label>
                 <input 
                   type="number"
                   className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-emerald-500 outline-none"
                   placeholder="0"
                   value={manualForm.fat}
                   onChange={e => setManualForm({...manualForm, fat: e.target.value})}
                 />
               </div>
             </div>

             {/* Save as Template Option */}
             <div className="pt-2 border-t border-slate-800 mt-2">
                <div className="flex items-center space-x-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="saveTemplate" 
                    checked={saveManualAsTemplate} 
                    onChange={(e) => setSaveManualAsTemplate(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-600 bg-slate-800"
                  />
                  <label htmlFor="saveTemplate" className="text-sm text-slate-300 cursor-pointer select-none">
                    Save as Template
                  </label>
                </div>
                
                {saveManualAsTemplate && (
                  <div className="animate-fade-in">
                    <input 
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white focus:border-indigo-500 focus:ring-indigo-500 outline-none text-sm"
                      placeholder="Template Name (e.g. My Breakfast)"
                      value={templateName}
                      onChange={e => setTemplateName(e.target.value)}
                    />
                  </div>
                )}
             </div>
             
             <Button 
               fullWidth 
               size="lg"
               onClick={handleManualSubmit}
               disabled={!manualForm.name || !manualForm.calories || (saveManualAsTemplate && !templateName)}
               className="mt-4"
             >
               <Check className="mr-2 w-5 h-5" /> Log Meal
             </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2 & 3: Preview & Analyze / Results (AI Mode)
  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 z-50 overflow-y-auto no-scrollbar">
      {imagePreview !== "placeholder" ? (
        <div className="relative h-64 bg-slate-900">
           <img src={imagePreview!} alt="Preview" className="w-full h-full object-cover opacity-90" />
           <button 
             onClick={handleRetake} 
             className="absolute top-4 left-4 p-2 bg-black/50 rounded-full text-white backdrop-blur-sm"
           >
             <X className="w-5 h-5" />
           </button>
        </div>
      ) : (
        <div className="relative h-24 bg-slate-900 flex items-center px-4">
           <button onClick={handleRetake} className="text-white"><X className="w-6 h-6" /></button>
           <h2 className="text-white font-bold ml-4">Confirm Meal</h2>
        </div>
      )}

      <div className={`relative ${imagePreview !== "placeholder" ? "-mt-6 rounded-t-3xl" : ""} bg-slate-50 dark:bg-slate-900 p-6 min-h-[calc(100vh-250px)]`}>
        {!analysisResult ? (
          <div className="text-center pt-8">
            {isAnalyzing ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto" />
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Analyzing your meal...</h3>
                <p className="text-slate-500 dark:text-slate-400">Identifying foods and calculating portions</p>
              </div>
            ) : error ? (
               <div className="space-y-4">
                 <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                 <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Something went wrong</h3>
                 <p className="text-red-500">{error}</p>
                 <Button onClick={handleAnalyze}>Try Again</Button>
               </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-center space-x-2 text-emerald-700 dark:text-emerald-400 font-medium">
                   <Sparkles className="w-5 h-5" />
                   <span>AI Ready to analyze</span>
                </div>
                <Button size="lg" fullWidth onClick={handleAnalyze} className="shadow-xl shadow-emerald-200 dark:shadow-none">
                  Analyze Photo
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in pb-24">
            {/* Header Result */}
            <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Analysis Complete</h2>
                <div className="flex gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                  <span>{calculateTotals().cal} kcal</span>
                  <span>•</span>
                  <span>{analysisResult.items.length} items detected</span>
                </div>
              </div>
              <div className={`text-right ${analysisResult.quality.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                <div className="text-xs font-semibold uppercase tracking-wider">Quality Score</div>
                <div className="text-3xl font-bold">{analysisResult.quality.score}</div>
              </div>
            </div>

            {/* Meal Type Selection */}
            {renderMealTypeSelector(false)}

            {/* Quality Insight */}
            <Card className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/30">
               <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-1 flex items-center">
                 <Sparkles className="w-4 h-4 mr-2" /> AI Nutrition Insight
               </h4>
               <p className="text-sm text-indigo-800 dark:text-indigo-300 mb-2">{analysisResult.quality.explanation}</p>
               <div className="space-y-1">
                  {analysisResult.quality.suggestions.map((s, i) => (
                    <div key={i} className="flex items-start text-xs text-indigo-700 dark:text-indigo-400">
                      <span className="mr-2">•</span> {s}
                    </div>
                  ))}
               </div>
            </Card>

            {/* Items List */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800 dark:text-white">Identified Items</h3>
              {analysisResult.items.map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex justify-between items-center">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{item.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.portion}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{item.calories} kcal</div>
                    <div className="text-[10px] text-slate-400">
                       P:{item.protein} C:{item.carbs} F:{item.fat}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Save as Template */}
            <div className="pt-2">
              {!showTemplateNameInput ? (
                <button 
                  onClick={() => setShowTemplateNameInput(true)}
                  className="flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                >
                  <Bookmark className="w-4 h-4 mr-1.5" /> Save meal as template
                </button>
              ) : (
                <div className="flex items-center space-x-2 animate-fade-in">
                  <input
                    type="text"
                    placeholder="Template name (e.g. Breakfast Oatmeal)"
                    className="flex-1 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                  <button 
                    onClick={handleSaveAsTemplate}
                    disabled={!templateName.trim()}
                    className="bg-indigo-600 text-white p-2 rounded-lg disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowTemplateNameInput(false)}
                    className="text-slate-400 p-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
              <div className="max-w-md mx-auto flex gap-3">
                 <Button variant="ghost" fullWidth onClick={handleRetake}>Retake</Button>
                 <Button fullWidth onClick={handleConfirm}>
                   <Check className="w-4 h-4 mr-2" /> Log Meal
                 </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
