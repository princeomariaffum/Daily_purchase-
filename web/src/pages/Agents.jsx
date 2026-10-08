import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useSeason } from '../contexts/SeasonContext';
import { Plus, Edit2, Shield, User } from 'lucide-react';
import { API_URL } from '../config';

export default function Agents() {
  const { token } = useAuth();
  const { currentTheme } = useSeason();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [societies, setSocieties] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/users/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Error fetching users:', e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const societiesArray = societies.split(',').map(s => s.trim()).filter(Boolean);
    const payload = { 
      username, 
      assigned_societies: societiesArray 
    };
    if (password) payload.password = password;

    try {
      if (editUser) {
        await axios.patch(`${API_URL}/users/${editUser.id}/`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/users/`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setModalOpen(false);
      fetchUsers();
    } catch (e) {
      console.error(e);
      alert('Failed to save user.');
    }
  };

  const openModal = (user = null) => {
    setEditUser(user);
    if (user) {
      setUsername(user.username);
      setPassword('');
      setSocieties((user.assigned_societies || []).join(', '));
    } else {
      setUsername('');
      setPassword('');
      setSocieties('');
    }
    setModalOpen(true);
  };

  return (
    <Layout title="Field Agents Management" onRefresh={fetchUsers}>
      <div style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>Agents & Societies</h2>
            <p style={{ color: '#6b7280', fontSize: 14 }}>Manage field agents and assign them to specific societies.</p>
          </div>
          <button 
            onClick={() => openModal()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: currentTheme.buttonGradient, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
          >
            <Plus size={18} /> Add Agent
          </button>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Username</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Assigned Societies</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: currentTheme.badgeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentTheme.primary }}>
                        <User size={18} />
                      </div>
                      <span style={{ fontWeight: 600, color: '#1f2937' }}>{user.username}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {user.assigned_societies && user.assigned_societies.length > 0 ? (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {user.assigned_societies.map(soc => (
                          <span key={soc} style={{ background: currentTheme.badgeBg, color: currentTheme.badgeTextColor, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{soc}</span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: 13, fontStyle: 'italic' }}>No societies assigned (Admin sees all)</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button onClick={() => openModal(user)} style={{ background: 'transparent', border: 'none', color: currentTheme.primary, cursor: 'pointer', padding: 8 }}>
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr><td colSpan="3" style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>No agents found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 16, width: 400, maxWidth: '90%' }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>{editUser ? 'Edit Agent' : 'Add New Agent'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Username</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15 }} 
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Password {editUser && <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Leave blank to keep current)</span>}</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required={!editUser} 
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15 }} 
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Assigned Societies</label>
                <input 
                  type="text" 
                  value={societies} 
                  onChange={e => setSocieties(e.target.value)} 
                  placeholder="Kumasi South, Oda, Subin" 
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15 }} 
                />
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Comma-separated list of exact society names.</p>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ flex: 1, padding: 12, background: '#f3f4f6', border: 'none', borderRadius: 8, fontWeight: 600, color: '#4b5563', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: 12, background: currentTheme.buttonGradient, border: 'none', borderRadius: 8, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Save Agent</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
