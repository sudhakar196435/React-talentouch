import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Import Firebase Auth
import '../Styles/Users.css';
import AdminNav from "./AdminNav";
import { ToastContainer, toast } from 'react-toastify';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate(); // For navigation
  const [userAuthenticated, setUserAuthenticated] = useState(false); // Track authentication state

  useEffect(() => {
    // Check if the user is logged in
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserAuthenticated(true); // User is authenticated
      } else {
        setUserAuthenticated(false); // User is not authenticated
        navigate("/login"); // Redirect to login page if not authenticated
      }
    });

    // Cleanup the listener when the component unmounts
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (userAuthenticated) {
      const fetchUsers = async () => {
        setIsLoading(true); // Set loading state to true while fetching
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => b.createdAt - a.createdAt);
        setUsers(usersData);
        setIsLoading(false); // Set loading state to false after data is fetched
      };
  
      fetchUsers();
    }
  }, [userAuthenticated]); // Fetch users when user is authenticated

  const updateUserStatus = async (userId, field, value) => {
    const userDoc = doc(db, "users", userId);
    await updateDoc(userDoc, { [field]: value });
    setUsers((prevUsers) =>
      prevUsers.map((user) => (user.id === userId ? { ...user, [field]: value } : user))
    );

    const action = field === "active" ? (value ? "activated" : "deactivated") : (value ? "blocked" : "unblocked");
    toast.success(`User has been ${action}!`);
  };

  const filteredUsers = users.filter((user) =>
    user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.mobileNumber?.toString().includes(search)
  );
  
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
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
              <th>Full Name</th>
              <th>Email</th>
              <th>Mobile Number</th>
              <th>Organization Type</th>
              <th>Active Status</th>
              <th>Block Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr key={user.id} onClick={() => navigate(`/users/${user.id}`)} style={{ cursor: "pointer" }}>
                <td>{index + 1}</td>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>{user.mobileNumber}</td>
                <td>{user.organizationType}</td>
                <td>{user.active ? "Active" : "Inactive"}</td>
                <td>{user.blocked ? "Blocked" : "None"}</td>
                <td>
                  {user.active ? (
                    <button className="deactivate" onClick={(e) => { e.stopPropagation(); updateUserStatus(user.id, "active", false); }}>Deactivate</button>
                  ) : (
                    <button className="activate" onClick={(e) => { e.stopPropagation(); updateUserStatus(user.id, "active", true); }}>Activate</button>
                  )}
                  {user.blocked ? (
                    <button className="unblock" onClick={(e) => { e.stopPropagation(); updateUserStatus(user.id, "blocked", false); }}>Unblock</button>
                  ) : (
                    <button className="block" onClick={(e) => { e.stopPropagation(); updateUserStatus(user.id, "blocked", true); }}>Block</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Users;
