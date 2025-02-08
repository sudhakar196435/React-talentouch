import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Table, Skeleton, Button } from "antd";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserNav from "./UserNav";

const AuditorAudit = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      let allBranches = [];

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const branchesCollection = collection(db, `users/${userId}/branches`);
        const branchesSnapshot = await getDocs(branchesCollection);

        branchesSnapshot.docs.forEach((branchDoc) => {
          allBranches.push({
            id: branchDoc.id,
            userId,
            ...branchDoc.data(),
          });
        });
      }

      setBranches(allBranches);
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error("Error fetching branches.");
    }
    setLoading(false);
  };

  const columns = [
    { title: "Branch Name", dataIndex: "branchName", key: "branchName" },
    { title: "Location", dataIndex: "location", key: "location" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => navigate(`/branch-acts/${record.userId}/${record.id}`)}
        >
          Audit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <UserNav />
      <div className="admin-container">
        <h1 className="admin-home-title">All Branches</h1>
        {loading ? (
          <Skeleton active />
        ) : (
          <Table dataSource={branches} columns={columns} rowKey="id" />
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default AuditorAudit;
