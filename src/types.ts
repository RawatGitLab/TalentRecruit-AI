/**
 * ParseData represents the structured information extracted from a candidate's resume
 * by the Gemini AI parser or fallback heuristic parser.
 */
export interface ParseData {
  // Array of parsed technical skills (e.g., ["React", "TypeScript", "Node.js"])
  skills: string[];
  
  // Chronological work experience list
  experience: {
    company: string;     // Name of the employer
    title: string;       // Job title or position held
    duration: string;    // Employment duration (e.g., "3 years (2023 - Present)")
    achievements: string[]; // Key accomplishments or bullet points
  }[];
  
  // Academic background
  education: {
    degree: string;      // Name of the degree (e.g., "Bachelor of Science")
    university: string;  // Graduating institution name
    year: number;        // Year of graduation or completion
  }[];
  
  // Extracted certifications (e.g., ["AWS Certified Developer"])
  certifications: string[];
}

/**
 * Candidate represents a job seeker registered in the system,
 * complete with parsed profile data and predictive AI analytics.
 */
export interface Candidate {
  id: string;            // Unique identifier (UUID or custom string key)
  name: string;          // Full name of the candidate
  email: string;         // Contact email address
  phone?: string;        // Optional contact telephone number
  status: 'active' | 'hired' | 'rejected' | 'on_hold'; // Pipeline state tracker
  resumeText?: string;   // Raw, unformatted resume text input pasted by the seeker
  resumeUrl?: string;    // Optional reference path to a hosted resume artifact
  parsedData: ParseData; // Structured resume details parsed out by the system
  
  // AI-generated matching and profile assessment details
  aiAnalysis?: {
    personality?: string;                    // Evaluated work style, culture indicators, and soft skills
    cultureFit?: number;                     // Quantified matching fit percentage against standard culture (0-100)
    careerTrajectory?: string;               // Multi-year growth velocity and career progress narrative
    skillLevels?: Record<string, number>;    // Skill-by-skill competency indexing (e.g., { "React": 85 })
    recommendations?: string[];              // Strategic recommendations for interviewing focus
    retentionRisk?: 'low' | 'medium' | 'high'; // Predictive risk of early transition or attrition
    retentionDetails?: string;               // Nuanced context supporting the predictive risk analysis
    skillsGap?: string[];                    // Identified technical gap areas against specific role requirements
  };
  createdAt: string;     // ISO timestamp string of profile creation
}

/**
 * Job represents an open corporate position or job listing
 * that candidates can browse and apply for.
 */
export interface Job {
  id: string;                    // Unique job identifier
  title: string;                 // Position title (e.g., "Senior Software Engineer")
  department: string;            // Business division (e.g., "Engineering")
  location: string;              // Geographical location or "Remote" designation
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote'; // Employment nature classification
  status: 'Open' | 'Closed' | 'Draft'; // Operational visibility state of the job post
  description: string;           // Base job description or general outline
  requirements: string[];        // Hard list of skills/credentials required (bullet points)
  optimizedDescription?: string; // Gemini AI-optimized high-engagement markdown description
  assessments?: Assessment[];    // Custom-generated quiz questions assigned to this opening
  createdAt: string;             // Job opening creation timestamp
}

/**
 * Application maps a candidate's profile to a specific job opening,
 * capturing match scores and selection progress.
 */
export interface Application {
  id: string;            // Application record identifier
  candidateId: string;   // Reference to the applying Candidate
  jobId: string;         // Reference to the target Job
  status: 'Applied' | 'Screening' | 'Interviewing' | 'Offered' | 'Hired' | 'Rejected'; // Recruitment pipeline stage
  appliedDate: string;   // ISO timestamp of application submission
  aiScore: number;       // Direct algorithmic fit score (0-100)
  matchPercentage: number; // Skill overlap & requirement compliance percentage (0-100)
  notes?: string;        // System notes or match analysis summary
}

/**
 * Interview tracks specific discussion and evaluation rounds
 * between candidates and human interviewers, backed by AI notes evaluator.
 */
export interface Interview {
  id: string;              // Interview round record identifier
  candidateId: string;     // Reference to Candidate being interviewed
  jobId: string;           // Reference to target Job role
  round: number;           // Discussion round index (1 = Screening, 2 = Technical, etc.)
  interviewerName: string; // Name of the designated recruiter or hiring manager
  date: string;            // Planned or completed interview ISO date string
  feedback: string;        // Written notes inputted by the human interviewer
  status: 'Scheduled' | 'Completed' | 'Cancelled'; // Appointment state
  questions?: string[];    // Array of AI-curated strategic candidate preparation questions
  
  // In-depth review results extracted by Gemini from the human's raw feedback notes
  aiEvaluation?: {
    score: number;         // Calculated interview score based on notes (0-100)
    strengths: string[];   // Bullet points of candidate strengths identified
    weaknesses: string[];  // Bullet points of technical or behavioral skill concerns identified
  };
}

/**
 * Offer represents an official job offer drafted, reviewed,
 * and issued to a candidate for a specific job position.
 */
export interface Offer {
  id: string;              // Unique offer contract identifier
  candidateId: string;     // Reference to the chosen Candidate
  jobId: string;           // Reference to the target Job being offered
  salary: number;          // Proposed annual base salary (in currency units, e.g., USD)
  benefits: string[];      // Array of perks or coverages (e.g., ["401k", "Health Care"])
  startDate: string;       // Agreed upon physical start date (YYYY-MM-DD)
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined'; // Offer response lifecycle status
  offerLetter?: string;    // Complete legal or formal text of the offer letter drafted by AI
  createdAt: string;       // ISO timestamp of offer generation
}

/**
 * Assessment represents a questionnaire or quiz
 * formulated dynamically by AI to evaluate specific job skills.
 */
export interface Assessment {
  id: string;              // Questionnaire identifier
  jobId: string;           // Target position mapped to this evaluation
  title: string;           // Formatted evaluation title
  
  // List of technical and behavioral questions inside this assessment
  questions: {
    id: string;            // Individual question identification key
    question: string;      // The actual question text
    options?: string[];    // Available choices if multiple choice (MCQ) type
    correctAnswer?: string; // Correct answer text for scoring verification
    type: 'MCQ' | 'Text';  // Question style (Multiple Choice or Free Text explanation)
  }[];
}

/**
 * VideoInterviewSession represents a mock interactive camera rehearsal studio
 * for job seekers to test and evaluate their vocal communication and answers.
 */
export interface VideoInterviewSession {
  id: string;              // Active session identifier
  candidateId: string;     // Reference to Seeker Candidate practicing
  jobId: string;           // Reference to target Job role context
  questions: string[];     // Array of interactive questions assigned for vocal reading
  
  // List of recorded spoken audio answers simulated in text and evaluated by Gemini
  recordings: {
    questionIndex: number;  // Matching index in the parent questions array
    answerText: string;     // Text transcription representing the seeker's verbal reply
    durationSeconds: number; // Length of the speech in seconds
    
    // Cognitive verbal performance metrics evaluated by the AI
    aiFeedback?: {
      communicationScore: number; // Score tracking pacing, speech clarity, and structure (0-100)
      technicalScore: number;     // Score tracking factual correctness and terminology accuracy (0-100)
      sentiment: string;          // Visual vibe and presentation sentiment (e.g., "Confident & Articulate")
      suggestions: string[];      // Targeted recommendations for answering better
    };
  }[];
  createdAt: string;       // Session start timestamp
}

