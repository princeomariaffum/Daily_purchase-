/**
 * Ghanaian & International Farmer Name Gender Dictionary & Detection Engine
 * Kuapa Kokoo Daily Purchase Platform
 */

// Ghanaian Day Names, Traditional Names, Northern/Islamic Names, and Common First Names
export const MALE_NAMES = new Set([
  // Ghanaian Akan Day Names
  'kwasi', 'akwasi', 'kojo', 'kwadwo', 'kwabena', 'kobina', 'kwaku', 'kweku', 
  'yaw', 'yao', 'kofi', 'fiifi', 'kwame', 'kwamena', 'kwaku',

  // Ewe, Ga, Dagaaba, Frafra, Dagbani & Northern Traditional Male Names
  'komla', 'koffi', 'kossi', 'atsu', 'efo', 'mawuli', 'selorm', 'elikplim', 'kosi',
  'nii', 'lante', 'tetteh', 'nkrumah', 'abeka', 'baba', 'barima', 'opanin',

  // Islamic / Northern Ghana Male Names
  'alhassan', 'fuseini', 'yakubu', 'abdul', 'ibrahim', 'mohammed', 'muhammad', 
  'issah', 'haruna', 'seidu', 'sulemana', 'dramani', 'mumuni', 'abukari', 
  'dawuda', 'osman', 'salifu', 'sadat', 'razak', 'yussif', 'gafaru', 'nurudeen',
  'alhaji', 'ismail', 'idddrisu', 'adam', 'ali', 'alidu', 'osmane', 'mustapha',
  'hamza', 'rabiu', 'zakaria', 'tahiru', 'braimah', 'amadu', 'bello', 'inusa',

  // Common Christian / English Male First Names
  'emmanuel', 'john', 'joseph', 'samuel', 'isaac', 'daniel', 'michael', 'david',
  'francis', 'peter', 'paul', 'james', 'stephen', 'eric', 'richard', 'charles',
  'bernard', 'benjamin', 'patrick', 'gideon', 'solomon', 'enoch', 'ebenezer',
  'prince', 'justice', 'ernest', 'andrews', 'dennis', 'felix', 'george', 'henry',
  'martin', 'philip', 'robert', 'simon', 'thomas', 'victor', 'william', 'wisdom',
  'prosper', 'courage', 'divine', 'bright', 'godfred', 'kingsford', 'edward',
  'frederick', 'collins', 'kelvin', 'desmond', 'matthew', 'alexander', 'anthony',
  'christopher', 'dominic', 'eugene', 'frank', 'garrick', 'gregory', 'harrison',
  'jacob', 'kenneth', 'lawrence', 'nathan', 'nathaniel', 'oliver', 'raymond',
  'samson', 'timothy', 'vincent', 'xavier', 'zachary'
]);

export const FEMALE_NAMES = new Set([
  // Ghanaian Akan Day Names
  'akosua', 'esi', 'adwoa', 'adjoa', 'abena', 'abenaa', 'araba', 'akua', 
  'ekua', 'yaa', 'yaaba', 'afia', 'afua', 'efua', 'ama', 'amma',

  // Ewe, Ga, Dagaaba, Frafra, Dagbani & Northern Traditional Female Names
  'ablaa', 'akpene', 'mawusi', 'enam', 'senam', 'elorm', 'awo', 'naa', 'dede',
  'kooko', 'obaapa', 'mansa', 'mansah', 'obaa',

  // Islamic / Northern Ghana Female Names
  'hajia', 'hajiya', 'fatima', 'fatimata', 'amina', 'aminatu', 'mariama', 
  'rahinatu', 'zulei', 'zuleihatu', 'rukaya', 'salamatu', 'ramatu', 'fusena', 
  'ayisha', 'aisha', 'samira', 'fati', 'asana', 'hasana', 'maimuna', 'kubura', 
  'zeinab', 'zenabu', 'rabiatu', 'suweiba', 'bintu', 'memuna', 'mariam', 
  'habiba', 'saadatu', 'najaat', 'zainab', 'nafisa', 'adama', 'hawa',

  // Common Christian / English Female First Names
  'mary', 'elizabeth', 'grace', 'mercy', 'patience', 'comfort', 'hannah', 
  'rebecca', 'sarah', 'dorcas', 'agnes', 'gladys', 'victoria', 'rose', 'joyce', 
  'evelyn', 'cecilia', 'faustina', 'theresa', 'esther', 'janet', 'juliana', 
  'abigail', 'florence', 'charity', 'rita', 'patricia', 'eunice', 'georgina', 
  'vida', 'cynthia', 'peace', 'blessing', 'precious', 'princess', 'queen', 
  'ruby', 'stella', 'deborah', 'anita', 'belinda', 'christine', 'diana', 
  'felicia', 'helen', 'irene', 'josephine', 'lydia', 'martha', 'naomi', 
  'olivia', 'ruth', 'sophia', 'vivian', 'winifred', 'alice', 'angela', 'ann', 
  'anna', 'barbara', 'bernice', 'caroline', 'catherine', 'charlotte', 'clara', 
  'dorothy', 'edith', 'emily', 'emmanuela', 'emmanuela', 'eunice', 'gloria', 
  'harriet', 'hazel', 'jackline', 'jacqueline', 'jane', 'jennifer', 'jessica', 
  'judith', 'juliet', 'laura', 'linda', 'lucy', 'margaret', 'mabel', 'matilda', 
  'monica', 'nancy', 'priscilla', 'rachel', 'rosina', 'veronica'
]);

// Honorific Titles for instant matching
export const MALE_TITLES = new Set(['mr', 'mr.', 'master', 'opanin', 'barima', 'nana (male)', 'alhaji']);
export const FEMALE_TITLES = new Set(['mrs', 'mrs.', 'ms', 'ms.', 'miss', 'madam', 'hajia', 'hajiya', 'obaapa']);

/**
 * Detect Gender from Full Name
 * @param {string} fullName - e.g. "Akosua Mansa", "Mr. Kofi Mensah", "Emmanuel Agyei"
 * @returns {{ gender: 'Male' | 'Female' | 'Unknown', confidence: number, matchedName: string }}
 */
export function detectGender(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return { gender: 'Unknown', confidence: 0, matchedName: '' };
  }

  // Clean and split string into tokens
  const cleanName = fullName.trim().toLowerCase();
  const tokens = cleanName.split(/[\s,._-]+/).filter(Boolean);

  if (tokens.length === 0) {
    return { gender: 'Unknown', confidence: 0, matchedName: '' };
  }

  // Check Honorific Titles first
  for (const token of tokens) {
    if (FEMALE_TITLES.has(token)) {
      return { gender: 'Female', confidence: 0.99, matchedName: token };
    }
    if (MALE_TITLES.has(token)) {
      return { gender: 'Male', confidence: 0.99, matchedName: token };
    }
  }

  // Score tokens against MALE and FEMALE dictionary
  let maleScore = 0;
  let femaleScore = 0;
  let lastMatchedMale = '';
  let lastMatchedFemale = '';

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Give higher weight (multiplier) to the first name / first token
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

/**
 * Get Gender Statistics for a list of farmers or purchase records
 */
export function getGenderDistribution(farmersOrRecords) {
  if (!Array.isArray(farmersOrRecords)) {
    return { male: 0, female: 0, unknown: 0, total: 0, malePercent: 0, femalePercent: 0 };
  }

  let male = 0;
  let female = 0;
  let unknown = 0;

  farmersOrRecords.forEach(item => {
    let gender = item.gender;
    if (!gender || gender === 'N/A' || gender === 'Unknown') {
      const name = item.name || item.farmer_name || '';
      gender = detectGender(name).gender;
    }

    if (gender === 'Male') male++;
    else if (gender === 'Female') female++;
    else unknown++;
  });

  const total = male + female + unknown;
  const knownTotal = male + female;

  return {
    male,
    female,
    unknown,
    total,
    malePercent: knownTotal > 0 ? parseFloat(((male / knownTotal) * 100).toFixed(1)) : 0,
    femalePercent: knownTotal > 0 ? parseFloat(((female / knownTotal) * 100).toFixed(1)) : 0
  };
}
