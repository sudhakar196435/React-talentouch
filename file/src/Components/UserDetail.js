import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import AdminNav from "./AdminNav";
import { FaSearch } from "react-icons/fa";
import { Button, message, Popconfirm, Spin, Descriptions, Select, Empty, Drawer, Breadcrumb,Card } from "antd";
import { ToastContainer, toast } from "react-toastify";
import '../Styles/UserDetail.css';
import { HomeOutlined, TeamOutlined, IdcardOutlined,UserOutlined } from '@ant-design/icons';

const UserDetail = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedBranchDetails, setSelectedBranchDetails] = useState(null);
  const [acts, setActs] = useState([]);
  const [selectedActs, setSelectedActs] = useState([]);
  const [role, setRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [subUsers, setSubUsers] = useState([]); // Store sub-users
  const [auditFrequency, setAuditFrequency] = useState(null); // New state for audit frequency
  const [drawerVisible, setDrawerVisible] = useState(false); // State for drawer visibility

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
        const actData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((act) => act.status === "active"); // Only show acts with status "active";
        setActs(actData);
      };
      fetchActs();
    }
  }, [role]);

  const handleBranchChange = async (branchId) => {
    setSelectedBranch(branchId);
    
    try {
      const branchDoc = await getDoc(doc(db, "users", userId, "branches", branchId));
      
      if (branchDoc.exists()) {
        const branchData = branchDoc.data();
        
        setSelectedBranchDetails(branchData);
        setSelectedActs(branchData.acts || []);
        setAuditFrequency(branchData.auditFrequency || ""); // Set existing audit frequency
        
        fetchSubUsers(branchId); // Fetch sub-users
      } else {
        setAuditFrequency(""); // Reset frequency if no data found
      }
    } catch (error) {
      console.error("Error fetching branch data:", error);
    }
  };
  

  const fetchSubUsers = async (branchId) => {
    const subUsersSnapshot = await getDocs(collection(db, "users", userId, "branches", branchId, "subUsers"));
    const subUsersData = subUsersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setSubUsers(subUsersData);
  };

  const handleCheckboxChange = (actId) => {
    setSelectedActs((prevSelected) =>
      prevSelected.includes(actId) ? prevSelected.filter((id) => id !== actId) : [...prevSelected, actId]
    );
  };

  const showDrawer = () => {
    setDrawerVisible(true);
  };
  
  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  const handleSaveActs = async () => {
    if (!selectedBranch || !auditFrequency) {
      message.error("Please select a branch and audit frequency");
      return;
    }
    try {
      const branchRef = doc(db, "users", userId, "branches", selectedBranch);
      // Update branch with selected acts and audit frequency.
      // This allows the audit for that branch to be re-submitted after the specified frequency time,
      // while previous records remain stored.
      await updateDoc(branchRef, { acts: selectedActs, auditFrequency: auditFrequency });
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
        <Breadcrumb style={{ marginBottom: '20px' }}>
          <Breadcrumb.Item href="/adminhome">
            <HomeOutlined /> Home
          </Breadcrumb.Item>
          <Breadcrumb.Item href="/users">
            <TeamOutlined /> Manage Users
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <IdcardOutlined /> User Details
          </Breadcrumb.Item>
        </Breadcrumb>
      
        <table className="acts-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Email</td>
              <td>{user.email}</td>
            </tr>
            <tr>
              <td>Company Name</td>
              <td>{user.companyName}</td>
            </tr>
          </tbody>
        </table>
        <Button type="primary" onClick={showDrawer} style={{ marginBottom: "1rem" }}>
          View Full Details
        </Button>
        <Drawer
          title="User Profile Preview"
          width={800}
          placement="right"
          onClose={closeDrawer}
          open={drawerVisible}
        >
          <Descriptions bordered column={1} size="large" >
            <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
            <Descriptions.Item label="Company Name">{user.companyName}</Descriptions.Item>
            <Descriptions.Item label="Company Address">{user.companyAddress}</Descriptions.Item>
            <Descriptions.Item label="Industry Type">{user.industryType}</Descriptions.Item>
            <Descriptions.Item label="coordinatorName">{user.coordinatorName}</Descriptions.Item>
            <Descriptions.Item label="directorName">{user.directorName}</Descriptions.Item>
            <Descriptions.Item label="hazardous">{user.hazardous}</Descriptions.Item>
            <Descriptions.Item label="hpAndManPower">{user.hpAndManPower}</Descriptions.Item>
            <Descriptions.Item label="industryType">{user.industryType}</Descriptions.Item>
            <Descriptions.Item label="licenseNo">{user.licenseNo}</Descriptions.Item>
            <Descriptions.Item label="medicalAdvisorName">{user.medicalAdvisorName}</Descriptions.Item>
            <Descriptions.Item label="occupierName">{user.occupierName}</Descriptions.Item>
            <Descriptions.Item label="safetyOfficerName">{user.safetyOfficerName}</Descriptions.Item>
            <Descriptions.Item label="welfareOfficerName">{user.welfareOfficerName}</Descriptions.Item>
          </Descriptions>
        </Drawer>

        <Card className="role-card">
      <h3 className="role-title">
        <UserOutlined /> Assign User Role
      </h3>
      <Select value={role} onChange={setRole} className="role-select">
        <Select.Option value="user">User</Select.Option>
        <Select.Option value="admin">Admin</Select.Option>
        <Select.Option value="auditor">Auditor</Select.Option>
      </Select>
      <Popconfirm title="Confirm Role Change" onConfirm={handleSaveRole} okText="Yes" cancelText="No">
        <Button type="primary" className="save-button">Save Role</Button>
      </Popconfirm>
    </Card>

        {role !== "auditor" && role !== "admin" && (
          <>
           <div className="audit-container">
  <div className="audit-box">
    <h3 className="audit-title">🏢 Select Branch</h3>
    <Select className="audit-dropdown" onChange={handleBranchChange} placeholder="Select a Branch">
      {branches.map((branch) => (
        <Select.Option key={branch.id} value={branch.id}>
          {branch.branchName}
        </Select.Option>
      ))}
    </Select>
  </div>
  <div className="audit-box">
    <h3 className="audit-title">📅 Audit Frequency</h3>
    <Select className="audit-dropdown" value={auditFrequency} onChange={setAuditFrequency} placeholder="Select Audit Frequency">
      <Select.Option value="Monthly">Monthly</Select.Option>
      <Select.Option value="Quarterly">Quarterly</Select.Option>
      <Select.Option value="Half Yearly">Half Yearly</Select.Option>
      <Select.Option value="Yearly">Yearly</Select.Option>
    </Select>
  </div>
</div>


            {selectedBranchDetails && (
              <div className="branch-detail">
                <h1 className="admin-home-title">Branch Details</h1>
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Branch Name">{selectedBranchDetails.branchName}</Descriptions.Item>
                  <Descriptions.Item label="Location">{selectedBranchDetails.location}</Descriptions.Item>
                  <Descriptions.Item label="Audit Frequency">{selectedBranchDetails.auditFrequency}</Descriptions.Item>
                </Descriptions>
              </div>
            )}

            {branches.length > 0 && selectedBranch && (
              <>
                <h1 className="admin-home-title">Sub-Users</h1>
                {subUsers.length > 0 ? (
                  <table className="acts-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subUsers.map((user) => (
                        <tr key={user.id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <Empty description="No sub-users found for this branch." />
                )}
              </>
            )}
            <br></br>
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
      <th>S.No</th>
      <th>Act Code</th>
      <th>Act Name</th>
      <th>Assign</th>
    </tr>
  </thead>
  <tbody>
    {acts
      .filter(
        (act) =>
          act.actName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          act.actCode.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map((act, index) => (
        <tr key={act.id}>
          <td>{index + 1}</td> {/* Adding serial number */}
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

            <Button type="primary" onClick={handleSaveActs} disabled={!selectedBranch || !auditFrequency}>
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
