import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import AdminNav from "./AdminNav";
import { FaSearch } from "react-icons/fa";
import { Button, message, Popconfirm, Spin, Descriptions, Select } from "antd";
import { ToastContainer, toast } from "react-toastify";
import '../Styles/UserDetail.css';

const UserDetail = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedBranchDetails, setSelectedBranchDetails] = useState(null); // New state for selected branch details
  const [acts, setActs] = useState([]);
  const [selectedActs, setSelectedActs] = useState([]);
  const [role, setRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setUser(userDoc.data());
        setRole(userDoc.data().role || "user");
      } else {
        console.error("User not found");
      }
    };
    fetchUser();
  }, [userId]);

  useEffect(() => {
    if (role !== "auditor" && role !== "admin") {
      const fetchBranches = async () => {
        const branchSnapshot = await getDocs(collection(db, "users", userId, "branches"));
        const branchData = branchSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setBranches(branchData);
      };
      fetchBranches();
    }
  }, [userId, role]);

  useEffect(() => {
    if (role !== "auditor" && role !== "admin") {
      const fetchActs = async () => {
        const querySnapshot = await getDocs(collection(db, "acts"));
        const actData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setActs(actData);
      };
      fetchActs();
    }
  }, [role]);

  const handleBranchChange = async (branchId) => {
    setSelectedBranch(branchId);
    const branchDoc = await getDoc(doc(db, "users", userId, "branches", branchId));
    if (branchDoc.exists()) {
      setSelectedBranchDetails(branchDoc.data()); // Set the selected branch details
      setSelectedActs(branchDoc.data().acts || []);
    }
  };

  const handleCheckboxChange = (actId) => {
    setSelectedActs((prevSelected) =>
      prevSelected.includes(actId) ? prevSelected.filter((id) => id !== actId) : [...prevSelected, actId]
    );
  };

  const handleSaveActs = async () => {
    if (!selectedBranch) {
      message.error("Please select a branch first");
      return;
    }
    try {
      const branchRef = doc(db, "users", userId, "branches", selectedBranch);
      await updateDoc(branchRef, { acts: selectedActs });
      toast.success("Acts assigned successfully!");
    } catch (error) {
      message.error("Failed to save acts. Please try again.");
    }
  };

  const handleSaveRole = async () => {
    try {
      await updateDoc(doc(db, "users", userId), { role });
      toast.success("User role saved successfully!");
    } catch (error) {
      message.error("Failed to save user role. Please try again.");
    }
  };

  if (!user) {
    return  <div className="loading-container">
            <Spin size="large" />
          </div>;
  }

  return (
    <div>
      <AdminNav />
      <div className="user-detail-container">
        
        <h1 className="admin-home-title">User Details</h1>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
          <Descriptions.Item label="Company Name">{user.companyName}</Descriptions.Item>
          <Descriptions.Item label="Company Address">{user.companyAddress}</Descriptions.Item>
          <Descriptions.Item label="Industry Type">{user.industryType}</Descriptions.Item>
        </Descriptions>

        <h3>Assign User Role</h3>
        <Select value={role} onChange={setRole} style={{ width: 200 }}>
          <Select.Option value="user">User</Select.Option>
          <Select.Option value="admin">Admin</Select.Option>
          <Select.Option value="auditor">Auditor</Select.Option>
        </Select>
        <Popconfirm title="Confirm Role Change" onConfirm={handleSaveRole} okText="Yes" cancelText="No">
          <Button type="primary">Save Role</Button>
        </Popconfirm>

        {role !== "auditor" && role !== "admin" && (
          <>
            <h3>Select Branch</h3>
            <Select style={{ width: 200 }} onChange={handleBranchChange} placeholder="Select a Branch">
              {branches.map((branch) => (
                <Select.Option key={branch.id} value={branch.id}>{branch.branchName}</Select.Option>
              ))}
            </Select>

            {selectedBranchDetails && (
              <div className="branch-details">
                <h4>Branch Details</h4>
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="Branch Name">{selectedBranchDetails.branchName}</Descriptions.Item>
                  <Descriptions.Item label="Location">{selectedBranchDetails.location}</Descriptions.Item>
                </Descriptions>
              </div>
            )}

            {selectedBranch && selectedBranchDetails && (
              <div>
                 <h1 className="admin-home-title">Assign Acts for {selectedBranchDetails.branchName}</h1>
             
              </div>
            )}

            <h3>Assign Acts</h3>
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
                {acts.filter((act) => act.actName.includes(searchQuery)).map((act) => (
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
            <Button type="primary" onClick={handleSaveActs} disabled={!selectedBranch}>
              Save Selected Acts
            </Button>
          </>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default UserDetail;
