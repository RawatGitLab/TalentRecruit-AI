import React, { useState } from 'react';
// Import beautiful vector indicators for seekers to browse jobs, parse resume profiles, and practice speaking
import { 
  Sparkles, FileText, CheckCircle, Play, Video, ArrowRight, Award, 
  BookOpen, Compass, AlertCircle, RefreshCw, Briefcase, ThumbsUp
} from 'lucide-react';
import { Job, Candidate } from '../types.ts';

/**
 * Props representing data inputs to the JobSeekerDashboard component.
 */
interface JobSeekerDashboardProps {
  jobs: Job[];                     // Open positions list
  onRefresh: () => void;           // Callback to sync databases
  hasAI: boolean;                  // Server live Gemini flag
}

/**
 * JobSeekerDashboard provides candidate-facing tools:
 * 1. Browse Jobs: View current job descriptions, modernized skill requirements, and take multiple-choice test assessments.
 * 2. Upload/Parse Resume: Paste resume text for Gemini parsing to extract profile structures and analyze alignment score, culture-fit, and career trajectory.
 * 3. AI Video Interview Rehearsal: Select any job opening to conduct a live simulated interview practice session. Speak/type answers to prompt Gemini for real-time coaching feedback on communication clarity, technical accuracy, and constructive verbal suggestions.
 */
export default function JobSeekerDashboard({ jobs, onRefresh, hasAI }: JobSeekerDashboardProps) {
  // Navigation tabs for Seeker ('browse' openings vs 'parse' profile vs 'practice' coach)
  const [activeSubTab, setActiveSubTab] = useState<'browse' | 'parse' | 'practice'>('browse');

  // Resume Parsing and alignment analysis local state
  const [resumeText, setResumeText] = useState('');
  const [selectedJobIdForParse, setSelectedJobIdForParse] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedCandidate, setParsedCandidate] = useState<Candidate | null>(null);

  // Video Rehearsal/Practice Coach local state
  const [selectedJobIdForPractice, setSelectedJobIdForPractice] = useState('');
  const [practiceSession, setPracticeSession] = useState<{
    id: string;
    questions: string[];
    currentQuestionIndex: number;
    answerText: string;
    isAnalyzing: boolean;
    results: any[];
  } | null>(null);

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Parse Resume Trigger
  const handleParseResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim()) {
      alert('Please paste some resume text first.');
      return;
    }
    setIsParsing(true);
    setParsedCandidate(null);

    try {
      const res = await fetch('/api/candidates/parse-and-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobId: selectedJobIdForParse || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setParsedCandidate(data);
        alert('Resume parsed and analyzed successfully! Head over to Active Jobs or Recruiter Dashboard to see your matching rank.');
        onRefresh();
      } else {
        const err = await res.json();
        alert(`Parsing failed: ${err.error || 'Server error'}`);
      }
    } catch (e: any) {
      alert(`Request failed: ${e.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Trigger Video Interview Session creation
  const handleStartPractice = async () => {
    if (!selectedJobIdForPractice) {
      alert('Please select a target job position to practice for.');
      return;
    }

    const targetJob = jobs.find(j => j.id === selectedJobIdForPractice);
    if (!targetJob) return;

    // Use default mock technical questions or generate tailored questions
    const practiceQuestions = [
      `How do you keep up-to-date with new tools and practices required for the "${targetJob.title}" role?`,
      `Explain a situation where you had to debug a production issue or handle high pressure workloads.`,
      `Describe a technical solution you designed recently. What were the key choices made?`
    ];

    try {
      const res = await fetch('/api/video-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: 'cand-practice-seeker',
          jobId: selectedJobIdForPractice,
          questions: practiceQuestions
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPracticeSession({
          id: data.id,
          questions: data.questions,
          currentQuestionIndex: 0,
          answerText: '',
          isAnalyzing: false,
          results: []
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Spoken Answer simulation
  const handleSubmitPracticeAnswer = async () => {
    if (!practiceSession || !practiceSession.answerText.trim()) {
      alert('Please write your simulated verbal answer before submitting.');
      return;
    }

    setPracticeSession(prev => prev ? { ...prev, isAnalyzing: true } : null);

    try {
      const res = await fetch(`/api/video-sessions/${practiceSession.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionIndex: practiceSession.currentQuestionIndex,
          answerText: practiceSession.answerText,
          durationSeconds: 45
        })
      });

      if (res.ok) {
        const updated = await res.json();
        const latestRecording = updated.recordings.find(
          (r: any) => r.questionIndex === practiceSession.currentQuestionIndex
        );

        setPracticeSession(prev => {
          if (!prev) return null;
          const updatedResults = [...prev.results];
          updatedResults[prev.currentQuestionIndex] = latestRecording?.aiFeedback;
          return {
            ...prev,
            answerText: '',
            isAnalyzing: false,
            results: updatedResults
          };
        });
      }
    } catch (err) {
      console.error(err);
      setPracticeSession(prev => prev ? { ...prev, isAnalyzing: false } : null);
    }
  };

  return (
    <div className="py-6">
      {/* Sub tabs navigation */}
      <div className="flex space-x-2 border-b border-slate-200 mb-8 pb-px">
        <button
          onClick={() => setActiveSubTab('browse')}
          className={`pb-3 text-sm font-bold transition-all relative px-1 cursor-pointer ${
            activeSubTab === 'browse'
              ? 'text-slate-900 border-b-2 border-emerald-500'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Browse Openings
        </button>
        <button
          onClick={() => setActiveSubTab('parse')}
          className={`pb-3 text-sm font-bold transition-all relative px-1 cursor-pointer ${
            activeSubTab === 'parse'
              ? 'text-slate-900 border-b-2 border-emerald-500'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          AI Resume Parser & Analysis
        </button>
        <button
          onClick={() => setActiveSubTab('practice')}
          className={`pb-3 text-sm font-bold transition-all relative px-1 cursor-pointer ${
            activeSubTab === 'practice'
              ? 'text-slate-900 border-b-2 border-emerald-500'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          AI Video Practice Panel
        </button>
      </div>

      {/* BROWSE ACTIVE JOBS */}
      {activeSubTab === 'browse' && (
        <div className="space-y-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Opportunities</h2>
            <p className="text-sm text-slate-500">Discover jobs optimized with tailored AI parameters.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map(job => (
              <div key={job.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-full font-semibold border border-slate-200">
                      {job.department}
                    </span>
                    <span className="bg-emerald-50 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
                      {job.type}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-950 mb-1">{job.title}</h3>
                  <p className="text-xs text-slate-400 mb-4">{job.location}</p>
                  
                  {job.optimizedDescription ? (
                    <div className="bg-emerald-50/20 p-4 rounded-xl border border-emerald-100/50 mb-4 text-xs text-slate-700 leading-relaxed max-h-[160px] overflow-y-auto whitespace-pre-wrap">
                      <div className="font-bold text-emerald-800 uppercase tracking-wide text-[10px] mb-2 flex items-center">
                        <Sparkles className="w-3.5 h-3.5 mr-1" /> Optimized Description (AI)
                      </div>
                      {job.optimizedDescription}
                    </div>
                  ) : (
                    <p className="text-slate-600 text-sm mb-4 leading-relaxed line-clamp-4">{job.description}</p>
                  )}

                  <div className="space-y-1.5 mb-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Candidate Requirements:</span>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {job.requirements.map((req, i) => (
                        <li key={i} className="flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-150 flex justify-between items-center mt-4">
                  <span className="text-xs text-slate-400">Created: {new Date(job.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => {
                      setSelectedJobIdForParse(job.id);
                      setActiveSubTab('parse');
                    }}
                    className="text-xs font-bold bg-slate-900 hover:bg-slate-950 text-white px-3.5 py-2 rounded-xl cursor-pointer transition flex items-center space-x-1"
                  >
                    <span>Apply via AI Parse</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI RESUME PARSER */}
      {activeSubTab === 'parse' && (
        <div className="space-y-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950 mb-1 flex items-center">
              <Sparkles className="w-5 h-5 text-emerald-600 mr-2 animate-pulse" />
              <span>Tailored AI Resume Analysis</span>
            </h2>
            <p className="text-sm text-slate-500 mb-6">Paste your raw profile information or text resume below. Gemini AI will instantly parse skills, identify gap deficiencies, and analyze career trajectory fit.</p>

            <form onSubmit={handleParseResume} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Optional: Select Position to analyze match percentage</label>
                <select
                  value={selectedJobIdForParse}
                  onChange={(e) => setSelectedJobIdForParse(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Let AI evaluate overall profile --</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Paste Raw Resume Text</label>
                <textarea
                  rows={8}
                  required
                  placeholder="Emily Watson&#10;emily@example.com&#10;Skills: React, TypeScript, Redux, Tailwind&#10;Experience: Senior Developer at InnoTech (3 years)..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isParsing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer transition flex items-center space-x-2 text-sm shadow-sm disabled:opacity-55"
              >
                <RefreshCw className={`w-4 h-4 ${isParsing ? 'animate-spin' : ''}`} />
                <span>{isParsing ? 'Parsing with Gemini AI...' : 'Parse & Apply'}</span>
              </button>
            </form>
          </div>

          {/* Results displays */}
          {parsedCandidate && (
            <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 md:p-8 space-y-8 shadow-xl">
              <div className="flex justify-between items-start border-b border-slate-800 pb-5">
                <div>
                  <h3 className="text-xl font-black text-white">{parsedCandidate.name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-1">{parsedCandidate.email} | {parsedCandidate.phone || 'No phone'}</p>
                </div>
                <div className="text-right bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Culture fit score</span>
                  <span className="text-2xl font-black text-emerald-400">{parsedCandidate.aiAnalysis?.cultureFit || 85}%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Parsed Structure */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mr-1.5" />
                      <span>Parsed Technical Competencies</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedCandidate.parsedData.skills.map((skill, idx) => (
                        <span key={idx} className="bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-0.5 rounded text-xs font-medium">{skill}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Extracted Work History</h4>
                    <div className="space-y-3">
                      {parsedCandidate.parsedData.experience.map((exp, idx) => (
                        <div key={idx} className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                          <div className="font-bold text-white text-xs">{exp.title}</div>
                          <div className="text-slate-400 text-xs mt-0.5">{exp.company} &bull; {exp.duration}</div>
                          <ul className="list-disc pl-4 text-[10px] text-slate-400 space-y-1 mt-2">
                            {exp.achievements.map((ach, k) => <li key={k}>{ach}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Predictive Analytics */}
                <div className="space-y-6 border-t md:border-t-0 md:border-l border-slate-800 md:pl-8 pt-6 md:pt-0">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Personality Assessment</h4>
                    <p className="text-xs text-slate-300 leading-relaxed italic">&ldquo;{parsedCandidate.aiAnalysis?.personality}&rdquo;</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Hiring Recommendations</h4>
                    <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                      {parsedCandidate.aiAnalysis?.recommendations?.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Retention Risk Assessment</h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                      Risk level: <span className="text-emerald-400 uppercase">{parsedCandidate.aiAnalysis?.retentionRisk}</span>
                    </p>
                    <p className="text-xs text-slate-400 leading-normal mt-1">{parsedCandidate.aiAnalysis?.retentionDetails}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIDEO PRACTICE PANEL */}
      {activeSubTab === 'practice' && (
        <div className="space-y-8">
          {!practiceSession ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950 mb-1 flex items-center">
                <Video className="w-5 h-5 text-indigo-600 mr-2" />
                <span>Simulated AI Video Interviewing Practice</span>
              </h2>
              <p className="text-sm text-slate-500 mb-6">Practice verbal standard interview questions. Speak clearly into the mock portal, and let Gemini AI evaluate communication pacing, technical correctness, and tone.</p>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Target Position</label>
                  <select
                    value={selectedJobIdForPractice}
                    onChange={(e) => setSelectedJobIdForPractice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- Choose Job --</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleStartPractice}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Launch Practice Studio</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: simulated Video recorder panel */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative aspect-video flex items-center justify-center">
                  {/* Simulated camera stream visualizer */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 z-10" />
                  
                  {/* Flashing record indicator */}
                  <div className="absolute top-4 left-4 z-20 bg-rose-600/90 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-full flex items-center space-x-1 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    <span>Live Mock Stream</span>
                  </div>

                  <div className="absolute top-4 right-4 z-20 text-slate-300 font-mono text-[10px] bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-800">
                    Camera: Active
                  </div>

                  <div className="text-center z-10 space-y-2 p-6">
                    <Video className="w-12 h-12 text-slate-700 mx-auto animate-pulse" />
                    <div className="text-xs text-slate-400 font-medium">Your camera preview is active in local safe-mode</div>
                  </div>
                </div>

                {/* Simulated Transcription Speech-to-Text Input */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="border-b border-slate-100 pb-3">
                    <span className="bg-indigo-50 text-indigo-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-indigo-200">
                      Question {practiceSession.currentQuestionIndex + 1} of {practiceSession.questions.length}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-2 leading-relaxed">
                      {practiceSession.questions[practiceSession.currentQuestionIndex]}
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Simulate your verbal answer (Type here)</label>
                    <textarea
                      rows={4}
                      value={practiceSession.answerText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPracticeSession(prev => prev ? { ...prev, answerText: val } : null);
                      }}
                      placeholder="Type your spoken answer simulation..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => setPracticeSession(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                    >
                      Exit practice session
                    </button>

                    <button
                      onClick={handleSubmitPracticeAnswer}
                      disabled={practiceSession.isAnalyzing || !practiceSession.answerText.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg text-xs cursor-pointer transition flex items-center space-x-1.5 disabled:opacity-55"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{practiceSession.isAnalyzing ? 'Evaluating Speech...' : 'Analyze My Speech'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Realtime Speech Insights output */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center">
                    <Award className="w-4 h-4 mr-1 text-indigo-600" />
                    <span>AI Speech Insights</span>
                  </h4>

                  {practiceSession.results[practiceSession.currentQuestionIndex] ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl text-center">
                          <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Communication</div>
                          <div className="text-lg font-bold text-indigo-600">
                            {practiceSession.results[practiceSession.currentQuestionIndex].communicationScore}%
                          </div>
                        </div>
                        <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl text-center">
                          <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Accuracy</div>
                          <div className="text-lg font-bold text-emerald-600">
                            {practiceSession.results[practiceSession.currentQuestionIndex].technicalScore}%
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">Vibe Sentiment:</span>
                        <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200">
                          {practiceSession.results[practiceSession.currentQuestionIndex].sentiment}
                        </span>
                      </div>

                      <div className="border-t border-slate-100 pt-3">
                        <span className="text-[10px] font-bold text-slate-400 block mb-2">Suggestions for improvement:</span>
                        <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                          {practiceSession.results[practiceSession.currentQuestionIndex].suggestions.map((sug: string, i: number) => (
                            <li key={i}>{sug}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Next question step */}
                      {practiceSession.currentQuestionIndex < practiceSession.questions.length - 1 && (
                        <button
                          onClick={() => {
                            setPracticeSession(prev => prev ? {
                              ...prev,
                              currentQuestionIndex: prev.currentQuestionIndex + 1
                            } : null);
                          }}
                          className="w-full bg-slate-900 text-white font-bold py-2 rounded-xl text-xs mt-4 flex items-center justify-center cursor-pointer hover:bg-slate-950 transition"
                        >
                          <span>Proceed to Next Question</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 text-xs font-medium">
                      <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
                      <p>Answer the active question on the left and submit to receive instant AI evaluation results.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
