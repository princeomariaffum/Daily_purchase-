import { useEffect, useState } from 'react';
import axios from 'axios';
import { Package, Users, DollarSign, Activity, Download } from 'lucide-react';
import { KilosTrendChart, AmountBarChart, FarmerStatusPie } from '../components/Charts';
import { exportSessionsToExcel } from '../utils/exportExcel';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useSeason } from '../contexts/SeasonContext';

const API_URL = 'http://localhost:8000/api';

function formatCurrency(n) {
  return `₵${(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const [allSessions, setAllSessions] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { activeSeason, filterSessionsBySeason, filterRecordsBySeason, currentTheme } = useSeason();

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [sR, rR] = await Promise.all([
        axios.get(`${API_URL}/sessions/`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/records/`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setAllSessions(sR.data);
      setAllRecords(rR.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [token]);

  // Dynamically filter data based on active Crop Season!
  const sessions = filterSessionsBySeason(allSessions);
  const records = filterRecordsBySeason(allRecords, allSessions);

  const totalKilos  = sessions.reduce((a, s) => a + (parseFloat(s.total_kilos)  || 0), 0);
  const totalBags   = sessions.reduce((a, s) => a + (parseFloat(s.total_bags)   || 0), 0);
  const totalAmount = sessions.reduce((a, s) => a + (parseFloat(s.total_amount) || 0), 0);
  const uniqueFarmers = new Set(records.map(r => r.farmer_name || r.kk_id)).size;

  return (
    <Layout title="Daily Purchase Overview" onRefresh={fetchData}>
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Welcome */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0 }}>Welcome back, Admin 👋</h1>
            <span style={{ background: currentTheme.badgeBg, color: currentTheme.badgeTextColor, fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: `1px solid ${currentTheme.cardHighlightBorder}` }}>
              {currentTheme.badgeText}
            </span>
          </div>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Here's a live summary of cocoa purchases recorded for the <strong>{activeSeason}</strong> season.</p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18 }}>
          <StatCard loading={loading} label="Total Kilos" value={`${totalKilos.toFixed(2)} kg`}   sub="Gross cocoa weight"    icon={<Activity size={20}/>}    iconBg="#fef3c7" iconColor="#d97706" trend="+12% this week"/>
          <StatCard loading={loading} label="Total Bags"  value={totalBags.toFixed(1)}             sub="@ 62.5 kg / bag"       icon={<Package size={20}/>}     iconBg="#ede9fe" iconColor="#7c3aed" trend="From all sessions"/>
          <StatCard loading={loading} label="GHC Amount"  value={formatCurrency(totalAmount)}       sub="Total paid to farmers" icon={<DollarSign size={20}/>}  iconBg="#d1fae5" iconColor="#059669" trend="Cumulative"/>
          <StatCard loading={loading} label="Farmers"     value={uniqueFarmers}                     sub="Unique registered"     icon={<Users size={20}/>}       iconBg="#dbeafe" iconColor="#2563eb" trend="Across all waybills"/>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
          <ChartCard title="Kilos Trend" subtitle="Cumulative weight over sessions" icon={<Activity size={16}/>}>
            <KilosTrendChart sessions={sessions}/>
          </ChartCard>
          <ChartCard title="GHC by Waybill" subtitle="Last 8 sessions" icon={<DollarSign size={16}/>}>
            <AmountBarChart sessions={sessions}/>
          </ChartCard>
          <ChartCard title="Farmer Status" subtitle="Existing vs. new farmers" icon={<Users size={16}/>}>
            <FarmerStatusPie records={records}/>
          </ChartCard>
        </div>

        {/* Sessions Table */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ede8e2', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3ede8' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Purchase Sessions</h2>
              <p style={{ margin: 0, fontSize: 13, color: '#9ca3af', marginTop: 3 }}>{sessions.length} waybill{sessions.length !== 1 ? 's' : ''} on record</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: '#fef9ec', border: '1px solid #f0c330', color: '#92400e', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                {new Date().toLocaleDateString('en-GH', { month: 'short', day: 'numeric' })}
              </span>
              <button
                onClick={() => exportSessionsToExcel(sessions)}
                disabled={sessions.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: sessions.length === 0 ? '#f3f4f6' : 'linear-gradient(135deg, #4a2511, #6b3a1f)', color: sessions.length === 0 ? '#9ca3af' : '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: sessions.length === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
              >
                <Download size={14}/>
                Export Excel
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#faf7f4' }}>
                  {['Waybill No.', 'Society / District', 'Zone', 'DPRS No.', 'Farmers', 'Total Kilos', 'Amount (GHC)', 'Date'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f3ede8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} style={{ padding: '16px 20px', borderBottom: '1px solid #faf7f4' }}>
                        <div className="shimmer" style={{ height: 14, borderRadius: 6, width: [80,160,80,70,40,70,90,80][j] }}/>
                      </td>
                    ))}
                  </tr>
                )) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '60px 24px', textAlign: 'center' }}>
                      <div style={{ color: '#d1d5db' }}>
                        <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }}/>
                        <p style={{ fontWeight: 600, color: '#6b7280', fontSize: 16, margin: '0 0 6px' }}>No sessions yet</p>
                        <p style={{ color: '#9ca3af', fontSize: 14 }}>Data will appear here once field officers sync their outbox.</p>
                      </div>
                    </td>
                  </tr>
                ) : sessions.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #faf7f4', transition: 'background 0.12s', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fdf9f6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '15px 20px' }}>
                      <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: 6, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>{s.waybill_no}</span>
                    </td>
                    <td style={{ padding: '15px 20px', fontWeight: 600, color: '#111827', fontSize: 14 }}>{s.society_district_name}</td>
                    <td style={{ padding: '15px 20px', color: '#6b7280', fontSize: 13 }}>{s.zone_name || '—'}</td>
                    <td style={{ padding: '15px 20px', color: '#6b7280', fontSize: 13 }}>{s.dprs_number || <span style={{ color: '#e5e7eb' }}>—</span>}</td>
                    <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                      <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s.records?.length ?? 0}</span>
                    </td>
                    <td style={{ padding: '15px 20px', fontWeight: 600, color: '#374151', fontSize: 14 }}>{(s.total_kilos || 0).toFixed(2)} kg</td>
                    <td style={{ padding: '15px 20px', fontWeight: 700, color: '#059669', fontSize: 14 }}>{formatCurrency(s.total_amount)}</td>
                    <td style={{ padding: '15px 20px', color: '#9ca3af', fontSize: 13 }}>{formatDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, sub, icon, iconBg, iconColor, trend, loading }) {
  return (
    <div className="card-hover" style={{ background: '#fff', borderRadius: 14, border: '1px solid #ede8e2', padding: '22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ width: 42, height: 42, background: iconBg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor }}>{icon}</div>
        <span style={{ fontSize: 11, color: '#9ca3af', background: '#f9fafb', border: '1px solid #f3f4f6', padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{trend}</span>
      </div>
      {loading ? (
        <>
          <div className="shimmer" style={{ height: 28, width: '55%', borderRadius: 6, marginBottom: 8 }}/>
          <div className="shimmer" style={{ height: 12, width: '75%', borderRadius: 4 }}/>
        </>
      ) : (
        <>
          <p style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: '0 0 4px', lineHeight: 1 }}>{value}</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 2px' }}>{label}</p>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{sub}</p>
        </>
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, icon, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #ede8e2', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #f7f2ee', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ color: '#8b5a2b' }}>{icon}</div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827' }}>{title}</p>
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ padding: '16px 12px 12px' }}>
        {children}
      </div>
    </div>
  );
}

