import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Skeleton, Alert, Breadcrumb,Button } from 'antd';
import { HomeOutlined, BankOutlined } from '@ant-design/icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, collection, getDocs, query, where } from 'firebase/firestore';
import AuditorNav from './AuditorNav';

const AuditorActs = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  const fetchBranches = useCallback(async (userId) => {
    setLoading(true);
    try {
      const auditorRef = doc(db, 'users', userId);
      const assignedBranchesRef = collection(auditorRef, 'assignedBranches');
      const assignedBranchesSnap = await getDocs(assignedBranchesRef);
      if (assignedBranchesSnap.empty) throw new Error('No assigned branches found.');
      
      let branchData = [];
      let branchIds = assignedBranchesSnap.docs.map(doc => doc.data().branchId);
      const adminQuery = query(collection(db, 'users'), where('role', '==', 'user'));
      const adminSnap = await getDocs(adminQuery);

      for (const adminDoc of adminSnap.docs) {
        const adminId = adminDoc.id;
        const adminBranchesRef = collection(db, 'users', adminId, 'branches');
        const adminBranchesSnap = await getDocs(adminBranchesRef);

        adminBranchesSnap.docs.forEach(branchDoc => {
          if (branchIds.includes(branchDoc.id)) {
            branchData.push({
              id: branchDoc.id,
              userId: adminId,
              name: branchDoc.data().branchName,
              location: branchDoc.data().location,
            });
          }
        });
      }
      setBranches(branchData);
    } catch (error) {
      toast.error(error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) navigate('/login');
      else fetchBranches(user.uid);
    });
    return () => unsubscribe();
  }, [auth, db, navigate, fetchBranches]);

  const branchColumns = [
    { title: 'Branch Name', dataIndex: 'name', key: 'name' },
    { title: 'Location', dataIndex: 'location', key: 'location' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button onClick={() => navigate(`/audit-acts/${record.userId}/${record.id}`)}>
        Select Branch
      </Button>
      
      ),
    },
  ];

  return (
    <div>
      <AuditorNav />
      <div className="admin-container">
      <h1 className="admin-home-title">Assigned Branches</h1>
      <Breadcrumb style={{ marginBottom: '20px' }}>
        <Breadcrumb.Item href="/AuditorHome">
          <HomeOutlined /> Home
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <BankOutlined /> Assigned Branches
        </Breadcrumb.Item>
      </Breadcrumb>
      {loading ? <Skeleton active /> : error ? <Alert message={error} type="error" /> : <Table dataSource={branches} columns={branchColumns} rowKey="id" pagination={{ position: ['bottomCenter'] }} />}
      <ToastContainer />
    </div>
    </div>
  );
};

export default AuditorActs;
