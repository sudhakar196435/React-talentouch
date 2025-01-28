import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import { getAuth, onAuthStateChanged } from "firebase/auth"; 
import { doc, getDoc, updateDoc } from "firebase/firestore"; 
import { db } from "../firebase"; 
import "../Styles/Settings.css";
import UserNav from "./UserNav";
import { ToastContainer, toast } from "react-toastify"; // Corrected import
import 'react-toastify/dist/ReactToastify.css'; // Import the necessary CSS for toast

const Settings = () => {
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false); // To toggle between view and edit mode
  const [formData, setFormData] = useState({});
  const auth = getAuth();
  const navigate = useNavigate(); // Initialize useNavigate hook

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "users", user.uid); 
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserData(userSnap.data());
          setFormData(userSnap.data()); // Initialize form data with user data
        } else {
          console.log("No such document!");
        }
      } else {
        // Redirect to login page if no user is logged in
        navigate("/login");
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData();
      } else {
        setUserData(null);
        navigate("/login"); // Redirect to login if user is not authenticated
      }
    });

    return () => unsubscribe(); 
  }, [auth, navigate]); // Ensure navigate is included as a dependency

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, "users", user.uid); 
      await updateDoc(userRef, formData); // Update Firestore with the new data
      setUserData(formData); // Update the local state with the new data
      setEditMode(false); // Exit edit mode
      toast.success("Changes saved successfully!"); // Show success toast
    }
  };

  const handleCancel = () => {
    setFormData(userData); // Reset form data to the original user data
    setEditMode(false); // Exit edit mode without saving
  };

  const handleGoToAdminHome = () => {
    navigate("/adminhome"); // Navigate to AdminHome page
  };

  return (
    <div>
      <UserNav />
      
      <div className="settings-container">
        <div className="settings-sidebar">
          <ul className="settings-menu">
            <li className="settings-menu-item active">
              <Link to="/settings">Profile</Link>
            </li>
            <li className="settings-menu-item">
              <Link to="/changepassword">Change Password</Link>
            </li>
            <li className="settings-menu-item">
              <Link to="/two-step-verification">Two-Step Verification</Link>
            </li>
            <li className="settings-menu-item">
              <Link to="/privacy-settings">Privacy Settings</Link>
            </li>
            <li className="settings-menu-item">
              <Link to="/login">Logout</Link>
            </li>
          </ul>
        </div>

        <div className="settings-content">
          <div className="profile-con">
          <h2 className="admin-home-title">My Profile</h2>
            {userData ? (
              <div className="profile-info">
                {editMode ? (
                  <div>
                    <table className="profile-table">
                      <tbody>
                        <tr>
                          <td><label>Name</label></td>
                          <td><input 
                            type="text" 
                            name="fullName" 
                            value={formData.fullName} 
                            onChange={handleInputChange} 
                          /></td>
                        </tr>
                        <tr>
                          <td><label>Mobile Number</label></td>
                          <td><input 
                            type="text" 
                            name="mobileNumber" 
                            value={formData.mobileNumber} 
                            onChange={handleInputChange} 
                          /></td>
                        </tr>
                        <tr>
                          <td><label>Organization Type</label></td>
                          <td><input 
                            type="text" 
                            name="organizationType" 
                            value={formData.organizationType} 
                            onChange={handleInputChange} 
                          /></td>
                        </tr>
                      </tbody>
                    </table>
                    <button onClick={handleSave} className="save-but">Save Changes</button>
                    <button onClick={handleCancel} className="cancel-but">Cancel</button>
                  </div>
                ) : (
                  <div>
                        {/* Conditionally render the admin button */}
                {userData.role === "admin" && (
                  <button onClick={handleGoToAdminHome} className="admin-button">
                    Admin Mode
                  </button>
                )}
                    <table className="profile-table">
                      
                      <tbody>
                        <tr>
                          <td>Name</td>
                          <td>{userData.fullName}</td>
                        </tr>
                        <tr>
                          <td>Email</td>
                          <td>{userData.email}</td>
                        </tr>
                        <tr>
                          <td>Mobile Number</td>
                          <td>{userData.mobileNumber}</td>
                        </tr>
                        <tr>
                          <td>Organization Type</td>
                          <td>{userData.organizationType}</td>
                        </tr>
                      </tbody>
                    </table>
                    <button onClick={() => setEditMode(true)} className="edit-but">Edit</button>
                  </div>
                )}
                
            
              </div>
            ) : (
              <p className="loading-message">Loading profile...</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Toast container for showing toast notifications */}
      <ToastContainer />
    </div>
  );
};

export default Settings;
