import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { 
  Users, Search, UploadCloud, Loader2, X, FileText, MapPin, 
  UserPlus, Edit3, Download, Calendar, TrendingUp, Award, Phone, 
  CreditCard, CheckCircle2, RefreshCw, BarChart2
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useSeason } from '../contexts/SeasonContext';
import { exportFarmerStatementPdf } from '../utils/exportFarmerStatement';

const API_URL = 'http://localhost:8000/api';

export default function Farmers() {
  const [farmers, setFarmers] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Selected farmer & state for lifetime history modal
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [farmerHistoryData, setFarmerHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'seasons' | 'ledger'
  const [isProfileClosing, setIsProfileClosing] = useState(false);

  // Modals state for Add / Edit
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddClosing, setIsAddClosing] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditClosing, setIsEditClosing] = useState(false);

  const [formLoading, setFormLoading] = useState(false);
  const [farmerForm, setFarmerForm] = useState({
    name: '',
    kk_id_num: '',
    society: '',
    zone: '',
    station_mark: '',
    gender: 'Male',
    year_of_birth: '',
    phone_numbers: '',
    id_card_number: '',
    field_size: ''
  });

  const fileInputRef = useRef(null);
  const { token } = useAuth();
  const { currentTheme } = useSeason();

  // Lock body scrolling when any modal is open so page background doesn't shift
  useEffect(() => {
    if (selectedFarmer || isAddModalOpen || isEditModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedFarmer, isAddModalOpen, isEditModalOpen]);

  // Smooth Animated Modal Closers
  const handleCloseProfileModal = () => {
    setIsProfileClosing(true);
    setTimeout(() => {
      setSelectedFarmer(null);
      setIsProfileClosing(false);
    }, 280);
  };

  const handleCloseAddModal = () => {
    setIsAddClosing(true);
    setTimeout(() => {
      setIsAddModalOpen(false);
      setIsAddClosing(false);
    }, 280);
  };

  const handleCloseEditModal = () => {
    setIsEditClosing(true);
    setTimeout(() => {
      setIsEditModalOpen(false);
      setIsEditClosing(false);
    }, 280);
  };

  // Keyboard shortcut ESC for modal closing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isEditModalOpen) handleCloseEditModal();
        else if (isAddModalOpen) handleCloseAddModal();
        else if (selectedFarmer) handleCloseProfileModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFarmer, isAddModalOpen, isEditModalOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resF, resR] = await Promise.all([
        axios.get(`${API_URL}/farmers/`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/records/`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setFarmers(resF.data);
      setAllRecords(resR.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Fetch detailed farmer lifetime history when a farmer is selected
  const handleSelectFarmer = async (farmer) => {
    setSelectedFarmer(farmer);
    setFarmerHistoryData(null);
    setLoadingHistory(true);
    setActiveTab('overview');
    setIsProfileClosing(false);

    try {
      const res = await axios.get(`${API_URL}/farmers/${farmer.id}/lifetime_history/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFarmerHistoryData(res.data);
    } catch (err) {
      console.error('Failed to fetch detailed farmer history:', err);
      // Fallback local calculations if endpoint unavailable
      const farmerRecs = allRecords.filter(r => 
        (r.kk_id && r.kk_id === farmer.kk_id_num) ||
        (r.farmer_name && r.farmer_name.toLowerCase() === farmer.name?.toLowerCase())
      );
      const totalKilos = farmerRecs.reduce((sum, r) => sum + (parseFloat(r.kilos) || 0), 0) || (parseFloat(farmer.volume) || 0);
      const totalBags = Math.round(totalKilos / 62.5) || (farmer.bags || 0);
      const totalAmount = farmerRecs.reduce((sum, r) => sum + (parseFloat(r.amount_ghc) || 0), 0) || (totalKilos * 50);

      setFarmerHistoryData({
        farmer,
        summary: {
          total_kilos: totalKilos,
          total_bags: totalBags,
          total_amount_ghc: totalAmount,
          bonus_entitled: totalKilos * 1.12,
          yield_per_hectare: farmer.field_size ? (totalKilos / farmer.field_size).toFixed(1) : 0,
          total_transactions: farmerRecs.length
        },
        seasons_breakdown: [],
        records: farmerRecs
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await axios.post(`${API_URL}/farmers/import_excel/`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        }
      });
      alert(res.data.message);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to import Excel file.');
    } finally {
      setUploading(false);
      event.target.value = ''; // Reset input
    }
  };

  const handleAddFarmerSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await axios.post(`${API_URL}/farmers/`, farmerForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Farmer registered successfully!');
      handleCloseAddModal();
      setFarmerForm({
        name: '', kk_id_num: '', society: '', zone: '', station_mark: '',
        gender: 'Male', year_of_birth: '', phone_numbers: '', id_card_number: '', field_size: ''
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add farmer.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditFarmerSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await axios.patch(`${API_URL}/farmers/${selectedFarmer.id}/`, farmerForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Farmer updated successfully!');
      handleCloseEditModal();
      fetchData();
      handleSelectFarmer({ ...selectedFarmer, ...farmerForm });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update farmer.');
    } finally {
      setFormLoading(false);
    }
  };

  const openEditModal = () => {
    if (!selectedFarmer) return;
    setFarmerForm({
      name: selectedFarmer.name || '',
      kk_id_num: selectedFarmer.kk_id_num || '',
      society: selectedFarmer.society || '',
      zone: selectedFarmer.zone || '',
      station_mark: selectedFarmer.station_mark || '',
      gender: selectedFarmer.gender || 'Male',
      year_of_birth: selectedFarmer.year_of_birth || '',
      phone_numbers: selectedFarmer.phone_numbers || '',
      id_card_number: selectedFarmer.id_card_number || '',
      field_size: selectedFarmer.field_size || ''
    });
    setIsEditModalOpen(true);
    setIsEditClosing(false);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const filteredFarmers = farmers.filter(f => 
    f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.kk_id_num?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.society?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.zone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredFarmers.length / pageSize);
  const paginatedFarmers = filteredFarmers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Layout title="Master Farmer Database" onRefresh={fetchData}>
      <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: 0 }}>Registered Cocoa Farmers</h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginTop: 6 }}>
              Inspect farmer lifetime production history, season breakdowns, and official bonus statements.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 12, top: 11 }} />
              <input 
                type="text" 
                placeholder="Search name, KKID, Society or Zone..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  padding: '9px 12px 9px 36px', 
                  borderRadius: 8, 
                  border: '1px solid #ede8e2', 
                  fontSize: 14,
                  width: 280,
                  outline: 'none'
                }}
              />
            </div>

            <button
              onClick={() => {
                setFarmerForm({
                  name: '', kk_id_num: '', society: '', zone: '', station_mark: '',
                  gender: 'Male', year_of_birth: '', phone_numbers: '', id_card_number: '', field_size: ''
                });
                setIsAddModalOpen(true);
                setIsAddClosing(false);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(5,150,105,0.2)' }}
            >
              <UserPlus size={16} /> Register New Farmer
            </button>

            <input 
              type="file" 
              accept=".xlsx, .xls" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: uploading ? '#9ca3af' : currentTheme.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'all 0.2s' }}
            >
              {uploading ? <Loader2 size={16} className="animate-spin"/> : <UploadCloud size={16}/>}
              {uploading ? 'Importing...' : 'Import Excel'}
            </button>
          </div>
        </div>

        {/* Farmers Table */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #ede8e2', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#faf7f4' }}>
                  {['Farmer Name', 'KK ID Num', 'Society', 'Zone', 'Station Mark', 'Field Size', 'Volume (kg)', 'Bags', 'Action'].map(h => (
                    <th key={h} style={{ padding: '16px 20px', textAlign: h === 'Action' ? 'center' : 'left', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f3ede8', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} style={{ padding: '18px 20px', borderBottom: '1px solid #faf7f4' }}>
                          <div className="shimmer" style={{ height: 14, borderRadius: 6, width: [120,90,100,80,90,70,80,60,50][j] }}/>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paginatedFarmers.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '60px 24px', textAlign: 'center' }}>
                      <div style={{ color: '#d1d5db' }}>
                        <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }}/>
                        <p style={{ fontWeight: 600, color: '#6b7280', fontSize: 16, margin: '0 0 6px' }}>No farmers found</p>
                        <p style={{ color: '#9ca3af', fontSize: 14 }}>{searchTerm ? "Try adjusting your search query." : "Click Register New Farmer or Import Excel to populate the database."}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedFarmers.map((f, i) => (
                    <tr 
                      key={i} 
                      onClick={() => handleSelectFarmer(f)}
                      style={{ borderBottom: '1px solid #faf7f4', transition: 'background 0.15s', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fdf9f6'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      title="Click to view farmer profile & lifetime history"
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 17, background: currentTheme.badgeBg, color: currentTheme.badgeTextColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                            {(f.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, color: '#111827', fontSize: 14, display: 'block' }}>{f.name}</span>
                            {f.phone_numbers && <span style={{ fontSize: 11, color: '#9ca3af' }}>{f.phone_numbers}</span>}
                          </div>
                        </div>
                      </td>
                      
                      <td style={{ padding: '16px 20px', color: currentTheme.primary, fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>
                        {f.kk_id_num || '—'}
                      </td>
                      
                      <td style={{ padding: '16px 20px', color: '#4b5563', fontSize: 13 }}>
                        {f.society || '—'}
                      </td>
                      
                      <td style={{ padding: '16px 20px', color: '#4b5563', fontSize: 13 }}>
                        {f.zone || '—'}
                      </td>

                      <td style={{ padding: '16px 20px', color: '#6b7280', fontSize: 13, fontFamily: 'monospace' }}>
                        {f.station_mark || '—'}
                      </td>
                      
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#4b5563', fontSize: 13 }}>
                        {f.field_size ? `${f.field_size} Ha` : '—'}
                      </td>
                      
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#059669', fontSize: 14 }}>
                        {f.volume ? `${f.volume.toLocaleString()} kg` : '—'}
                      </td>
                      
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#2563eb', fontSize: 14 }}>
                        {f.bags ? f.bags : (f.volume ? Math.round(f.volume / 62.5) : '—')}
                      </td>

                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <span style={{ fontSize: 12, color: currentTheme.primary, fontWeight: 700, background: currentTheme.badgeBg, padding: '4px 10px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          Profile & History &rarr;
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3ede8', background: '#faf7f4' }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                Showing <b>{((currentPage - 1) * pageSize) + 1}</b> to <b>{Math.min(currentPage * pageSize, filteredFarmers.length)}</b> of <b>{filteredFarmers.length}</b> farmers
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, fontWeight: 600, color: currentPage === 1 ? '#9ca3af' : '#374151', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, fontWeight: 600, color: currentPage === totalPages ? '#9ca3af' : '#374151', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== FARMER PROFILE & LIFETIME HISTORY MODAL (PORTAL TO DOCUMENT.BODY) ===== */}
      {selectedFarmer && createPortal(
        <div 
          className={isProfileClosing ? "modal-backdrop-out" : "modal-backdrop-in"}
          onClick={handleCloseProfileModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 99999, paddingTop: 28, paddingBottom: 28, overflow: 'hidden' }}
        >
          <div 
            className={isProfileClosing ? "modal-pop-out" : "modal-pop-in"}
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 24, width: '92%', maxWidth: 840, maxHeight: 'calc(100vh - 56px)', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column' }}
          >
            
            {/* Modal Header Banner */}
            <div style={{ background: currentTheme.sidebarGradient, padding: '24px 32px', color: '#fff', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 32, background: currentTheme.logoGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 28, color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                    {(selectedFarmer.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#fff' }}>{selectedFarmer.name}</h2>
                      <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                        KK-ID: {selectedFarmer.kk_id_num || 'N/A'}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={14} />
                      Society: <strong>{selectedFarmer.society || 'N/A'}</strong> • Zone: <strong>{selectedFarmer.zone || 'N/A'}</strong>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button 
                    onClick={openEditModal} 
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 10, padding: '7px 12px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'background 0.2s' }}
                  >
                    <Edit3 size={14} /> Edit Profile
                  </button>

                  <button 
                    onClick={handleCloseProfileModal} 
                    style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 20, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div style={{ display: 'flex', gap: 8, marginTop: 22, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                {[
                  { id: 'overview', label: 'Overview & Profile', icon: Users },
                  { id: 'seasons', label: 'Season Breakdown', icon: BarChart2 },
                  { id: 'ledger', label: 'Purchase Ledger', icon: FileText }
                ].map(t => {
                  const IconComp = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 16px',
                        background: isActive ? '#fff' : 'transparent',
                        color: isActive ? currentTheme.primary : 'rgba(255,255,255,0.8)',
                        border: 'none',
                        borderRadius: '8px 8px 0 0',
                        fontSize: 13,
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <IconComp size={14} /> {t.label}
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    if (farmerHistoryData) {
                      exportFarmerStatementPdf(
                        selectedFarmer,
                        farmerHistoryData.summary,
                        farmerHistoryData.records,
                        farmerHistoryData.seasons_breakdown
                      );
                    }
                  }}
                  style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    background: '#059669',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}
                >
                  <Download size={14} /> PDF Statement
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '28px', overflowY: 'auto', flex: 1, background: '#fcfbf9' }}>
              
              {loadingHistory ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                  <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', color: currentTheme.primary }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>Loading farmer lifetime metrics...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: OVERVIEW & PROFILE */}
                  {activeTab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      
                      {/* Stat Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
                        <div style={{ background: '#fff', padding: 18, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Lifetime Volume</p>
                          <p style={{ fontSize: 22, fontWeight: 800, color: '#059669', margin: '6px 0 0' }}>
                            {(farmerHistoryData?.summary?.total_kilos || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })} kg
                          </p>
                        </div>
                        
                        <div style={{ background: '#fff', padding: 18, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Lifetime Bags (62.5kg)</p>
                          <p style={{ fontSize: 22, fontWeight: 800, color: '#2563eb', margin: '6px 0 0' }}>
                            {farmerHistoryData?.summary?.total_bags || 0} bags
                          </p>
                        </div>

                        <div style={{ background: '#fff', padding: 18, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Total Cash Paid Out</p>
                          <p style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: '6px 0 0' }}>
                            GH₵ {(farmerHistoryData?.summary?.total_amount_ghc || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>

                        <div style={{ background: '#fff', padding: 18, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Bonus Entitled</p>
                          <p style={{ fontSize: 22, fontWeight: 800, color: '#d97706', margin: '6px 0 0' }}>
                            GH₵ {(farmerHistoryData?.summary?.bonus_entitled || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      {/* Bio Details Grid */}
                      <div style={{ background: '#fff', padding: 22, borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CreditCard size={16} color={currentTheme.primary} /> Farmer Bio & Verification Metrics
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                          <div>
                            <span style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Ghana Card / ID Number</span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{selectedFarmer.id_card_number || 'Not Registered'}</span>
                          </div>

                          <div>
                            <span style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Contact Phone</span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Phone size={13} color="#64748b" /> {selectedFarmer.phone_numbers || 'N/A'}
                            </span>
                          </div>

                          <div>
                            <span style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Gender & YOB</span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>
                              {selectedFarmer.gender || 'N/A'} {selectedFarmer.year_of_birth ? `(Born ${selectedFarmer.year_of_birth})` : ''}
                            </span>
                          </div>

                          <div>
                            <span style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Farm Field Size</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>
                              {selectedFarmer.field_size ? `${selectedFarmer.field_size} Hectares` : 'Not Measured'}
                            </span>
                          </div>

                          <div>
                            <span style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Yield Efficiency</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#2563eb' }}>
                              {farmerHistoryData?.summary?.yield_per_hectare ? `${farmerHistoryData.summary.yield_per_hectare} kg / Hectare` : 'N/A'}
                            </span>
                          </div>

                          <div>
                            <span style={{ fontSize: 12, color: '#94a3b8', display: 'block' }}>Station Mark</span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#334155', fontFamily: 'monospace' }}>
                              {selectedFarmer.station_mark || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 2: SEASON BREAKDOWN */}
                  {activeTab === 'seasons' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Crop Season Year-by-Year Breakdown</h3>
                        <span style={{ fontSize: 12, color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: 12 }}>
                          COCOBOD Multi-Season Tracking
                        </span>
                      </div>

                      {(!farmerHistoryData?.seasons_breakdown || farmerHistoryData.seasons_breakdown.length === 0) ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', color: '#94a3b8' }}>
                          <BarChart2 size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                          <p style={{ margin: 0, fontWeight: 600, color: '#64748b' }}>No seasonal breakdown logs found yet.</p>
                          <p style={{ margin: '4px 0 0', fontSize: 12 }}>Waybills recorded for this farmer will automatically aggregate per crop year.</p>
                        </div>
                      ) : (
                        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', textTransform: 'uppercase', fontSize: 11, fontWeight: 700 }}>
                                <th style={{ padding: '14px 18px', textAlign: 'left' }}>Crop Season</th>
                                <th style={{ padding: '14px 18px', textAlign: 'center' }}>Deliveries</th>
                                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Volume (kg)</th>
                                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Bags (62.5kg)</th>
                                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Total Paid (GH₵)</th>
                                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Bonus (GH₵)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {farmerHistoryData.seasons_breakdown.map((sb, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '14px 18px', fontWeight: 700, color: currentTheme.primary }}>
                                    {sb.season}
                                  </td>
                                  <td style={{ padding: '14px 18px', textAlign: 'center', color: '#475569' }}>
                                    {sb.count} Waybill(s)
                                  </td>
                                  <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                                    {sb.kilos.toLocaleString()} kg
                                  </td>
                                  <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                                    {sb.bags} bags
                                  </td>
                                  <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>
                                    GH₵ {sb.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700, color: '#d97706' }}>
                                    GH₵ {sb.bonus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: TRANSACTION LEDGER */}
                  {activeTab === 'ledger' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Itemized Waybill Delivery Ledger</h3>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '4px 12px', borderRadius: 12 }}>
                          {farmerHistoryData?.records?.length || 0} Transactions Logged
                        </span>
                      </div>

                      {(!farmerHistoryData?.records || farmerHistoryData.records.length === 0) ? (
                        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', background: '#fff', borderRadius: 16, border: '1px dashed #cbd5e1' }}>
                          <FileText size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                          <p style={{ margin: 0, fontWeight: 600, color: '#64748b' }}>No individual waybill history logged yet for this farmer.</p>
                          <p style={{ margin: '4px 0 0', fontSize: 12 }}>Master database record: {selectedFarmer.volume || 0} kg registered.</p>
                        </div>
                      ) : (
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', textTransform: 'uppercase', fontSize: 11, fontWeight: 700 }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Date</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Waybill No</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Season</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Volume (kg)</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Bags</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Paid (GH₵)</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Bonus (GH₵)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {farmerHistoryData.records.map((rec, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '12px 16px', color: '#475569' }}>{rec.date || '—'}</td>
                                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b', fontFamily: 'monospace' }}>{rec.waybill_no || `WB-${rec.id}`}</td>
                                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{rec.season || '2025/2026'}</td>
                                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>{parseFloat(rec.kilos || 0).toFixed(1)} kg</td>
                                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>{Math.round((parseFloat(rec.kilos) || 0) / 62.5)}</td>
                                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>GH₵ {(parseFloat(rec.amount_ghc) || (parseFloat(rec.kilos || 0) * 50)).toFixed(2)}</td>
                                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#d97706' }}>GH₵ {(parseFloat(rec.kilos || 0) * 1.12).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                </>
              )}

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===== REGISTER NEW FARMER MODAL (PORTAL TO DOCUMENT.BODY) ===== */}
      {isAddModalOpen && createPortal(
        <div 
          className={isAddClosing ? "modal-backdrop-out" : "modal-backdrop-in"}
          onClick={handleCloseAddModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 99999, paddingTop: 28, paddingBottom: 28, overflow: 'hidden' }}
        >
          <div 
            className={isAddClosing ? "modal-pop-out" : "modal-pop-in"}
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 20, width: '92%', maxWidth: 540, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', maxHeight: 'calc(100vh - 56px)' }}
          >
            <div style={{ background: '#059669', padding: '20px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={20} /> Register New Farmer
              </h3>
              <button onClick={handleCloseAddModal} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddFarmerSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '80vh', overflowY: 'auto' }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Full Name *</label>
                <input required type="text" value={farmerForm.name} onChange={e => setFarmerForm({...farmerForm, name: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="e.g. Kwame Mensah" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>KK-ID Number *</label>
                  <input required type="text" value={farmerForm.kk_id_num} onChange={e => setFarmerForm({...farmerForm, kk_id_num: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'monospace' }} placeholder="e.g. KK-2025-084" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Ghana Card ID</label>
                  <input type="text" value={farmerForm.id_card_number} onChange={e => setFarmerForm({...farmerForm, id_card_number: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="GHA-72648102-1" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Society Depot</label>
                  <input type="text" value={farmerForm.society} onChange={e => setFarmerForm({...farmerForm, society: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="e.g. Sankore Depot A" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Zone / District</label>
                  <input type="text" value={farmerForm.zone} onChange={e => setFarmerForm({...farmerForm, zone: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="e.g. Asunafo South" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Station Mark</label>
                  <input type="text" value={farmerForm.station_mark} onChange={e => setFarmerForm({...farmerForm, station_mark: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'monospace' }} placeholder="SNK-01" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Phone Number</label>
                  <input type="text" value={farmerForm.phone_numbers} onChange={e => setFarmerForm({...farmerForm, phone_numbers: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="0244000000" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Field Size (Ha)</label>
                  <input type="number" step="0.1" value={farmerForm.field_size} onChange={e => setFarmerForm({...farmerForm, field_size: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} placeholder="2.5" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={handleCloseAddModal} style={{ padding: '9px 18px', background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={formLoading} style={{ padding: '9px 20px', background: '#059669', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#fff', cursor: formLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {formLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Save Farmer
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ===== EDIT FARMER MODAL (PORTAL TO DOCUMENT.BODY) ===== */}
      {isEditModalOpen && createPortal(
        <div 
          className={isEditClosing ? "modal-backdrop-out" : "modal-backdrop-in"}
          onClick={handleCloseEditModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 99999, paddingTop: 28, paddingBottom: 28, overflow: 'hidden' }}
        >
          <div 
            className={isEditClosing ? "modal-pop-out" : "modal-pop-in"}
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 20, width: '92%', maxWidth: 540, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', maxHeight: 'calc(100vh - 56px)' }}
          >
            <div style={{ background: currentTheme.primary, padding: '20px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={20} /> Edit Farmer Profile
              </h3>
              <button onClick={handleCloseEditModal} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditFarmerSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '80vh', overflowY: 'auto' }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Full Name *</label>
                <input required type="text" value={farmerForm.name} onChange={e => setFarmerForm({...farmerForm, name: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>KK-ID Number *</label>
                  <input required type="text" value={farmerForm.kk_id_num} onChange={e => setFarmerForm({...farmerForm, kk_id_num: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'monospace' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Ghana Card ID</label>
                  <input type="text" value={farmerForm.id_card_number} onChange={e => setFarmerForm({...farmerForm, id_card_number: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Society Depot</label>
                  <input type="text" value={farmerForm.society} onChange={e => setFarmerForm({...farmerForm, society: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Zone / District</label>
                  <input type="text" value={farmerForm.zone} onChange={e => setFarmerForm({...farmerForm, zone: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Station Mark</label>
                  <input type="text" value={farmerForm.station_mark} onChange={e => setFarmerForm({...farmerForm, station_mark: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'monospace' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Phone Number</label>
                  <input type="text" value={farmerForm.phone_numbers} onChange={e => setFarmerForm({...farmerForm, phone_numbers: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Field Size (Ha)</label>
                  <input type="number" step="0.1" value={farmerForm.field_size} onChange={e => setFarmerForm({...farmerForm, field_size: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={handleCloseEditModal} style={{ padding: '9px 18px', background: '#f1f5f9', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={formLoading} style={{ padding: '9px 20px', background: currentTheme.primary, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#fff', cursor: formLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {formLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Update Details
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </Layout>
  );
}
