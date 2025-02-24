import React, { useState, useEffect } from "react";
import { collectionGroup, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Table, Empty, Skeleton, Button } from "antd";
import { useNavigate } from "react-router-dom";
import AuditorNav from "./AuditorNav";

const SubUserSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const submissionsQuerySnapshot = await getDocs(collectionGroup(db, "submissions"));
      const rawSubmissions = submissionsQuerySnapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        const branchId = docSnapshot.ref.parent.parent?.id || "N/A";
        return {
          id: docSnapshot.id,
          ...data,
          branchId,
        };
      });

      const enhancedSubmissions = await Promise.all(
        rawSubmissions.map(async (submission) => {
         
          

          const branchRef = doc(db, `users/${submission.userId}/branches`, submission.branchId);
          const branchSnap = await getDoc(branchRef);
          const branchName = branchSnap.exists()
            ? branchSnap.data().branchName || "Unknown Branch"
            : "Unknown Branch";

          const actRef = doc(db, "acts", submission.actId);
          const actSnap = await getDoc(actRef);
          const actName = actSnap.exists()
            ? actSnap.data().actName || "Unknown Act"
            : "Unknown Act";

          return {
            ...submission,
            branchName,
            actName,
          };
        })
      );

      setSubmissions(enhancedSubmissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const columns = [
    
    {
      title: "Branch",
      dataIndex: "branchName",
      key: "branchName",
    },
    {
      title: "Act Name",
      dataIndex: "actName",
      key: "actName",
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
          onClick={() => navigate(`/submissions/${record.userId}/${record.branchId}/${record.id}`)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <AuditorNav />
      <div className="admin-home-container">
        <h1 className="admin-home-title">Submissions</h1>
        {loading ? (
          <Skeleton active />
        ) : submissions.length === 0 ? (
          <Empty description="No submissions available" />
        ) : (
          <Table dataSource={submissions} columns={columns} rowKey="id" />
        )}
      </div>
    </div>
  );
};

export default SubUserSubmissions;