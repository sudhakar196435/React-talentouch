import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Table, Empty, Skeleton, Button, Select } from "antd";
import { useNavigate } from "react-router-dom";
import AuditorNav from "./AuditorNav";

const { Option } = Select;

const SubmissionsView = () => {
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const navigate = useNavigate();

  const fetchCompanies = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const companyList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCompanies(companyList);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const fetchBranches = async (companyId) => {
    try {
      const snapshot = await getDocs(collection(db, `users/${companyId}/branches`));
      const branchList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBranches(branchList);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchSubmissions = async (companyId, branchId) => {
    if (!companyId || !branchId) return;
    setLoading(true);
    try {
      const submissionsRef = collection(db, `users/${companyId}/branches/${branchId}/submissions`);
      const snapshot = await getDocs(submissionsRef);

      const submissionsList = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();

          const actRef = doc(db, "acts", data.actId);
          const actSnap = await getDoc(actRef);
          const actName = actSnap.exists() ? actSnap.data().actName || "Unknown Act" : "Unknown Act";

          return {
            id: docSnapshot.id,
            ...data,
            actName,
          };
        })
      );

      setSubmissions(submissionsList);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const columns = [
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
          onClick={() => navigate(`/submissions/${selectedCompany}/${selectedBranch}/${record.id}`)}
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
        <h1 className="admin-home-title">Audit Submissions</h1>
        <Select
          placeholder="Select Company"
          style={{ width: 300, marginBottom: 20 }}
          onChange={(value) => {
            setSelectedCompany(value);
            setSelectedBranch(null);
            setSubmissions([]);
            fetchBranches(value);
          }}
        >
          {companies.map((company) => (
            <Option key={company.id} value={company.id}>
              {company.companyName}
            </Option>
          ))}
        </Select>

        {selectedCompany && (
          <Select
            placeholder="Select Branch"
            style={{ width: 300, marginLeft: 20, marginBottom: 20 }}
            onChange={(value) => {
              setSelectedBranch(value);
              fetchSubmissions(selectedCompany, value);
            }}
          >
            {branches.map((branch) => (
              <Option key={branch.id} value={branch.id}>
                {branch.branchName}
              </Option>
            ))}
          </Select>
        )}

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

export default SubmissionsView;
