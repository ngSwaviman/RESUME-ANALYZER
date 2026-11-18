/**
 * Dictionary based skill extraction.
 *
 * A single compiled alternation of canonical skills + aliases is tested against
 * normalised text. Word boundaries guard against false positives such as
 * "java" inside "javascript" or "sql" inside "mysql".
 */
const { SKILLS, canonicalSkill, getSkillEntry } = require('./skillDictionary');
const { normalizeText } = require('./textProcessing');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildPattern = () => {
  const aliases = [];
  SKILLS.forEach((skill) => {
    // Normalise exactly like resume text (lowercase, "/" -> space) so aliases
    // such as "UI/UX" and "CI/CD" still match after preprocessing.
    aliases.push(normalizeText(skill.name));
    skill.aliases.forEach((alias) => aliases.push(normalizeText(alias)));
  });

  // Longest aliases first so "machine learning" wins before "learning" style partials.
  const unique = [...new Set(aliases)].sort((a, b) => b.length - a.length);
  const body = unique
    .map((alias) => escapeRegex(alias).replace(/\s+/g, '[\\s\\-_/]*'))
    .join('|');

  return new RegExp(`(?<![a-z0-9+#])(?:${body})(?![a-z0-9+#])`, 'gi');
};

const SKILL_PATTERN = buildPattern();

const skillTokens = (skill) =>
  new Set(
    String(skill)
      .toLowerCase()
      .split(/[^a-z0-9+#]+/)
      .filter(Boolean)
  );

/**
 * Drop fragments that are only one word of a longer detected skill, e.g.
 * "Machine" + "Learning" when "Machine Learning" was also found.
 */
const pruneSkillFragments = (skills = []) => {
  const tokenSets = skills.map(skillTokens);
  return skills.filter((skill, index) => {
    const tokens = tokenSets[index];
    if (tokens.size !== 1) return true;
    const [token] = tokens;
    return !tokenSets.some(
      (other, otherIndex) => otherIndex !== index && other.size > 1 && other.has(token)
    );
  });
};

/** Extract canonical skills present in a block of text. */
const extractSkills = (text = '') => {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const found = new Set();
  const matches = normalized.match(SKILL_PATTERN) || [];
  matches.forEach((match) => {
    const canonical = canonicalSkill(match);
    if (canonical) found.add(canonical);
  });

  return [...found].sort((a, b) => a.localeCompare(b));
};

/**
 * Parse an explicit "Skills" section, keeping technologies that are not in the
 * dictionary yet (e.g. a niche internal tool). Entries are cleaned and capped.
 */
const GENERIC_SKILL_WORDS = new Set([
  'and', 'or', 'etc', 'others', 'tools', 'technologies', 'languages', 'frameworks',
  'libraries', 'databases', 'platforms', 'concepts', 'soft', 'skills', 'technical',
]);

const extractSkillListFromSection = (sectionText = '') => {
  const tokens = sectionText
    .split(/[,;|•·\n\r\t/]+/)
    .map((token) => token.replace(/^[\s\-*–—:]+|[\s.:]+$/g, '').trim())
    .filter(Boolean);

  const skills = [];
  const push = (value) => {
    if (value && !skills.some((skill) => skill.toLowerCase() === value.toLowerCase())) skills.push(value);
  };

  tokens.forEach((token) => {
    const words = token.split(/\s+/).filter(Boolean);
    if (words.length > 4 || token.length > 40 || token.length < 2) return;
    const lower = token.toLowerCase();
    if (GENERIC_SKILL_WORDS.has(lower) || /^\d+$/.test(token)) return;

    const entry = getSkillEntry(token);
    if (entry) {
      push(entry.name);
      return;
    }

    // A line break inside the skills list can glue two skills together
    // ("Git" + "Docker" -> "Git Docker"); split such tokens back apart.
    if (words.length > 1 && words.every((word) => getSkillEntry(word))) {
      words.forEach((word) => push(getSkillEntry(word).name));
      return;
    }

    // Keep genuinely unknown but technology-looking terms (e.g. "Jupyter").
    const looksTechnical = /[.+#]/.test(token) || /^[A-Z]/.test(token) || /\d/.test(token);
    if (looksTechnical && words.length <= 3) push(canonicalSkill(token));
  });

  return pruneSkillFragments(skills);
};

/** Group a list of canonical skills by dictionary category (for UI charts). */
const groupSkillsByCategory = (skills = []) => {
  const groups = {};
  skills.forEach((skill) => {
    const entry = getSkillEntry(skill);
    const category = entry ? entry.category : 'Other';
    groups[category] = groups[category] || [];
    groups[category].push(skill);
  });
  return groups;
};

module.exports = {
  extractSkills,
  extractSkillListFromSection,
  groupSkillsByCategory,
  pruneSkillFragments,
  SKILL_PATTERN,
};
