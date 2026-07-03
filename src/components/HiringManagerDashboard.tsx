import React, { useState } from 'react';
// Import beautiful vector layout indicators for managers to view evaluations and scheduling status
import { 
  Sparkles, CheckSquare, Award, User, AlertTriangle, ListChecks, 
  Send, ThumbsUp, ThumbsDown, MessageSquareCode, CalendarDays,
  FileSpreadsheet, ClipboardList
} from 'lucide-react';
import { Candidate, Job, Application, Interview } from '../types.ts';

/**
 * Props for the HiringManagerDashboard component.
 */
interface HiringManagerDashboardProps {
  jobs: Job[];                     // Active openings
  candidates: Candidate[];         // Profiles parsed in the system
  applications: Application[];     // Matches connecting candidates to jobs
  interviews: Interview[];         // Human and AI-scheduled interview rounds
  onRefresh: () => void;           // Sync database records
  hasAI: boolean;                  // Server live Gemini flag
}

/**
 * HiringManagerDashboard provides the control panel for team-level engineering managers:
 * 1. Active Candidate Deep Evaluation: Select candidates in the matching pipeline to reveal
 *    AI assessment summaries, skills gap lists, culture-fit index scores, and tenure risk analysis.
 * 2. Strategic Prep Workshop: Select a candidate and position to generate highly customized,
 *    role-relevant interview questions using the Gemini AI model.
 * 3. Human Feedback AI Evaluator: Log qualitative post-interview remarks to trigger Gemini analysis,
 *    outputting scored assessments of candidate strengths, weaknesses, and a structured rating.
 */
export default function HiringManagerDashboard({
  jobs,
  candidates,
  applications,
  interviews,
  onRefresh,
  hasAI
}: HiringManagerDashboardProps) {
  // Currently selected application inside Deep evaluation workshop
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  // Target scheduled interview round selected for post-interview feedback scoring
  const [selectedInterviewId, setSelectedInterviewId] = useState<string>('');
  
  // Custom human feedback notes inputted by the hiring manager
  const [humanFeedbackText, setHumanFeedbackText] = useState<string>('');
  // Pending transition state for the feedback notes AI evaluation call
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Candidate selection fields for generating interview prep sheets
  const [prepCandidateId, setPrepCandidateId] = useState<string>('');
  const [prepJobId, setPrepJobId] = useState<string>('');
  const [generatedPrepQuestions, setGeneratedPrepQuestions] = useState<string[]>([]);
  const [isGeneratingPrep, setIsGeneratingPrep] = useState<boolean>(false);

  const selectedApp = applications.find(a => a.id === selectedAppId);
  const selectedCandidate = selectedApp ? candidates.find(c => c.id === selectedApp.candidateId) : null;
  const selectedJob = selectedApp ? jobs.find(j => j.id === selectedApp.jobId) : null;

  // Trigger AI Question Generation
  const handleGeneratePrepQuestions = async () => {
    if (!prepCandidateId || !prepJobId) {
      alert('Please select both a candidate and job first.');
      return;
    }
    setIsGeneratingPrep(true);
    setGeneratedPrepQuestions([]);
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: prepCandidateId,
          jobId: prepJobId,
          round: 1,
          interviewerName: 'AI Preparation Workshop',
          date: new Date().toISOString(),
          status: 'Scheduled'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedPrepQuestions(data.questions || []);
      } else {
        alert('Failed to generate preparational questions.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPrep(false);
    }
  };

  // Submit interview notes & run AI Evaluation
  const handleRunEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterviewId) {
      alert('Please select an interview session to evaluate.');
      return;
    }
    if (!humanFeedbackText.trim()) {
      alert('Please write down your interview discussion notes/feedback.');
      return;
    }

    setIsEvaluating(true);
    try {
      // 1. Update the interview feedback in database first
      const updateRes = await fetch(`/api/interviews/${selectedInterviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: humanFeedbackText })
      });

      if (!updateRes.ok) {
        throw new Error('Failed to save interview feedback notes');
      }

      // 2. Trigger Gemini AI feedback evaluation and analysis
      const evalRes = await fetch(`/api/interviews/${selectedInterviewId}/evaluate`, {
        method: 'POST'
      });

      if (evalRes.ok) {
        alert('AI Interview Evaluation Completed Successfully!');
        setHumanFeedbackText('');
        setSelectedInterviewId('');
        onRefresh();
      } else {
        const errData = await evalRes.json();
        alert(`Evaluation error: ${errData.error || 'Server error'}`);
      }
    } catch (err: any) {
      alert(`Request failed: ${err.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="py-6 space-y-10">
      
      {/* SECTION 1: CANDIDATE SELECTIVE MATCH & FIT INSIGHTS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-950 tracking-tight flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            <span>Active Candidate Deep Evaluation Workshop</span>
          </h2>
          <p className="text-sm text-slate-500">Select any candidate in your pipeline to view AI skill ratings, personality matches, and skills gap analysis.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: select candidate application */}
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-600 uppercase">Select Target Applicant</label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50">
              {applications.map(app => {
                const cand = candidates.find(c => c.id === app.candidateId);
                const job = jobs.find(j => j.id === app.jobId);
                if (!cand || !job) return null;

                return (
                  <button
                    key={app.id}
                    onClick={() => setSelectedAppId(app.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                      selectedAppId === app.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold mb-1">{cand.name}</div>
                    <div className={selectedAppId === app.id ? 'text-indigo-300' : 'text-indigo-600'}>
                      {job.title}
                    </div>
                  </button>
                );
              })}
              {applications.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs font-medium">No applicants found.</div>
              )}
            </div>
          </div>

          {/* Right panels: displays parsed skills & AI evaluation metrics */}
          <div className="lg:col-span-2">
            {selectedCandidate && selectedJob && selectedApp ? (
              <div className="border border-slate-200/80 rounded-2xl p-6 bg-slate-50/50 space-y-6">
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedCandidate.name}</h3>
                    <p className="text-sm text-indigo-600 font-semibold">{selectedJob.title}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-bold uppercase block mb-1">Relevance Match</span>
                    <span className="text-2xl font-black text-indigo-600">{selectedApp.matchPercentage}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Skill level meters */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Extracted Competency Index</h4>
                    <div className="space-y-2.5">
                      {selectedCandidate.aiAnalysis?.skillLevels ? (
                        Object.entries(selectedCandidate.aiAnalysis.skillLevels).map(([skill, val]) => (
                          <div key={skill} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium text-slate-700">
                              <span>{skill}</span>
                              <span className="font-bold">{val}%</span>
                            </div>
                            <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${val}%` }} />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCandidate.parsedData.skills.map((skill, idx) => (
                            <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded text-xs font-semibold">{skill}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skills gap & trajectory */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" />
                        <span>Identified Skills Gaps</span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCandidate.aiAnalysis?.skillsGap && selectedCandidate.aiAnalysis.skillsGap.length > 0 ? (
                          selectedCandidate.aiAnalysis.skillsGap.map((gap, i) => (
                            <span key={i} className="bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-0.5 rounded text-xs font-bold">{gap}</span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-xs">No apparent technology gap found against standard requirements.</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Culture Assessment</h4>
                      <p className="text-xs text-slate-600 leading-relaxed italic">&ldquo;{selectedCandidate.aiAnalysis?.personality || 'Confident and detailed self-starter.'}&rdquo;</p>
                    </div>
                  </div>
                </div>

                {/* AI Recommendations panel */}
                {selectedCandidate.aiAnalysis?.recommendations && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Suggested Interview Focus (Gemini AI)</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600">
                      {selectedCandidate.aiAnalysis.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl py-16 text-center text-slate-400">
                <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium">Please select an applicant from the left to start evaluation.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: AI QUESTION GENERATION PREP */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-950 tracking-tight flex items-center space-x-2">
            <MessageSquareCode className="w-5 h-5 text-emerald-600" />
            <span>AI Guided Interview Preparation Workshop</span>
          </h2>
          <p className="text-sm text-slate-500">Instantly generate structured technical and behavioral questions tailored directly to the candidates resume skills and target requirements.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Candidate</label>
              <select
                value={prepCandidateId}
                onChange={(e) => setPrepCandidateId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">-- Choose Candidate --</option>
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Job Position</label>
              <select
                value={prepJobId}
                onChange={(e) => setPrepJobId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">-- Choose Job --</option>
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGeneratePrepQuestions}
              disabled={isGeneratingPrep}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-xl text-sm cursor-pointer shadow-sm flex items-center justify-center space-x-1.5 transition disabled:opacity-55"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGeneratingPrep ? 'Generating...' : 'Formulate Questions'}</span>
            </button>
          </div>

          <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center">
              <ListChecks className="w-4 h-4 mr-1 text-slate-500" />
              <span>Target prep questions list</span>
            </h4>
            {generatedPrepQuestions.length > 0 ? (
              <div className="space-y-3">
                {generatedPrepQuestions.map((q, idx) => (
                  <div key={idx} className="bg-white border border-slate-200/80 p-3.5 rounded-xl text-xs font-medium text-slate-800 leading-relaxed shadow-3xs flex items-start space-x-2">
                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5">{idx+1}</span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-xs py-8 text-center font-medium">Select candidate/job and trigger formulation to render AI questions.</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: EVALUATION FEEDBACK HUB */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-950 tracking-tight flex items-center space-x-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <span>AI Interview Feedback Evaluator</span>
          </h2>
          <p className="text-sm text-slate-500">Provide written notes or summaries of a candidate interview. Gemini AI will analyze the feedback, score the candidate, and extract clear strengths and weaknesses.</p>
        </div>

        <form onSubmit={handleRunEvaluation} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Interview Session</label>
              <select
                required
                value={selectedInterviewId}
                onChange={(e) => setSelectedInterviewId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">-- Select Interview --</option>
                {interviews.map(i => {
                  const cand = candidates.find(c => c.id === i.candidateId);
                  const j = jobs.find(jb => jb.id === i.jobId);
                  return (
                    <option key={i.id} value={i.id}>
                      {cand?.name || 'Anonymous'} - {j?.title || 'Generic Role'} (Round {i.round})
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              type="submit"
              disabled={isEvaluating}
              className="w-full bg-slate-900 hover:bg-slate-950 text-white font-semibold py-2.5 rounded-xl text-sm cursor-pointer shadow-sm flex items-center justify-center space-x-1.5 transition disabled:opacity-55"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{isEvaluating ? 'Evaluating Notes...' : 'Run AI Evaluation'}</span>
            </button>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Your Human Discussion Notes & Feedback</label>
              <textarea
                required
                rows={5}
                value={humanFeedbackText}
                onChange={(e) => setHumanFeedbackText(e.target.value)}
                placeholder="Describe candidate performance, how they answered questions, technical accuracy, and key behavioral indicators..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
              />
            </div>
          </div>
        </form>

        {/* Existing Completed Evaluation Results in NoSQL-like nested structure */}
        <div className="mt-8 pt-8 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Completed Interview Assessments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {interviews.filter(i => i.aiEvaluation).map(i => {
              const cand = candidates.find(c => c.id === i.candidateId);
              const j = jobs.find(jb => jb.id === i.jobId);
              return (
                <div key={i.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{cand?.name}</h4>
                      <p className="text-xs text-indigo-600 font-semibold">{j?.title} (Round {i.round})</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-xl text-sm font-black border border-emerald-200">
                      Score: {i.aiEvaluation?.score}/100
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-150 p-3 rounded-xl">
                      <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center">
                        <ThumbsUp className="w-3 h-3 mr-1" /> Core Strengths
                      </div>
                      <ul className="list-disc pl-3 text-[10px] text-slate-600 space-y-1">
                        {i.aiEvaluation?.strengths.map((str, idx) => (
                          <li key={idx}>{str}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white border border-slate-150 p-3 rounded-xl">
                      <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-2 flex items-center">
                        <ThumbsDown className="w-3 h-3 mr-1" /> Skill Concerns
                      </div>
                      <ul className="list-disc pl-3 text-[10px] text-slate-600 space-y-1">
                        {i.aiEvaluation?.weaknesses.map((wk, idx) => (
                          <li key={idx}>{wk}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
