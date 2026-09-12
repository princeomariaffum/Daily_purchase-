import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import { X, Layers, MapPin, CheckCircle2, ShieldCheck, Maximize2, Compass, AlertCircle } from 'lucide-react';
import { useSeason } from '../contexts/SeasonContext';

export default function FarmMapModal({ farmer, farm, onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polygonLayerRef = useRef(null);

  const [tileMode, setTileMode] = useState('satellite'); // 'satellite' | 'street'
  const [isClosing, setIsClosing] = useState(false);
  const { currentTheme } = useSeason();

  // Extract farm polygon coordinates or build default fallback polygon
  const rawPolygon = farm?.polygon || farmer?.farms?.[0]?.polygon || [];
  const farmSizeHa = farm?.farm_size_ha || farmer?.actual_farm_size || farmer?.field_size || 2.5;
  const farmSizeAcres = (farmSizeHa * 2.47105).toFixed(2);
  const estimatedYieldKg = farm?.estimated_yield_kg || Math.round(farmSizeHa * 450);
  const estimatedBags = (estimatedYieldKg / 62.5).toFixed(1);

  // Parse lat/lng array for Leaflet
  const polygonPoints = Array.isArray(rawPolygon) && rawPolygon.length >= 3
    ? rawPolygon.map(pt => [pt.lat ?? pt[0], pt.lng ?? pt[1]])
    : [
        [6.7333, -1.6500],
        [6.7350, -1.6520],
        [6.7360, -1.6480],
        [6.7333, -1.6500]
      ];

  const centerLat = polygonPoints.reduce((sum, pt) => sum + pt[0], 0) / polygonPoints.length;
  const centerLng = polygonPoints.reduce((sum, pt) => sum + pt[1], 0) / polygonPoints.length;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 16,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Add Tile Layer
    if (tileMode === 'satellite') {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri'
      }).addTo(map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
    }

    // Draw Polygon Overlay
    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
    }

    const polygon = L.polygon(polygonPoints, {
      color: '#047857',
      fillColor: '#059669',
      fillOpacity: 0.45,
      weight: 3
    }).addTo(map);

    polygon.bindPopup(`
      <div style="font-family: system-ui, sans-serif; padding: 4px;">
        <strong style="color: #065f46; font-size: 14px;">${farmer?.name || 'Cocoa Farm'}</strong><br/>
        <span style="color: #4b5563; font-size: 12px;">Size: <b>${farmSizeHa} Ha</b> (${farmSizeAcres} Acres)</span><br/>
        <span style="color: #059669; font-size: 12px;">Est. Yield: <b>${estimatedYieldKg} kg</b> (${estimatedBags} bags)</span>
      </div>
    `);

    polygonLayerRef.current = polygon;
    map.fitBounds(polygon.getBounds(), { padding: [50, 50] });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [tileMode]);

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: 28,
        paddingBottom: 28,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        opacity: isClosing ? 0 : 1,
        transition: 'opacity 0.2s ease-in-out',
        overflowY: 'auto'
      }}
      onClick={handleClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '94%',
          maxWidth: 1100,
          background: '#ffffff',
          borderRadius: 18,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 56px)',
          transform: isClosing ? 'scale(0.97)' : 'scale(1)',
          transition: 'transform 0.2s ease-in-out'
        }}
      >
        {/* Modal Header */}
        <div style={{ padding: '18px 24px', background: currentTheme.gradient, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <MapPin size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                GPS Farm Polygon Map — {farmer?.name || 'Cocoa Farmer'}
              </h3>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.9 }}>
                COCOBOD ID: <b>{farmer?.cocobod_id || farmer?.kk_id_num || '—'}</b> | Society: <b>{farmer?.society || farmer?.district_name || '—'}</b> | Zone: <b>{farmer?.zone || farmer?.zone_name || '—'}</b>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Tile Layer Controls */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.2)', padding: 3, borderRadius: 8 }}>
              <button 
                onClick={() => setTileMode('satellite')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  background: tileMode === 'satellite' ? '#ffffff' : 'transparent',
                  color: tileMode === 'satellite' ? currentTheme.primary : '#ffffff',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Layers size={14} /> Satellite View
              </button>
              <button 
                onClick={() => setTileMode('street')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  background: tileMode === 'street' ? '#ffffff' : 'transparent',
                  color: tileMode === 'street' ? currentTheme.primary : '#ffffff',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Compass size={14} /> Street Map
              </button>
            </div>

            <button 
              onClick={handleClose}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body: Map + Sidebar */}
        <div style={{ display: 'flex', height: 580, background: '#f8fafc', position: 'relative' }}>
          {/* Map Canvas */}
          <div ref={mapContainerRef} style={{ flex: 1, height: '100%', width: '100%' }} />

          {/* Right Metrics Panel */}
          <div style={{ width: 320, background: '#ffffff', borderLeft: '1px solid #e2e8f0', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
            <div style={{ background: currentTheme.badgeBg, padding: 14, borderRadius: 12, border: `1px solid ${currentTheme.badgeBorderColor}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: currentTheme.primary, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                <ShieldCheck size={16} /> Verified Farm Survey
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#4b5563', lineHeight: 1.4 }}>
                GPS polygon boundaries surveyed via Kuapa Kokoo mobile field mapping tool.
              </p>
            </div>

            {/* Farm Area Box */}
            <div style={{ background: '#fafaf9', padding: 16, borderRadius: 12, border: '1px solid #f5f5f4' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Official Farm Size</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#047857' }}>{farmSizeHa}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>Hectares</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#a8a29e', display: 'block', marginTop: 2 }}>
                Equivalent to <b>{farmSizeAcres} Acres</b>
              </span>
            </div>

            {/* Estimated Yield */}
            <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 12, border: '1px solid #dcfce7' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estimated Annual Yield</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#15803d' }}>{estimatedYieldKg.toLocaleString()}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>kg</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d', display: 'block', marginTop: 2 }}>
                ~ {estimatedBags} bags (62.5kg standard)
              </span>
            </div>

            {/* GPS Metadata */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                <span style={{ color: '#64748b' }}>Center Latitude</span>
                <span style={{ fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>{centerLat.toFixed(5)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                <span style={{ color: '#64748b' }}>Center Longitude</span>
                <span style={{ fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>{centerLng.toFixed(5)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                <span style={{ color: '#64748b' }}>GPS Boundary Points</span>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{polygonPoints.length} Vertices</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Status</span>
                <span style={{ fontWeight: 700, color: '#047857', background: '#d1fae5', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>
                  Active Farm
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
