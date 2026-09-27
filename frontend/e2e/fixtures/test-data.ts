/**
 * Test data fixtures for Athena E2E tests
 * Uses fallback AI provider for deterministic responses
 */

export const TEST_API_KEY = 'dev-admin-key';
export const TEST_BASE_URL = '/api/v1/athena';

export const TEST_PROFILE = {
  id: 'test-profile-1',
  email: 'test@athena.local',
  full_name: 'Test User',
  skills: ['Python', 'TypeScript', 'React', 'FastAPI', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes'],
  experience: [
    {
      id: 'exp-1',
      company: 'Tech Corp',
      title: 'Senior Software Engineer',
      start_date: '2022-01-01',
      end_date: null,
      description: 'Built scalable microservices using Python and TypeScript',
      technologies: ['Python', 'TypeScript', 'AWS', 'Docker'],
    },
    {
      id: 'exp-2',
      company: 'Startup Inc',
      title: 'Full Stack Developer',
      start_date: '2019-06-01',
      end_date: '2021-12-31',
      description: 'Developed full-stack applications with React and FastAPI',
      technologies: ['React', 'FastAPI', 'PostgreSQL'],
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'University of Technology',
      degree: 'Master of Science',
      field: 'Computer Science',
      start_date: '2017-09-01',
      end_date: '2019-05-01',
    },
  ],
  certifications: [
    { id: 'cert-1', name: 'AWS Solutions Architect', issuer: 'Amazon', date: '2023-03-15' },
    { id: 'cert-2', name: 'Certified Kubernetes Administrator', issuer: 'CNCF', date: '2022-11-01' },
  ],
  preferences: {
    autoCreateThreshold: 90,
    flagThresholdMin: 80,
    flagThresholdMax: 89,
    dehumanizeEnabled: true,
    n8nWebhookUrl: 'https://n8n.test.webhook',
    n8nActive: false,
  },
  documents: [
    {
      id: 'doc-1',
      name: 'Resume - Senior Engineer',
      type: 'resume',
      content: 'Test resume content',
      updated_at: '2026-01-15T10:00:00Z',
    },
  ],
};

export const TEST_JOBS = [
  {
    id: 'job-high-score',
    source: 'linkedin',
    source_job_id: 'linkedin-12345',
    title: 'Senior Python Engineer',
    company: 'AI Innovations Inc',
    location: 'Remote (US/EU)',
    job_type: 'full_time',
    description: 'We are looking for a Senior Python Engineer to build AI-powered applications. Requirements: 5+ years Python, experience with FastAPI, PostgreSQL, AWS, Docker, Kubernetes. Nice to have: TypeScript, React, ML/AI experience.',
    requirements: ['5+ years Python', 'FastAPI', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes'],
    keywords: ['python', 'fastapi', 'postgresql', 'aws', 'docker', 'kubernetes'],
    salary_range: { min: 150000, max: 200000, currency: 'USD', period: 'yearly' },
    application_url: 'https://ai-innovations.com/careers/senior-python-engineer',
    ats_score: 95,
    match_score: 92,
    match_tier: 'excellent',
    status: 'scored',
    scraped_at: '2026-09-20T10:00:00Z',
  },
  {
    id: 'job-medium-score',
    source: 'indeed',
    source_job_id: 'indeed-67890',
    title: 'Full Stack Developer',
    company: 'Web Solutions Ltd',
    location: 'Lilongwe, Malawi',
    job_type: 'full_time',
    description: 'Full Stack Developer needed for Malawi-based projects. React, TypeScript, Node.js, PostgreSQL. Experience with Malawi regulatory environment a plus.',
    requirements: ['3+ years React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    keywords: ['react', 'typescript', 'nodejs', 'postgresql'],
    salary_range: { min: 2500000, max: 4000000, currency: 'MWK', period: 'monthly' },
    application_url: 'https://websolutions.mw/careers/fullstack',
    ats_score: 78,
    match_score: 72,
    match_tier: 'good',
    status: 'scored',
    scraped_at: '2026-09-20T11:00:00Z',
  },
  {
    id: 'job-low-score',
    source: 'glassdoor',
    source_job_id: 'glassdoor-11111',
    title: 'DevOps Engineer',
    company: 'Cloud Systems Co',
    location: 'Remote (Global)',
    job_type: 'contract',
    description: 'DevOps Engineer for cloud infrastructure. Terraform, Kubernetes, AWS, CI/CD pipelines. 5+ years experience required.',
    requirements: ['5+ years Terraform', 'Kubernetes', 'AWS', 'CI/CD'],
    keywords: ['terraform', 'kubernetes', 'aws', 'cicd'],
    salary_range: { min: 100, max: 150, currency: 'USD', period: 'hourly' },
    application_url: 'https://cloudsystems.co/jobs/devops',
    ats_score: 45,
    match_score: 38,
    match_tier: 'poor',
    status: 'scored',
    scraped_at: '2026-09-20T12:00:00Z',
  },
  {
    id: 'job-consultancy',
    source: 'devex',
    source_job_id: 'devex-22222',
    title: 'Senior Technical Consultant - Climate Finance',
    company: 'Global Development Partners',
    location: 'Lilongwe, Malawi (Hybrid)',
    job_type: 'consultancy',
    description: 'Consultancy for climate finance project in Malawi. Requires expertise in climate finance, World Bank/GCF procedures, stakeholder engagement. 10+ years experience.',
    requirements: ['10+ years climate finance', 'World Bank procedures', 'Stakeholder engagement'],
    keywords: ['climate finance', 'world bank', 'stakeholder engagement', 'gcf'],
    salary_range: { min: 200000, max: 300000, currency: 'USD', period: 'yearly' },
    application_url: 'https://globdevpartners.org/consultancies/climate-finance',
    ats_score: 88,
    match_score: 85,
    match_tier: 'good',
    status: 'scored',
    scraped_at: '2026-09-20T13:00:00Z',
  },
];

export const TEST_APPLICATION = {
  id: 'app-1',
  job_id: 'job-high-score',
  user_profile_id: 'test-profile-1',
  resume_id: 'doc-1',
  cover_letter_id: null,
  ats_score: 95,
  match_score: 92,
  status: 'applied',
  receipt_data: {
    confirmationHash: 'sha256:abc123def456',
    submittedAt: '2026-09-25T14:30:00Z',
    signatory: 'Test User',
    followUpDate: '2026-10-02T14:30:00Z',
  },
  follow_up_dates: ['2026-10-02T14:30:00Z'],
};

export const SEED_API_CALLS = [
  // Create test profile
  {
    method: 'POST',
    path: '/api/v1/athena/profiles',
    body: TEST_PROFILE,
    headers: { 'X-API-Key': TEST_API_KEY, 'Content-Type': 'application/json' },
  },
  // Create test jobs
  ...TEST_JOBS.map(job => ({
    method: 'POST',
    path: '/api/v1/athena/jobs',
    body: job,
    headers: { 'X-API-Key': TEST_API_KEY, 'Content-Type': 'application/json' },
  })),
];

export const FALLBACK_AI_RESPONSES = {
  'score-ats': {
    keyword_match: 90,
    semantic_similarity: 85,
    experience_relevance: 95,
    education_match: 80,
    overall: 89,
    details: 'Strong keyword alignment with Python, FastAPI, AWS. Semantic match on cloud infrastructure. Experience highly relevant.',
    tier: 'strong',
    should_auto_apply: true,
    should_flag_for_review: false,
  },
  'tailor-resume': {
    content: '# Test User\n\n## Senior Software Engineer\n\n### Experience\n- Tech Corp: Built scalable microservices...\n- Startup Inc: Developed full-stack applications...\n\n### Skills\nPython, TypeScript, React, FastAPI, PostgreSQL, AWS, Docker, Kubernetes\n\n### Education\nM.S. Computer Science, University of Technology\n\n### Certifications\nAWS Solutions Architect, CKAD',
    format: 'markdown',
    warnings: [],
  },
  'tailor-document': {
    cover_letter: 'Dear Hiring Manager,\n\nI am writing to express my interest in the Senior Python Engineer position at AI Innovations Inc. With 5+ years of experience building scalable microservices using Python, FastAPI, and cloud technologies...\n\nSincerely,\nTest User',
    executive_summary: 'Senior Software Engineer with 7+ years experience in Python, TypeScript, and cloud-native architectures. Proven track record of delivering scalable solutions...',
    consultancy_proposal: '# Consultancy Proposal: Climate Finance Technical Advisory\n\n## 1. Technical Approach\n\n## 2. Work Plan & Deliverables\n\n## 3. Team Composition\n\n## 4. Financial Proposal',
  },
  'dehumanize': {
    original: 'I spearheaded a testament to my ability to delve into complex systems.',
    dehumanized: 'I led a project that demonstrated my ability to analyze complex systems.',
    changes: ['spearheaded → led', 'testament to → demonstrated', 'delve into → analyze'],
  },
  'submit-application': {
    receipt: {
      id: 'receipt-1',
      confirmationHash: 'sha256:abc123def456789',
      submittedAt: '2026-09-26T10:00:00Z',
      signatory: 'Test User',
      followUpDate: '2026-10-03T10:00:00Z',
      jobTitle: 'Senior Python Engineer',
      company: 'AI Innovations Inc',
    },
    followUpEmail: 'Subject: Follow-up on Application - Senior Python Engineer\n\nDear Hiring Team,\n\nI submitted my application on September 26, 2026...',
  },
  'n8n-dispatch': {
    success: true,
    executionId: 'exec-12345',
    response: { status: 'triggered', workflow: 'athena-pipeline' },
  },
};