import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; 
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { Table, Button, Modal, Input, Form } from "antd";
import { toast } from "react-toastify";

const SubUsers = () => {
  const [subUsers, setSubUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubUserModalOpen, setIsSubUserModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();
  
  const navigate = useNavigate();
  const auth = getAuth();
  const { branchId } = useParams();

  // ✅ Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        toast.warning("You must be logged in!");
        navigate("/login"); // Redirect to login page if no user
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [auth, navigate]);

  useEffect(() => {
    if (currentUser && branchId) {
      console.log(`✅ Checking sub-users for branch: ${branchId}`);
      checkAndFetchSubUsers();
    }
  }, [currentUser, branchId]);

  const checkAndFetchSubUsers = async () => {
    if (!currentUser || !branchId) return;

    setLoading(true);
    try {
      const subUsersRef = collection(db, `users/${currentUser.uid}/branches/${branchId}/subUsers`);
      const snapshot = await getDocs(subUsersRef);

      if (snapshot.empty) {
        console.warn(`⚠️ No sub-users found for branch ${branchId}, creating default entry.`);
        await addDoc(subUsersRef, {
          name: "Default User",
          email: "default@example.com",
          role: "Placeholder",
        });
        toast.info("Created default sub-user entry.");
      }

      fetchSubUsers(); // ✅ Fetch latest data after ensuring the subcollection exists
    } catch (error) {
      console.error("❌ Error checking subUsers collection:", error);
      toast.error("Error checking subUsers collection.");
    }
    setLoading(false);
  };

  const fetchSubUsers = async () => {
    if (!currentUser || !branchId) {
      console.error("❌ Error: User or Branch ID is missing", { currentUser, branchId });
      toast.error("User or Branch ID is missing.");
      return;
    }

    setLoading(true);
    
    try {
      const path = `users/${currentUser.uid}/branches/${branchId}/subUsers`;
      console.log("🔍 Fetching sub-users from path:", path);
      
      const subUsersRef = collection(db, path);
      const snapshot = await getDocs(subUsersRef);
  
      if (snapshot.empty) {
        console.warn(`⚠️ No sub-users found for branch: ${branchId}`);
        setSubUsers([]);
      } else {
        setSubUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }
    } catch (error) {
      console.error("🔥 Firestore fetch error:", error);
      toast.error("Error fetching sub-users.");
    }
    
    setLoading(false);
  };

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
      console.error("❌ Error adding sub-user:", error);
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
      console.error("❌ Error deleting sub-user:", error);
      toast.error("Error deleting sub-user.");
    }
  };

  return (
    <div>
      <h2>Sub Users for Branch: {branchId}</h2>
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
  );
};

export default SubUsers;
