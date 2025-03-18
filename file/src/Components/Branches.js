import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Table, Button, Modal, Input, Form, Skeleton, Breadcrumb, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserNav from "./UserNav";
import { HomeOutlined, BankOutlined } from "@ant-design/icons";

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/AccessDenied");
      } else {
        setCurrentUser(user);

        // Fetch active status from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setIsActive(userDoc.data().active); // Assuming Firestore has an 'active' field
        }

        fetchBranches(user);
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  // Fetch branches for the logged-in user
  const fetchBranches = async (user) => {
    if (!user) return;
    setLoading(true);

    try {
      const branchesRef = collection(db, `users/${user.uid}/branches`);
      const snapshot = await getDocs(branchesRef);

      if (!snapshot.empty) {
        const branchList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBranches(branchList);
      } else {
        setBranches([]);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error("Error fetching branches.");
    }

    setLoading(false);
  };

  // Add a new branch
  const handleAddBranch = async (values) => {
    if (!currentUser) return;

    try {
      await addDoc(collection(db, `users/${currentUser.uid}/branches`), values);
      toast.success("Branch added successfully!");
      setIsModalOpen(false);
      fetchBranches(currentUser);
    } catch (error) {
      console.error("Error adding branch:", error);
      toast.error("Error adding branch!");
    }
  };

  // Delete a branch
  const handleDeleteBranch = async (id) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/branches`, id));
      setBranches((prev) => prev.filter((b) => b.id !== id));
      toast.success("Branch deleted successfully!");
    } catch (error) {
      console.error("Error deleting branch:", error);
      toast.error("Error deleting branch!");
    }
  };

  const openModal = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  // Navigate to sub-users page
  const handleBranchClick = (branchId) => {
    navigate(`/sub-users/${branchId}`);
  };

  // Navigate to View Acts
  const handleViewActs = (branchId) => {
    navigate(`/branch-acts/${branchId}`);
  };

  // Navigate to View Submissions with correct path
  const handleViewSubmissions = (branchId) => {
    if (!currentUser) return;
    navigate(`/submissions/${currentUser.uid}/${branchId}/combined_1741290298509`);
  };

  const columns = [
    { title: "Branch Name", dataIndex: "branchName", key: "branchName" },
    { title: "Location", dataIndex: "location", key: "location" },
    { title: "Audit Frequency", dataIndex: "auditFrequency", key: "auditFrequency" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <>
          <Button type="primary" onClick={() => handleBranchClick(record.id)}>Manage Sub Users</Button>
          <Button type="primary" onClick={() => handleViewActs(record.id)}>View Acts</Button>
          <Button danger onClick={() => handleDeleteBranch(record.id)} style={{ marginLeft: 8 }}>Delete</Button>
          <Button type="primary" onClick={() => handleViewSubmissions(record.id)}>View Submissions</Button>
        </>
      ),
    },
  ];

  return (
    <div>
      <UserNav />
      <div className="admin-container">
        <h1 className="admin-home-title">Branches</h1>
        <Breadcrumb style={{ marginBottom: "20px" }}>
          <Breadcrumb.Item href="/home">
            <HomeOutlined /> Home
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <BankOutlined /> Branches
          </Breadcrumb.Item>
        </Breadcrumb>

        {!isActive && (
          <Alert
            message="Pending Account Approval"
            description="Your account is under review. Activation is required to add a branch."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            closable
          />
        )}

        <Button type="primary" onClick={openModal} style={{ marginBottom: 16 }} disabled={!isActive}>
          Add Branch
        </Button>

        {loading ? <Skeleton active /> : <Table dataSource={branches} columns={columns} rowKey="id" />}

        {/* Add Branch Modal */}
        <Modal title="Add Branch" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
          <Form form={form} layout="vertical" onFinish={handleAddBranch}>
            <Form.Item name="branchName" label="Branch Name" rules={[{ required: true, message: "Enter branch name" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="location" label="Location" rules={[{ required: true, message: "Enter location" }]}>
              <Input />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Add
            </Button>
          </Form>
        </Modal>

        <ToastContainer />
      </div>
    </div>
  );
};

export default Branches;
