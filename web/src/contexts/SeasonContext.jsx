import React, { createContext, useContext, useState } from 'react';

const SeasonContext = createContext();

export const CROP_SEASONS = {
  '2026/2027': {
    id: '2026/2027',
    name: '2026/27 Season',
    badgeText: '✨ 2026/27 NEW CROP SEASON',
    themeName: 'Emerald Harvest',
    primary: '#059669',       // Electric Emerald
    primaryDark: '#064e3b',   // Deep Forest Emerald
    accent: '#10b981',        // Bright Emerald
    sidebarGradient: 'linear-gradient(180deg, #022c22 0%, #064e3b 60%, #0f766e 100%)',
    logoGradient: 'linear-gradient(135deg, #34d399, #059669)',
    activeNavBg: 'rgba(52,211,153,0.18)',
    activeNavText: '#34d399',
    headerAccent: '#10b981',
    badgeBg: '#d1fae5',
    badgeTextColor: '#065f46',
    cardHighlightBorder: '#6ee7b7',
    buttonGradient: 'linear-gradient(135deg, #064e3b, #047857)',
    buttonHoverGradient: 'linear-gradient(135deg, #047857, #059669)',
    waybillBadgeBg: '#d1fae5',
    waybillBadgeText: '#065f46',
    dateBadgeBg: '#ecfdf5',
    dateBadgeBorder: '#6ee7b7',
    dateBadgeText: '#047857',
    chartLine: '#059669',
    chartGradientStart: '#34d399',
    chartBar1: '#064e3b',
    chartBar2: '#059669',
    pieColors: ['#059669', '#10b981', '#34d399', '#0d9488'],
    statCards: {
      kilos: { bg: '#d1fae5', color: '#047857' },
      bags: { bg: '#ccfbf1', color: '#0f766e' },
      amount: { bg: '#ecfdf5', color: '#059669' },
      farmers: { bg: '#e0f2fe', color: '#0284c7' }
    }
  },
  '2025/2026': {
    id: '2025/2026',
    name: '2025/26 Season',
    badgeText: '🌾 2025/26 CROP SEASON',
    themeName: 'Classic Cocoa & Gold',
    primary: '#d97706',       // Rich Amber Gold
    primaryDark: '#78350f',   // Deep Cocoa Earth
    accent: '#f0c330',        // Kuapa Gold
    sidebarGradient: 'linear-gradient(180deg, #1a0d05 0%, #2c1508 60%, #3d1f0a 100%)',
    logoGradient: 'linear-gradient(135deg, #f0c330, #d4a017)',
    activeNavBg: 'rgba(240,195,48,0.15)',
    activeNavText: '#f0c330',
    headerAccent: '#f59e0b',
    badgeBg: '#fef3c7',
    badgeTextColor: '#92400e',
    cardHighlightBorder: '#fde68a',
    buttonGradient: 'linear-gradient(135deg, #4a2511, #6b3a1f)',
    buttonHoverGradient: 'linear-gradient(135deg, #6b3a1f, #8b5a2b)',
    waybillBadgeBg: '#fef3c7',
    waybillBadgeText: '#92400e',
    dateBadgeBg: '#fef9ec',
    dateBadgeBorder: '#f0c330',
    dateBadgeText: '#92400e',
    chartLine: '#d97706',
    chartGradientStart: '#fde047',
    chartBar1: '#4a2511',
    chartBar2: '#8b5a2b',
    pieColors: ['#f0c330', '#4a2511', '#8b5a2b', '#d97706'],
    statCards: {
      kilos: { bg: '#fef3c7', color: '#b45309' },
      bags: { bg: '#fff7ed', color: '#c2410c' },
      amount: { bg: '#fef9c3', color: '#854d0e' },
      farmers: { bg: '#fef3c7', color: '#78350f' }
    }
  },
  '2024/2025': {
    id: '2024/2025',
    name: '2024/25 Season (Archived)',
    badgeText: '📦 2024/25 ARCHIVED SEASON',
    themeName: 'Bronze Archive',
    primary: '#4b5563',       // Slate Steel
    primaryDark: '#1f2937',   // Dark Charcoal
    accent: '#9ca3af',        // Muted Slate
    sidebarGradient: 'linear-gradient(180deg, #111827 0%, #1f2937 60%, #374151 100%)',
    logoGradient: 'linear-gradient(135deg, #9ca3af, #4b5563)',
    activeNavBg: 'rgba(156,163,175,0.2)',
    activeNavText: '#e5e7eb',
    headerAccent: '#6b7280',
    badgeBg: '#f3f4f6',
    badgeTextColor: '#374151',
    cardHighlightBorder: '#cbd5e1',
    buttonGradient: 'linear-gradient(135deg, #1f2937, #374151)',
    buttonHoverGradient: 'linear-gradient(135deg, #374151, #4b5563)',
    waybillBadgeBg: '#e5e7eb',
    waybillBadgeText: '#374151',
    dateBadgeBg: '#f3f4f6',
    dateBadgeBorder: '#cbd5e1',
    dateBadgeText: '#1f2937',
    chartLine: '#4b5563',
    chartGradientStart: '#9ca3af',
    chartBar1: '#1f2937',
    chartBar2: '#4b5563',
    pieColors: ['#4b5563', '#6b7280', '#9ca3af', '#374151'],
    statCards: {
      kilos: { bg: '#e5e7eb', color: '#374151' },
      bags: { bg: '#f3f4f6', color: '#4b5563' },
      amount: { bg: '#e2e8f0', color: '#1e293b' },
      farmers: { bg: '#cbd5e1', color: '#334155' }
    }
  }
};

/**
 * Automatically determine the Crop Season for any given date string or today.
 * Cocoa purchasing season in Ghana officially opens around Sept 20th - 25th each year.
 */
export const getSeasonFromDate = (dateString) => {
  const d = dateString ? new Date(dateString) : new Date();
  if (isNaN(d.getTime())) return '2025/2026';

  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1 to 12 (Jan to Dec)
  const day = d.getDate();

  // If date is Sept 20th or later (Month 9, Day >= 20, or Month 10, 11, 12)
  if ((month === 9 && day >= 20) || month >= 10) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
};

export const getCurrentSeasonAuto = () => {
  return getSeasonFromDate(new Date());
};

export const SeasonProvider = ({ children }) => {
  const [activeSeason, setActiveSeason] = useState(() => {
    return localStorage.getItem('@active_crop_season') || getCurrentSeasonAuto();
  });

  const changeSeason = (seasonId) => {
    if (CROP_SEASONS[seasonId]) {
      setActiveSeason(seasonId);
      localStorage.setItem('@active_crop_season', seasonId);
    }
  };

  const currentTheme = CROP_SEASONS[activeSeason] || CROP_SEASONS['2025/2026'];

  const filterSessionsBySeason = (sessions, targetSeason = activeSeason) => {
    if (!Array.isArray(sessions)) return [];
    return sessions.filter(s => {
      if (s.season || s.crop_season) {
        return (s.season || s.crop_season) === targetSeason;
      }
      const sessDate = s.date || s.saved_at || s.created_at;
      return getSeasonFromDate(sessDate) === targetSeason;
    });
  };

  const filterRecordsBySeason = (records, sessions, targetSeason = activeSeason) => {
    if (!Array.isArray(records)) return [];
    const validSessionIds = filterSessionsBySeason(sessions, targetSeason).map(s => s.id);
    return records.filter(r => {
      if (r.session) {
        return validSessionIds.includes(r.session);
      }
      const rDate = r.date || r.created_at;
      return getSeasonFromDate(rDate) === targetSeason;
    });
  };

  return (
    <SeasonContext.Provider value={{ 
      activeSeason, 
      changeSeason, 
      currentTheme, 
      CROP_SEASONS,
      filterSessionsBySeason,
      filterRecordsBySeason,
      getSeasonFromDate,
      getCurrentSeasonAuto
    }}>
      {children}
    </SeasonContext.Provider>
  );
};

export const useSeason = () => {
  const context = useContext(SeasonContext);
  if (!context) {
    return {
      activeSeason: '2025/2026',
      changeSeason: () => {},
      currentTheme: CROP_SEASONS['2025/2026'],
      CROP_SEASONS,
      filterSessionsBySeason: (s) => s || [],
      filterRecordsBySeason: (r) => r || [],
      getSeasonFromDate: () => '2025/2026'
    };
  }
  return context;
};
