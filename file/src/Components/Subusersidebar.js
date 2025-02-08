import React from 'react';
import { Menu, Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import { UserOutlined, UnorderedListOutlined, FileTextOutlined,LogoutOutlined ,BarChartOutlined} from '@ant-design/icons';
import { getAuth, signOut } from 'firebase/auth'; // Import Firebase authentication

const items = [
  {
    key: 'grp',
    label: 'Menu',
    type: 'group',
  },
  // Custom items for acts
  {
    type: 'divider',
  },
  {
    key: 'myAccount',
    icon: <UserOutlined />,
    label: <Link to="/Subuserprofile">Profile</Link>,
  },
  {
    key: 'Myacts',
    icon: <UnorderedListOutlined />,
    label: <Link to="/">My Acts</Link>,
  },
  {
    key: 'AuditSubmissions',
    icon: <FileTextOutlined />,
    label: <Link to="/">Audit Submissions</Link>,
  },
  {
    key: 'report',
    icon: <BarChartOutlined />,
    label: <Link to="/">Report</Link>,
  },
  

];

const Subusersidebar = () => {
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
        style={{ marginTop: 20, width: '100%' ,}}
        onClick={handleLogout} // Trigger the logout function
        icon={<LogoutOutlined />} // Add the Logout icon
      >
        Logout
      </Button>
    </div>
  );
};

export default Subusersidebar;
