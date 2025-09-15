import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Inventory from './pages/Inventory';
import Shipping from './pages/Shipping';
import CMS from './pages/CMS';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import Chat from './pages/Chat';
import './styles/globals.css';

function App() {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/products/*" element={<Products />} />
                          <Route path="/orders/*" element={<Orders />} />
                          <Route path="/customers/*" element={<Customers />} />
                          <Route path="/inventory/*" element={<Inventory />} />
                          <Route path="/shipping/*" element={<Shipping />} />
                          <Route path="/cms/*" element={<CMS />} />
                          <Route path="/reports/*" element={<Reports />} />
                          <Route path="/settings/*" element={<Settings />} />
                          <Route path="/users/*" element={<Users />} />
                          <Route path="/audit-logs" element={<AuditLogs />} />
                          <Route path="/chat" element={<Chat />} />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </Provider>
  );
}

export default App;
