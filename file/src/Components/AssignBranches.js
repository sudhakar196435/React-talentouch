import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { Table, Checkbox, Button, Spin, message, Result } from "antd";
import AdminNav from "./AdminNav";
import { useNavigate } from "react-router-dom";
const AssignBranches = () => {
  const { auditorId } = useParams();
  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
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
              name: branchDoc.data().branchName, // Assuming branches have a "branchName" field
              ownerId: userDoc.id,
            });
          });
        }

        setBranches(allBranches);

        // Fetch already assigned branches for this auditor
        const assignedBranchesCollection = collection(db, `users/${auditorId}/assignedBranches`);
        const assignedBranchesSnapshot = await getDocs(assignedBranchesCollection);
        const assignedBranchIds = assignedBranchesSnapshot.docs.map((doc) => doc.id);

        setSelectedBranches(assignedBranchIds);
      } catch (error) {
        message.error("Error fetching branches");
      }
      setLoading(false);
    };

    fetchBranches();
  }, [auditorId]);

  const handleCheckboxChange = (branchId) => {
    setSelectedBranches((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId) // Remove if unchecked
        : [...prev, branchId] // Add if checked
    );
  };

  const handleSave = async () => {
    try {
      const assignedBranchesCollection = collection(db, `users/${auditorId}/assignedBranches`);

      // Get the current assigned branches from Firestore
      const existingDocs = await getDocs(assignedBranchesCollection);
      const existingBranchIds = existingDocs.docs.map((doc) => doc.id);

      // Determine which branches to add and remove
      const branchesToAdd = selectedBranches.filter((id) => !existingBranchIds.includes(id));
      const branchesToRemove = existingBranchIds.filter((id) => !selectedBranches.includes(id));

      // Add new assigned branches
      for (const branchId of branchesToAdd) {
        const branchRef = doc(db, `users/${auditorId}/assignedBranches`, branchId);
        await setDoc(branchRef, { branchId }); // Store branchId as a field
      }

      // Remove unassigned branches
      for (const branchId of branchesToRemove) {
        const branchRef = doc(db, `users/${auditorId}/assignedBranches`, branchId);
        await deleteDoc(branchRef);
      }

      message.success("Branches assigned successfully");
      setIsSaved(true); // Show success message instead of table
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
    return <div className="loading-container">
          <Spin size="large" />
        </div> 
  }

  return (
    <div>
      <AdminNav />
      <div className="user-detail-container">
        {isSaved ? (
          <Result
          status="success"
          title="Branches Assigned Successfully!"
          subTitle={
            selectedBranches.length > 1
              ? `Great job! You have successfully assigned ${selectedBranches.length} branches to the auditor.`
              : "Your changes have been saved."
          }
          extra={[
            <Button type="primary" key="back" onClick={() => navigate(`/aud`)}>
              Done
            </Button>,
          ]}
        />
        
        ) : (
          <>
            <h1 className="admin-home-title">Assign Branches</h1>
            <Table dataSource={branches} columns={columns} rowKey="id" />
            <Button type="primary" onClick={handleSave} style={{ marginTop: "20px" }}>
              Save
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default AssignBranches;
