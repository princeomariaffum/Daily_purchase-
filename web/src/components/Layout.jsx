import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, FileText, MapPin,
  LogOut, RefreshCw, Sparkles, Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSeason } from '../contexts/SeasonContext';

const NAV_ITEMS = [
  { icon: <LayoutDashboard size={18}/>, label: 'Dashboard',       path: '/' },
  { icon: <FileText size={18}/>,        label: 'Sessions',        path: '/sessions' },
  { icon: <Users size={18}/>,           label: 'Farmers',         path: '/farmers' },
  { icon: <MapPin size={18}/>,          label: 'Farms & Mapping', path: '/farms' },
  { icon: <Users size={18}/>,           label: 'Agents',          path: '/agents' },
  { icon: <Package size={18}/>,         label: 'Reports',         path: '/reports' },
];

export default function Layout({ children, title, onRefresh }) {
  const { logout } = useAuth();
  const { activeSeason, changeSeason, currentTheme, CROP_SEASONS } = useSeason();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      {/* ===== SIDEBAR ===== */}
      <aside 
        className="theme-transition"
        style={{
          width: 240, flexShrink: 0,
          background: currentTheme.sidebarGradient,
          display: 'flex', flexDirection: 'column',
          boxShadow: '4px 0 24px rgba(0,0,0,0.25)',
          position: 'sticky', top: 0, height: '100vh',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div 
              className="theme-transition"
              style={{ width: 42, height: 42, background: currentTheme.logoGradient, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 20, color: '#fff', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
            >
              K
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.1 }}>Kuapa Kokoo</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4 }}>Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 10px', marginBottom: 4 }}>Menu</p>
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <button 
                key={item.label} 
                onClick={() => navigate(item.path)}
                className="theme-transition"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: active ? currentTheme.activeNavBg : 'transparent',
                  color: active ? currentTheme.activeNavText : 'rgba(255,255,255,0.6)',
                  fontWeight: active ? 700 : 400,
                  fontSize: 14, marginBottom: 4,
                  borderLeft: active ? `3px solid ${currentTheme.activeNavText}` : '3px solid transparent',
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Season Indicator Pill in Sidebar */}
        <div 
          className="theme-transition"
          style={{ margin: '12px', padding: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4 }}>Active Theme</p>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={12} color={currentTheme.activeNavText} />
            {currentTheme.themeName}
          </p>
        </div>

        {/* Logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 10, border: 'none', background: 'rgba(239,68,68,0.1)', color: 'rgba(252,165,165,0.9)', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
            <LogOut size={16}/>
            Sign out
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Top bar */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{title || 'Overview'}</p>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{new Date().toLocaleDateString('en-GH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          {/* Right Header Controls: Season Selector & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            
            {/* Season Selector Dropdown */}
            <div 
              className="theme-transition"
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: currentTheme.badgeBg, padding: '6px 12px', borderRadius: 20, border: `1px solid ${currentTheme.cardHighlightBorder}` }}
            >
              <Calendar size={15} color={currentTheme.badgeTextColor} />
              <select 
                value={activeSeason}
                onChange={(e) => changeSeason(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: currentTheme.badgeTextColor,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {Object.values(CROP_SEASONS).map(season => (
                  <option key={season.id} value={season.id} style={{ color: '#1e293b', background: '#fff' }}>
                    {season.badgeText} ({season.themeName})
                  </option>
                ))}
              </select>
            </div>

            {onRefresh && (
              <button 
                onClick={onRefresh} 
                className="theme-transition"
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', 
                  background: currentTheme.primary, color: '#fff', border: 'none', 
                  borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                <RefreshCw size={14}/>
                Refresh
              </button>
            )}
          </div>
        </header>

        {/* Keyed container for smooth fade animation on season change */}
        <div key={activeSeason} className="season-transition" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
