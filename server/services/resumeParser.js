/**
 * Rule-based resume information extraction.
 *
 * The parser works on the text layer produced by pdf.js: it detects section
 * headings, then applies targeted regular expressions for contact details,
 * education, experience, certifications and skills.
 */
const { extractSkills, extractSkillListFromSection, pruneSkillFragments } = require('./skillExtractor');

/**
 * Headings in designed CVs (Canva, Figma, some Word templates) are often set
 * with wide letter spacing, so the text layer reads "E D U C A T I O N".
 * These patterns allow any amount of whitespace between the letters of a word.
 */
const looseKeyword = (phrase) =>
  phrase
    .split('')
    .map((character) => (character === ' ' ? '\\s*' : character))
    .join('\\s*');

// Headings may carry a short id on the same line, e.g. "C O N T A C T #3983".
const headingPattern = (phrases) =>
  new RegExp(`^(${phrases.map(looseKeyword).join('|')})\\s*:?(?:\\s*#.*)?$`, 'i');

const SECTION_DEFINITIONS = [
  // "summery" is a common misspelling in hand-made CV templates.
  ['summary', ['professional summary', 'professional summery', 'career summary', 'career objective', 'summary', 'summery', 'objective', 'profile']],
  ['skills', ['technical skills', 'core skills', 'key skills', 'skills', 'technologies', 'tech stack', 'technical proficiencies']],
  ['experience', ['work experience', 'professional experience', 'employment history', 'experience', 'internship', 'internships', 'work history']],
  ['education', ['education', 'academic details', 'academic qualifications', 'educational qualifications', 'qualifications']],
  ['certifications', ['certifications', 'certification', 'licenses & certifications', 'licenses and certifications', 'courses & certifications', 'courses and certifications']],
  ['projects', ['projects', 'project', 'academic projects', 'personal projects']],
  // Captured so their content does not leak into the sections above.
  ['contact', ['contact', 'contact details', 'contact information']],
  ['languages', ['languages', 'language', 'languages known']],
  ['declaration', ['declaration']],
  ['achievements', ['achievements', 'awards', 'interests', 'hobbies', 'references']],
];

const SECTION_HEADINGS = SECTION_DEFINITIONS.map(([key, phrases]) => ({
  key,
  phrase: phrases[0],
  pattern: headingPattern(phrases),
}));

const DEGREE_PATTERN = /\b(b\.?\s?tech|b\.?\s?e\.?|b\.?\s?sc|bca|mca|m\.?\s?tech|m\.?\s?sc|mba|b\.?\s?com|m\.?\s?com|bachelor'?s?|master'?s?|ph\.?\s?d|diploma|higher\s+secondary|class\s+xii|class\s+x|12th|10th)\b/i;
const INSTITUTION_PATTERN = /(institute|university|college|school|academy|polytechnic|iit|nit|iiit)\b/i;
const ROLE_PATTERN = /\b(developer|engineer|intern|analyst|designer|manager|consultant|architect|tester|administrator|scientist|associate|lead|specialist)\b/i;

const splitLines = (text = '') =>
  String(text)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0);

const detectSections = (lines) => {
  const sections = { header: [] };
  let active = 'header';

  lines.forEach((line) => {
    const heading = SECTION_HEADINGS.find((entry) => entry.pattern.test(line));
    if (heading) {
      active = heading.key;
      sections[active] = sections[active] || [];
      return;
    }
    sections[active] = sections[active] || [];
    sections[active].push(line);
  });

  return sections;
};

const titleCase = (value) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word.length > 2 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');

const NAME_STOP_WORDS = new Set([
  'RESUME', 'CURRICULUM', 'VITAE', 'PROFILE', 'SUMMARY', 'OBJECTIVE', 'SKILLS', 'EDUCATION',
  'EXPERIENCE', 'PROJECTS', 'CERTIFICATION', 'CERTIFICATIONS', 'LANGUAGES', 'LANGUAGE',
  'DECLARATION', 'CONTACT', 'REFERENCES', 'ACHIEVEMENTS', 'AWARDS', 'INTERESTS',
]);

const extractName = (lines = []) => {
  const candidates = lines.slice(0, 10);
  const invalid = /(resume|curriculum|vitae|email|phone|mobile|address|linkedin|github|profile|summary|objective)/i;

  for (const line of candidates) {
    const cleaned = line.replace(/^[^a-z]+/i, '').trim();
    if (!cleaned || cleaned.length > 48 || invalid.test(cleaned)) continue;
    if (/[@\d]/.test(cleaned)) continue;
    if (/[.:;]$/.test(cleaned)) continue; // a sentence, not a name
    if (!/^[a-z][a-z.\s'-]*$/i.test(cleaned)) continue;

    const words = cleaned.split(/\s+/);
    if (words.length < 2 || words.length > 4) continue;
    // Every word has to start with a capital: rejects "Contributing to Impactful Projects".
    if (!words.every((word) => /^[A-Z]/.test(word))) continue;

    const isHeadingLike = SECTION_HEADINGS.some((heading) => heading.pattern.test(cleaned));
    if (isHeadingLike) continue;

    return titleCase(cleaned);
  }

  // Designed templates sometimes split the name across two blocks ("SWAVIMAN"
  // in one column, "GHARAI" in another), so no single line holds the name.
  const capsWords = lines
    .slice(0, 60)
    .map((line) => line.trim())
    .filter(
      (line) =>
        /^[A-Z][A-Z'.-]{1,14}$/.test(line) &&
        !NAME_STOP_WORDS.has(line.toUpperCase()) &&
        !ROLE_PATTERN.test(line)
    );

  if (capsWords.length >= 2 && capsWords[0] !== capsWords[1]) {
    return titleCase(`${capsWords[0]} ${capsWords[1]}`);
  }
  if (capsWords.length === 1) return titleCase(capsWords[0]);

  return '';
};

const extractEmail = (text = '') => {
  const match = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return match ? match[0].toLowerCase() : '';
};

const extractPhone = (text = '') => {
  // Grab compact runs of digits/separators, then keep the longest one that has
  // 10-13 digits (Indian 10-digit numbers up to international format).
  // Covers +91 98765 43210, 9876543210, (0674) 234-5678 and +1 (415) 555-0132.
  const matches =
    text.match(/(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{1,5}\)[\s.-]?)?\d[\d\s.-]{7,16}\d/g) || [];

  let best = '';
  let bestScore = -Infinity;

  matches.forEach((raw) => {
    const trimmed = raw.replace(/\s+/g, ' ').trim();
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 13 || trimmed.length > 24) return;
    // "1654086 2025-05" is a certificate id plus a date, not a phone number.
    if (/\b(19|20)\d{2}[-/.]\d{1,2}\b/.test(trimmed)) return;

    let score = 0;
    if (trimmed.startsWith('+')) score += 3;
    if (/\(/.test(trimmed)) score += 2;
    if (digits.length === 10) score += 2;
    if (digits.length === 12 && digits.startsWith('91')) score += 2;
    if (/^[6-9]\d{9}$/.test(digits.slice(-10))) score += 1;

    if (score > bestScore) {
      bestScore = score;
      best = trimmed;
    }
  });

  return best;
};

/** "ananya.mohapatra@example.com" -> "Ananya Mohapatra" when no name line exists. */
const nameFromEmail = (text = '') => {
  const email = extractEmail(text);
  if (!email) return '';
  const local = email.split('@')[0].replace(/\d+/g, '');
  const parts = local.split(/[._-]+/).filter((part) => part.length > 1);
  if (parts.length < 2) return '';
  return titleCase(parts.join(' '));
};

/** The line under the name often states the current role. */
const extractHeadline = (lines = []) => {
  const candidate = (lines[1] || '').trim();
  if (!candidate || candidate.length > 60) return '';
  if (/@|\b(19|20)\d{2}\b/.test(candidate)) return '';
  return ROLE_PATTERN.test(candidate) ? candidate : '';
};

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const parseDatePoint = (value, endOfRange = false) => {
  const text = String(value).trim().toLowerCase();
  if (/present|current|till date|ongoing/.test(text)) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }
  const yearMatch = text.match(/(19|20)\d{2}/);
  if (!yearMatch) return null;
  const year = Number(yearMatch[0]);
  const monthMatch = text.match(/[a-z]{3}/);
  if (monthMatch && MONTHS[monthMatch[0]] !== undefined) {
    return { year, month: MONTHS[monthMatch[0]] };
  }
  return { year, month: endOfRange ? 11 : 0 };
};

/** Total months of employment from explicit date ranges in the experience section. */
const deriveMonthsOfExperience = (experienceText = '') => {
  const rangePattern =
    /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?((?:19|20)\d{2})\s*(?:-|–|—|to)\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?((?:19|20)\d{2}|present|current|ongoing)/gi;

  const intervals = [];
  for (const match of experienceText.matchAll(rangePattern)) {
    const start = parseDatePoint(`${match[1] || ''} ${match[2]}`, false);
    const end = parseDatePoint(`${match[3] || ''} ${match[4]}`, true);
    if (!start || !end) continue;
    const startIndex = start.year * 12 + start.month;
    const endIndex = end.year * 12 + end.month;
    if (endIndex > startIndex) intervals.push([startIndex, endIndex]);
  }
  if (!intervals.length) return 0;

  intervals.sort((a, b) => a[0] - b[0]);
  let total = 0;
  let [currentStart, currentEnd] = intervals[0];
  intervals.slice(1).forEach(([start, end]) => {
    if (start <= currentEnd) {
      currentEnd = Math.max(currentEnd, end);
    } else {
      total += currentEnd - currentStart;
      [currentStart, currentEnd] = [start, end];
    }
  });
  total += currentEnd - currentStart;
  return total;
};

/**
 * Experience in years. An explicit statement such as "2 years of experience"
 * wins; otherwise the work-history date ranges are summed.
 */
const extractExperienceYears = (text = '', experienceText = '') => {
  const declared = [...text.matchAll(/(\d{1,2})\s*(?:\+)?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp\.?)/gi)]
    .map((match) => Number(match[1]))
    .filter((value) => value >= 0 && value <= 40);

  if (declared.length) return Math.min(40, Math.max(...declared));
  return Math.min(40, Math.floor(deriveMonthsOfExperience(experienceText) / 12));
};

const pairWithInstitution = (lines = [], matcher) =>
  lines.reduce((entries, line, index) => {
    if (!matcher(line)) return entries;
    const next = lines[index + 1];
    const joinsNext =
      next && !matcher(next) && (INSTITUTION_PATTERN.test(next) || /\(\d{4}/.test(next)) && next.length < 90;
    entries.push(joinsNext ? `${line} — ${next}` : line);
    return entries;
  }, []);

const uniqueLimited = (items, limit) => {
  const seen = new Set();
  const output = [];
  items.forEach((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    output.push(item);
  });
  return output.slice(0, limit);
};

const URL_PATTERN = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:\/[^\s,;()]*)?/gi;

const normaliseUrl = (value) => (/^https?:\/\//i.test(value) ? value : `https://${value}`);

/** LinkedIn, GitHub and any other personal site found in the document. */
const extractLinks = (text = '') => {
  const links = { linkedin: '', github: '', portfolio: '' };
  // Remove emails first: "ananya.mohapatra@site.com" would otherwise yield a
  // bogus portfolio URL from its local part and domain.
  const source = String(text || '').replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, ' ');

  for (const match of source.matchAll(URL_PATTERN)) {
    const raw = match[0].replace(/[.,;:]+$/, '');
    if (!raw.includes('.')) continue;
    // Domains are written in lower case. This rejects "React.js", "B.Tech" and
    // other dotted phrases that are not web addresses.
    if (/[A-Z]/.test(raw)) continue;
    if (!/\.(com|in|org|net|io|dev|me|co|ai|app|tech|info|edu|gov|xyz|site|online|design|pro|portfolio|blog|page|link|store|cloud|works|studio)(?:[/?#]|$)/i.test(raw)) continue;
    const lower = raw.toLowerCase();
    if (/\b(localhost|example\.com|resumerank)\b/.test(lower)) continue;

    if (lower.includes('linkedin.com') && !links.linkedin) links.linkedin = normaliseUrl(raw);
    else if (lower.includes('github.com') && !links.github) links.github = normaliseUrl(raw);
    else if (!links.portfolio && !/\.(png|jpe?g|gif|svg|pdf|webp)$/i.test(lower)) links.portfolio = normaliseUrl(raw);
  }

  return links;
};

/** "Bhubaneswar, Odisha" style location from the header block. */
const LOCATION_REJECT =
  /^(technology|institute|university|college|school|schooling|studies|academy|engineering|science|department|india|bharat)$/i;

const extractLocation = (headerText = '') => {
  // A single space (never \s) so "Developer" + newline + "Bhubaneswar" cannot
  // be glued into one city name. Commas may be written without a space.
  const pattern = /\b([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+)?),\s*([A-Z][a-zA-Z]{2,})\b/g;

  for (const match of String(headerText).matchAll(pattern)) {
    const [, city, region] = match;
    if (/@|www|\.(com|in|org|io)\b/i.test(city)) continue;
    if (ROLE_PATTERN.test(city) || ROLE_PATTERN.test(region)) continue;
    if (LOCATION_REJECT.test(city) || LOCATION_REJECT.test(region)) continue;
    return `${city}, ${region}`;
  }

  return '';
};

/**
 * @param {string} text plain text extracted from a PDF
 */
const parseResumeText = (text = '') => {
  const cleanText = String(text || '');
  const lines = splitLines(cleanText);
  const sections = detectSections(lines);
  const headerText = (sections.header || []).join('\n');

  // Join the skills section with spaces (not commas) so a wrapped line such as
  // "Machine" / "Learning" is rebuilt as one skill. Lists already use commas.
  const explicitSkills = extractSkillListFromSection((sections.skills || []).join(' '));
  const dictionarySkills = extractSkills(cleanText);
  const skills = uniqueLimited(pruneSkillFragments([...explicitSkills, ...dictionarySkills]), 40);

  const education = uniqueLimited(
    pairWithInstitution(
      [...(sections.education || [])],
      (line) => DEGREE_PATTERN.test(line) || INSTITUTION_PATTERN.test(line)
    ),
    6
  );

  const experienceLines = sections.experience || [];
  const experience = uniqueLimited(
    experienceLines.filter((line) => ROLE_PATTERN.test(line) || /\b\d{4}\b/.test(line)).slice(0, 8),
    6
  );

  const certSources = sections.certifications && sections.certifications.length
    ? sections.certifications
    : lines.filter((line) => /(certified|certification|certificate)/i.test(line));
  const certifications = uniqueLimited(
    certSources
      .map((line) => line.replace(/^[-•*·\s]+/, '').trim())
      .filter((line) => line.length > 4 && line.length < 120),
    8
  );

  const projects = uniqueLimited(
    (sections.projects || [])
      .map((line) => line.replace(/^[-•*·\s]+/, '').trim())
      .filter((line) => line.length > 6 && line.length < 140),
    6
  );

  const summary = (sections.summary || []).join(' ').replace(/\s+/g, ' ').trim().slice(0, 600);

  return {
    name: extractName(lines.slice(0, 60)) || nameFromEmail(cleanText) || 'Candidate',
    headline: extractHeadline(lines.slice(0, 8)),
    summary,
    email: extractEmail(cleanText),
    phone: extractPhone(cleanText),
    location: extractLocation(headerText) || extractLocation(lines.slice(0, 12).join('\n')) || extractLocation(cleanText),
    links: extractLinks(cleanText),
    projects,
    skills,
    education,
    experience,
    certifications,
    experienceYears: extractExperienceYears(cleanText, (sections.experience || []).join('\n')),
    wordCount: cleanText.split(/\s+/).filter(Boolean).length,
    sectionsDetected: {
      email: Boolean(extractEmail(cleanText)),
      phone: Boolean(extractPhone(cleanText)),
      education: education.length > 0,
      experience: experience.length > 0 || sections.experience !== undefined && sections.experience.length > 0,
      skills: skills.length > 0,
      certifications: certifications.length > 0,
    },
    // Designed templates often start straight with a section heading, leaving no
    // header block; show the opening lines instead of an empty contact panel.
    headerPreview: (headerText || lines.slice(0, 6).join('\n')).slice(0, 300),
  };
};

module.exports = { parseResumeText, extractName, extractEmail, extractPhone, extractExperienceYears, splitLines };
