import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import AuditorNav from "./AuditorNav";
import { Spin, Table } from "antd";

const AuditorUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      const userList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(userList);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const columns = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Company Name",
      dataIndex: "companyName",
      key: "companyName",
    },
    {
      title: "Industry Type",
      dataIndex: "industryType",
      key: "industryType",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Link to={`/auditor/user/${record.id}`} className="view-btn">
          View
        </Link>
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
      <AuditorNav />
      <h1 className="admin-home-title">Users List</h1>
      <Table dataSource={users} columns={columns} rowKey="id" />
    </div>
  );
};

export default AuditorUsers;
