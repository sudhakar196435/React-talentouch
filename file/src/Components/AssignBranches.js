import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { Table, Checkbox, Button, Spin, message, Result } from "antd";
import AdminNav from "./AdminNav";

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
        // Fetch branches from all users.
        const usersSnapshot = await getDocs(collection(db, "users"));
        let allBranches = [];
        for (const userDoc of usersSnapshot.docs) {
          const branchesSnapshot = await getDocs(collection(db, `users/${userDoc.id}/branches`));
          branchesSnapshot.docs.forEach((branchDoc) => {
            // Each branch is identified by its document ID.
            if (branchDoc.data().branchName) {
              allBranches.push({
                id: branchDoc.id,
                name: branchDoc.data().branchName,
                ownerId: userDoc.id,
              });
            }
          });
        }
        // Remove duplicates based on branch id (if any)
        const uniqueBranches = Array.from(new Map(allBranches.map(item => [item.id, item])).values());
        setBranches(uniqueBranches);

        // Fetch already assigned branches for this auditor.
        const assignedSnapshot = await getDocs(collection(db, `users/${auditorId}/assignedBranches`));
        // Expect that we always store the branch ID in a field called "branchId".
        const assignedBranchIds = assignedSnapshot.docs
          .map(doc => doc.data().branchId)
          .filter(id => id);
        setSelectedBranches(assignedBranchIds);
      } catch (error) {
        message.error("Error fetching branches");
        console.error("Fetch error:", error);
      }
      setLoading(false);
    };

    fetchBranches();
  }, [auditorId]);

  const handleCheckboxChange = (branchId) => {
    setSelectedBranches(prev =>
      prev.includes(branchId)
        ? prev.filter(id => id !== branchId)
        : [...prev, branchId]
    );
  };

  const handleSave = async () => {
    try {
      const assignedCollection = collection(db, `users/${auditorId}/assignedBranches`);
      const existingSnapshot = await getDocs(assignedCollection);
      const existingBranchIds = existingSnapshot.docs
        .map(doc => doc.data().branchId)
        .filter(id => id);

      // Determine which branches to add and which to remove.
      const branchesToAdd = selectedBranches.filter(id => !existingBranchIds.includes(id));
      const branchesToRemove = existingBranchIds.filter(id => !selectedBranches.includes(id));

      // Add new assignments.
      for (const branchId of branchesToAdd) {
        const branchRef = doc(db, `users/${auditorId}/assignedBranches`, branchId);
        await setDoc(branchRef, { branchId });
      }

      // Remove unassigned branches.
      for (const branchId of branchesToRemove) {
        const branchRef = doc(db, `users/${auditorId}/assignedBranches`, branchId);
        await deleteDoc(branchRef);
      }

      message.success("Branches assigned successfully");
      setIsSaved(true);
    } catch (error) {
      message.error("Error assigning branches");
      console.error("Assignment error:", error);
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
