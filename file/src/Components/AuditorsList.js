import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Table, Button, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import AdminNav from "./AdminNav";

const AuditorsList = () => {
  const [auditors, setAuditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuditors = async () => {
      const auditorsQuery = query(collection(db, "users"), where("role", "==", "auditor"));
      const querySnapshot = await getDocs(auditorsQuery);
      const auditorList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAuditors(auditorList);
      setLoading(false);
    };

    fetchAuditors();
  }, []);

  const columns = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button type="primary" onClick={() => navigate(`/assign-branches/${record.id}`)}>
          Assign Branches
        </Button>
      ),
    },
  ];

  if (loading) {
    return <Spin size="large" style={{ display: "block", margin: "20px auto" }} />;
  }

  return (
    <div>
        <AdminNav/>
        <div className="user-detail-container">
        
        <h1 className="admin-home-title">Auditors List</h1>
   
      <Table dataSource={auditors} columns={columns} rowKey="id" />
    </div>
    </div>
  );
};

export default AuditorsList;
