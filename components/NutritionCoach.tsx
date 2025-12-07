
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Recipe } from '../types';
import { createCoachChat, generateRecipe } from '../services/geminiService';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Send, Bot, Loader2, Utensils, ChefHat, Sparkles, ChefHat as ChefIcon, AlertTriangle } from 'lucide-react';
import { Chat, GenerateContentResponse } from '@google/genai';

interface NutritionCoachProps {
  userProfile: UserProfile;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  recipe?: Recipe;
}

export const NutritionCoach: React.FC<NutritionCoachProps> = ({ userProfile }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hi ${userProfile.name}! I'm your AI Nutrition Coach. Ask me anything about your diet, food choices, or how to reach your goal of ${userProfile.goal.toLowerCase()}!`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ingredientsInput, setIngredientsInput] = useState('');
  const [showRecipeBuilder, setShowRecipeBuilder] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session with error handling
    try {
      chatRef.current = createCoachChat(userProfile);
      setApiError(null);
    } catch (e: any) {
      console.error("Failed to initialize chat:", e);
      setApiError("API Key missing. Please check your environment configuration.");
    }
  }, [userProfile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (textOverride?: string) => {
    if (apiError) return;
    const textToSend = textOverride || input;
    if (!textToSend.trim() || !chatRef.current || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowRecipeBuilder(false); // Close builder if open

    try {
      const response = await chatRef.current.sendMessageStream({ message: userMessage.text });
      
      let fullResponse = "";
      const modelMessageId = (Date.now() + 1).toString();
      
      // Add placeholder for model response
      setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '' }]);

      for await (const chunk of response) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullResponse += c.text;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === modelMessageId ? { ...msg, text: fullResponse } : msg
            )
          );
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "I'm having trouble connecting right now. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestFood = () => {
    handleSend(`Suggest 3 healthy food options for me considering my ${userProfile.dietaryPreference} preference and my macro goals.`);
  };

  const handleGenerateRecipe = async () => {
    if (apiError || !ingredientsInput.trim()) return;
    
    // Add User Request
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: `Create a ${userProfile.dietaryPreference} recipe using: ${ingredientsInput}`
    };
    setMessages(prev => [...prev, userMessage]);
    setIngredientsInput('');
    setIsLoading(true);
    setShowRecipeBuilder(false);

    try {
      // Call recipe generation service
      const recipe = await generateRecipe(ingredientsInput, userProfile);
      
      const recipeMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Here is a recipe I created for you!",
        recipe: recipe
      };
      setMessages(prev => [...prev, recipeMessage]);
    } catch (e) {
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: "Sorry, I couldn't generate a recipe right now. Please try again or check your ingredients." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (apiError) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Setup Required</h2>
        <p className="text-slate-600 dark:text-slate-300 max-w-sm mb-4">
          The AI features require an API Key. If you are the developer, please add <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">VITE_API_KEY</code> to your environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Coach</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Ask about nutrition & goals</p>
          </div>
        </div>
      </div>

      {/* AI Tools Bar */}
      <div className="px-2 mb-3">
         <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
            <button 
              onClick={handleSuggestFood}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-sm whitespace-nowrap active:bg-slate-50 dark:active:bg-slate-700 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Utensils className="w-3 h-3 text-orange-500" />
              <span>Suggest Food</span>
            </button>
            <button 
              onClick={() => setShowRecipeBuilder(!showRecipeBuilder)}
              disabled={isLoading}
              className={`flex items-center space-x-2 border rounded-full px-4 py-2 text-xs font-medium shadow-sm whitespace-nowrap active:bg-slate-50 dark:active:bg-slate-700 transition-colors ${showRecipeBuilder ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <ChefHat className="w-3 h-3 text-indigo-500" />
              <span>Recipe Builder</span>
            </button>
         </div>
         
         {showRecipeBuilder && (
           <div className="mt-2 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl animate-fade-in border border-indigo-100 dark:border-indigo-800/30">
             <label className="text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-2 block flex items-center">
               <Sparkles className="w-3 h-3 mr-1" />
               Enter ingredients (comma separated)
             </label>
             <div className="flex gap-2">
               <input 
                 className="flex-1 text-sm rounded-lg border-indigo-200 dark:border-indigo-700 dark:bg-slate-800 dark:text-white focus:ring-indigo-500 p-2"
                 placeholder="e.g. chicken, spinach, garlic"
                 value={ingredientsInput}
                 onChange={(e) => setIngredientsInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleGenerateRecipe()}
               />
               <Button size="sm" onClick={handleGenerateRecipe} disabled={!ingredientsInput}>
                 Generate
               </Button>
             </div>
           </div>
         )}
      </div>

      <Card className="flex-1 overflow-hidden flex flex-col p-0 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-200 dark:shadow-none'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none shadow-sm'
                }`}
              >
                {msg.text}
              </div>
              
              {/* Render Recipe Card if present */}
              {msg.recipe && (
                <div className="mt-2 max-w-[95%] md:max-w-[60%] w-full bg-white dark:bg-slate-800 border border-orange-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
                  <div className="bg-orange-50 dark:bg-orange-900/30 p-3 border-b border-orange-100 dark:border-orange-800/30 flex justify-between items-center">
                     <div className="flex items-center">
                        <ChefIcon className="w-5 h-5 text-orange-500 mr-2" />
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{msg.recipe.name}</h3>
                     </div>
                     <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{msg.recipe.calories} kcal</span>
                  </div>
                  <div className="p-4 space-y-4">
                     <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded-lg">
                           <div className="font-bold text-slate-900 dark:text-slate-200">{msg.recipe.macros.protein}g</div>
                           <div className="text-slate-500 dark:text-slate-400">Protein</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded-lg">
                           <div className="font-bold text-slate-900 dark:text-slate-200">{msg.recipe.macros.carbs}g</div>
                           <div className="text-slate-500 dark:text-slate-400">Carbs</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700 p-2 rounded-lg">
                           <div className="font-bold text-slate-900 dark:text-slate-200">{msg.recipe.macros.fat}g</div>
                           <div className="text-slate-500 dark:text-slate-400">Fat</div>
                        </div>
                     </div>
                     
                     <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">Ingredients</h4>
                        <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc pl-4 space-y-1">
                           {msg.recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                        </ul>
                     </div>
                     
                     <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">Instructions</h4>
                        <ol className="text-xs text-slate-600 dark:text-slate-400 list-decimal pl-4 space-y-1">
                           {msg.recipe.instructions.map((ins, i) => <li key={i}>{ins}</li>)}
                        </ol>
                     </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center space-x-2">
                 <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                 <span className="text-xs text-slate-400">Thinking...</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 rounded-b-2xl">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Is pizza okay for dinner?"
              className="flex-1 bg-slate-100 dark:bg-slate-700 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              disabled={isLoading || !!apiError}
            />
            <Button 
              onClick={() => handleSend()} 
              disabled={!input.trim() || isLoading || !!apiError}
              className={`px-4 rounded-xl ${!input.trim() || isLoading ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500' : 'bg-emerald-600 text-white'}`}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
