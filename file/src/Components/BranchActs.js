import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Table, Skeleton, Button } from "antd";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserNav from "./UserNav";

const BranchActs = () => {
  const { branchId, userId } = useParams();
  const [acts, setActs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
      } else {
        fetchActs(userId || user.uid);
      }
    });

    return () => unsubscribe();
  }, [auth, navigate, userId, branchId]);

  const fetchActs = async (uid) => {
    if (!uid || !branchId) return;
    setLoading(true);

    try {
      const branchRef = doc(db, `users/${uid}/branches`, branchId);
      const branchSnap = await getDoc(branchRef);

      if (!branchSnap.exists()) {
        toast.error("Branch not found");
        setLoading(false);
        return;
      }

      const branchData = branchSnap.data();
      if (!branchData.acts || branchData.acts.length === 0) {
        setActs([]);
        setLoading(false);
        return;
      }

      const actsCollection = collection(db, "acts");
      const actsSnapshot = await getDocs(actsCollection);
      const actsList = actsSnapshot.docs
        .filter((doc) => branchData.acts.includes(doc.id))
        .map((doc) => ({ id: doc.id, ...doc.data() }));

      setActs(actsList);
    } catch (error) {
      console.error("Error fetching acts:", error);
      toast.error("Error fetching acts.");
    }

    setLoading(false);
  };

  const columns = [
    { title: "Act Code", dataIndex: "actCode", key: "actCode" },
    { title: "Act Name", dataIndex: "actName", key: "actName" },
    {
      title: "Audits",
      key: "audits",
      render: (_, record) => (
        <Button type="primary" onClick={() => navigate(`/audits/${record.id}`)}>
          View Audit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <UserNav />
      <div className="admin-container">
        <h1 className="admin-home-title">Branch Acts</h1>
        {loading ? (
          <Skeleton active />
        ) : (
          <Table dataSource={acts} columns={columns} rowKey="id" />
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default BranchActs;
