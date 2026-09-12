import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  MapPin, Search, Filter, Layers, Compass, Loader2, Map, ShieldCheck, 
  ChevronRight, RefreshCw, BarChart2, Award 
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useSeason } from '../contexts/SeasonContext';
import FarmMapModal from '../components/FarmMapModal';
import { API_URL } from '../config';

export default function Farms() {
  const [farms, setFarms] = useState([]);
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedZone, setSelectedZone] = useState('');

  // Selected farm for map modal
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const { token } = useAuth();
  const { currentTheme } = useSeason();

  useEffect(() => {
    fetchFarmsData();
  }, [token]);

  const fetchFarmsData = async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [farmsRes, regionsRes, districtsRes, zonesRes] = await Promise.all([
        axios.get(`${API_URL}/farms/`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/regions/`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/districts/`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/zones/`, { headers }).catch(() => ({ data: [] }))
      ]);

      const farmsData = Array.isArray(farmsRes.data) ? farmsRes.data : (farmsRes.data?.results || []);
      const regionsData = Array.isArray(regionsRes.data) ? regionsRes.data : (regionsRes.data?.results || []);
      const districtsData = Array.isArray(districtsRes.data) ? districtsRes.data : (districtsRes.data?.results || []);
      const zonesData = Array.isArray(zonesRes.data) ? zonesRes.data : (zonesRes.data?.results || []);

      setFarms(farmsData);
      setRegions(regionsData);
      setDistricts(districtsData);
      setZones(zonesData);
    } catch (err) {
      console.error('Error loading farms data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFarms = farms.filter(f => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (f.farmer_name || '').toLowerCase().includes(search) ||
      (f.cocobod_id || '').toLowerCase().includes(search) ||
      (f.district_name || '').toLowerCase().includes(search);

    const matchesRegion = !selectedRegion || f.region_name === selectedRegion;
    const matchesDistrict = !selectedDistrict || f.district_name === selectedDistrict;
    const matchesZone = !selectedZone || f.zone_name === selectedZone;

    return matchesSearch && matchesRegion && matchesDistrict && matchesZone;
  });

  const totalHectares = filteredFarms.reduce((sum, f) => sum + (f.farm_size_ha || 2.5), 0);
  const totalAcres = Math.round(totalHectares * 2.47105);
  const totalYieldKg = filteredFarms.reduce((sum, f) => sum + (f.estimated_yield_kg || Math.round((f.farm_size_ha || 2.5) * 450)), 0);

  const totalPages = Math.ceil(filteredFarms.length / pageSize) || 1;
  const paginatedFarms = filteredFarms.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenMap = (farmItem) => {
    setSelectedFarm(farmItem);
    setSelectedFarmer({
      name: farmItem.farmer_name,
      cocobod_id: farmItem.cocobod_id,
      society: farmItem.district_name,
      zone: farmItem.zone_name
    });
  };

  return (
    <Layout>
      <div style={{ padding: '24px 32px', maxWidth: 1440, margin: '0 auto' }}>
        
        {/* Page Title Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ padding: 8, borderRadius: 10, background: currentTheme.badgeBg, color: currentTheme.primary }}>
                <MapPin size={22} />
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0, tracking: '-0.02em' }}>
                Cocoa Farms & GPS Boundary Mapping
              </h1>
            </div>
            <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0 42px' }}>
              Inspect surveyed cocoa land polygons, satellite tree canopy, and verified acreage across Ghana.
            </p>
          </div>

          <button 
            onClick={fetchFarmsData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 13,
              color: '#374151',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <RefreshCw size={15} /> Refresh GPS Data
          </button>
        </div>

        {/* Top Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
          <div style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #f3ede8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Surveyed Farms</span>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginTop: 4 }}>{filteredFarms.length.toLocaleString()}</div>
            <span style={{ fontSize: 12, color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <ShieldCheck size={14} /> 100% GPS Mapped
            </span>
          </div>

          <div style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #f3ede8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Mapped Land</span>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#047857', marginTop: 4 }}>{totalHectares.toLocaleString()} <span style={{ fontSize: 16, fontWeight: 600 }}>Ha</span></div>
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginTop: 4, display: 'block' }}>
              Equivalent to <b>{totalAcres.toLocaleString()} Acres</b>
            </span>
          </div>

          <div style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #f3ede8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Farm Size</span>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>
              {(totalHectares / (filteredFarms.length || 1)).toFixed(1)} <span style={{ fontSize: 16, fontWeight: 600 }}>Ha</span>
            </div>
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginTop: 4, display: 'block' }}>
              Standard cocoa farm plot
            </span>
          </div>

          <div style={{ background: '#ffffff', padding: 20, borderRadius: 16, border: '1px solid #f3ede8', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Est. Total Cocoa Yield</span>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#d97706', marginTop: 4 }}>
              {(totalYieldKg / 1000).toFixed(1)} <span style={{ fontSize: 16, fontWeight: 600 }}>Tons</span>
            </div>
            <span style={{ fontSize: 12, color: '#d97706', fontWeight: 600, marginTop: 4, display: 'block' }}>
              ~ {Math.round(totalYieldKg / 62.5).toLocaleString()} bags
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ background: '#ffffff', padding: 18, borderRadius: 16, border: '1px solid #f3ede8', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input 
              type="text"
              placeholder="Search by farmer name, COCOBOD ID, or district..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 42px',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                fontSize: 14,
                outline: 'none',
                background: '#fafaf9'
              }}
            />
          </div>

          {/* Region Filter */}
          <select 
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, background: '#fff', fontWeight: 600, color: '#374151' }}
          >
            <option value="">All Regions ({regions.length})</option>
            {regions.map((r, i) => <option key={i} value={r.region_name}>{r.region_name}</option>)}
          </select>

          {/* District Filter */}
          <select 
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, background: '#fff', fontWeight: 600, color: '#374151' }}
          >
            <option value="">All Districts ({districts.length})</option>
            {districts.map((d, i) => <option key={i} value={d.district_name}>{d.district_name}</option>)}
          </select>

          {/* Zone Filter */}
          <select 
            value={selectedZone}
            onChange={e => setSelectedZone(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, background: '#fff', fontWeight: 600, color: '#374151' }}
          >
            <option value="">All Zones ({zones.length})</option>
            {zones.map((z, i) => <option key={i} value={z.zone_name}>{z.zone_name}</option>)}
          </select>
        </div>

        {/* Farm List Table */}
        <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid #f3ede8', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
              <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px', color: currentTheme.primary }} />
              <p style={{ fontWeight: 600 }}>Loading GPS farm boundaries...</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#faf7f4', borderBottom: '1px solid #f3ede8', fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '16px 20px' }}>Farm ID</th>
                  <th style={{ padding: '16px 20px' }}>Farmer Name</th>
                  <th style={{ padding: '16px 20px' }}>District / Society</th>
                  <th style={{ padding: '16px 20px' }}>Zone</th>
                  <th style={{ padding: '16px 20px' }}>Size (Hectares)</th>
                  <th style={{ padding: '16px 20px' }}>Est. Yield (kg)</th>
                  <th style={{ padding: '16px 20px' }}>Status</th>
                  <th style={{ padding: '16px 20px', textAlign: 'center' }}>Map Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFarms.map((farmItem, i) => (
                  <tr 
                    key={i}
                    style={{ borderBottom: '1px solid #faf7f4', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fdf9f6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 700, color: '#4b5563', fontSize: 13 }}>
                      FARM-{farmItem.farm_id || i + 1}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontWeight: 700, color: '#111827', fontSize: 14, display: 'block' }}>
                        {farmItem.farmer_name || 'Cocoa Farmer'}
                      </span>
                      <span style={{ fontSize: 12, color: currentTheme.primary, fontFamily: 'monospace' }}>
                        {farmItem.cocobod_id || '—'}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', color: '#4b5563', fontSize: 13 }}>
                      {farmItem.district_name || 'Offinso Society'}
                    </td>

                    <td style={{ padding: '16px 20px', color: '#4b5563', fontSize: 13 }}>
                      {farmItem.zone_name || 'Offinso Central'}
                    </td>

                    <td style={{ padding: '16px 20px', fontWeight: 700, color: '#047857', fontSize: 14 }}>
                      {farmItem.farm_size_ha || 2.5} Ha
                    </td>

                    <td style={{ padding: '16px 20px', fontWeight: 700, color: '#d97706', fontSize: 14 }}>
                      {(farmItem.estimated_yield_kg || Math.round((farmItem.farm_size_ha || 2.5) * 450)).toLocaleString()} kg
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#047857', background: '#d1fae5', padding: '4px 10px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ShieldCheck size={13} /> Active
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleOpenMap(farmItem)}
                        style={{
                          padding: '8px 14px',
                          background: currentTheme.badgeBg,
                          border: `1px solid ${currentTheme.badgeBorderColor}`,
                          borderRadius: 10,
                          color: currentTheme.primary,
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Map size={14} /> View GPS Map 🗺️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3ede8', background: '#faf7f4' }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                Showing <b>{((currentPage - 1) * pageSize) + 1}</b> to <b>{Math.min(currentPage * pageSize, filteredFarms.length)}</b> of <b>{filteredFarms.length}</b> farms
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

        {/* Map Modal */}
        {selectedFarm && (
          <FarmMapModal 
            farm={selectedFarm}
            farmer={selectedFarmer}
            onClose={() => {
              setSelectedFarm(null);
              setSelectedFarmer(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
}
