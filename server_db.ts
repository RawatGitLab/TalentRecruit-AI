import fs from 'fs';
import path from 'path';
import { Candidate, Job, Application, Interview, Offer, Assessment, VideoInterviewSession } from './src/types.ts';

// Configure the database persistence directory inside process working directory
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

/**
 * DatabaseSchema represents the complete NoSQL-like structured JSON model
 * that stores our entire recruitment platform state locally.
 */
interface DatabaseSchema {
  candidates: Candidate[];
  jobs: Job[];
  applications: Application[];
  interviews: Interview[];
  offers: Offer[];
  assessments: Assessment[];
  videoSessions: VideoInterviewSession[];
}

/**
 * INITIAL_JOBS acts as the initial catalog of active job openings
 * seeded on database bootstrap to provide immediate utility.
 */
const INITIAL_JOBS: Job[] = [
  {
    id: 'job-1',
    title: 'Senior React Developer',
    department: 'Engineering',
    location: 'Remote, US',
    type: 'Full-time',
    status: 'Open',
    description: 'We are seeking a Senior React Developer proficient in modern frontend web development to build rich user experiences with React 19, Tailwind CSS, and state-management tools.',
    requirements: [
      '5+ years of React experience',
      'Proficiency in TypeScript and modern standard CSS structures',
      'Knowledge of build tools like Vite, ESBuild',
      'Experience with responsive designs and performance optimization'
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'job-2',
    title: 'AI Fullstack Engineer',
    department: 'AI Lab',
    location: 'San Francisco, CA',
    type: 'Full-time',
    status: 'Open',
    description: 'Join our team to develop intelligent applications leveraging Large Language Models. You will bridge frontend interfaces with server-side AI integrations using Node.js and Gemini.',
    requirements: [
      '3+ years of Node.js and React experience',
      'Experience integrating LLM APIs (Gemini, OpenAI)',
      'Familiarity with NoSQL or NoSQL-like document structures',
      'Strong knowledge of asynchronous coding and streaming APIs'
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'job-3',
    title: 'Technical Recruiter',
    department: 'People Operations',
    location: 'Austin, TX',
    type: 'Contract',
    status: 'Open',
    description: 'Looking for a recruiter who has experience sourcing technical roles. You will evaluate candidate resumes, conduct initial screenings, and manage interview pipelines.',
    requirements: [
      '3+ years in tech recruiting',
      'Excellent candidate communication skills',
      'Experience managing candidate records and offer pipelines'
    ],
    createdAt: new Date().toISOString()
  }
];

/**
 * INITIAL_CANDIDATES seeds the system with rich mock resumes, Work Histories,
 * and AI assessments to display advanced analytical components instantly.
 */
const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'cand-1',
    name: 'Emily Watson',
    email: 'emily.watson@example.com',
    phone: '512-555-0192',
    status: 'active',
    parsedData: {
      skills: ['React', 'TypeScript', 'Redux', 'Tailwind CSS', 'Next.js', 'Jest'],
      experience: [
        {
          company: 'InnoTech Solutions',
          title: 'Senior Frontend Developer',
          duration: '3 Years',
          achievements: [
            'Led migration from Webpack to Vite, cutting build times by 45%',
            'Architected core UI library used by 12 developer teams',
            'Optimized image loading and React state management, increasing Lighthouse score to 98%'
          ]
        },
        {
          company: 'WebCraft Agency',
          title: 'Software Engineer',
          duration: '2 Years',
          achievements: [
            'Built responsive web interfaces for high-traffic e-commerce sites',
            'Implemented accessible patterns conforming to WCAG 2.1 guidelines'
          ]
        }
      ],
      education: [
        {
          degree: 'B.S. Computer Science',
          university: 'University of Texas at Austin',
          year: 2021
        }
      ],
      certifications: ['AWS Certified Cloud Practitioner', 'Meta Front-End Developer Professional']
    },
    aiAnalysis: {
      personality: 'Analytical, communicative, and team-oriented with a strong eye for visual detail and performance efficiency.',
      cultureFit: 92,
      careerTrajectory: 'Steady technical advancement, showing a strong trajectory from developer to core UI architect.',
      skillLevels: {
        'React': 90,
        'TypeScript': 85,
        'Tailwind CSS': 95,
        'Performance': 80
      },
      recommendations: [
        'Ask Emily about her custom component design patterns during the first round.',
        'Explore her experience leading team-wide tooling migrations.'
      ],
      retentionRisk: 'low',
      retentionDetails: 'High job stability with a consistent multi-year stay at her previous employer.',
      skillsGap: ['Node.js', 'System Architecture']
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'cand-2',
    name: 'Michael Chen',
    email: 'm.chen@example.com',
    phone: '415-555-0183',
    status: 'active',
    parsedData: {
      skills: ['Node.js', 'Express', 'Python', 'React', 'MongoDB', 'PostgreSQL', 'Docker', 'Gemini API'],
      experience: [
        {
          company: 'DataFlow Systems',
          title: 'Full Stack Developer',
          duration: '2 Years',
          achievements: [
            'Built real-time data visualizers using D3 and WebSockets',
            'Integrated AI chatbot module resulting in 30% faster customer ticketing answers'
          ]
        }
      ],
      education: [
        {
          degree: 'M.S. Software Engineering',
          university: 'San Jose State University',
          year: 2024
        }
      ],
      certifications: ['Google Professional Cloud Architect']
    },
    aiAnalysis: {
      personality: 'Innovation-focused, technical risk-taker who excels at combining system integrations with language models.',
      cultureFit: 88,
      careerTrajectory: 'Emerging full-stack and AI engineering expert with an academic master\'s background and high development speed.',
      skillLevels: {
        'Node.js': 88,
        'Python': 80,
        'React': 75,
        'Gemini API': 90
      },
      recommendations: [
        'Verify Michael\'s depth in relational vs NoSQL database designs.',
        'Great fit for our AI Lab. Let him talk about his custom chatbot integration projects.'
      ],
      retentionRisk: 'medium',
      retentionDetails: 'Relatively early-career engineer, might seek rapid role scope expansion or high learning curves.',
      skillsGap: ['Advanced Frontend Testing', 'Docker in Production']
    },
    createdAt: new Date().toISOString()
  }
];

/**
 * INITIAL_APPLICATIONS connects candidates to jobs and maps matching scores.
 */
const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'app-1',
    candidateId: 'cand-1',
    jobId: 'job-1',
    status: 'Interviewing',
    appliedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    aiScore: 94,
    matchPercentage: 96,
    notes: 'Excellent match for Senior React. Parse results are highly relevant.'
  },
  {
    id: 'app-2',
    candidateId: 'cand-2',
    jobId: 'job-2',
    status: 'Screening',
    appliedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    aiScore: 89,
    matchPercentage: 90,
    notes: 'Strong full-stack and API experience fits the AI Labs role nicely.'
  }
];

/**
 * INITIAL_INTERVIEWS pre-populates upcoming interview sessions.
 */
const INITIAL_INTERVIEWS: Interview[] = [
  {
    id: 'int-1',
    candidateId: 'cand-1',
    jobId: 'job-1',
    round: 1,
    interviewerName: 'Sarah Jenkins (VP of Engineering)',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    feedback: 'Scheduled initial technical discussion around component library architecture and rendering performance.',
    status: 'Scheduled',
    questions: [
      'Explain React 19 concurrent features and how they can optimize rendering.',
      'How do you manage complex shared state in a highly loaded dashboard app without introducing global rerender overhead?',
      'Describe a situation where you had to lead a developer migration. How did you coordinate?'
    ]
  }
];

const INITIAL_OFFERS: Offer[] = [];

/**
 * INITIAL_ASSESSMENTS provides ready-to-test multiple choice or text quizzes for jobs.
 */
const INITIAL_ASSESSMENTS: Assessment[] = [
  {
    id: 'assess-1',
    jobId: 'job-1',
    title: 'Senior Frontend Coding & Design Quiz',
    questions: [
      {
        id: 'q1',
        type: 'MCQ',
        question: 'Which of the following is true about standard useEffect behavior regarding state changes?',
        options: [
          'State updates inside useEffect should occur without dependency checks to prevent loops',
          'Updating a state value included in the dependency array directly inside the useEffect body without guards results in an infinite render loop',
          'useEffect runs asynchronously during the commit phase, completely blocking browser painting',
          'The clean-up function inside useEffect never runs when a component is unmounted'
        ],
        correctAnswer: 'Updating a state value included in the dependency array directly inside the useEffect body without guards results in an infinite render loop'
      },
      {
        id: 'q2',
        type: 'Text',
        question: 'Explain how you would measure and resolve a performance rendering bottleneck in a deeply nested React list.'
      }
    ]
  }
];

const INITIAL_SESSIONS: VideoInterviewSession[] = [];

/**
 * Database class encapsulates file-based JSON storage operations,
 * simulating a NoSQL document database with absolute transaction guarantees.
 */
class Database {
  // In-memory data repository
  private data: DatabaseSchema;

  /**
   * Database Constructor: Initializes structural entities and loads persisted dataset.
   */
  constructor() {
    this.data = {
      candidates: INITIAL_CANDIDATES,
      jobs: INITIAL_JOBS,
      applications: INITIAL_APPLICATIONS,
      interviews: INITIAL_INTERVIEWS,
      offers: INITIAL_OFFERS,
      assessments: INITIAL_ASSESSMENTS,
      videoSessions: INITIAL_SESSIONS
    };
    this.load();
  }

  /**
   * load(): Synchronously checks and reads JSON database from disk.
   * Falls back to memory-seeded defaults if the database file doesn't exist yet.
   */
  private load() {
    try {
      // Create DB directory if it does not exist
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      // Read and parse JSON database file
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.data = { ...this.data, ...parsed };
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Failed to load database, using defaults:', e);
    }
  }

  /**
   * save(): Synchronously serializes and flushes in-memory data back to disk.
   */
  private save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save database:', e);
    }
  }

  // ==========================================
  // JOB MANAGEMENT OPERATIONS
  // ==========================================

  // Retrieve list of all jobs
  getJobs() { return this.data.jobs; }
  
  // Find specific job by unique ID
  getJob(id: string) { return this.data.jobs.find(j => j.id === id); }
  
  // Create and append a new Job listing
  createJob(job: Omit<Job, 'id' | 'createdAt'>) {
    const newJob: Job = {
      ...job,
      id: `job-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.data.jobs.push(newJob);
    this.save();
    return newJob;
  }
  
  // Update attributes of an existing Job listing
  updateJob(id: string, updates: Partial<Job>) {
    const index = this.data.jobs.findIndex(j => j.id === id);
    if (index !== -1) {
      this.data.jobs[index] = { ...this.data.jobs[index], ...updates };
      this.save();
      return this.data.jobs[index];
    }
    return null;
  }
  
  // Delete job and cascade delete associated records to prevent foreign-key reference leaks
  deleteJob(id: string) {
    this.data.jobs = this.data.jobs.filter(j => j.id !== id);
    this.data.applications = this.data.applications.filter(a => a.jobId !== id);
    this.data.interviews = this.data.interviews.filter(i => i.jobId !== id);
    this.data.offers = this.data.offers.filter(o => o.jobId !== id);
    this.data.assessments = this.data.assessments.filter(as => as.jobId !== id);
    this.save();
  }

  // ==========================================
  // CANDIDATE PROFILE MANAGEMENT
  // ==========================================

  // Get list of registered Candidates
  getCandidates() { return this.data.candidates; }
  
  // Locate Candidate by ID
  getCandidate(id: string) { return this.data.candidates.find(c => c.id === id); }
  
  // Register/create a new candidate profile
  createCandidate(candidate: Omit<Candidate, 'id' | 'createdAt'>) {
    const newCand: Candidate = {
      ...candidate,
      id: `cand-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.data.candidates.push(newCand);
    this.save();
    return newCand;
  }
  
  // Update specific fields (e.g. status, skills analysis) on a candidate profile
  updateCandidate(id: string, updates: Partial<Candidate>) {
    const index = this.data.candidates.findIndex(c => c.id === id);
    if (index !== -1) {
      this.data.candidates[index] = { ...this.data.candidates[index], ...updates };
      this.save();
      return this.data.candidates[index];
    }
    return null;
  }
  
  // Delete candidate and clean up dependent references across other pipelines
  deleteCandidate(id: string) {
    this.data.candidates = this.data.candidates.filter(c => c.id !== id);
    this.data.applications = this.data.applications.filter(a => a.candidateId !== id);
    this.data.interviews = this.data.interviews.filter(i => i.candidateId !== id);
    this.data.offers = this.data.offers.filter(o => o.candidateId !== id);
    this.data.videoSessions = this.data.videoSessions.filter(vs => vs.candidateId !== id);
    this.save();
  }

  // ==========================================
  // APPLICATION PIPELINE MANAGEMENT
  // ==========================================

  // Get all submission applications
  getApplications() { return this.data.applications; }
  
  // Get detailed application by ID
  getApplication(id: string) { return this.data.applications.find(a => a.id === id); }
  
  // Create an application mapping candidate profile to job role
  createApplication(app: Omit<Application, 'id' | 'appliedDate'>) {
    const newApp: Application = {
      ...app,
      id: `app-${Date.now()}`,
      appliedDate: new Date().toISOString()
    };
    this.data.applications.push(newApp);
    this.save();
    return newApp;
  }
  
  // Update status or scores of an application
  updateApplication(id: string, updates: Partial<Application>) {
    const index = this.data.applications.findIndex(a => a.id === id);
    if (index !== -1) {
      this.data.applications[index] = { ...this.data.applications[index], ...updates };
      this.save();
      return this.data.applications[index];
    }
    return null;
  }
  
  // Drop application
  deleteApplication(id: string) {
    this.data.applications = this.data.applications.filter(a => a.id !== id);
    this.save();
  }

  // ==========================================
  // INTERVIEW ROUND MANAGEMENT
  // ==========================================

  // List all interview records
  getInterviews() { return this.data.interviews; }
  
  // Find a specific interview round record
  getInterview(id: string) { return this.data.interviews.find(i => i.id === id); }
  
  // Create and schedule a new interview round
  createInterview(interview: Omit<Interview, 'id'>) {
    const newInt: Interview = {
      ...interview,
      id: `int-${Date.now()}`
    };
    this.data.interviews.push(newInt);
    this.save();
    return newInt;
  }
  
  // Log feedback, change scheduled status, or assign AI evaluations
  updateInterview(id: string, updates: Partial<Interview>) {
    const index = this.data.interviews.findIndex(i => i.id === id);
    if (index !== -1) {
      this.data.interviews[index] = { ...this.data.interviews[index], ...updates };
      this.save();
      return this.data.interviews[index];
    }
    return null;
  }
  
  // Remove an interview record
  deleteInterview(id: string) {
    this.data.interviews = this.data.interviews.filter(i => i.id !== id);
    this.save();
  }

  // ==========================================
  // CONTRACT OFFER DISPATCHING
  // ==========================================

  // Get all offers
  getOffers() { return this.data.offers; }
  
  // Find particular offer
  getOffer(id: string) { return this.data.offers.find(o => o.id === id); }
  
  // Create/Draft a new contract offer letter
  createOffer(offer: Omit<Offer, 'id' | 'createdAt'>) {
    const newOffer: Offer = {
      ...offer,
      id: `offer-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.data.offers.push(newOffer);
    this.save();
    return newOffer;
  }
  
  // Change offer state (e.g., Draft -> Sent -> Accepted)
  updateOffer(id: string, updates: Partial<Offer>) {
    const index = this.data.offers.findIndex(o => o.id === id);
    if (index !== -1) {
      this.data.offers[index] = { ...this.data.offers[index], ...updates };
      this.save();
      return this.data.offers[index];
    }
    return null;
  }
  
  // Delete draft or expired offer
  deleteOffer(id: string) {
    this.data.offers = this.data.offers.filter(o => o.id !== id);
    this.save();
  }

  // ==========================================
  // SKILL ASSESSMENT QUIZZES
  // ==========================================

  // Get lists of job assessments
  getAssessments() { return this.data.assessments; }
  
  // Match a specific assessment questionnaire to a job listing
  getAssessmentForJob(jobId: string) { return this.data.assessments.find(as => as.jobId === jobId); }
  
  // Create an assessment quiz mapping to a role
  createAssessment(assess: Omit<Assessment, 'id'>) {
    const newAssess: Assessment = {
      ...assess,
      id: `assess-${Date.now()}`
    };
    this.data.assessments.push(newAssess);
    this.save();
    return newAssess;
  }
  
  // Edit questions inside an existing assessment
  updateAssessment(id: string, updates: Partial<Assessment>) {
    const index = this.data.assessments.findIndex(as => as.id === id);
    if (index !== -1) {
      this.data.assessments[index] = { ...this.data.assessments[index], ...updates };
      this.save();
      return this.data.assessments[index];
    }
    return null;
  }

  // ==========================================
  // VIDEO REHEARSAL SESSIONS
  // ==========================================

  // Return all video mock session results
  getVideoSessions() { return this.data.videoSessions; }
  
  // Get an active or completed practice video session by ID
  getVideoSession(id: string) { return this.data.videoSessions.find(s => s.id === id); }
  
  // Initialize a new video review session
  createVideoSession(session: Omit<VideoInterviewSession, 'id' | 'createdAt'>) {
    const newSession: VideoInterviewSession = {
      ...session,
      id: `vsession-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.data.videoSessions.push(newSession);
    this.save();
    return newSession;
  }
  
  // Save transcript and append speech evaluation metrics
  updateVideoSession(id: string, updates: Partial<VideoInterviewSession>) {
    const index = this.data.videoSessions.findIndex(s => s.id === id);
    if (index !== -1) {
      this.data.videoSessions[index] = { ...this.data.videoSessions[index], ...updates };
      this.save();
      return this.data.videoSessions[index];
    }
    return null;
  }
}

// Export a single database controller instance (Singleton Pattern) to prevent file contention lockouts
export const db = new Database();

