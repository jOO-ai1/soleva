import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { RBACProvider } from './contexts/RBACContext';
import { NotificationProvider } from './components/NotificationSystem';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import FlashSales from './pages/FlashSales';
import Coupons from './pages/Coupons';
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
import ChatSupport from './pages/ChatSupport';
import MultiStore from './pages/MultiStore';
import Suppliers from './pages/Suppliers';
import Investors from './pages/Investors';
import GuestAnalytics from './pages/GuestAnalytics';
import './styles/globals.css';
import './styles/design-system.css';

function App() {
  return (
    <Provider store={store}>
      <LanguageProvider>
        <NotificationProvider>
          <AuthProvider>
            <RBACProvider>
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
                            <Route path="/categories/*" element={<Categories />} />
                            <Route path="/flash-sales/*" element={<FlashSales />} />
                            <Route path="/coupons/*" element={<Coupons />} />
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
                            <Route path="/chat-support/*" element={<ChatSupport />} />
                            <Route path="/multi-store/*" element={<MultiStore />} />
                            <Route path="/suppliers/*" element={<Suppliers />} />
                            <Route path="/investors/*" element={<Investors />} />
                            <Route path="/guest-analytics/*" element={<GuestAnalytics />} />
                          </Routes>
                        </Layout>
                      </ProtectedRoute>
                      } />

                </Routes>
              </div>
            </Router>
            </RBACProvider>
          </AuthProvider>
        </NotificationProvider>
      </LanguageProvider>
    </Provider>);

}

export default App;