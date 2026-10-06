/**
 * Ghanaian & International Farmer Name Gender Dictionary & Detection Engine
 * Kuapa Kokoo Daily Purchase Platform - Mobile
 */

export const MALE_NAMES = new Set([
  'kwasi', 'akwasi', 'kojo', 'kwadwo', 'kwabena', 'kobina', 'kwaku', 'kweku', 
  'yaw', 'yao', 'kofi', 'fiifi', 'kwame', 'kwamena', 'kwaku',
  'komla', 'koffi', 'kossi', 'atsu', 'efo', 'mawuli', 'selorm', 'elikplim', 'kosi',
  'nii', 'lante', 'tetteh', 'nkrumah', 'abeka', 'baba', 'barima', 'opanin',
  'alhassan', 'fuseini', 'yakubu', 'abdul', 'ibrahim', 'mohammed', 'muhammad', 
  'issah', 'haruna', 'seidu', 'sulemana', 'dramani', 'mumuni', 'abukari', 
  'dawuda', 'osman', 'salifu', 'sadat', 'razak', 'yussif', 'gafaru', 'nurudeen',
  'alhaji', 'ismail', 'idddrisu', 'adam', 'ali', 'alidu', 'osmane', 'mustapha',
  'hamza', 'rabiu', 'zakaria', 'tahiru', 'braimah', 'amadu', 'bello', 'inusa',
  'emmanuel', 'john', 'joseph', 'samuel', 'isaac', 'daniel', 'michael', 'david',
  'francis', 'peter', 'paul', 'james', 'stephen', 'eric', 'richard', 'charles',
  'bernard', 'benjamin', 'patrick', 'gideon', 'solomon', 'enoch', 'ebenezer',
  'prince', 'justice', 'ernest', 'andrews', 'dennis', 'felix', 'george', 'henry',
  'martin', 'philip', 'robert', 'simon', 'thomas', 'victor', 'william', 'wisdom',
  'prosper', 'courage', 'divine', 'bright', 'godfred', 'kingsford', 'edward',
  'frederick', 'collins', 'kelvin', 'desmond', 'matthew', 'alexander', 'anthony'
]);

export const FEMALE_NAMES = new Set([
  'akosua', 'esi', 'adwoa', 'adjoa', 'abena', 'abenaa', 'araba', 'akua', 
  'ekua', 'yaa', 'yaaba', 'afia', 'afua', 'efua', 'ama', 'amma',
  'ablaa', 'akpene', 'mawusi', 'enam', 'senam', 'elorm', 'awo', 'naa', 'dede',
  'kooko', 'obaapa', 'mansa', 'mansah', 'obaa',
  'hajia', 'hajiya', 'fatima', 'fatimata', 'amina', 'aminatu', 'mariama', 
  'rahinatu', 'zulei', 'zuleihatu', 'rukaya', 'salamatu', 'ramatu', 'fusena', 
  'ayisha', 'aisha', 'samira', 'fati', 'asana', 'hasana', 'maimuna', 'kubura', 
  'zeinab', 'zenabu', 'rabiatu', 'suweiba', 'bintu', 'memuna', 'mariam', 
  'habiba', 'saadatu', 'najaat', 'zainab', 'nafisa', 'adama', 'hawa',
  'mary', 'elizabeth', 'grace', 'mercy', 'patience', 'comfort', 'hannah', 
  'rebecca', 'sarah', 'dorcas', 'agnes', 'gladys', 'victoria', 'rose', 'joyce', 
  'evelyn', 'cecilia', 'faustina', 'theresa', 'esther', 'janet', 'juliana', 
  'abigail', 'florence', 'charity', 'rita', 'patricia', 'eunice', 'georgina', 
  'vida', 'cynthia', 'peace', 'blessing', 'precious', 'princess', 'queen', 
  'ruby', 'stella', 'deborah', 'anita', 'belinda', 'christine', 'diana'
]);

export const MALE_TITLES = new Set(['mr', 'mr.', 'master', 'opanin', 'barima', 'alhaji']);
export const FEMALE_TITLES = new Set(['mrs', 'mrs.', 'ms', 'ms.', 'miss', 'madam', 'hajia', 'hajiya', 'obaapa']);

export function detectGender(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return { gender: 'Unknown', confidence: 0, matchedName: '' };
  }

  const cleanName = fullName.trim().toLowerCase();
  const tokens = cleanName.split(/[\s,._-]+/).filter(Boolean);

  if (tokens.length === 0) {
    return { gender: 'Unknown', confidence: 0, matchedName: '' };
  }

  for (const token of tokens) {
    if (FEMALE_TITLES.has(token)) return { gender: 'Female', confidence: 0.99, matchedName: token };
    if (MALE_TITLES.has(token)) return { gender: 'Male', confidence: 0.99, matchedName: token };
  }

  let maleScore = 0;
  let femaleScore = 0;
  let lastMatchedMale = '';
  let lastMatchedFemale = '';

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const weight = (i === 0) ? 2.5 : 1.0;

    if (MALE_NAMES.has(token)) {
      maleScore += weight;
      lastMatchedMale = token;
    }
    if (FEMALE_NAMES.has(token)) {
      femaleScore += weight;
      lastMatchedFemale = token;
    }
  }

  if (femaleScore > maleScore) {
    return {
      gender: 'Female',
      confidence: Math.min(0.95, femaleScore / (femaleScore + maleScore + 0.5)),
      matchedName: lastMatchedFemale
    };
  } else if (maleScore > femaleScore) {
    return {
      gender: 'Male',
      confidence: Math.min(0.95, maleScore / (maleScore + femaleScore + 0.5)),
      matchedName: lastMatchedMale
    };
  }

  return { gender: 'Unknown', confidence: 0, matchedName: '' };
}
