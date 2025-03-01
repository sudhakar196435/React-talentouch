import React, { useState, useEffect } from "react";
import {
  collectionGroup,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  collection,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import {
  Table,
  Button,
  Empty,
  Skeleton,
  Select,
  DatePicker,
  message,
} from "antd";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import AuditorNav from "./AuditorNav";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import moment from "moment";

const { RangePicker } = DatePicker;

const AuditorSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchSubmissions(user.uid);
      } else {
        setCurrentUser(null);
        setSubmissions([]);
        setFilteredSubmissions([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchAssignedBranches = async (auditorId) => {
    try {
      const snapshot = await getDocs(collection(db, `users/${auditorId}/assignedBranches`));
      return snapshot.docs.map((doc) => doc.id);
    } catch (error) {
      console.error("Error fetching assigned branches:", error);
      return [];
    }
  };

  const fetchSubmissions = async (userId) => {
    setLoading(true);
    try {
      const assignedBranchIds = await fetchAssignedBranches(userId);
      if (assignedBranchIds.length === 0) {
        setSubmissions([]);
        setFilteredSubmissions([]);
        setBranches([]);
        setLoading(false);
        return;
      }

      const submissionsSnapshot = await getDocs(collectionGroup(db, "submissions"));
      const allSubmissions = submissionsSnapshot.docs.map((doc) => {
        const data = doc.data();
        const branchIdFromPath = doc.ref.parent.parent ? doc.ref.parent.parent.id : null;
        const branchId = branchIdFromPath || data.branchId || "N/A";
        return {
          id: doc.id,
          ...data,
          branchId,
        };
      });

      const relevantSubmissions = allSubmissions.filter((submission) =>
        assignedBranchIds.includes(submission.branchId)
      );

      const enhancedSubmissions = await Promise.all(
        relevantSubmissions.map(async (submission) => {
          let userName = "Unknown User";
          let branchName = "Unknown Branch";

          try {
            const userRef = doc(db, "users", submission.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              userName = userSnap.data().name || "Unknown User";
            }
          } catch (error) {
            console.error("Error fetching user:", error);
          }

          try {
            const branchRef = doc(db, "users", submission.userId, "branches", submission.branchId);
            const branchSnap = await getDoc(branchRef);
            if (branchSnap.exists()) {
              branchName = branchSnap.data().branchName || "Unknown Branch";
            }
          } catch (error) {
            console.error("Error fetching branch:", error);
          }

          const timestamp = submission.timestamp
            ? submission.timestamp.toDate
              ? submission.timestamp.toDate()
              : new Date(submission.timestamp)
            : null;

          return {
            ...submission,
            userName,
            branchName,
            timestamp,
          };
        })
      );

      setSubmissions(enhancedSubmissions);
      setFilteredSubmissions(enhancedSubmissions);

      const branchNames = [...new Set(enhancedSubmissions.map((sub) => sub.branchName))];
      setBranches(branchNames);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      message.error("Error fetching submissions.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (submissions.length === 0) {
      setFilteredSubmissions([]);
      return;
    }
    let filtered = submissions;
    if (selectedBranch) {
      filtered = filtered.filter((sub) => sub.branchName === selectedBranch);
    }
    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange;
      filtered = filtered.filter((sub) => {
        if (!sub.timestamp) return false;
        return moment(sub.timestamp).isBetween(start, end, "day", "[]");
      });
    }
    setFilteredSubmissions(filtered);
  }, [selectedBranch, dateRange, submissions]);

  const handleDelete = async (submissionId, branchId, userId) => {
    try {
      await deleteDoc(doc(db, `users/${userId}/branches/${branchId}/submissions`, submissionId));
      message.success("Submission deleted successfully.");
      fetchSubmissions(userId);
    } catch (error) {
      console.error("Error deleting submission:", error);
      message.error("Failed to delete submission.");
    }
  };

  const handleClearFilters = () => {
    setSelectedBranch(null);
    setDateRange(null);
    setFilteredSubmissions(submissions);
  };

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
      title: "Timestamp",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (timestamp) =>
        timestamp ? moment(timestamp).format("YYYY-MM-DD HH:mm:ss") : "N/A",
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
            onClick={() => handleDelete(record.id, record.branchId, record.userId)}
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
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <Select
            placeholder="Filter by Branch"
            onChange={(value) => setSelectedBranch(value)}
            value={selectedBranch}
            allowClear
            style={{ width: 200 }}
          >
            {branches.map((branch) => (
              <Select.Option key={branch} value={branch}>
                {branch}
              </Select.Option>
            ))}
          </Select>
          <RangePicker
            onChange={(dates) => setDateRange(dates)}
            value={dateRange}
            style={{ width: 250 }}
            allowClear
          />
          <Button onClick={handleClearFilters} style={{ marginLeft: 8 }}>
            Clear Filters
          </Button>
        </div>
        {loading ? (
          <Skeleton active />
        ) : filteredSubmissions.length === 0 ? (
          <Empty description="No submissions available" />
        ) : (
          <Table dataSource={filteredSubmissions} columns={columns} rowKey="id" />
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default AuditorSubmissions;
