import React from 'react';
// Import custom, standard lucide indicators for branding, security roles, and status
import { ShieldCheck, UserCheck, Briefcase, Sparkles } from 'lucide-react';

/**
 * Interface definition for RoleSelector component.
 * Allows managing stateful role shifts and visualizing server-side Gemini system health.
 */
interface RoleSelectorProps {
  currentRole: 'recruiter' | 'manager' | 'seeker'; // The currently active dashboard layout view
  onChange: (role: 'recruiter' | 'manager' | 'seeker') => void; // Trigger callback on select
  hasAI: boolean; // Tracks whether standard live API key configuration is active on the server
}

/**
 * RoleSelector renders the global application top navigation bar, featuring:
 * 1. Branded logo and application description.
 * 2. Tri-role mode switcher (Recruiter, Hiring Manager, Seeker views) for full pipeline visualization.
 * 3. Real-time Gemini API status pill.
 */
export default function RoleSelector({ currentRole, onChange, hasAI }: RoleSelectorProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 space-y-4 md:space-y-0">
          
          {/* Logo, Branding & Application Intent */}
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 text-slate-900 p-2 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Briefcase className="w-6 h-6" id="app-logo-icon" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                TalentRecruit AI
              </h1>
              <p className="text-xs text-slate-400 font-medium">AI-Enhanced Recruitment & Talent Suite</p>
            </div>
          </div>

          {/* Role selection switcher - permits evaluating different pipeline experiences instantly */}
          <div className="flex flex-wrap items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start md:self-center">
            {/* 1. HR / Technical Recruiter Button */}
            <button
              id="role-btn-recruiter"
              onClick={() => onChange('recruiter')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
                currentRole === 'recruiter'
                  ? 'bg-emerald-500 text-slate-900 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>HR / Recruiter</span>
            </button>
            
            {/* 2. Hiring Manager / Reviewer Button */}
            <button
              id="role-btn-manager"
              onClick={() => onChange('manager')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
                currentRole === 'manager'
                  ? 'bg-emerald-500 text-slate-900 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Hiring Manager</span>
            </button>
            
            {/* 3. Job Seeker / Candidate Studio Button */}
            <button
              id="role-btn-seeker"
              onClick={() => onChange('seeker')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
                currentRole === 'seeker'
                  ? 'bg-emerald-500 text-slate-900 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Job Seeker</span>
            </button>
          </div>

          {/* AI Connection Status Indicator: visual confirmation of live LLM routing vs heuristic local engine */}
          <div className="flex items-center space-x-2 bg-slate-950/60 px-3 py-1.5 rounded-full border border-slate-800 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${hasAI ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-slate-300 font-mono">
              {hasAI ? 'Gemini 3.5-Flash Live' : 'AI Simulation Mode'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
