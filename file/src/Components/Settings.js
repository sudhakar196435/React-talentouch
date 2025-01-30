import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { getAuth, onAuthStateChanged } from "firebase/auth"; 
import { doc, getDoc, updateDoc } from "firebase/firestore"; 
import { db } from "../firebase"; 
import "../Styles/Settings.css";
import UserNav from "./UserNav";
import { ToastContainer, toast } from "react-toastify"; // Corrected import
import 'react-toastify/dist/ReactToastify.css'; // Import the necessary CSS for toast
import Usersidebar from "./Usersidebar";


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
        <Usersidebar/>

        <div className="settings-content">
          <div className="profile-con">
            <h2 className="admin-home-title">Profile</h2>
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
                        {/* Add new fields */}
                        <tr>
                          <td><label>Company Name</label></td>
                          <td><input 
                            type="text" 
                            name="companyName" 
                            value={formData.companyName} 
                            onChange={handleInputChange} 
                          /></td>
                        </tr>
                        <tr>
                          <td><label>Company Address</label></td>
                          <td><input 
                            type="text" 
                            name="companyAddress" 
                            value={formData.companyAddress} 
                            onChange={handleInputChange} 
                          /></td>
                        </tr>
                        <tr>
                          <td><label>Hazardous</label></td>
                          <td><input 
                            type="text" 
                            name="hazardous" 
                            value={formData.hazardous} 
                            onChange={handleInputChange} 
                          /></td>
                        </tr>
                        <tr>
                          <td><label>Industry Type</label></td>
                          <td><input 
                            type="text" 
                            name="industryType" 
                            value={formData.industryType} 
                            onChange={handleInputChange} 
                          /></td>
                        </tr>
                        <tr>
                          <td><label>Contract Employees</label></td>
                          <td><input 
                            type="text" 
                            name="contractEmployees" 
                            value={formData.contractEmployees} 
                            onChange={handleInputChange} 
                          /></td>
                        </tr>
                        <tr>
                          <td><label>Occupier Name</label></td>
                          <td><input 
                            type="text" 
                            name="occupierName" 
                            value={formData.occupierName} 
                            onChange={handleInputChange} 
                          /></td>
                        </tr>
                        <tr>
                          <td><label>Director Name</label></td>
                          <td><input 
                            type="text" 
                            name="directorName" 
                            value={formData.directorName} 
                            onChange={handleInputChange} 
                          /></td>
                        </tr>
                        <tr>
                          <td><label>License No</label></td>
                          <td><input 
                            type="text" 
                            name="licenseNo" 
                            value={formData.licenseNo} 
                            onChange={handleInputChange} 
                          /></td>
                        </tr>
                        <tr>
                          <td><label>License Validity</label></td>
                          <td><input 
                            type="text" 
                            name="licenseValidity" 
                            value={formData.licenseValidity} 
                            onChange={handleInputChange} 
                          /></td>
                        </tr>
                        <tr>
                          <td><label>HP and Man Power</label></td>
                          <td><input 
                            type="text" 
                            name="hpAndManPower" 
                            value={formData.hpAndManPower} 
                            onChange={handleInputChange} 
                          /></td>
                        </tr>
                        <tr>
                          <td><label>Coordinator Name</label></td>
                          <td><input 
                            type="text" 
                            name="coordinatorName" 
                            value={formData.coordinatorName} 
                            onChange={handleInputChange} 
                          /></td>
                        </tr>
                        <tr>
                          <td><label>Safety Officer Name</label></td>
                          <td><input 
                            type="text" 
                            name="safetyOfficerName" 
                            value={formData.safetyOfficerName} 
                            onChange={handleInputChange} 
                          /></td>
                        </tr>
                        <tr>
                          <td><label>Welfare Officer Name</label></td>
                          <td><input 
                            type="text" 
                            name="welfareOfficerName" 
                            value={formData.welfareOfficerName} 
                            onChange={handleInputChange} 
                          /></td>
                        </tr>
                        <tr>
                          <td><label>Medical Advisor Name</label></td>
                          <td><input 
                            type="text" 
                            name="medicalAdvisorName" 
                            value={formData.medicalAdvisorName} 
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
                        {/* Display newly added fields */}
                        <tr>
                          <td>Company Name</td>
                          <td>{userData.companyName}</td>
                        </tr>
                        <tr>
                          <td>Company Address</td>
                          <td>{userData.companyAddress}</td>
                        </tr>
                        <tr>
                          <td>Hazardous</td>
                          <td>{userData.hazardous}</td>
                        </tr>
                        <tr>
                          <td>Industry Type</td>
                          <td>{userData.industryType}</td>
                        </tr>
                        <tr>
                          <td>Contract Employees</td>
                          <td>{userData.contractEmployees}</td>
                        </tr>
                        <tr>
                          <td>Occupier Name</td>
                          <td>{userData.occupierName}</td>
                        </tr>
                        <tr>
                          <td>Director Name</td>
                          <td>{userData.directorName}</td>
                        </tr>
                        <tr>
                          <td>License No</td>
                          <td>{userData.licenseNo}</td>
                        </tr>
                        <tr>
                          <td>License Validity</td>
                          <td>{userData.licenseValidity}</td>
                        </tr>
                        <tr>
                          <td>HP and Man Power</td>
                          <td>{userData.hpAndManPower}</td>
                        </tr>
                        <tr>
                          <td>Coordinator Name</td>
                          <td>{userData.coordinatorName}</td>
                        </tr>
                        <tr>
                          <td>Safety Officer Name</td>
                          <td>{userData.safetyOfficerName}</td>
                        </tr>
                        <tr>
                          <td>Welfare Officer Name</td>
                          <td>{userData.welfareOfficerName}</td>
                        </tr>
                        <tr>
                          <td>Medical Advisor Name</td>
                          <td>{userData.medicalAdvisorName}</td>
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
