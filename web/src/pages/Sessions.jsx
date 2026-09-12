import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useSeason } from '../contexts/SeasonContext';
import { exportSessionsToExcel } from '../utils/exportExcel';
import { Download, FileText, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { API_URL } from '../config';

export default function Sessions() {
  const { token } = useAuth();
  const { activeSeason, filterSessionsBySeason, currentTheme } = useSeason();
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/sessions/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAllSessions(res.data);
    } catch (e) {
      console.error(e);
      alert('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSessions();
  }, [token]);

  const sessions = filterSessionsBySeason(allSessions);

  const handleExport = () => {
    if (sessions.length > 0) {
      exportSessionsToExcel(sessions);
    }
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <Layout title="Purchase Sessions" onRefresh={fetchSessions}>
      <div style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>Purchase Sessions (Waybills)</h2>
            <p style={{ color: '#6b7280', fontSize: 14 }}>View all submitted waybills and their individual farmer records.</p>
          </div>
          <button 
            onClick={handleExport}
            disabled={sessions.length === 0}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, 
              background: sessions.length === 0 ? '#e5e7eb' : '#22c55e', 
              color: sessions.length === 0 ? '#9ca3af' : '#fff', 
              border: 'none', padding: '10px 20px', borderRadius: 8, 
              fontWeight: 600, cursor: sessions.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Download size={18} /> Export to Excel
          </button>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ width: 40, padding: '16px 12px', textAlign: 'center' }}></th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Waybill No.</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Society/District</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Date Submitted</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' }}>Total Volume</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(session => (
                <React.Fragment key={session.id}>
                  <tr 
                    style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: expandedRow === session.id ? '#fdf8ec' : '#fff' }}
                    onClick={() => toggleRow(session.id)}
                  >
                    <td style={{ padding: '16px 12px', textAlign: 'center', color: '#9ca3af' }}>
                      {expandedRow === session.id ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={16} color="#d4a017" />
                        <span style={{ fontWeight: 600, color: '#1f2937' }}>{session.waybill_no || 'N/A'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontWeight: 500, color: '#4b5563' }}>{session.society_district_name || 'N/A'}</span>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{session.zone_name}</div>
                    </td>
                    <td style={{ padding: '16px 24px', color: '#6b7280', fontSize: 14 }}>
                      {new Date(session.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: '#1f2937' }}>{parseFloat(session.total_kilos || 0).toFixed(2)} kg</span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: '#059669' }}>₵{parseFloat(session.total_amount || 0).toFixed(2)}</span>
                    </td>
                  </tr>
                  
                  {/* EXPANDED RECORDS ROW */}
                  {expandedRow === session.id && (
                    <tr style={{ background: '#fafafa', borderBottom: '1px solid #e5e7eb' }}>
                      <td colSpan="6" style={{ padding: 0 }}>
                        <div style={{ padding: '24px 48px' }}>
                          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Package size={16}/> Individual Purchase Records ({session.records.length})
                          </h4>
                          {session.records.length > 0 ? (
                            <table style={{ width: '100%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                                  <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'left' }}>Farmer Name</th>
                                  <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'left' }}>Status</th>
                                  <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'left' }}>Card ID</th>
                                  <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' }}>Kilos</th>
                                  <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' }}>Amount (₵)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {session.records.map(record => (
                                  <tr key={record.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: '#374151' }}>{record.farmer_name}</td>
                                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#6b7280' }}>
                                      <span style={{ padding: '2px 8px', borderRadius: 12, background: record.farmer_status === 'Existing' ? '#dcfce7' : '#fef9c3', color: record.farmer_status === 'Existing' ? '#166534' : '#854d0e', fontWeight: 600 }}>
                                        {record.farmer_status}
                                      </span>
                                    </td>
                                    <td style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280', fontFamily: 'monospace' }}>{record.cocoa_card_id || '-'}</td>
                                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, textAlign: 'right', color: '#1f2937' }}>{parseFloat(record.kilos).toFixed(2)}</td>
                                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, textAlign: 'right', color: '#059669' }}>{parseFloat(record.amount_ghc).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p style={{ color: '#9ca3af', fontSize: 13 }}>No records found in this waybill.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              
              {sessions.length === 0 && !loading && (
                <tr><td colSpan="6" style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>No purchase sessions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
