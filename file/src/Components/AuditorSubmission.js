import React, { useState, useEffect } from "react";
import { collectionGroup, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Table, Button, Empty, message, Skeleton } from "antd";
import { useNavigate } from "react-router-dom";
import AuditorNav from "./AuditorNav";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AuditorSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch all submissions from any subcollection named "submissions"
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const submissionsQuerySnapshot = await getDocs(collectionGroup(db, "submissions"));
      
      // Map the raw submission data and also get branchId from the parent path
      const rawSubmissions = submissionsQuerySnapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        // Assuming the submission document exists under: users/{userId}/branches/{branchId}/submissions
        const branchId = docSnapshot.ref.parent.parent?.id || "N/A";
        return {
          id: docSnapshot.id,
          ...data,
          branchId,
        };
      });
      
      // Enhance each submission by fetching names from related documents.
      const enhancedSubmissions = await Promise.all(
        rawSubmissions.map(async (submission) => {
          // Fetch the user document to get the user's name.
          const userRef = doc(db, "users", submission.userId);
          const userSnap = await getDoc(userRef);
          const userName = userSnap.exists()
            ? userSnap.data().name || userSnap.data().displayName || "Unknown User"
            : "Unknown User";
          
          // Fetch the branch document to get the branch name.
          const branchRef = doc(db, `users/${submission.userId}/branches`, submission.branchId);
          const branchSnap = await getDoc(branchRef);
          const branchName = branchSnap.exists()
            ? branchSnap.data().branchName || "Unknown Branch"
            : "Unknown Branch";
          
          // Fetch the act document to get the act name.
          const actRef = doc(db, "acts", submission.actId);
          const actSnap = await getDoc(actRef);
          const actName = actSnap.exists()
            ? actSnap.data().actName || "Unknown Act"
            : "Unknown Act";
          
          return {
            ...submission,
            userName,
            branchName,
            actName,
          };
        })
      );

      setSubmissions(enhancedSubmissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      message.error("Error fetching submissions.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Delete a submission.
  // We use the full path: users/{userId}/branches/{branchId}/submissions/{submissionId}
  const handleDelete = async (submissionId, branchId, userId) => {
    try {
      await deleteDoc(doc(db, `users/${userId}/branches/${branchId}/submissions`, submissionId));
      message.success("Submission deleted successfully.");
      fetchSubmissions();
    } catch (error) {
      console.error("Error deleting submission:", error);
      message.error("Failed to delete submission.");
    }
  };

  // Define table columns to show names rather than raw IDs.
  const columns = [
    {
      title: "User",
      dataIndex: "userName",
      key: "userName",
    },
    {
      title: "Branch",
      dataIndex: "branchName",
      key: "branchName",
    },
    {
      title: "Act",
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
        <>
          <Button
            type="primary"
            onClick={() =>
              navigate(`/submissions/${record.userId}/${record.branchId}/${record.id}`)
            }
          >
            View Details
          </Button>
          <Button
            danger
            style={{ marginLeft: 8 }}
            onClick={() =>
              handleDelete(record.id, record.branchId, record.userId)
            }
          >
            Delete
          </Button>
        </>
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
      <ToastContainer />
    </div>
  );
};

export default AuditorSubmissions;
