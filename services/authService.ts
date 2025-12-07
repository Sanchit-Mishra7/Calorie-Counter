
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

  