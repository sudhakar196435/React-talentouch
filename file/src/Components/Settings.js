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
import { Descriptions ,Skeleton} from 'antd'; // Import Ant Design components

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
                          <td><label>Mobile Number</label></td>
                          <td><input 
                            type="text" 
                            name="mobileNumber" 
                            value={formData.mobileNumber} 
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
                    <Descriptions bordered column={2} size="large"className="custom-descriptions" >
          <Descriptions.Item label="Email">{userData.email}</Descriptions.Item>
          <Descriptions.Item label="Mobile Number">{userData.mobileNumber}</Descriptions.Item>
          <Descriptions.Item label="Company Name">{userData.companyName}</Descriptions.Item>
          <Descriptions.Item label="Company Address">{userData.companyAddress}</Descriptions.Item>
          <Descriptions.Item label="Hazardous">{userData.hazardous}</Descriptions.Item>
          <Descriptions.Item label="Industry Type">{userData.industryType}</Descriptions.Item>
          <Descriptions.Item label="Contract Employees">{userData.contractEmployees}</Descriptions.Item>
          <Descriptions.Item label="Occupier Name">{userData.occupierName}</Descriptions.Item>
          <Descriptions.Item label="Director Name">{userData.directorName}</Descriptions.Item>
          <Descriptions.Item label="License No">{userData.licenseNo}</Descriptions.Item>
          <Descriptions.Item label="License Validity">{userData.licenseValidity}</Descriptions.Item>
          <Descriptions.Item label="HP and Man Power">{userData.hpAndManPower}</Descriptions.Item>
          <Descriptions.Item label="Coordinator Name">{userData.coordinatorName}</Descriptions.Item>
          <Descriptions.Item label="Safety Officer Name">{userData.safetyOfficerName}</Descriptions.Item>
          <Descriptions.Item label="Welfare Officer Name">{userData.welfareOfficerName}</Descriptions.Item>
          <Descriptions.Item label="Medical Advisor Name">{userData.medicalAdvisorName}</Descriptions.Item>
          
        </Descriptions>
                    <button onClick={() => setEditMode(true)} className="edit-but">Edit</button>
                  </div>
                )}
              </div>
            ) : (
              <Skeleton active />
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
