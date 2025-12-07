import { GoogleGenAI, Type, Chat } from "@google/genai";
import { FoodItem, QualityScore, UserProfile, Recipe } from "../types";

const getClient = () => {
  // Support multiple environment variable standards for local dev (Vite, CRA, Node)
  const apiKey = 
    process.env.API_KEY || 
    process.env.REACT_APP_API_KEY || 
    (import.meta as any).env?.VITE_API_KEY;

  if (!apiKey) {
    throw new Error("API_KEY is not set. For local development, create a .env file and set VITE_API_KEY=your_key");
  }
  return new GoogleGenAI({ apiKey });
};

interface AIAnalysisResult {
  items: FoodItem[];
  qualityScore: QualityScore;
}

export const analyzeFoodImage = async (base64Image: string): Promise<AIAnalysisResult> => {
  const ai = getClient();
  
  // Clean base64 string if it contains data URI prefix
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  const prompt = `
    Analyze this food image. Identify all food items present.
    Estimate the portion size, calories, protein (g), carbs (g), and fat (g) for each item.
    Also, calculate a "Meal Quality Score" from 0-100 based on whole food ingredients, nutrient density, and lack of processing.
    Provide a brief explanation for the score and 2-3 short suggestions to improve the nutritional value.
    
    Return the response in JSON format matching this structure:
    {
      "items": [
        { "name": "Grilled Chicken", "calories": 150, "protein": 30, "carbs": 0, "fat": 3, "portion": "4 oz breast", "confidence": "High" }
      ],
      "qualityScore": {
        "score": 85,
        "explanation": "High protein, whole foods.",
        "suggestions": ["Add leafy greens", "Use less oil"]
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fat: { type: Type.NUMBER },
                  portion: { type: Type.STRING },
                  confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                },
                required: ["name", "calories", "protein", "carbs", "fat", "portion", "confidence"]
              }
            },
            qualityScore: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                explanation: { type: Type.STRING },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["score", "explanation", "suggestions"]
            }
          },
          required: ["items", "qualityScore"]
        }
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text) as AIAnalysisResult;
    return result;

  } catch (error) {
    console.error("Error analyzing food:", error);
    throw error;
  }
};

export const createCoachChat = (userProfile: UserProfile): Chat => {
  const ai = getClient();
  
  const systemInstruction = `
    You are a friendly and knowledgeable AI Nutrition Coach named NutriAI.
    
    User Context:
    - Name: ${userProfile.name}
    - Age: ${userProfile.age}
    - Goal: ${userProfile.goal} (${userProfile.targetWeightKg}kg target)
    - Dietary Preference: ${userProfile.dietaryPreference}
    - Daily Calorie Target: ${userProfile.macroTargets.calories} kcal
    - Diet Type: Balanced (approx 45% carbs, 25% protein, 30% fat)
    
    Your Responsibilities:
    1. Answer questions about food choices and their nutritional value.
    2. Suggest healthier alternatives consistent with their ${userProfile.dietaryPreference} diet.
    3. Help the user stay motivated towards their goal of ${userProfile.goal}.
    4. Explain the 'Quality Score' concept (Whole foods = high score, Processed = low score).
    5. Be ready to generate recipes if the user asks.
    
    Style:
    - Concise and conversational.
    - Encouraging but honest.
    - Use emojis occasionally.
    - Format lists clearly.
  `;

  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction,
    }
  });
};

export const generateRecipe = async (ingredients: string, userProfile: UserProfile): Promise<Recipe> => {
  const ai = getClient();
  const prompt = `
    Create a healthy recipe using these ingredients: ${ingredients}.
    The user is ${userProfile.dietaryPreference}.
    Their goal is ${userProfile.goal}.
    Provide the recipe name, estimated calories per serving, ingredient list, instructions, and macro nutrients.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
            macros: {
              type: Type.OBJECT,
              properties: {
                protein: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                fat: { type: Type.NUMBER }
              },
              required: ["protein", "carbs", "fat"]
            }
          },
          required: ["name", "calories", "ingredients", "instructions", "macros"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as Recipe;
  } catch (error) {
    console.error("Error generating recipe:", error);
    throw error;
  }
};

export const getNutritionFromText = async (foodName: string): Promise<FoodItem> => {
  const ai = getClient();
  const prompt = `
    Estimate nutrition for a standard serving of: "${foodName}".
    Return the item name (be specific), calories, protein (g), carbs (g), fat (g), and portion description.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            portion: { type: Type.STRING },
            confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
          },
          required: ["name", "calories", "protein", "carbs", "fat", "portion", "confidence"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as FoodItem;
  } catch (error) {
    console.error("Error estimating nutrition:", error);
    throw error;
  }
};

export const getFoodSuggestions = async (query: string): Promise<string[]> => {
  const ai = getClient();
  const prompt = `
    List 5 common food item names that match or complete the search query: "${query}".
    Return only the names as an array of strings. Keep it concise.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["suggestions"]
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const result = JSON.parse(text);
    return result.suggestions || [];
  } catch (error) {
    console.error("Error getting suggestions:", error);
    return [];
  }
};