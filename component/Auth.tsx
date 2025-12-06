import React, { useState } from 'react';
import { Button } from './ui/Button';
import { authService } from '../services/authService';
import { UserAccount } from '../types';
import { Leaf, ArrowRight, Lock, User } from 'lucide-react';

 return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-100 dark:border-slate-800 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg mx-auto mb-4">
            C
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {isLogin ? 'Sign in to access your meal history' : 'Join Calorie Counter to start your journey'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 ml-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="Enter username"
              />
            </div>
          </div>
