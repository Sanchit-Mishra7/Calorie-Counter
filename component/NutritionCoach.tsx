
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
         
         