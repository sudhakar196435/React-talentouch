// SubUserSubmissions.js
import React, { useState, useEffect } from "react";
import { doc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Table, Empty, Skeleton, Button } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import UserNav from "./UserNav";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SubUserSubmissions = () => {
  // Expect branch owner's UID (parentUid) and branchId in the URL.
  const { parentUid, branchId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      // Fetch submissions from the branch's submissions subcollection.
      const submissionsRef = collection(db, `users/${parentUid}/branches/${branchId}/submissions`);
      const snapshot = await getDocs(submissionsRef);
      const subs = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          ...data,
        };
      });
      setSubmissions(subs);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Error fetching submissions.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (parentUid && branchId) {
      fetchSubmissions();
    }
  }, [parentUid, branchId]);

  const columns = [
    {
      title: "Period",
      dataIndex: "period",
      key: "period",
      render: (period) => period || "N/A",
    },
    {
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (timestamp) => {
        if (timestamp && typeof timestamp.toDate === "function") {
          return timestamp.toDate().toLocaleString();
        } else if (timestamp) {
          return new Date(timestamp).toLocaleString();
        }
        return "N/A";
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() =>
            navigate(`/submissions/${parentUid}/${branchId}/${record.id}`)
          }
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <UserNav />
      <div className="admin-home-container">
        <h1 className="admin-home-title">My Branch Submissions</h1>
        {loading ? (
          <Skeleton active />
        ) : submissions.length === 0 ? (
          <Empty description="No submissions available" />
        ) : (
          <Table dataSource={submissions} columns={columns} rowKey="id" />
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default SubUserSubmissions;
