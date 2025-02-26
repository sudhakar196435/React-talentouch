import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Skeleton, Alert, Modal, Breadcrumb } from 'antd';
import { HomeOutlined, BankOutlined } from '@ant-design/icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import AuditorNav from './AuditorNav';

const AuditorActs = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acts, setActs] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [actsLoading, setActsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  const fetchBranches = useCallback(async (userId) => {
    setLoading(true);
    try {
      const auditorRef = doc(db, 'users', userId);
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
  }, [db]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().role === 'auditor') {
          fetchBranches(user.uid);
        } else {
          navigate('/login');
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [auth, db, navigate, fetchBranches]);

  const fetchActs = useCallback(async (branch) => {
    setActsLoading(true);
    setSelectedBranch(branch);
    setIsModalVisible(true);

    try {
      if (branch.actIds.length === 0) {
        toast.warn('No acts assigned to this branch.');
        setActs([]);
        setActsLoading(false);
        return;
      }

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
      setActsLoading(false);
    }
  }, [db]);

  const branchColumns = [
    { title: 'Branch Name', dataIndex: 'name', key: 'name' },
    { title: 'Location', dataIndex: 'location', key: 'location' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <>
          <Button
            type="primary"
            onClick={() => fetchActs(record)}
            style={{ marginRight: '10px' }}
          >
            View Acts
          </Button>
          <Button
            type="default"
            onClick={() => navigate(`/branch-user/${record.userId}`, { state: { userId: record.userId } })}
          >
            View Company Details
          </Button>
        </>
      ),
    },
  ];

  const actColumns = [
    { title: 'Act Code', dataIndex: 'code', key: 'code' },
    { title: 'Act Name', dataIndex: 'name', key: 'name' },
   
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
      <AuditorNav />
      <div className="admin-container">
        <h1 className="admin-home-title">Assigned Branches</h1>

        {/* Breadcrumb Navigation */}
        <Breadcrumb style={{ marginBottom: '20px' }}>
          <Breadcrumb.Item href="/AuditorHome">
            <HomeOutlined /> Home
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <BankOutlined /> Assigned Branches
          </Breadcrumb.Item>
        </Breadcrumb>

        {loading ? (
          <Skeleton active />
        ) : error ? (
          <Alert message={error} type="error" />
        ) : (
          <Table dataSource={branches} columns={branchColumns} rowKey="id" pagination={{ position: ['bottomCenter'] }}/>
        )}

        {/* Acts Modal */}
        <Modal
          title={`Acts for ${selectedBranch?.name}`}
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          width={1200}
        >
          {actsLoading ? <Skeleton active /> : <Table dataSource={acts} columns={actColumns} rowKey="id" pagination={{ position: ['bottomCenter'] }} />}
        </Modal>
      </div>
      <ToastContainer />
    </div>
  );
};

export default AuditorActs;
