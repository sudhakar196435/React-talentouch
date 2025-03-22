import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Table, Button, Spin, Breadcrumb, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import { AuditOutlined, HomeOutlined } from "@ant-design/icons";
import AdminNav from "./AdminNav";

const AuditorsList = () => {
  const [auditors, setAuditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuditors = async () => {
      const auditorsQuery = query(
        collection(db, "users"),
        where("role", "==", "auditor")
      );
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
      render: (role) => <Tag color="orange">{role}</Tag>, // Role displayed as is
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => navigate(`/assign-branches/${record.id}`)}
        >
          Assign Branches
        </Button>
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
        <h1 className="admin-home-title">Auditors List</h1>
        <Breadcrumb style={{ marginBottom: "20px" }}>
          <Breadcrumb.Item href="/adminhome">
            <HomeOutlined /> Home
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <AuditOutlined /> Auditors List
          </Breadcrumb.Item>
        </Breadcrumb>
        <Table
          bordered
          dataSource={auditors}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>
    </div>
  );
};

export default AuditorsList;
