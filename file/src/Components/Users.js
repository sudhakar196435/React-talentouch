import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import '../Styles/Users.css';
import AdminNav from "./AdminNav";
import { ToastContainer, toast } from 'react-toastify';
import { Button, Modal, Spin,Tag,Breadcrumb } from 'antd';
import { EyeOutlined ,HomeOutlined,TeamOutlined} from '@ant-design/icons';
import emailjs from 'emailjs-com';
import { FaSearch } from "react-icons/fa";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [actionType, setActionType] = useState(""); // 'activate' or 'deactivate'

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserAuthenticated(true);
      } else {
        setUserAuthenticated(false);
        navigate("/AccessDenied");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (userAuthenticated) {
      const fetchUsers = async () => {
        setIsLoading(true);
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => b.createdAt - a.createdAt);
        setUsers(usersData);
        setIsLoading(false);
      };
      fetchUsers();
    }
  }, [userAuthenticated]);

  const sendActivationEmail = async (email) => {
    try {
      const templateParams = {
        email: email,
      };
      await emailjs.send('service_c36fmij', 'template_r1ujk21', templateParams, 'VTtmali6bgh-tzEk6');
     
      toast.success(`Activation email sent to ${email}`);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send activation email.');
    }
  };

  const updateUserStatus = async (userId, field, value) => {
    const userDoc = doc(db, "users", userId);
    await updateDoc(userDoc, { [field]: value });
    setUsers((prevUsers) =>
      prevUsers.map((user) => (user.id === userId ? { ...user, [field]: value } : user))
    );
    toast.success(`User has been ${value ? "activated" : "deactivated"}!`);
    
    // If the user is activated, send the activation email
    if (value) {
      const activatedUser = users.find(user => user.id === userId);
      if (activatedUser) {
        sendActivationEmail(activatedUser.email, activatedUser.fullName);
      }
    }
  };

  const showConfirmationModal = (user, action) => {
    setCurrentUser(user);
    setActionType(action);
    setIsModalVisible(true);
  };

  const handleModalOk = () => {
    if (currentUser && actionType) {
      updateUserStatus(currentUser.id, "active", actionType === "activate");
    }
    setIsModalVisible(false);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const filteredUsers = users.filter((user) =>
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    user.mobileNumber?.toString().includes(search)
  );

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <AdminNav />
      <div className="admin-container">
        <h1 className="admin-home-title">Manage Users</h1>
        <Breadcrumb style={{ marginBottom: '20px' }}>
          <Breadcrumb.Item href="/adminhome">
            <HomeOutlined /> Home
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <TeamOutlined /> Manage Users
          </Breadcrumb.Item>
        </Breadcrumb>
        <div className="search-bar">
          <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search by Company, Email, or Mobile"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        </div>
        <table className="acts-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Company Name</th>
              <th>Email</th>
              <th>Mobile Number</th>
              <th>Role</th>
              <th>Active Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr key={user.id}>
                <td>{index + 1}</td>
                <td>{user.companyName}</td>
                <td>{user.email}</td>
                <td>{user.mobileNumber}</td>
                <td>
              <Tag color={user.role === "admin" ? "red": user.role === "auditor" ? "orange": "blue"}>
              {user.role ? user.role : "User"}
              </Tag>
                </td>
                <td>{user.active ? "Active" : "Inactive"}</td>
                <td>
                  {user.active ? (
                    <button className="deactivate" onClick={() => showConfirmationModal(user, "deactivate")}>Deactivate</button>
                  ) : (
                    <button className="activate" onClick={() => showConfirmationModal(user, "activate")}>Activate</button>
                  )}
                  <Button className="view-btn" onClick={() => navigate(`/users/${user.id}`)} icon={<EyeOutlined />}> View</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
  title={`${actionType === "activate" ? "Activate" : "Deactivate"} User`}
  open={isModalVisible} // Updated 'visible' to 'open' (latest Ant Design version)
  onCancel={handleModalCancel}
  footer={[
    <Button key="cancel" onClick={handleModalCancel}>
      Cancel
    </Button>,
    <Button key="confirm" type="primary" onClick={handleModalOk}>
      Confirm
    </Button>,
  ]}
>
  <p>Are you sure you want to {actionType === "activate" ? "activate" : "deactivate"} this user?</p>
</Modal>


      <ToastContainer />
    </div>
  );
};

export default Users;
