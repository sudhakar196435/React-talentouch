import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Skeleton, Empty,Breadcrumb } from "antd";
import UserNav from "./UserNav";
import { HomeOutlined,BankOutlined,FileTextOutlined } from '@ant-design/icons';

const BranchActs = () => {
  const { branchId, userId } = useParams();
  const [acts, setActs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
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
          .map((doc, index) => ({
            id: doc.id,
            serialNo: index + 1,
            ...doc.data(),
          }));

        setActs(actsList);
      } catch (error) {
        console.error("Error fetching acts:", error);
        toast.error("Error fetching acts.");
      }

      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login");
      } else {
        fetchActs(userId || user.uid);
      }
    });

    return () => unsubscribe();
  }, [auth, navigate, userId, branchId]);

  return (
    <div>
      <UserNav />
      <div className="admin-container">
        <h1 className="admin-home-title">Branch Acts</h1>
        <Breadcrumb style={{ marginBottom: '20px' }}>
        <Breadcrumb.Item href="/home">
          <HomeOutlined /> Home
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/branches">
          <BankOutlined /> Branches
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <FileTextOutlined /> Branch Acts
        </Breadcrumb.Item>
      </Breadcrumb>
        {loading ? (
          <Skeleton active />
        ) : acts.length > 0 ? (
          <div className="table-container">
          <table className="acts-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Act Code</th>
                <th>Act Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {acts.map((act) => (
                <tr key={act.id}>
                  <td>{act.serialNo}</td>
                  <td>{act.actCode}</td>
                  <td>{act.actName}</td>
                  <td>
                    <a href={`/act/${act.id}`} className="view-link">
                      View Act Details
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          <Empty description="No Acts Are Assigned" />
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default BranchActs;
