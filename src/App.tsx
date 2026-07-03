import React, { useState, useEffect } from 'react';
// Switcher navigation component to alter current role dashboard layout
import RoleSelector from './components/RoleSelector.tsx';
// HR Recruiter panel component (Resume upload, matching profile analysis, drafting contract offers)
import RecruiterDashboard from './components/RecruiterDashboard.tsx';
// Hiring Manager panel component (Interview scheduler, AI discussion notes rating evaluation)
import HiringManagerDashboard from './components/HiringManagerDashboard.tsx';
// Candidate/Seeker workspace component (Role search, assessments quiz, mock speech rehearsal)
import JobSeekerDashboard from './components/JobSeekerDashboard.tsx';
// Data entity type definitions imported for complete TypeScript compiler safety
import { Job, Candidate, Application, Interview, Offer } from './types.ts';
// Beautiful, cohesive vector layout indicators
import { Github, Linkedin, Mail, Sparkles, Heart } from 'lucide-react';

/**
 * Root App Component:
 * Synchronizes the global relational data collections from the Express JSON database,
 * manages global loading transitions, and routes views contextually using a role switcher.
 */
export default function App() {
  // state variable representing current user viewpoint (Recruiter vs Hiring Manager vs Seeker)
  const [currentRole, setCurrentRole] = useState<'recruiter' | 'manager' | 'seeker'>('recruiter');
  
  // Flag indicating if standard Gemini secret key configuration is available on the server
  const [hasAI, setHasAI] = useState<boolean>(false);
  
  // Tracks pending data synchronization during bootstrapping transitions
  const [loading, setLoading] = useState<boolean>(true);

  // States containing complete records synchronized from server-persisted JSON
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  /**
   * fetchAllData(): Performs a parallel query fetch request across all API endpoints,
   * completely refreshing the clientside local store data for reactive synchronization.
   */
  const fetchAllData = async () => {
    try {
      const [healthRes, jobsRes, candRes, appRes, intRes, offerRes] = await Promise.all([
        fetch('/api/health'),       // Check AI configuration state
        fetch('/api/jobs'),         // Load jobs catalog
        fetch('/api/candidates'),   // Load parsed candidate list
        fetch('/api/applications'), // Load applied job seeker map
        fetch('/api/interviews'),   // Load technical discussion rounds
        fetch('/api/offers')        // Load drafted legal offer letters
      ]);

      // Parse and assign AI setup health status
      if (healthRes.ok) {
        const health = await healthRes.json();
        setHasAI(health.hasAI);
      }

      // Populate local state variables with response payload arrays
      if (jobsRes.ok) setJobs(await jobsRes.json());
      if (candRes.ok) setCandidates(await candRes.json());
      if (appRes.ok) setApplications(await appRes.json());
      if (intRes.ok) setInterviews(await intRes.json());
      if (offerRes.ok) setOffers(await offerRes.json());

    } catch (e) {
      console.error('Failed to load system collections:', e);
    } finally {
      // Discard spinner overlay to present the selected recruiter or seeker dashboard
      setLoading(false);
    }
  };

  /**
   * React Lifecycle hook to fetch records immediately on component initial render.
   */
  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between" id="app-container">
      <div>
        {/* Global navigation component facilitating tri-dashboard role swapping */}
        <RoleSelector currentRole={currentRole} onChange={setCurrentRole} hasAI={hasAI} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            // Spinner graphic centered during active network queries
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
              <p className="text-slate-500 text-sm font-medium">Bootstrapping NoSQL recruitment pipeline...</p>
            </div>
          ) : (
            <>
              {/* Recruiter Workspace layout */}
              {currentRole === 'recruiter' && (
                <RecruiterDashboard
                  jobs={jobs}
                  candidates={candidates}
                  applications={applications}
                  offers={offers}
                  onRefresh={fetchAllData}
                  hasAI={hasAI}
                />
              )}

              {/* Hiring Manager Workspace layout */}
              {currentRole === 'manager' && (
                <HiringManagerDashboard
                  jobs={jobs}
                  candidates={candidates}
                  applications={applications}
                  interviews={interviews}
                  onRefresh={fetchAllData}
                  hasAI={hasAI}
                />
              )}

              {/* Job Seeker Practice Studio layout */}
              {currentRole === 'seeker' && (
                <JobSeekerDashboard
                  jobs={jobs}
                  onRefresh={fetchAllData}
                  hasAI={hasAI}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mandatory Footer with custom branding, developer name, and social handles */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 mt-16" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <div className="flex items-center space-x-2 text-white font-bold text-sm tracking-tight">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>TalentRecruit AI Suite</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Designed & implemented with TypeScript, Express, and Gemini 3.5-Flash.</p>
            </div>

            {/* Candidate details & social links */}
            <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:space-x-8">
              <div className="text-xs">
                <span className="text-slate-500">Developer:</span>{' '}
                <strong className="text-white font-semibold">Varun Rawat</strong>
              </div>

              <div className="flex space-x-4">
                <a
                  href="https://github.com/varunrawat"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-white transition flex items-center space-x-1 text-xs"
                  id="footer-github-link"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
                <a
                  href="https://linkedin.com/in/varunrawat"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-white transition flex items-center space-x-1 text-xs"
                  id="footer-linkedin-link"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </a>
                <a
                  href="mailto:varunrawatmailbox2507@gmail.com"
                  className="text-slate-400 hover:text-white transition flex items-center space-x-1 text-xs"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800/60 text-center text-[10px] text-slate-500 flex items-center justify-center space-x-1.5">
            <span>Made with</span>
            <Heart className="w-3 h-3 text-rose-500 fill-current" />
            <span>for House of Edtech Recruitment Challenge &copy; 2026.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
