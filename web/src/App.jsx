import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SeasonProvider } from './contexts/SeasonContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Farmers from './pages/Farmers';
import Agents from './pages/Agents';
import Sessions from './pages/Sessions';
import Reports from './pages/Reports';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <SeasonProvider>
        <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/farmers" element={
            <ProtectedRoute>
              <Farmers />
            </ProtectedRoute>
          } />
          <Route path="/agents" element={
            <ProtectedRoute>
              <Agents />
            </ProtectedRoute>
          } />
          <Route path="/sessions" element={
            <ProtectedRoute>
              <Sessions />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </SeasonProvider>
    </AuthProvider>
  );
}

export default App;

