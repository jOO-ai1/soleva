
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string; // create, read, update, delete, manage
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  level: number; // 1 = Admin, 2 = Manager, 3 = Agent, 4 = Viewer
}

interface RBACContextType {
  roles: Role[];
  permissions: Permission[];
  userRole: Role | null;
  hasPermission: (module: string, action: string) => boolean;
  hasAnyPermission: (checks: Array<{module: string, action: string}>) => boolean;
  canAccessModule: (module: string) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isAgent: boolean;
  isViewer: boolean;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

// Define all permissions
const PERMISSIONS: Permission[] = [
  // Products
  { id: 'products.create', name: 'Create Products', description: 'Create new products', module: 'products', action: 'create' },
  { id: 'products.read', name: 'View Products', description: 'View product list', module: 'products', action: 'read' },
  { id: 'products.update', name: 'Update Products', description: 'Edit existing products', module: 'products', action: 'update' },
  { id: 'products.delete', name: 'Delete Products', description: 'Delete products', module: 'products', action: 'delete' },
  { id: 'products.manage', name: 'Manage Products', description: 'Full product management', module: 'products', action: 'manage' },
  
  // Orders
  { id: 'orders.read', name: 'View Orders', description: 'View order list', module: 'orders', action: 'read' },
  { id: 'orders.update', name: 'Update Orders', description: 'Update order status', module: 'orders', action: 'update' },
  { id: 'orders.manage', name: 'Manage Orders', description: 'Full order management', module: 'orders', action: 'manage' },
  
  // Customers
  { id: 'customers.read', name: 'View Customers', description: 'View customer list', module: 'customers', action: 'read' },
  { id: 'customers.update', name: 'Update Customers', description: 'Edit customer info', module: 'customers', action: 'update' },
  { id: 'customers.manage', name: 'Manage Customers', description: 'Full customer management', module: 'customers', action: 'manage' },
  
  // Suppliers
  { id: 'suppliers.create', name: 'Create Suppliers', description: 'Add new suppliers', module: 'suppliers', action: 'create' },
  { id: 'suppliers.read', name: 'View Suppliers', description: 'View supplier list', module: 'suppliers', action: 'read' },
  { id: 'suppliers.update', name: 'Update Suppliers', description: 'Edit supplier info', module: 'suppliers', action: 'update' },
  { id: 'suppliers.delete', name: 'Delete Suppliers', description: 'Remove suppliers', module: 'suppliers', action: 'delete' },
  { id: 'suppliers.manage', name: 'Manage Suppliers', description: 'Full supplier management', module: 'suppliers', action: 'manage' },
  
  // Investors
  { id: 'investors.create', name: 'Create Investors', description: 'Add new investors', module: 'investors', action: 'create' },
  { id: 'investors.read', name: 'View Investors', description: 'View investor list', module: 'investors', action: 'read' },
  { id: 'investors.update', name: 'Update Investors', description: 'Edit investor info', module: 'investors', action: 'update' },
  { id: 'investors.delete', name: 'Delete Investors', description: 'Remove investors', module: 'investors', action: 'delete' },
  { id: 'investors.manage', name: 'Manage Investors', description: 'Full investor management', module: 'investors', action: 'manage' },
  
  // Chat Support
  { id: 'chat.read', name: 'View Chats', description: 'View chat conversations', module: 'chat', action: 'read' },
  { id: 'chat.respond', name: 'Respond to Chats', description: 'Reply to customer chats', module: 'chat', action: 'update' },
  { id: 'chat.escalate', name: 'Escalate Chats', description: 'Escalate chat conversations', module: 'chat', action: 'escalate' },
  { id: 'chat.manage', name: 'Manage Chat System', description: 'Full chat system management', module: 'chat', action: 'manage' },
  
  // Analytics
  { id: 'analytics.read', name: 'View Analytics', description: 'View reports and analytics', module: 'analytics', action: 'read' },
  { id: 'analytics.export', name: 'Export Analytics', description: 'Export analytics data', module: 'analytics', action: 'export' },
  
  // Users
  { id: 'users.create', name: 'Create Users', description: 'Add new admin users', module: 'users', action: 'create' },
  { id: 'users.read', name: 'View Users', description: 'View user list', module: 'users', action: 'read' },
  { id: 'users.update', name: 'Update Users', description: 'Edit user info', module: 'users', action: 'update' },
  { id: 'users.delete', name: 'Delete Users', description: 'Remove users', module: 'users', action: 'delete' },
  { id: 'users.manage', name: 'Manage Users', description: 'Full user management', module: 'users', action: 'manage' },
  
  // Settings
  { id: 'settings.read', name: 'View Settings', description: 'View system settings', module: 'settings', action: 'read' },
  { id: 'settings.update', name: 'Update Settings', description: 'Modify system settings', module: 'settings', action: 'update' },
  
  // System
  { id: 'system.audit', name: 'System Audit', description: 'View audit logs', module: 'system', action: 'audit' },
  { id: 'system.manage', name: 'System Management', description: 'Full system control', module: 'system', action: 'manage' }
];

// Define roles
const ROLES: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access',
    level: 1,
    permissions: PERMISSIONS.map(p => p.id) // All permissions
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Business operations management',
    level: 2,
    permissions: [
      'products.manage',
      'orders.manage',
      'customers.manage',
      'suppliers.manage',
      'investors.read',
      'investors.update',
      'chat.manage',
      'analytics.read',
      'analytics.export',
      'users.read',
      'settings.read'
    ]
  },
  {
    id: 'agent',
    name: 'Support Agent',
    description: 'Customer support and basic operations',
    level: 3,
    permissions: [
      'products.read',
      'orders.read',
      'orders.update',
      'customers.read',
      'customers.update',
      'suppliers.read',
      'chat.read',
      'chat.respond',
      'chat.escalate',
      'analytics.read'
    ]
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to basic data',
    level: 4,
    permissions: [
      'products.read',
      'orders.read',
      'customers.read',
      'suppliers.read',
      'chat.read',
      'analytics.read'
    ]
  }
];

interface RBACProviderProps {
  children: ReactNode;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<Role | null>(null);

  useEffect(() => {
    if (user?.role) {
      const role = ROLES.find(r => r.id === user.role.toLowerCase()) || ROLES[3]; // Default to viewer
      setUserRole(role);
    }
  }, [user]);

  const hasPermission = (module: string, action: string): boolean => {
    if (!userRole) return false;
    
    const permissionId = `${module}.${action}`;
    const managePermissionId = `${module}.manage`;
    
    // Check for specific permission or manage permission for the module
    return userRole.permissions.includes(permissionId) || 
           userRole.permissions.includes(managePermissionId);
  };

  const hasAnyPermission = (checks: Array<{module: string, action: string}>): boolean => {
    return checks.some(check => hasPermission(check.module, check.action));
  };

  const canAccessModule = (module: string): boolean => {
    if (!userRole) return false;
    
    return userRole.permissions.some(permission => permission.startsWith(`${module}.`));
  };

  const value: RBACContextType = {
    roles: ROLES,
    permissions: PERMISSIONS,
    userRole,
    hasPermission,
    hasAnyPermission,
    canAccessModule,
    isAdmin: userRole?.level === 1,
    isManager: userRole?.level === 2,
    isAgent: userRole?.level === 3,
    isViewer: userRole?.level === 4
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
};

export const useRBAC = (): RBACContextType => {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

export default RBACContext;
