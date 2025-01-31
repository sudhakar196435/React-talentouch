import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import AdminNav from "./AdminNav";
import { FaSearch } from "react-icons/fa"; // Import search icon
import "../Styles/UserDetail.css";
import { Button, message, Popconfirm,Spin, Descriptions  } from "antd";


import { ToastContainer, toast } from "react-toastify";
const UserDetail = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [acts, setActs] = useState([]);
  const [selectedActs, setSelectedActs] = useState([]);
  const [role, setRole] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // Search query state


  // Fetch user details
  useEffect(() => {
    const fetchUser = async () => {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setUser(userDoc.data());
        setSelectedActs(userDoc.data().acts || []);
        setRole(userDoc.data().role || "user");
      } else {
        console.error("User not found");
      }
    };
    fetchUser();
  }, [userId]);

  // Fetch all acts
  useEffect(() => {
    const fetchActs = async () => {
      const querySnapshot = await getDocs(collection(db, "acts"));
      const actData = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setActs(actData);
    };
    fetchActs();
  }, []);

  // Handle checkbox toggle
  const handleCheckboxChange = (actId) => {
    setSelectedActs((prevSelected) =>
      prevSelected.includes(actId)
        ? prevSelected.filter((id) => id !== actId)
        : [...prevSelected, actId]
    );
  };

  // Handle role change
  const handleRoleChange = (e) => {
    setRole(e.target.value);
  };

  // Save selected acts to the user
  const handleSaveActs = async () => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { acts: selectedActs });
      toast.success("Acts assigned successfully!");
    } catch (error) {
      console.error("Error saving acts:", error);
      message.error("Failed to save selected acts. Please try again.");
    }
  };

  // Save role to the user
  const handleSaveRole = async () => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: role });
      toast.success("User role saved successfully!");
    } catch (error) {
      console.error("Error saving role:", error);
      alert("Failed to save user role. Please try again.");
    }
  };

  
  // Filter acts based on search query
  const filteredActs = acts.filter(
    (act) =>
      act.actName.includes(searchQuery) || act.actCode.includes(searchQuery)
  );

  if (!user) {
    return (
       <div className="loading-container">
                   <Spin size="large" />
                 </div>
    );
  }

  return (
    <div>
      <AdminNav />
      <div className="user-detail-container">
        <h1 className="admin-home-title">User Details</h1>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
          <Descriptions.Item label="Mobile Number">{user.mobileNumber}</Descriptions.Item>
          <Descriptions.Item label="Company Name">{user.companyName}</Descriptions.Item>
          <Descriptions.Item label="Company Address">{user.companyAddress}</Descriptions.Item>
          <Descriptions.Item label="Hazardous">{user.hazardous}</Descriptions.Item>
          <Descriptions.Item label="Industry Type">{user.industryType}</Descriptions.Item>
          <Descriptions.Item label="Contract Employees">{user.contractEmployees}</Descriptions.Item>
          <Descriptions.Item label="Occupier Name">{user.occupierName}</Descriptions.Item>
          <Descriptions.Item label="Director Name">{user.directorName}</Descriptions.Item>
          <Descriptions.Item label="License No">{user.licenseNo}</Descriptions.Item>
          <Descriptions.Item label="License Validity">{user.licenseValidity}</Descriptions.Item>
          <Descriptions.Item label="HP and Man Power">{user.hpAndManPower}</Descriptions.Item>
          <Descriptions.Item label="Coordinator Name">{user.coordinatorName}</Descriptions.Item>
          <Descriptions.Item label="Safety Officer Name">{user.safetyOfficerName}</Descriptions.Item>
          <Descriptions.Item label="Welfare Officer Name">{user.welfareOfficerName}</Descriptions.Item>
          <Descriptions.Item label="Medical Advisor Name">{user.medicalAdvisorName}</Descriptions.Item>
          
        </Descriptions>

        <div className="role-section">
          <h3>Assign User Role</h3>
          <select value={role} onChange={handleRoleChange} className="role-dropdown">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <Popconfirm
            title="Confirm Role Change"
            description="Are you sure you want to save this user role?"
            onConfirm={handleSaveRole}
            onCancel={() => message.error("Role change canceled")}
            okText="Yes"
            cancelText="No"
          >
            <Button type="primary">Save Role</Button>
          </Popconfirm>
        </div>

        <div className="acts-section">
        <h1 className="admin-home-title">Assign Acts</h1>
          
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by Act Code or Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <table className="acts-table">
            <thead>
              <tr>
                <th>Act Code</th>
                <th>Act Name</th>
                <th>Assign</th>
              </tr>
            </thead>
            <tbody>
              {filteredActs.map((act) => (
                <tr key={act.id}>
                  <td>{act.actCode}</td>
                  <td>{act.actName}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedActs.includes(act.id)}
                      onChange={() => handleCheckboxChange(act.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="save-btn" onClick={handleSaveActs}>
            Save Selected Acts
          </button>
        </div>
      </div>
        <ToastContainer />
    </div>
  );
};

export default UserDetail;
