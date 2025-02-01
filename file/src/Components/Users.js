import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import '../Styles/Users.css';
import AdminNav from "./AdminNav";
import { ToastContainer, toast } from 'react-toastify';
import { Button, Modal, Spin } from 'antd';
import { EyeOutlined } from '@ant-design/icons';

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
        navigate("/login");
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

  const updateUserStatus = async (userId, field, value) => {
    const userDoc = doc(db, "users", userId);
    await updateDoc(userDoc, { [field]: value });
    setUsers((prevUsers) =>
      prevUsers.map((user) => (user.id === userId ? { ...user, [field]: value } : user))
    );
    toast.success(`User has been ${value ? "activated" : "deactivated"}!`);
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
    user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
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
        <input
          type="text"
          placeholder="Search by Name, Email, or Mobile"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Company Name</th>
              <th>Email</th>
              <th>Mobile Number</th>
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
                <td>{user.active ? "Active" : "Inactive"}</td>
                <td>
                  {user.active ? (
                    <button className="deactivate" onClick={() => showConfirmationModal(user, "deactivate")}>Deactivate</button>
                  ) : (
                    <button className="activate" onClick={() => showConfirmationModal(user, "activate")}>Activate</button>
                  )}
                  <Button className="view-btn" onClick={() => navigate(`/users/${user.id}`)} icon={<EyeOutlined />}> View</Button>
                  {/* New Button: View Audit History */}
                  <Button
                    className="view-audit-history-btn"
                    onClick={() => navigate(`/user-audit-history/${user.id}`)} // Redirect to the user's audit history
                  >
                    View Audit History
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        title={`${actionType === "activate" ? "Activate" : "Deactivate"} User`}
        visible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="Confirm"
        cancelText="Cancel"
      >
        <p>Are you sure you want to {actionType === "activate" ? "activate" : "deactivate"} this user?</p>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default Users;