import React from 'react';
import { AppstoreOutlined, MailOutlined, SettingOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom

const items = [
  {
    key: 'sub1',
    label: 'Navigation One',
    icon: <MailOutlined />,
    children: [
      {
        key: 'g1',
        label: 'Item 1',
        type: 'group',
        children: [
          {
            key: '1',
            label: 'Option 1',
          },
          {
            key: '2',
            label: 'Option 2',
          },
        ],
      },
      
    ],
  },
  {
    key: 'sub2',
    label: 'Manage Acts',
    icon: <AppstoreOutlined />,
    children: [
        {
            key: 'allActs',
            label: <Link to="/acts">All Acts</Link>,
          },
          {
            key: 'addAct',
            label: <Link to="/act">Add Act</Link>,
          },
      {
        key: '6',
        label: 'Option 6',
      },
     
    ],
  },
  {
    type: 'divider',
  },
  {
    key: 'sub4',
    label: 'Settings',
    icon: <SettingOutlined />,
    children: [
      {
        key: '9',
        label: 'Option 9',
      },
      {
        key: '10',
        label: 'Option 10',
      },
      {
        key: '11',
        label: 'Option 11',
      },
      {
        key: '12',
        label: 'Option 12',
      },
    ],
  },
  {
    key: 'grp',
    label: 'Group',
    type: 'group',
    
  },
  // Custom items for acts
  {
    type: 'divider',
  },
  {
    key: 'myAccount',
    label: <Link to="/adminsettings">My Account</Link>,
  },
 
  {
    key: 'hiringProcess',
    label: <Link to="/settings/security">Hiring Process Workflow</Link>,
  },
];

const Adminsidebar = () => {
  const onClick = (e) => {
    console.log('click ', e);
  };
  
  return (
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
  );
};

export default Adminsidebar;
