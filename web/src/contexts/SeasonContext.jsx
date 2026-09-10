import React, { createContext, useContext, useState } from 'react';

const SeasonContext = createContext();

export const CROP_SEASONS = {
  '2025/2026': {
    id: '2025/2026',
    name: '2025/26 Season',
    badgeText: '🌾 2025/26 CROP SEASON',
    themeName: 'Classic Cocoa & Gold',
    primary: '#d97706',       // Rich Amber Gold
    primaryDark: '#78350f',   // Deep Cocoa Earth
    accent: '#047857',        // Kuapa Green
    sidebarGradient: 'linear-gradient(180deg, #1a0d05 0%, #2c1508 60%, #3d1f0a 100%)',
    logoGradient: 'linear-gradient(135deg, #f0c330, #d4a017)',
    activeNavBg: 'rgba(240,195,48,0.15)',
    activeNavText: '#f0c330',
    headerAccent: '#f59e0b',
    badgeBg: '#fef3c7',
    badgeTextColor: '#92400e',
    cardHighlightBorder: '#fde68a',
  },
  '2026/2027': {
    id: '2026/2027',
    name: '2026/27 Season',
    badgeText: '✨ 2026/27 NEW CROP SEASON',
    themeName: 'Emerald Harvest',
    primary: '#059669',       // Electric Emerald
    primaryDark: '#064e3b',   // Deep Forest Emerald
    accent: '#6366f1',        // Royal Indigo
    sidebarGradient: 'linear-gradient(180deg, #022c22 0%, #064e3b 60%, #0f766e 100%)',
    logoGradient: 'linear-gradient(135deg, #34d399, #059669)',
    activeNavBg: 'rgba(52,211,153,0.18)',
    activeNavText: '#34d399',
    headerAccent: '#10b981',
    badgeBg: '#d1fae5',
    badgeTextColor: '#065f46',
    cardHighlightBorder: '#6ee7b7',
  },
  '2024/2025': {
    id: '2024/2025',
    name: '2024/25 Season (Archived)',
    badgeText: '📦 2024/25 ARCHIVED SEASON',
    themeName: 'Bronze Archive',
    primary: '#4b5563',       // Slate Steel
    primaryDark: '#1f2937',   // Dark Charcoal
    accent: '#d97706',        // Muted Bronze
    sidebarGradient: 'linear-gradient(180deg, #111827 0%, #1f2937 60%, #374151 100%)',
    logoGradient: 'linear-gradient(135deg, #9ca3af, #4b5563)',
    activeNavBg: 'rgba(156,163,175,0.2)',
    activeNavText: '#e5e7eb',
    headerAccent: '#6b7280',
    badgeBg: '#f3f4f6',
    badgeTextColor: '#374151',
    cardHighlightBorder: '#cbd5e1',
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
