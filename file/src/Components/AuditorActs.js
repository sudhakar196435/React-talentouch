import React, { useEffect, useState } from 'react';
import { Table, Button, Spin, Alert } from 'antd';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

const AuditorActs = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acts, setActs] = useState({});
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    fetchBranches();
  }, []);

  // 🔹 Fetch assigned branches for the logged-in auditor
  const fetchBranches = async () => {
    if (!auth.currentUser) {
      setError('No authenticated user found.');
      setLoading(false);
      return;
    }

    try {
      const auditorRef = doc(db, 'users', auth.currentUser.uid);
      const auditorSnap = await getDoc(auditorRef);

      if (!auditorSnap.exists()) {
        setError('Auditor not found in database.');
        setLoading(false);
        return;
      }

      console.log('✅ Auditor Found! Fetching Assigned Branches...');
      const assignedBranchesRef = collection(auditorRef, 'assignedBranches');
      const assignedBranchesSnap = await getDocs(assignedBranchesRef);

      if (assignedBranchesSnap.empty) {
        setError('No assigned branches found.');
        setLoading(false);
        return;
      }

      let branchData = [];
      let branchIds = [];

      assignedBranchesSnap.docs.forEach(branchDoc => {
        const branchId = branchDoc.data().branchId;
        branchIds.push(branchId);
      });

      console.log('📌 Assigned Branch IDs:', branchIds);

      // 🔹 Fetch Admin Users & Their Branches Sub-Collection
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
              name: branchDoc.data().branchName,
            });
          }
        });
      }

      console.log('✅ Final Branch Data:', branchData);
      setBranches(branchData);
    } catch (error) {
      console.error('❌ Error fetching branches:', error);
      setError('Failed to load branches.');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch acts for a selected branch
  const fetchActs = async (branchId) => {
    setLoading(true);
    try {
      console.log(`🔍 Fetching acts for Branch ID: ${branchId}`);

      const branchRef = doc(db, 'users', branchId);
      const branchSnap = await getDoc(branchRef);

      if (!branchSnap.exists()) {
        console.error(`⚠ Branch ID ${branchId} NOT found in users collection.`);
        setLoading(false);
        return;
      }

      const actIds = branchSnap.data().acts || [];
      console.log('📌 Act IDs to Fetch:', actIds);

      // 🔹 Fetch Act Details from `acts` Collection
      let actDetails = [];
      for (const actId of actIds) {
        const actRef = doc(db, 'acts', actId);
        const actSnap = await getDoc(actRef);

        if (actSnap.exists()) {
          actDetails.push({
            id: actSnap.id,
            name: actSnap.data().actName,
            code: actSnap.data().actCode,
          });
        }
      }

      console.log('✅ Retrieved Acts:', actDetails);
      setActs(prev => ({ ...prev, [branchId]: actDetails }));
    } catch (error) {
      console.error('❌ Error fetching acts:', error);
      setError('Failed to load acts.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Auditor Assigned Branches</h2>

      {loading && <Spin size="large" />}
      {error && <Alert message={error} type="error" />}

      <Table
        dataSource={branches}
        columns={[
          {
            title: 'Branch Name',
            dataIndex: 'name',
            key: 'name',
          },
          {
            title: 'Actions',
            key: 'actions',
            render: (text, record) => (
              <Button type="primary" onClick={() => fetchActs(record.id)}>
                View Acts
              </Button>
            ),
          },
        ]}
        rowKey="id"
      />

      <h2>Acts for Selected Branch</h2>

      {Object.keys(acts).map(branchId => (
        <div key={branchId}>
          <h3>Branch: {branches.find(b => b.id === branchId)?.name || branchId}</h3>
          <Table
            dataSource={acts[branchId]}
            columns={[
              {
                title: 'Act Name',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: 'Act Code',
                dataIndex: 'code',
                key: 'code',
              },
            ]}
            rowKey="id"
          />
        </div>
      ))}
    </div>
  );
};

export default AuditorActs;
