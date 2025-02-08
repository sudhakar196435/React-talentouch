import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Checkbox, Button, Spin, message } from "antd";
import AdminNav from "./AdminNav";

const AssignBranches = () => {
  const { auditorId } = useParams();
  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const usersCollection = await getDocs(collection(db, "users"));
        let allBranches = [];
        
        for (const userDoc of usersCollection.docs) {
          const branchesCollection = collection(db, `users/${userDoc.id}/branches`);
          const branchesSnapshot = await getDocs(branchesCollection);
          
          branchesSnapshot.docs.forEach((branchDoc) => {
            allBranches.push({
              id: branchDoc.id,
              name: branchDoc.data().branchName, // Assuming branches have a "name" field
              ownerId: userDoc.id,
            });
          });
        }
        
        setBranches(allBranches);
      } catch (error) {
        message.error("Error fetching branches");
      }
      setLoading(false);
    };

    fetchBranches();
  }, []);

  const handleCheckboxChange = (branchId) => {
    setSelectedBranches((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  };

  const handleSave = async () => {
    try {
      const auditorRef = doc(db, "users", auditorId);
      await updateDoc(auditorRef, { assignedBranches: selectedBranches });
      message.success("Branches assigned successfully");
      navigate("/auditors");
    } catch (error) {
      message.error("Error assigning branches");
    }
  };

  const columns = [
    {
      title: "Branch Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Assign",
      key: "assign",
      render: (_, record) => (
        <Checkbox
          checked={selectedBranches.includes(record.id)}
          onChange={() => handleCheckboxChange(record.id)}
        />
      ),
    },
  ];

  if (loading) {
    return <Spin size="large" style={{ display: "block", margin: "20px auto" }} />;
  }

  return (
    <div>
      <AdminNav />
      <div className="user-detail-container">
        <h1 className="admin-home-title">Assign Branches</h1>
        <Table dataSource={branches} columns={columns} rowKey="id" />
        <Button type="primary" onClick={handleSave} style={{ marginTop: "20px" }}>
          Save
        </Button>
      </div>
    </div>
  );
};

export default AssignBranches;
