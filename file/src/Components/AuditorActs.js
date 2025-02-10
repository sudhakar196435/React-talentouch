import React, { useEffect, useState } from 'react';
import { Table, Spin, Alert } from 'antd';
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const AuditorActs = () => {
  const [loading, setLoading] = useState(true);
  const [acts, setActs] = useState([]);
  const [error, setError] = useState(null);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchActs = async () => {
      if (!auth.currentUser) {
        setError('No authenticated user found.');
        setLoading(false);
        return;
      }

      try {
        // Step 1: Get the auditor document
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

        let branchIds = assignedBranchesSnap.docs.map(doc => doc.data().branchId);
        console.log('📌 Assigned Branch IDs:', branchIds);

        // Step 2: Find Admin Users
        const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
        const adminsSnap = await getDocs(adminsQuery);

        if (adminsSnap.empty) {
          setError('No admins found.');
          setLoading(false);
          return;
        }

        let actIds = new Set();

        for (const adminDoc of adminsSnap.docs) {
          console.log(`🔍 Checking Admin: ${adminDoc.id}`);
          const branchesSnap = await getDocs(collection(db, `users/${adminDoc.id}/branches`));

          for (const branch of branchesSnap.docs) {
            console.log(`➡ Checking Branch: ${branch.id}`);

            if (branchIds.includes(branch.id)) {
              console.log(`✅ Matched Branch ID: ${branch.id}`);

              const branchData = branch.data();
              console.log(`📜 Branch Data:`, branchData);

              if (branchData.acts && Array.isArray(branchData.acts)) {
                console.log(`🔗 Acts Found in Branch ${branch.id}:`, branchData.acts);
                branchData.acts.forEach(actId => actIds.add(actId));
              } else {
                console.log(`⚠ Branch ${branch.id} has no acts array.`);
              }
            }
          }
        }

        console.log('🎯 Act IDs to Fetch:', Array.from(actIds));

        // Step 3: Fetch Act Details from Main 'acts' Collection
        if (actIds.size === 0) {
          setError('No acts found for assigned branches.');
          setLoading(false);
          return;
        }

        let actsData = [];
        for (const actId of actIds) {
          const actRef = doc(db, 'acts', actId);
          const actSnap = await getDoc(actRef);

          if (actSnap.exists()) {
            const actData = actSnap.data();
            actsData.push({
              id: actId,
              code: actData.code || 'N/A', // Display Act Code
              name: actData.name || 'N/A', // Display Act Name
            });
          } else {
            console.log(`❌ Act ${actId} not found in 'acts' collection.`);
          }
        }

        setActs(actsData);
      } catch (error) {
        console.error('❌ Error fetching acts:', error);
        setError('Failed to load acts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchActs();
  }, [auth.currentUser, db]);

  // Define Table Columns (Only Act Code & Act Name)
  const columns = [
    { title: 'Act Code', dataIndex: 'code', key: 'code' },
    { title: 'Act Name', dataIndex: 'name', key: 'name' },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2>📜 Auditor Assigned Acts</h2>
      {loading ? (
        <Spin size="large" />
      ) : error ? (
        <Alert message={error} type="error" showIcon />
      ) : (
        <Table dataSource={acts} columns={columns} rowKey="id" />
      )}
    </div>
  );
};

export default AuditorActs;
