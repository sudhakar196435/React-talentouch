import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import AdminNav from "./AdminNav";
import { FaSearch } from "react-icons/fa"; // Import search icon
import "../Styles/UserDetail.css";

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
      alert("Selected acts saved successfully!");
    } catch (error) {
      console.error("Error saving acts:", error);
      alert("Failed to save selected acts. Please try again.");
    }
  };

  // Save role to the user
  const handleSaveRole = async () => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: role });
      alert("User role saved successfully!");
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
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <AdminNav />
      <div className="user-detail-container">
        <h1 className="admin-home-title">User Details</h1>
        <div className="user-info">
          <p><strong>Full Name:</strong> {user.fullName}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Mobile Number:</strong> {user.mobileNumber}</p>
          <p><strong>Organization Type:</strong> {user.organizationType}</p>
        </div>

        <div className="role-section">
          <h3>Assign User Role</h3>
          <select value={role} onChange={handleRoleChange} className="role-dropdown">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button className="save-btn" onClick={handleSaveRole}>Save Role</button>
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
    </div>
  );
};

export default UserDetail;
