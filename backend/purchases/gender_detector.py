"""
Ghanaian & International Name Gender Detector for Django Backend
"""
import re

MALE_NAMES = {
    'kwasi', 'akwasi', 'kojo', 'kwadwo', 'kwabena', 'kobina', 'kwaku', 'kweku', 
    'yaw', 'yao', 'kofi', 'fiifi', 'kwame', 'kwamena',
    'komla', 'koffi', 'kossi', 'atsu', 'efo', 'mawuli', 'selorm', 'elikplim', 'kosi',
    'nii', 'lante', 'tetteh', 'nkrumah', 'abeka', 'baba', 'barima', 'opanin',
    'alhassan', 'fuseini', 'yakubu', 'abdul', 'ibrahim', 'mohammed', 'muhammad', 
    'issah', 'haruna', 'seidu', 'sulemana', 'dramani', 'mumuni', 'abukari', 
    'dawuda', 'osman', 'salifu', 'sadat', 'razak', 'yussif', 'gafaru', 'nurudeen',
    'alhaji', 'ismail', 'idrisu', 'adam', 'ali', 'alidu', 'osmane', 'mustapha',
    'hamza', 'rabiu', 'zakaria', 'tahiru', 'braimah', 'amadu', 'bello', 'inusa',
    'emmanuel', 'john', 'joseph', 'samuel', 'isaac', 'daniel', 'michael', 'david',
    'francis', 'peter', 'paul', 'james', 'stephen', 'eric', 'richard', 'charles',
    'bernard', 'benjamin', 'patrick', 'gideon', 'solomon', 'enoch', 'ebenezer',
    'prince', 'justice', 'ernest', 'andrews', 'dennis', 'felix', 'george', 'henry',
    'martin', 'philip', 'robert', 'simon', 'thomas', 'victor', 'william', 'wisdom',
    'prosper', 'courage', 'divine', 'bright', 'godfred', 'kingsford', 'edward',
    'frederick', 'collins', 'kelvin', 'desmond', 'matthew', 'alexander', 'anthony'
}

FEMALE_NAMES = {
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
}

MALE_TITLES = {'mr', 'mr.', 'master', 'opanin', 'barima', 'alhaji'}
FEMALE_TITLES = {'mrs', 'mrs.', 'ms', 'ms.', 'miss', 'madam', 'hajia', 'hajiya', 'obaapa'}

def detect_gender(full_name):
    if not full_name or not isinstance(full_name, str):
        return 'Unknown'
    
    clean_name = full_name.strip().lower()
    tokens = [t for t in re.split(r'[\s,._-]+', clean_name) if t]

    if not tokens:
        return 'Unknown'

    for t in tokens:
        if t in FEMALE_TITLES:
            return 'Female'
        if t in MALE_TITLES:
            return 'Male'

    male_score = 0
    female_score = 0

    for idx, token in enumerate(tokens):
        weight = 2.5 if idx == 0 else 1.0
        if token in MALE_NAMES:
            male_score += weight
        if token in FEMALE_NAMES:
            female_score += weight

    if female_score > male_score:
        return 'Female'
    elif male_score > female_score:
        return 'Male'

    return 'Male' # Default fallback for unclassified names in Ghana cocoa farming
