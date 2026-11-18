/**
 * Skill dictionary used by the extractor.
 *
 * Each entry has a canonical display name plus aliases that commonly appear in
 * resumes and job descriptions. Adding a skill here immediately improves both
 * resume parsing and job matching - no other code change is required.
 */
const SKILLS = [
  // Languages
  { name: 'JavaScript', aliases: ['javascript', 'js', 'es6', 'ecmascript'], category: 'Language' },
  { name: 'TypeScript', aliases: ['typescript', 'ts'], category: 'Language' },
  { name: 'Python', aliases: ['python', 'python3'], category: 'Language' },
  { name: 'Java', aliases: ['java', 'core java', 'java 8', 'java 17'], category: 'Language' },
  { name: 'C++', aliases: ['c++', 'cpp'], category: 'Language' },
  { name: 'C#', aliases: ['c#', 'csharp', 'c sharp'], category: 'Language' },
  { name: 'C', aliases: ['ansi c'], category: 'Language' },
  { name: 'PHP', aliases: ['php'], category: 'Language' },
  { name: 'Go', aliases: ['golang', 'go lang'], category: 'Language' },
  { name: 'Ruby', aliases: ['ruby'], category: 'Language' },
  { name: 'Kotlin', aliases: ['kotlin'], category: 'Language' },
  { name: 'Swift', aliases: ['swift'], category: 'Language' },
  { name: 'R', aliases: ['r programming', 'r language'], category: 'Language' },
  { name: 'SQL', aliases: ['sql', 'structured query language'], category: 'Language' },
  { name: 'Bash', aliases: ['bash', 'shell scripting', 'shell script'], category: 'Language' },

  // Frontend
  { name: 'React.js', aliases: ['react', 'reactjs', 'react.js', 'react js'], category: 'Frontend' },
  { name: 'Next.js', aliases: ['nextjs', 'next.js', 'next js'], category: 'Frontend' },
  { name: 'Angular', aliases: ['angular', 'angularjs', 'angular js'], category: 'Frontend' },
  { name: 'Vue.js', aliases: ['vue', 'vuejs', 'vue.js'], category: 'Frontend' },
  { name: 'Redux', aliases: ['redux', 'redux toolkit'], category: 'Frontend' },
  { name: 'HTML5', aliases: ['html', 'html5'], category: 'Frontend' },
  { name: 'CSS3', aliases: ['css', 'css3'], category: 'Frontend' },
  { name: 'Tailwind CSS', aliases: ['tailwind', 'tailwindcss', 'tailwind css'], category: 'Frontend' },
  { name: 'Bootstrap', aliases: ['bootstrap', 'bootstrap 5'], category: 'Frontend' },
  { name: 'SASS', aliases: ['sass', 'scss'], category: 'Frontend' },
  { name: 'jQuery', aliases: ['jquery'], category: 'Frontend' },
  { name: 'Material UI', aliases: ['material ui', 'mui', 'material-ui'], category: 'Frontend' },
  { name: 'Vite', aliases: ['vite', 'vitejs'], category: 'Frontend' },
  { name: 'Webpack', aliases: ['webpack'], category: 'Frontend' },
  { name: 'Responsive Design', aliases: ['responsive design', 'responsive web design', 'responsive layouts', 'responsive ui', 'responsive', 'mobile friendly'], category: 'Frontend' },

  // Backend
  { name: 'Node.js', aliases: ['node', 'nodejs', 'node.js', 'node js'], category: 'Backend' },
  { name: 'Express.js', aliases: ['express', 'expressjs', 'express.js'], category: 'Backend' },
  { name: 'REST API', aliases: ['rest api', 'restful', 'rest apis', 'rest', 'restful api'], category: 'Backend' },
  { name: 'GraphQL', aliases: ['graphql'], category: 'Backend' },
  { name: 'Django', aliases: ['django'], category: 'Backend' },
  { name: 'Flask', aliases: ['flask'], category: 'Backend' },
  { name: 'Spring Boot', aliases: ['spring boot', 'springboot', 'spring'], category: 'Backend' },
  { name: 'Laravel', aliases: ['laravel'], category: 'Backend' },
  { name: 'JWT', aliases: ['jwt', 'json web token', 'json web tokens'], category: 'Backend' },
  { name: 'Socket.IO', aliases: ['socket.io', 'socketio', 'websockets', 'websocket'], category: 'Backend' },
  { name: 'Microservices', aliases: ['microservices', 'micro services', 'microservice'], category: 'Backend' },
  { name: 'API Development', aliases: ['api development', 'api design', 'web services'], category: 'Backend' },

  // Databases
  { name: 'MongoDB', aliases: ['mongodb', 'mongo', 'mongo db'], category: 'Database' },
  { name: 'Mongoose', aliases: ['mongoose', 'mongoosejs'], category: 'Database' },
  { name: 'MySQL', aliases: ['mysql'], category: 'Database' },
  { name: 'PostgreSQL', aliases: ['postgresql', 'postgres', 'psql'], category: 'Database' },
  { name: 'Oracle DB', aliases: ['oracle', 'oracle db', 'oracle database', 'plsql', 'pl/sql'], category: 'Database' },
  { name: 'SQL Server', aliases: ['sql server', 'mssql', 't-sql'], category: 'Database' },
  { name: 'SQLite', aliases: ['sqlite', 'sqlite3'], category: 'Database' },
  { name: 'Redis', aliases: ['redis', 'redis cache'], category: 'Database' },
  { name: 'Firebase', aliases: ['firebase', 'firestore'], category: 'Database' },
  { name: 'DynamoDB', aliases: ['dynamodb'], category: 'Database' },
  { name: 'Cassandra', aliases: ['cassandra'], category: 'Database' },
  { name: 'Database Design', aliases: ['database design', 'schema design', 'data modeling', 'normalization'], category: 'Database' },

  // Data / AI
  { name: 'Machine Learning', aliases: ['machine learning', 'ml', 'supervised learning'], category: 'AI/Data' },
  { name: 'Deep Learning', aliases: ['deep learning', 'neural networks', 'neural network'], category: 'AI/Data' },
  { name: 'NLP', aliases: ['nlp', 'natural language processing'], category: 'AI/Data' },
  { name: 'TensorFlow', aliases: ['tensorflow', 'tf keras'], category: 'AI/Data' },
  { name: 'PyTorch', aliases: ['pytorch', 'torch'], category: 'AI/Data' },
  { name: 'scikit-learn', aliases: ['scikit-learn', 'sklearn', 'scikit learn'], category: 'AI/Data' },
  { name: 'Pandas', aliases: ['pandas'], category: 'AI/Data' },
  { name: 'NumPy', aliases: ['numpy'], category: 'AI/Data' },
  { name: 'OpenCV', aliases: ['opencv'], category: 'AI/Data' },
  { name: 'Data Analysis', aliases: ['data analysis', 'data analytics', 'exploratory data analysis', 'eda'], category: 'AI/Data' },
  { name: 'Data Visualization', aliases: ['data visualization', 'data visualisation'], category: 'AI/Data' },
  { name: 'Power BI', aliases: ['power bi', 'powerbi'], category: 'AI/Data' },
  { name: 'Tableau', aliases: ['tableau'], category: 'AI/Data' },
  { name: 'Excel', aliases: ['excel', 'ms excel', 'advanced excel'], category: 'AI/Data' },
  { name: 'Statistics', aliases: ['statistics', 'statistical analysis', 'statistical literacy', 'statistical', 'probability'], category: 'AI/Data' },
  { name: 'TF-IDF', aliases: ['tf-idf', 'tfidf', 'tf idf'], category: 'AI/Data' },
  { name: 'Cosine Similarity', aliases: ['cosine similarity'], category: 'AI/Data' },
  { name: 'Computer Vision', aliases: ['computer vision'], category: 'AI/Data' },
  { name: 'Big Data', aliases: ['big data', 'hadoop', 'spark', 'apache spark'], category: 'AI/Data' },

  // DevOps / Cloud
  { name: 'AWS', aliases: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'], category: 'Cloud/DevOps' },
  { name: 'Azure', aliases: ['azure', 'microsoft azure'], category: 'Cloud/DevOps' },
  { name: 'Google Cloud', aliases: ['gcp', 'google cloud', 'google cloud platform'], category: 'Cloud/DevOps' },
  { name: 'Docker', aliases: ['docker', 'dockerfile', 'containerization'], category: 'Cloud/DevOps' },
  { name: 'Kubernetes', aliases: ['kubernetes', 'k8s'], category: 'Cloud/DevOps' },
  { name: 'CI/CD', aliases: ['ci/cd', 'ci cd', 'continuous integration', 'github actions', 'jenkins'], category: 'Cloud/DevOps' },
  { name: 'Linux', aliases: ['linux', 'ubuntu', 'unix'], category: 'Cloud/DevOps' },
  { name: 'Nginx', aliases: ['nginx', 'apache http server'], category: 'Cloud/DevOps' },
  { name: 'Terraform', aliases: ['terraform'], category: 'Cloud/DevOps' },
  { name: 'Git', aliases: ['git', 'github', 'gitlab', 'bitbucket', 'version control'], category: 'Cloud/DevOps' },
  { name: 'Vercel', aliases: ['vercel'], category: 'Cloud/DevOps' },
  { name: 'Netlify', aliases: ['netlify'], category: 'Cloud/DevOps' },
  { name: 'Heroku', aliases: ['heroku'], category: 'Cloud/DevOps' },

  // Mobile
  { name: 'React Native', aliases: ['react native'], category: 'Mobile' },
  { name: 'Flutter', aliases: ['flutter', 'dart'], category: 'Mobile' },
  { name: 'Android', aliases: ['android', 'android studio'], category: 'Mobile' },
  { name: 'iOS', aliases: ['ios', 'xcode'], category: 'Mobile' },

  // Testing / Quality
  { name: 'Jest', aliases: ['jest'], category: 'Testing' },
  { name: 'Mocha', aliases: ['mocha'], category: 'Testing' },
  { name: 'Cypress', aliases: ['cypress'], category: 'Testing' },
  { name: 'Selenium', aliases: ['selenium'], category: 'Testing' },
  { name: 'Postman', aliases: ['postman'], category: 'Testing' },
  { name: 'Unit Testing', aliases: ['unit testing', 'unit tests', 'tdd', 'test driven development'], category: 'Testing' },
  { name: 'Manual Testing', aliases: ['manual testing', 'test cases', 'qa testing'], category: 'Testing' },
  { name: 'JUnit', aliases: ['junit'], category: 'Testing' },

  // CS fundamentals
  { name: 'Data Structures', aliases: ['data structures', 'dsa', 'data structures and algorithms'], category: 'Fundamentals' },
  { name: 'Algorithms', aliases: ['algorithms', 'algorithm design'], category: 'Fundamentals' },
  { name: 'OOP', aliases: ['oop', 'object oriented programming', 'object-oriented programming', 'oops'], category: 'Fundamentals' },
  { name: 'Operating Systems', aliases: ['operating systems', 'operating system'], category: 'Fundamentals' },
  { name: 'Computer Networks', aliases: ['computer networks', 'computer networking', 'networking'], category: 'Fundamentals' },
  { name: 'DBMS', aliases: ['dbms', 'database management system', 'database management systems'], category: 'Fundamentals' },
  { name: 'Software Engineering', aliases: ['software engineering', 'sdlc', 'agile', 'scrum', 'kanban'], category: 'Fundamentals' },
  { name: 'System Design', aliases: ['system design', 'software architecture', 'design patterns'], category: 'Fundamentals' },
  { name: 'Cyber Security', aliases: ['cyber security', 'cybersecurity', 'information security', 'ethical hacking'], category: 'Fundamentals' },
  { name: 'Blockchain', aliases: ['blockchain', 'solidity', 'smart contracts'], category: 'Fundamentals' },

  // Tools / soft
  { name: 'Figma', aliases: ['figma', 'adobe xd'], category: 'Design' },
  { name: 'UI/UX Design', aliases: ['ui/ux', 'ui ux', 'ui/ux design', 'ux design', 'ui design', 'user experience', 'wireframing', 'prototyping'], category: 'Design' },
  { name: 'Jira', aliases: ['jira', 'confluence'], category: 'Tools' },
  { name: 'Communication', aliases: ['communication skills', 'communication', 'presentation skills'], category: 'Soft Skill' },
  { name: 'Leadership', aliases: ['leadership', 'team lead', 'team leadership'], category: 'Soft Skill' },
  { name: 'Problem Solving', aliases: ['problem solving', 'analytical skills', 'critical thinking'], category: 'Soft Skill' },
  { name: 'Teamwork', aliases: ['teamwork', 'team player', 'collaboration'], category: 'Soft Skill' },
  { name: 'Time Management', aliases: ['time management'], category: 'Soft Skill' },
  { name: 'Project Management', aliases: ['project management', 'stakeholder management'], category: 'Soft Skill' },
];

const BY_ALIAS = new Map();
const BY_NAME = new Map();

SKILLS.forEach((entry) => {
  BY_NAME.set(entry.name.toLowerCase(), entry);
  entry.aliases.forEach((alias) => BY_ALIAS.set(alias.toLowerCase(), entry));
});

/** Resolve any free-text skill string to its canonical display name. */
const canonicalSkill = (raw) => {
  if (!raw) return '';
  const key = String(raw).toLowerCase().replace(/\s+/g, ' ').trim();
  const entry = BY_ALIAS.get(key) || BY_NAME.get(key);
  if (entry) return entry.name;
  return String(raw)
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b[a-z]/g, (c) => c.toUpperCase());
};

const getSkillEntry = (name) => BY_NAME.get(String(name).toLowerCase()) || null;

module.exports = { SKILLS, canonicalSkill, getSkillEntry };
