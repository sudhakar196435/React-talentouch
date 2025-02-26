import React from 'react';
import { Menu, Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserOutlined,
  FileTextOutlined,
  HistoryOutlined,
  BarChartOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { getAuth, signOut } from 'firebase/auth';

const items = [
  {
    key: 'grp',
    label: 'Menu',
    type: 'group',
  },
  {
    type: 'divider',
  },
  
  {
    key: 'myAccount',
    icon: <UserOutlined style={{ color: 'blue' }} />, // Icon color
    label: <Link to="/AuditorSettings" style={{ color: 'blue' }}>My Account</Link>, // Text color
  },  
  {
    key: 'myBranches',
    icon: <FileTextOutlined />,
    label: <Link to="/auditorviewacts">My Branches</Link>,
  },
  {
    key: 'auditHistory',
    icon: <HistoryOutlined />,
    label: <Link to="/auditorsubmissions">Audit History</Link>,
  },
  {
    key: 'reports',
    icon: <BarChartOutlined />,
    label: <Link to="/auditor/reports">Reports</Link>,
  },
  {
    key: 'notifications',
    icon: <BellOutlined />,
    label: <Link to="/auditor/notifications">Notifications</Link>,
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: <Link to="/auditor/settings">Settings</Link>,
  },
];

const Auditorsidebar = () => {
  const navigate = useNavigate();

  const onClick = (e) => {
    console.log('Menu item clicked:', e);
  };

  // Logout function
  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        // Redirect to login page after successful logout
        navigate('/login');
      })
      .catch((error) => {
        console.error('Logout failed:', error);
      });
  };

  return (
    <div>
      <Menu
        onClick={onClick}
        style={{ width: 256 }}
        defaultSelectedKeys={['dashboard']}
        mode="inline"
        items={items}
      />
      <Button
        style={{ marginTop: 20, width: '100%' }}
        onClick={handleLogout}
        icon={<LogoutOutlined />}
      >
        Logout
      </Button>
    </div>
  );
};

export default Auditorsidebar;
