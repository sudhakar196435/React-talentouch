import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import AdminNav from "./AdminNav";
import { Button, message, Popconfirm, Spin, Descriptions, Select } from "antd";
import { ToastContainer, toast } from "react-toastify";

const UserDetail = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [acts, setActs] = useState([]);
  const [selectedActs, setSelectedActs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setUser(userDoc.data());
      } else {
        console.error("User not found");
      }
    };

    const fetchBranches = async () => {
      const branchCollection = collection(db, "users", userId, "branches");
      const branchSnapshot = await getDocs(branchCollection);
      const branchList = branchSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setBranches(branchList);
    };

    const fetchActs = async () => {
      const actCollection = collection(db, "acts");
      const actSnapshot = await getDocs(actCollection);
      const actList = actSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setActs(actList);
    };

    fetchUser();
    fetchBranches();
    fetchActs();
    setLoading(false);
  }, [userId]);

  const handleBranchSelect = async (branchId) => {
    setSelectedBranch(branchId);
    const branchDoc = await getDoc(doc(db, "users", userId, "branches", branchId));
    if (branchDoc.exists()) {
      setSelectedActs(branchDoc.data().acts || []);
    } else {
      setSelectedActs([]);
    }
  };

  const handleCheckboxChange = (actId) => {
    setSelectedActs((prevSelected) =>
      prevSelected.includes(actId)
        ? prevSelected.filter((id) => id !== actId)
        : [...prevSelected, actId]
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
      toast.success("Acts assigned successfully to the branch!");
    } catch (error) {
      console.error("Error saving acts:", error);
      message.error("Failed to save selected acts. Please try again.");
    }
  };

  if (loading || !user) {
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
        </Descriptions>

        <div className="branch-selection">
          <h3>Select Branch</h3>
          <Select
            style={{ width: "100%" }}
            placeholder="Select a branch"
            onChange={handleBranchSelect}
          >
            {branches.map((branch) => (
              <Select.Option key={branch.id} value={branch.id}>
                {branch.branchName}
              </Select.Option>
            ))}
          </Select>
        </div>

        {selectedBranch && (
          <div className="acts-section">
            <h1 className="admin-home-title">Assign Acts to Branch</h1>
            <table className="acts-table">
              <thead>
                <tr>
                  <th>Act Code</th>
                  <th>Act Name</th>
                  <th>Assign</th>
                </tr>
              </thead>
              <tbody>
                {acts.map((act) => (
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
            <Button type="primary" onClick={handleSaveActs}>
              Save Selected Acts
            </Button>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default UserDetail;
