import React from 'react';
import { Menu, Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import { UserOutlined, LogoutOutlined, FileTextOutlined } from '@ant-design/icons'; // Import FileTextOutlined for View Acts icon
import { getAuth, signOut } from 'firebase/auth'; // Import Firebase authentication

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
    icon: <UserOutlined />,
    label: <Link to="/AuditorSettings">My Account</Link>,
  },
  {
    key: 'viewActs',
    icon: <FileTextOutlined />,
    label: <Link to="/auditorviewacts">View Acts</Link>, // Link to View Acts page
  },
];

const Auditorsidebar = () => {
  const navigate = useNavigate(); // Use navigate hook for redirection
  
  const onClick = (e) => {
    console.log('click ', e);
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
        style={{
          width: 256,
        }}
        defaultSelectedKeys={['1']}
        defaultOpenKeys={['sub1']}
        mode="inline"
        items={items}
      />
      <Button
        style={{ marginTop: 20, width: '100%' }}
        onClick={handleLogout} // Trigger the logout function
        icon={<LogoutOutlined />} // Add the Logout icon
      >
        Logout
      </Button>
    </div>
  );
};

export default Auditorsidebar;
