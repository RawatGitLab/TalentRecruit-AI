import React, { useState, useEffect } from 'react';
// Import beautiful layout icons for dashboard action buttons, badges, and structural tabs
import { 
  Plus, Edit, Trash2, Sparkles, UserPlus, CheckCircle, Clock, 
  MapPin, DollarSign, Calendar, Eye, Send, FileText, LayoutGrid, 
  List, TrendingUp, BarChart3, Users, Briefcase, Award, ShieldAlert
} from 'lucide-react';
import { Job, Candidate, Application, Offer, Assessment } from '../types.ts';

/**
 * RecruiterDashboard Props representing state collections synchronized from
 * the root App container component.
 */
interface RecruiterDashboardProps {
  jobs: Job[];                     // Synchronized job openings
  candidates: Candidate[];         // Synchronized parsed candidates
  applications: Application[];     // Candidate-to-Job application mappings
  offers: Offer[];                 // AI-drafted contract offers
  onRefresh: () => void;           // Global reload trigger to refresh NoSQL disk records
  hasAI: boolean;                  // Live Gemini client operational flag
}

/**
 * RecruiterDashboard component provides the core control center for corporate HR specialists:
 * 1. Active Jobs Tab: Create, Edit, Delete job openings & trigger Gemini description optimization.
 * 2. Candidates Tab: Register raw candidate profiles with custom skills, view parsed experiences, and delete profiles.
 * 3. Applications Tab: Connect any candidate to a job, view match percentage, change selection pipeline states, and trigger onboarding.
 * 4. Offer Letters Tab: Draft high-engagement job contract offers in beautiful markdown via Gemini, view, and send them.
 * 5. Analytics Tab: Visualize key metrics (active pipelines, hire rates, top departments, and average match statistics).
 */
export default function RecruiterDashboard({ 
  jobs, 
  candidates, 
  applications, 
  offers, 
  onRefresh,
  hasAI 
}: RecruiterDashboardProps) {
  // Views inside Recruiter: defaults to 'jobs' list view
  const [activeTab, setActiveTab] = useState<'jobs' | 'candidates' | 'applications' | 'offers' | 'analytics'>('jobs');
  
  // Job Form state for creating and editing job posts
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDept, setJobDept] = useState('');
  const [jobLoc, setJobLoc] = useState('');
  const [jobType, setJobType] = useState<'Full-time' | 'Part-time' | 'Contract' | 'Remote'>('Full-time');
  const [jobDesc, setJobDesc] = useState('');
  const [jobReqs, setJobReqs] = useState('');
  const [isOptimizingJob, setIsOptimizingJob] = useState(false);

  // Candidate Match Application mapping state
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [matchNotes, setMatchNotes] = useState('');
  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false);

  // Offer Contract Creation State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerCandidateId, setOfferCandidateId] = useState('');
  const [offerJobId, setOfferJobId] = useState('');
  const [offerSalary, setOfferSalary] = useState(120000);
  const [offerBenefits, setOfferBenefits] = useState('Medical, 401k matching, Unlimited PTO');
  const [offerStartDate, setOfferStartDate] = useState(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [isGeneratingOffer, setIsGeneratingOffer] = useState(false);
  const [selectedOfferLetter, setSelectedOfferLetter] = useState<string | null>(null);

  // Manual Candidate Creation state
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [candPhone, setCandPhone] = useState('');
  const [candSkills, setCandSkills] = useState('');
  const [candExperience, setCandExperience] = useState('');

  // Reset Job form helper to avoid lingering states across edits
  const resetJobForm = () => {
    setEditingJob(null);
    setJobTitle('');
    setJobDept('Engineering');
    setJobLoc('');
    setJobType('Full-time');
    setJobDesc('');
    setJobReqs('');
  };

  // Open Edit Job Form
  const openEditJob = (job: Job) => {
    setEditingJob(job);
    setJobTitle(job.title);
    setJobDept(job.department);
    setJobLoc(job.location);
    setJobType(job.type);
    setJobDesc(job.description);
    setJobReqs(job.requirements.join('\n'));
    setShowJobModal(true);
  };

  // Submit Job
  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: jobTitle,
      department: jobDept,
      location: jobLoc,
      type: jobType,
      status: 'Open',
      description: jobDesc,
      requirements: jobReqs.split('\n').filter(r => r.trim() !== ''),
    };

    const url = editingJob ? `/api/jobs/${editingJob.id}` : '/api/jobs';
    const method = editingJob ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowJobModal(false);
        resetJobForm();
        onRefresh();
      }
    } catch (err) {
      console.error('Job save failed:', err);
    }
  };

  // Delete Job
  const handleDeleteJob = async (id: string) => {
    if (confirm('Are you sure you want to delete this job and all associated applications?')) {
      try {
        await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
        onRefresh();
      } catch (err) {
        console.error('Job deletion failed:', err);
      }
    }
  };

  // Optimize Job via Gemini
  const handleOptimizeJob = async (id: string) => {
    setIsOptimizingJob(true);
    try {
      const res = await fetch(`/api/jobs/${id}/optimize`, { method: 'POST' });
      if (res.ok) {
        alert('Job Description successfully optimized with Gemini AI!');
        onRefresh();
      } else {
        const data = await res.json();
        alert(`Optimization failed: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Optimization request failed:', err);
    } finally {
      setIsOptimizingJob(false);
    }
  };

  // Create Application / Match Candidate
  const handleMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateId || !selectedJobId) {
      alert('Please select both a candidate and a job');
      return;
    }
    setIsSubmittingMatch(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: selectedCandidateId,
          jobId: selectedJobId,
          status: 'Applied',
          notes: matchNotes,
        }),
      });
      if (res.ok) {
        setShowMatchModal(false);
        setSelectedCandidateId('');
        setSelectedJobId('');
        setMatchNotes('');
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to match candidate.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingMatch(false);
    }
  };

  // Handle Application Status Update
  const handleUpdateAppStatus = async (appId: string, newStatus: string) => {
    try {
      await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Generate AI Offer
  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerCandidateId || !offerJobId) {
      alert('Please select both a candidate and a job');
      return;
    }
    setIsGeneratingOffer(true);
    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: offerCandidateId,
          jobId: offerJobId,
          salary: offerSalary,
          benefits: offerBenefits.split(',').map(b => b.trim()),
          startDate: offerStartDate,
          status: 'Draft',
        }),
      });
      if (res.ok) {
        setShowOfferModal(false);
        setOfferCandidateId('');
        setOfferJobId('');
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to generate offer.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingOffer(false);
    }
  };

  // Manual Candidate Creation
  const handleCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = candSkills.split(',').map(s => s.trim()).filter(s => s !== '');
    const expObj = candExperience ? [
      {
        company: 'Previous Employer',
        title: 'Software Developer',
        duration: candExperience,
        achievements: ['Contributed significantly to team projects.']
      }
    ] : [];

    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: candName,
          email: candEmail,
          phone: candPhone,
          status: 'active',
          parsedData: {
            skills: skillsArray,
            experience: expObj,
            education: [{ degree: 'College Degree', university: 'Generic University', year: 2020 }],
            certifications: []
          }
        }),
      });
      if (res.ok) {
        setShowCandidateModal(false);
        setCandName('');
        setCandEmail('');
        setCandPhone('');
        setCandSkills('');
        setCandExperience('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Candidate
  const handleDeleteCandidate = async (id: string) => {
    if (confirm('Are you sure you want to delete this candidate?')) {
      try {
        await fetch(`/api/candidates/${id}`, { method: 'DELETE' });
        onRefresh();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Onboarding Workflow List (Triggered for hired applications)
  const onboardingSteps = [
    { title: 'IT Setup', desc: 'Provision laptop, email account, and Slack access' },
    { title: 'Legal Documentation', desc: 'Sign contract, NDAs, and upload tax papers' },
    { title: 'Manager One-on-One', desc: 'Schedule initial 30-min alignment meeting' },
    { title: 'Security Training', desc: 'Complete safety and compliance video courses' }
  ];

  return (
    <div className="py-6">
      {/* Recruiter Navigation Bar */}
      <div className="flex space-x-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 mb-8 max-w-fit">
        <button
          id="rec-tab-jobs"
          onClick={() => setActiveTab('jobs')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === 'jobs' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Active Jobs ({jobs.length})</span>
        </button>
        <button
          id="rec-tab-candidates"
          onClick={() => setActiveTab('candidates')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === 'candidates' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Candidates ({candidates.length})</span>
        </button>
        <button
          id="rec-tab-applications"
          onClick={() => setActiveTab('applications')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === 'applications' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Applications ({applications.length})</span>
        </button>
        <button
          id="rec-tab-offers"
          onClick={() => setActiveTab('offers')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === 'offers' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Offer Letters ({offers.length})</span>
        </button>
        <button
          id="rec-tab-analytics"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === 'analytics' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>AI Analytics</span>
        </button>
      </div>

      {/* JOBS TAB */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Active Jobs Pipeline</h2>
              <p className="text-sm text-slate-500">Create, edit, and optimize target job descriptions using Gemini AI.</p>
            </div>
            <button
              id="btn-create-job"
              onClick={() => { resetJobForm(); setShowJobModal(true); }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 text-sm font-semibold cursor-pointer shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Job</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {jobs.map(job => (
              <div key={job.id} id={`job-card-${job.id}`} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-full font-medium border border-slate-200">
                      {job.department}
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium border border-emerald-200">
                      {job.type}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1 leading-snug">{job.title}</h3>
                  <div className="flex items-center text-slate-500 text-xs mb-4">
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    <span>{job.location}</span>
                  </div>
                  <p className="text-slate-600 text-sm line-clamp-3 mb-4 leading-relaxed">{job.description}</p>
                  
                  {job.requirements.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Key Competencies:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {job.requirements.slice(0, 3).map((req, i) => (
                          <span key={i} className="bg-slate-550 text-slate-700 bg-slate-50 text-xs px-2 py-0.5 rounded border border-slate-200">{req}</span>
                        ))}
                        {job.requirements.length > 3 && <span className="text-slate-400 text-xs font-semibold">+{job.requirements.length - 3} more</span>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                  <div className="flex space-x-1">
                    <button
                      id={`btn-edit-job-${job.id}`}
                      onClick={() => openEditJob(job)}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg cursor-pointer transition"
                      title="Edit job"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      id={`btn-delete-job-${job.id}`}
                      onClick={() => handleDeleteJob(job.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition"
                      title="Delete job"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    id={`btn-optimize-job-${job.id}`}
                    onClick={() => handleOptimizeJob(job.id)}
                    disabled={isOptimizingJob}
                    className="flex items-center space-x-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isOptimizingJob ? 'Optimizing...' : 'AI Optimize'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CANDIDATES TAB */}
      {activeTab === 'candidates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Candidate Profiles</h2>
              <p className="text-sm text-slate-500">Review candidate details, extracted skills, career evaluations, and match status.</p>
            </div>
            <div className="flex space-x-3">
              <button
                id="btn-add-cand"
                onClick={() => setShowCandidateModal(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center space-x-2 text-sm font-semibold cursor-pointer shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Candidate</span>
              </button>
              <button
                id="btn-match-cand"
                onClick={() => setShowMatchModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 text-sm font-semibold cursor-pointer shadow-sm transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Match to Job</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate Info</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Parsed Skills</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Culture Fit</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tenure Risk</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {candidates.map(cand => (
                  <tr key={cand.id} id={`cand-row-${cand.id}`} className="hover:bg-slate-50/55 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{cand.name}</div>
                      <div className="text-slate-500 text-xs font-mono">{cand.email}</div>
                      <div className="text-slate-400 text-xs">{cand.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {cand.parsedData.skills.map((skill, i) => (
                          <span key={i} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded border border-slate-200">{skill}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {cand.aiAnalysis?.cultureFit ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-slate-800">{cand.aiAnalysis.cultureFit}%</span>
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${cand.aiAnalysis.cultureFit}%` }} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Unassessed</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {cand.aiAnalysis?.retentionRisk ? (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          cand.aiAnalysis.retentionRisk === 'low'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : cand.aiAnalysis.retentionRisk === 'medium'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {cand.aiAnalysis.retentionRisk.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        cand.status === 'hired'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : cand.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : cand.status === 'on_hold'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-slate-100 text-slate-800 border-slate-300'
                      }`}>
                        {cand.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteCandidate(cand.id)}
                        className="text-red-500 hover:text-red-700 p-2 cursor-pointer transition rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APPLICATIONS TAB */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Job Applications Pipeline</h2>
            <p className="text-sm text-slate-500">Monitor overall candidate scores, matching index, interview status and onboarding tasks.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {applications.map(app => {
              const cand = candidates.find(c => c.id === app.candidateId);
              const job = jobs.find(j => j.id === app.jobId);
              if (!cand || !job) return null;

              return (
                <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div>
                      <div className="flex items-center space-x-3 mb-1.5">
                        <span className="text-lg font-bold text-slate-900">{cand.name}</span>
                        <span className="text-slate-400 font-medium">➔</span>
                        <span className="text-sm font-bold text-indigo-600">{job.title}</span>
                      </div>
                      <p className="text-slate-500 text-xs flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        <span>Applied on {new Date(app.appliedDate).toLocaleDateString()}</span>
                      </p>
                      <p className="text-slate-600 text-sm mt-3 border-l-2 border-slate-200 pl-3 italic">
                        &ldquo;{app.notes || 'No standard application notes.'}&rdquo;
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                      {/* Match indices */}
                      <div className="text-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/60">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Match Index</div>
                        <div className="text-lg font-bold text-indigo-600">{app.matchPercentage}%</div>
                      </div>

                      <div className="text-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/60">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">AI Score</div>
                        <div className="text-lg font-bold text-emerald-600">{app.aiScore}/100</div>
                      </div>

                      {/* Status select dropdown */}
                      <div className="flex flex-col space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Application Status</span>
                        <select
                          value={app.status}
                          onChange={(e) => handleUpdateAppStatus(app.id, e.target.value)}
                          className="bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold py-1.5 px-2.5 text-slate-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="Applied">Applied</option>
                          <option value="Screening">Screening</option>
                          <option value="Interviewing">Interviewing</option>
                          <option value="Offered">Offered</option>
                          <option value="Hired">Hired</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Onboarding Checklist if hired */}
                  {app.status === 'Hired' && (
                    <div className="mt-5 pt-5 border-t border-slate-100 bg-emerald-50/40 p-4 rounded-xl border border-emerald-100">
                      <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm mb-3">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Interactive Candidate Onboarding (Hired)</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {onboardingSteps.map((step, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                            <div className="flex items-start space-x-2">
                              <input type="checkbox" id={`onb-chk-${app.id}-${idx}`} className="mt-1 accent-emerald-600" />
                              <label htmlFor={`onb-chk-${app.id}-${idx}`} className="cursor-pointer">
                                <div className="text-xs font-bold text-slate-800">{step.title}</div>
                                <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{step.desc}</div>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {applications.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No active candidate applications found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OFFERS TAB */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Offer Management</h2>
              <p className="text-sm text-slate-500">Draft, preview, and track official candidate job offers using Gemini copywriting models.</p>
            </div>
            <button
              id="btn-gen-offer"
              onClick={() => setShowOfferModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 text-sm font-semibold cursor-pointer shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Generate AI Offer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {offers.map(off => {
              const cand = candidates.find(c => c.id === off.candidateId);
              const job = jobs.find(j => j.id === off.jobId);
              if (!cand || !job) return null;

              return (
                <div key={off.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{cand.name}</h3>
                      <p className="text-sm text-slate-500">Offered Position: <strong className="text-indigo-600 font-semibold">{job.title}</strong></p>
                      <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-600">
                        <span className="flex items-center"><DollarSign className="w-4 h-4 mr-1 text-slate-400" /> Salary: ${off.salary.toLocaleString()}/yr</span>
                        <span className="flex items-center"><Calendar className="w-4 h-4 mr-1 text-slate-400" /> Start Date: {off.startDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setSelectedOfferLetter(off.offerLetter || null)}
                        className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Offer</span>
                      </button>

                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        off.status === 'Accepted'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : off.status === 'Sent'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {off.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {offers.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No drafted job offers found. Use the Generate AI Offer tool above.</p>
              </div>
            )}
          </div>

          {/* Offer Letter Preview Modal */}
          {selectedOfferLetter && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Official Generated Job Offer Letter</h3>
                  <button onClick={() => setSelectedOfferLetter(null)} className="text-slate-400 hover:text-slate-600 text-2xl font-semibold cursor-pointer">&times;</button>
                </div>
                <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap border border-slate-100 bg-slate-50/50 p-6 rounded-xl font-mono">
                  {selectedOfferLetter}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end space-x-3">
                  <button onClick={() => setSelectedOfferLetter(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition">
                    Close
                  </button>
                  <button onClick={() => { alert('Offer dispatched successfully!'); setSelectedOfferLetter(null); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 cursor-pointer transition">
                    <Send className="w-4 h-4" />
                    <span>Dispatch Offer</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">HR Insights & AI Analytics</h2>
            <p className="text-sm text-slate-500">Monitor overall pipeline throughput, candidate scores, demand metrics and skills distribution.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Active Jobs</div>
              <div className="text-3xl font-black text-slate-900">{jobs.length}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Applications In Funnel</div>
              <div className="text-3xl font-black text-slate-900">{applications.length}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Mean Match Percentage</div>
              <div className="text-3xl font-black text-slate-900">
                {applications.length ? Math.round(applications.reduce((acc, a) => acc + a.matchPercentage, 0) / applications.length) : 0}%
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Mean Candidate AI Score</div>
              <div className="text-3xl font-black text-slate-900">
                {applications.length ? Math.round(applications.reduce((acc, a) => acc + a.aiScore, 0) / applications.length) : 0}/100
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hiring funnel visual chart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Recruitment Pipeline Funnel</h3>
              <div className="space-y-3">
                {[
                  { stage: 'Total Candidates', count: candidates.length, color: 'bg-slate-400' },
                  { stage: 'Applied', count: applications.filter(a => a.status === 'Applied').length, color: 'bg-indigo-400' },
                  { stage: 'Screening', count: applications.filter(a => a.status === 'Screening').length, color: 'bg-teal-400' },
                  { stage: 'Interviewing', count: applications.filter(a => a.status === 'Interviewing').length, color: 'bg-amber-400' },
                  { stage: 'Hired & Offered', count: applications.filter(a => a.status === 'Hired' || a.status === 'Offered').length, color: 'bg-emerald-500' }
                ].map((stg, i) => {
                  const maxCount = candidates.length || 1;
                  const pct = Math.round((stg.count / maxCount) * 100);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{stg.stage}</span>
                        <span>{stg.count}</span>
                      </div>
                      <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className={`${stg.color} h-3 rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department hiring speed & demand chart */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Department Openings distribution</h3>
              <div className="space-y-4">
                {[
                  { dept: 'Engineering', count: jobs.filter(j => j.department === 'Engineering').length, color: 'bg-cyan-500' },
                  { dept: 'AI Lab', count: jobs.filter(j => j.department === 'AI Lab').length, color: 'bg-teal-500' },
                  { dept: 'People Operations', count: jobs.filter(j => j.department === 'People Operations').length, color: 'bg-emerald-500' },
                  { dept: 'Other', count: jobs.filter(j => j.department !== 'Engineering' && j.department !== 'AI Lab' && j.department !== 'People Operations').length, color: 'bg-indigo-500' }
                ].map((dp, i) => {
                  const totalJobs = jobs.length || 1;
                  const pct = Math.round((dp.count / totalJobs) * 100);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{dp.dept}</span>
                        <span>{dp.count} Job{dp.count !== 1 ? 's' : ''} ({pct}%)</span>
                      </div>
                      <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className={`${dp.color} h-2.5 rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ALL MODALS --- */}

      {/* Job Creation Modal */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{editingJob ? 'Modify Job Requirements' : 'Add New Target Role'}</h3>
            <form onSubmit={handleJobSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead AI Specialist"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Department</label>
                  <select
                    value={jobDept}
                    onChange={(e) => setJobDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="AI Lab">AI Lab</option>
                    <option value="People Operations">People Operations</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Job Type</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Remote, US"
                  value={jobLoc}
                  onChange={(e) => setJobLoc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Summarize the key role and goals..."
                  value={jobDesc}
                  onChange={(e) => setJobDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Requirements (one per line)</label>
                <textarea
                  rows={3}
                  placeholder="5+ years of React&#10;Experience with Node.js"
                  value={jobReqs}
                  onChange={(e) => setJobReqs(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer shadow-sm transition"
                >
                  Save Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Match Candidate Modal */}
      {showMatchModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Link Candidate Application</h3>
            <form onSubmit={handleMatchSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Candidate</label>
                <select
                  required
                  value={selectedCandidateId}
                  onChange={(e) => setSelectedCandidateId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Candidate --</option>
                  {candidates.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Target Position</label>
                <select
                  required
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Job --</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.title} ({j.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Fit Notes</label>
                <textarea
                  rows={3}
                  placeholder="Any initial screening details..."
                  value={matchNotes}
                  onChange={(e) => setMatchNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMatchModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMatch}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer shadow-sm transition disabled:opacity-55"
                >
                  {isSubmittingMatch ? 'Linking...' : 'Create Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offer Generation Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">AI Copied Offer Generator</h3>
            <form onSubmit={handleOfferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Candidate</label>
                <select
                  required
                  value={offerCandidateId}
                  onChange={(e) => setOfferCandidateId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Candidate --</option>
                  {candidates.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Target Position</label>
                <select
                  required
                  value={offerJobId}
                  onChange={(e) => setOfferJobId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Job --</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Annual Salary ($ USD)</label>
                <input
                  type="number"
                  required
                  value={offerSalary}
                  onChange={(e) => setOfferSalary(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Benefits (comma separated)</label>
                <input
                  type="text"
                  value={offerBenefits}
                  onChange={(e) => setOfferBenefits(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Target Start Date</label>
                <input
                  type="date"
                  required
                  value={offerStartDate}
                  onChange={(e) => setOfferStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingOffer}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer shadow-sm flex items-center space-x-1 transition disabled:opacity-55"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGeneratingOffer ? 'Generating...' : 'Generate Offer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showCandidateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Custom Candidate</h3>
            <form onSubmit={handleCandidateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Candidate Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={candName}
                  onChange={(e) => setCandName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="johndoe@example.com"
                  value={candEmail}
                  onChange={(e) => setCandEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="512-555-0199"
                  value={candPhone}
                  onChange={(e) => setCandPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  placeholder="React, CSS, Node.js"
                  value={candSkills}
                  onChange={(e) => setCandSkills(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Brief Experience Overview</label>
                <input
                  type="text"
                  placeholder="e.g. 3 years as Junior Frontend Developer"
                  value={candExperience}
                  onChange={(e) => setCandExperience(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCandidateModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer shadow-sm transition"
                >
                  Add Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
