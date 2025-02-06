import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Table, Button, Modal, Input, Form } from "antd";
import { toast } from "react-toastify";
import '../Styles/SubUsers.css';
import UserNav from "./UserNav";

const SubUsers = () => {
  const [subUsers, setSubUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubUserModalOpen, setIsSubUserModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [branchLocation, setBranchLocation] = useState(""); // Add state for location
  const [form] = Form.useForm();
  
  const navigate = useNavigate();
  const auth = getAuth();
  const { branchId } = useParams();

  // Define fetchSubUsers function with useCallback to avoid re-creation on every render
  const fetchSubUsers = useCallback(async () => {
    if (!currentUser || !branchId) return;

    setLoading(true);
    try {
      // Fetch branch location
      const branchDocRef = doc(db, `users/${currentUser.uid}/branches`, branchId);
      const branchDocSnapshot = await getDoc(branchDocRef);
      if (branchDocSnapshot.exists()) {
        setBranchLocation(branchDocSnapshot.data().location); // Store location from branch
      }

      // Fetch sub-users
      const subUsersRef = collection(db, `users/${currentUser.uid}/branches/${branchId}/subUsers`);
      const snapshot = await getDocs(subUsersRef);
      if (snapshot.empty) {
        setSubUsers([]);
      } else {
        setSubUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }
    } catch (error) {
      console.error("Error fetching sub-users:", error);
      toast.error("Error fetching sub-users.");
    }
    setLoading(false);
  }, [currentUser, branchId]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        toast.warning("You must be logged in!");
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  useEffect(() => {
    if (currentUser && branchId) {
      fetchSubUsers();
    }
  }, [currentUser, branchId, fetchSubUsers]); // Add fetchSubUsers as a dependency

  const handleAddSubUser = async (values) => {
    if (!currentUser || !branchId) {
      toast.error("Invalid user or branch ID.");
      return;
    }

    try {
      const subUsersRef = collection(db, `users/${currentUser.uid}/branches/${branchId}/subUsers`);
      await addDoc(subUsersRef, values);
      toast.success("Sub User added successfully!");
      fetchSubUsers(); 
      setIsSubUserModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error("Error adding sub-user:", error);
      toast.error("Error adding sub-user.");
    }
  };

  const handleDeleteSubUser = async (subUserId) => {
    if (!currentUser || !branchId) {
      toast.error("Invalid user or branch ID.");
      return;
    }

    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/branches/${branchId}/subUsers`, subUserId));
      setSubUsers((prev) => prev.filter((user) => user.id !== subUserId));
      toast.success("Sub User deleted successfully!");
    } catch (error) {
      console.error("Error deleting sub-user:", error);
      toast.error("Error deleting sub-user.");
    }
  };

  return (
    <div>
      <UserNav/>
      <div className="admin-container"> 
        <h1 className="admin-home-title">Manage Sub Users for Branch: {branchLocation}</h1> {/* Display location instead of branchId */}
        <Button type="primary" onClick={() => setIsSubUserModalOpen(true)} style={{ marginBottom: 16 }}>
          Add Sub User
        </Button>
        <Table
          dataSource={subUsers}
          columns={[
            { title: "Name", dataIndex: "name", key: "name" },
            { title: "Email", dataIndex: "email", key: "email" },
            { title: "Role", dataIndex: "role", key: "role" },
            {
              title: "Actions",
              key: "actions",
              render: (_, record) => (
                <Button danger onClick={() => handleDeleteSubUser(record.id)}>Delete</Button>
              ),
            },
          ]}
          rowKey="id"
          loading={loading}
        />
        <Modal title="Add Sub User" open={isSubUserModalOpen} onCancel={() => setIsSubUserModalOpen(false)} footer={null}>
          <Form form={form} layout="vertical" onFinish={handleAddSubUser}>
            <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please enter name" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, message: "Please enter email" }]}>
              <Input />
            </Form.Item>
            <Form.Item name="role" label="Role" rules={[{ required: true, message: "Please enter role" }]}>
              <Input />
            </Form.Item>
            <Button type="primary" htmlType="submit">Add</Button>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default SubUsers;
