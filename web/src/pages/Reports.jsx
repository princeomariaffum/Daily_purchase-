import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useSeason } from '../contexts/SeasonContext';
import { TrendingUp, Users, DollarSign, Package, Award, FileText, Download, BarChart3 } from 'lucide-react';
import { exportBonusReport, exportSocietyBonusReport } from '../utils/exportBonusReport';
import { exportSocietyBonusPdf, exportZoneBonusPdf } from '../utils/exportPdfReport';
import { SocietyComparisonBarChart, ZoneBreakdownBarChart } from '../components/Charts';

export default function Reports() {
  const { token } = useAuth();
  const { activeSeason, filterSessionsBySeason, filterRecordsBySeason, currentTheme } = useSeason();
  const [allSessions, setAllSessions] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Bonus Report State
  const [selectedSociety, setSelectedSociety] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [bonusRate, setBonusRate] = useState('1.12');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSess, resRec] = await Promise.all([
        axios.get('http://localhost:8000/api/sessions/', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:8000/api/records/', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAllSessions(resSess.data);
      setAllRecords(resRec.data);
    } catch (e) {
      console.error(e);
      alert('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  // Dynamically filter data by selected Season!
  const sessions = filterSessionsBySeason(allSessions);
  const records = filterRecordsBySeason(allRecords, allSessions);

  // Calculations
  const totalKilos = sessions.reduce((sum, s) => sum + (parseFloat(s.total_kilos) || 0), 0);
  const totalAmount = sessions.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0);
  const totalFarmers = new Set(records.map(r => r.kk_id || r.farmer_name)).size;
  
  // Aggregate by Society
  const societyStats = {};
  sessions.forEach(s => {
    const soc = s.society_district_name || 'Unknown Society';
    if (!societyStats[soc]) societyStats[soc] = { kilos: 0, amount: 0, waybills: 0 };
    societyStats[soc].kilos += parseFloat(s.total_kilos) || 0;
    societyStats[soc].amount += parseFloat(s.total_amount) || 0;
    societyStats[soc].waybills += 1;
  });

  const topSocieties = Object.keys(societyStats)
    .map(name => ({ name, ...societyStats[name] }))
    .sort((a, b) => b.kilos - a.kilos);

  const StatCard = ({ title, value, icon, color }) => (
    <div style={{ flex: '1 1 200px', background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
        {icon}
      </div>
      <div>
        <p style={{ color: '#6b7280', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{title}</p>
        <p style={{ color: '#111827', fontSize: 28, fontWeight: 800 }}>{value}</p>
      </div>
    </div>
  );

  return (
    <Layout title="Reports & Analytics" onRefresh={fetchData}>
      <div style={{ padding: '32px' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>Analytics Overview</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>High-level aggregates of all purchasing operations.</p>
        </div>

        {/* Top Stat Cards */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
          <StatCard 
            title="Total Volume" 
            value={`${totalKilos.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`} 
            icon={<Package size={28}/>} color="#f59e0b" 
          />
          <StatCard 
            title="Total Paid Out" 
            value={`₵${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            icon={<DollarSign size={28}/>} color="#10b981" 
          />
          <StatCard 
            title="Active Farmers" 
            value={totalFarmers.toLocaleString()} 
            icon={<Users size={28}/>} color="#3b82f6" 
          />
          <StatCard 
            title="Waybills Logged" 
            value={sessions.length.toLocaleString()} 
            icon={<FileText size={28}/>} color="#8b5cf6" 
          />
        </div>

        {/* Society & District Comparative Analytics Section */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: currentTheme.badgeBg, width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 color={currentTheme.badgeTextColor} size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1f2937' }}>Society & District Comparative Analytics</h3>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Side-by-side volume comparisons across societies and individual zone performance.</p>
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, background: currentTheme.badgeBg, color: currentTheme.badgeTextColor, padding: '4px 12px', borderRadius: 20 }}>
              {activeSeason} Season
            </span>
          </div>

          <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {/* Chart 1: All Societies Volume Comparison */}
            <div style={{ border: '1px solid #f1f5f9', borderRadius: 12, padding: 20, background: '#fafafa' }}>
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>Society Volume Comparison (kg)</h4>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, background: '#e2e8f0', padding: '2px 8px', borderRadius: 10 }}>Overall Ranking</span>
              </div>
              <SocietyComparisonBarChart sessions={sessions} primaryColor={currentTheme.primary} />
            </div>

            {/* Chart 2: Selected Society Zone Breakdown */}
            <div style={{ border: '1px solid #f1f5f9', borderRadius: 12, padding: 20, background: '#fafafa' }}>
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  Zone Breakdown {selectedSociety ? `for ${selectedSociety}` : ''}
                </h4>
                <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, background: '#dbeafe', padding: '2px 8px', borderRadius: 10 }}>Zone Level</span>
              </div>
              <ZoneBreakdownBarChart sessions={sessions} selectedSociety={selectedSociety} color={currentTheme.accent || '#2563eb'} />
            </div>
          </div>
        </div>

        {/* Export Bonus Report Section */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          
          {/* Section Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: '#eff6ff', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText color="#2563eb" size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1f2937' }}>Export Bonus Payment Reports</h3>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Generate official cash bonus distribution reports for Excel and PDF printing.</p>
              </div>
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            {/* Filter Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24, background: '#f9fafb', padding: 20, borderRadius: 12, border: '1px solid #f3f4f6' }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  1. Select Society <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select 
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', fontSize: 14, fontWeight: 500, color: '#1f2937' }}
                  value={selectedSociety}
                  onChange={e => { setSelectedSociety(e.target.value); setSelectedZone(''); }}
                >
                  <option value="">-- Select Society --</option>
                  {Object.keys(societyStats).sort().map(soc => <option key={soc} value={soc}>{soc}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  2. Select Zone <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 400 }}>(For Zone Reports)</span>
                </label>
                <select 
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: selectedSociety ? '#fff' : '#f3f4f6', fontSize: 14, fontWeight: 500, color: '#1f2937' }}
                  value={selectedZone}
                  onChange={e => setSelectedZone(e.target.value)}
                  disabled={!selectedSociety}
                >
                  <option value="">-- All Zones in Society --</option>
                  {[...new Set(sessions.filter(s => s.society_district_name === selectedSociety).map(s => s.zone_name))].filter(Boolean).sort().map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  3. Bonus Rate (₵ / kg)
                </label>
                <input 
                  type="number"
                  step="0.01"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', fontSize: 14, fontWeight: 600, color: '#059669' }}
                  value={bonusRate}
                  onChange={e => setBonusRate(e.target.value)}
                />
              </div>
            </div>

            {/* Export Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              
              {/* Card 1: Society Bonus Summary */}
              <div style={{ border: selectedSociety ? '1px solid #a7f3d0' : '1px solid #e5e7eb', background: selectedSociety ? '#f0fdf4' : '#fff', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.2s' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#047857', background: '#d1fae5', padding: '4px 10px', borderRadius: 6 }}>
                      Society Level
                    </span>
                    <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Summary Report</span>
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Society Bonus Summary</h4>
                  <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5, marginBottom: 16 }}>
                    Aggregates member counts, cocoa volumes (kg & bags), and total cash bonuses across all zones under <strong>{selectedSociety || 'selected society'}</strong>.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    disabled={!selectedSociety || !bonusRate}
                    onClick={async () => {
                      const socSessions = sessions.filter(s => s.society_district_name === selectedSociety);
                      await exportSocietyBonusReport(selectedSociety, socSessions, records, parseFloat(bonusRate));
                    }}
                    style={{ flex: 1, padding: '12px 14px', background: (!selectedSociety || !bonusRate) ? '#e5e7eb' : '#059669', color: (!selectedSociety || !bonusRate) ? '#9ca3af' : '#fff', borderRadius: 8, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', cursor: (!selectedSociety || !bonusRate) ? 'not-allowed' : 'pointer' }}
                  >
                    <Download size={16} />
                    Excel (.xlsx)
                  </button>

                  <button 
                    disabled={!selectedSociety || !bonusRate}
                    onClick={() => {
                      const socSessions = sessions.filter(s => s.society_district_name === selectedSociety);
                      exportSocietyBonusPdf(selectedSociety, socSessions, records, parseFloat(bonusRate));
                    }}
                    style={{ flex: 1, padding: '12px 14px', background: (!selectedSociety || !bonusRate) ? '#e5e7eb' : '#dc2626', color: (!selectedSociety || !bonusRate) ? '#9ca3af' : '#fff', borderRadius: 8, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', cursor: (!selectedSociety || !bonusRate) ? 'not-allowed' : 'pointer' }}
                  >
                    <Download size={16} />
                    PDF (.pdf)
                  </button>
                </div>
              </div>

              {/* Card 2: Zone Bonus Details */}
              <div style={{ border: selectedZone ? '1px solid #bfdbfe' : '1px solid #e5e7eb', background: selectedZone ? '#eff6ff' : '#fff', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.2s' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1d4ed8', background: '#dbeafe', padding: '4px 10px', borderRadius: 6 }}>
                      Zone Level
                    </span>
                    <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Line-Item Details</span>
                  </div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Zone Farmers Bonus Details</h4>
                  <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5, marginBottom: 16 }}>
                    Generates itemized list of individual farmers, cocoa volumes, cash payouts, and signature spaces for <strong>{selectedZone || 'selected zone'}</strong>.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    disabled={!selectedZone || !bonusRate}
                    onClick={async () => {
                      const targetSessions = sessions.filter(s => s.zone_name === selectedZone && s.society_district_name === selectedSociety);
                      const targetSessionIds = targetSessions.map(s => s.id);
                      const targetRecords = records.filter(r => targetSessionIds.includes(r.session));
                      await exportBonusReport(selectedZone, selectedSociety, targetRecords, parseFloat(bonusRate));
                    }}
                    style={{ flex: 1, padding: '12px 14px', background: (!selectedZone || !bonusRate) ? '#e5e7eb' : '#2563eb', color: (!selectedZone || !bonusRate) ? '#9ca3af' : '#fff', borderRadius: 8, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', cursor: (!selectedZone || !bonusRate) ? 'not-allowed' : 'pointer' }}
                  >
                    <Download size={16} />
                    Excel (.xlsx)
                  </button>

                  <button 
                    disabled={!selectedZone || !bonusRate}
                    onClick={() => {
                      const targetSessions = sessions.filter(s => s.zone_name === selectedZone && s.society_district_name === selectedSociety);
                      const targetSessionIds = targetSessions.map(s => s.id);
                      const targetRecords = records.filter(r => targetSessionIds.includes(r.session));
                      exportZoneBonusPdf(selectedZone, selectedSociety, targetRecords, parseFloat(bonusRate));
                    }}
                    style={{ flex: 1, padding: '12px 14px', background: (!selectedZone || !bonusRate) ? '#e5e7eb' : '#7c3aed', color: (!selectedZone || !bonusRate) ? '#9ca3af' : '#fff', borderRadius: 8, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', cursor: (!selectedZone || !bonusRate) ? 'not-allowed' : 'pointer' }}
                  >
                    <Download size={16} />
                    PDF (.pdf)
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 10, background: '#f9fafb' }}>
            <Award color="#d4a017" size={20} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1f2937' }}>Top Performing Societies</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Rank</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Society / District</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' }}>Waybills</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' }}>Total Volume (kg)</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' }}>Total Value (₵)</th>
              </tr>
            </thead>
            <tbody>
              {topSocieties.map((soc, index) => (
                <tr key={soc.name} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px 24px', width: 60, textAlign: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 14, background: index < 3 ? '#fef3c7' : '#f3f4f6', color: index < 3 ? '#d97706' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                      {index + 1}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: '#1f2937' }}>{soc.name}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', color: '#6b7280' }}>{soc.waybills}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 700, color: '#1f2937' }}>{soc.kilos.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>₵{soc.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {topSocieties.length === 0 && !loading && (
                <tr><td colSpan="5" style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>No purchasing data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </Layout>
  );
}
