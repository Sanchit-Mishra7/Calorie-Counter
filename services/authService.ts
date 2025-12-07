
import { DailyLog, UserAccount, UserProfile } from '../types';

// Keys for LocalStorage
const USERS_KEY = 'cc_users';
const CURRENT_USER_KEY = 'cc_current_user_id';
const DATA_PREFIX = 'cc_data_';

// Simple "hashing" for demo purposes (NOT secure for production)
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

interface UserData {
  profile: UserProfile | null;
  logs: DailyLog[];
}

export const authService = {
  // --- AUTHENTICATION ---

  register: (username: string, password: string): UserAccount => {
    const users = authService.getAllUsers();
    
    if (users.find(u => u.username === username)) {
      throw new Error('Username already exists');
    }

    const newUser: UserAccount = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      passwordHash: hashPassword(password),
      createdAt: Date.now()
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Initialize empty data for new user
    authService.saveUserData(newUser.id, { profile: null, logs: [] });

    return newUser;
  },

  login: (username: string, password: string): UserAccount => {
    const users = authService.getAllUsers();
    const user = users.find(u => u.username === username);

    if (!user || user.passwordHash !== hashPassword(password)) {
      throw new Error('Invalid username or password');
    }

    // Set session
    localStorage.setItem(CURRENT_USER_KEY, user.id);
    return user;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): UserAccount | null => {
    const userId = localStorage.getItem(CURRENT_USER_KEY);
    if (!userId) return null;
    
    const users = authService.getAllUsers();
    return users.find(u => u.id === userId) || null;
  },

  getAllUsers: (): UserAccount[] => {
    const usersJson = localStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  },

  // --- DATABASE ---

  saveUserData: (userId: string, data: UserData) => {
    localStorage.setItem(DATA_PREFIX + userId, JSON.stringify(data));
  },

  loadUserData: (userId: string): UserData => {
    const dataJson = localStorage.getItem(DATA_PREFIX + userId);
    if (dataJson) {
      return JSON.parse(dataJson);
    }
    // Default structure if no data exists
    return {
      profile: null,
      logs: [{ date: new Date().toISOString().split('T')[0], meals: [] }]
    };
  }
};
