import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Skeleton, Alert, Spin } from 'antd';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import UserNav from './UserNav';

const AuditorActs = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acts, setActs] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      if (!auth.currentUser) {
        throw new Error('No authenticated user found.');
      }

      const auditorRef = doc(db, 'users', auth.currentUser.uid);
      const auditorSnap = await getDoc(auditorRef);

      if (!auditorSnap.exists()) {
        throw new Error('Auditor not found in database.');
      }

      const assignedBranchesRef = collection(auditorRef, 'assignedBranches');
      const assignedBranchesSnap = await getDocs(assignedBranchesRef);

      if (assignedBranchesSnap.empty) {
        throw new Error('No assigned branches found.');
      }

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
              actIds: branchDoc.data().acts || [],
            });
          }
        });
      }

      setBranches(branchData);
    } catch (error) {
      console.error('❌ Error fetching branches:', error);
      toast.error(error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchActs = async (branch) => {
    if (selectedBranch?.id === branch.id) {
      setSelectedBranch(null);
      setActs([]);
      return;
    }

    if (branch.actIds.length === 0) {
      toast.warn('No acts assigned to this branch.');
      setSelectedBranch(branch);
      setActs([]);
      return;
    }

    setLoading(true);
    setActs([]);
    setSelectedBranch(branch);

    try {
      let actDetails = [];
      for (const actId of branch.actIds) {
        const actRef = doc(db, 'acts', actId);
        const actSnap = await getDoc(actRef);

        if (actSnap.exists()) {
          actDetails.push({
            id: actSnap.id,
            name: actSnap.data().actName,
            code: actSnap.data().actCode,
            branchId: branch.id,
            userId: branch.userId,
          });
        }
      }

      setActs(actDetails);
    } catch (error) {
      console.error('❌ Error fetching acts:', error);
      toast.error('Failed to load acts.');
    } finally {
      setLoading(false);
    }
  };

  const branchColumns = [
    { title: 'Branch Name', dataIndex: 'name', key: 'name' },
    { title: 'Location', dataIndex: 'location', key: 'location' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type={selectedBranch?.id === record.id ? 'default' : 'primary'}
          onClick={() => fetchActs(record)}
        >
          {selectedBranch?.id === record.id ? 'Hide Acts' : 'View Acts'}
        </Button>
      ),
    },
  ];

  const actColumns = [
    { title: 'Act Name', dataIndex: 'name', key: 'name' },
    { title: 'Act Code', dataIndex: 'code', key: 'code' },
    {
      title: "Audit",
      key: "audit",
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => navigate(`/audit-act/${record.userId}/${record.branchId}/${record.id}`)}
        >
          Audit
        </Button>
      ),
    },
    
  ];

  return (
    <div>
      <UserNav />
      <div className="admin-container">
        <h1 className="admin-home-title">Assigned Branches</h1>
        {loading ? (
          <Skeleton active />
        ) : error ? (
          <Alert message={error} type="error" />
        ) : (
          <Table dataSource={branches} columns={branchColumns} rowKey="id" />
        )}
        {selectedBranch && (
          <div>
            <h2>Acts for {selectedBranch.name}</h2>
            {loading ? <Spin size="large" /> : <Table dataSource={acts} columns={actColumns} rowKey="id" />}
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default AuditorActs;
