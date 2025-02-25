import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Table, Skeleton, Alert, Spin } from 'antd';
import { toast } from 'react-toastify';

const BranchCompliance = () => {
  const { userId, branchId } = useParams();
  const [acts, setActs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    fetchActs();
  }, []);

  const fetchActs = async () => {
    setLoading(true);
    try {
      const branchRef = doc(db, 'users', userId, 'branches', branchId);
      const branchSnap = await getDoc(branchRef);

      if (!branchSnap.exists()) {
        throw new Error('Branch not found.');
      }

      const actIds = branchSnap.data().acts || [];
      if (actIds.length === 0) {
        toast.warn('No compliance acts assigned to this branch.');
        setActs([]);
        return;
      }

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

      setActs(actDetails);
    } catch (error) {
      console.error('❌ Error fetching compliance data:', error);
      toast.error('Failed to load compliance data.');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const actColumns = [
    { title: 'Act Name', dataIndex: 'name', key: 'name' },
    { title: 'Act Code', dataIndex: 'code', key: 'code' },
  ];

  return (
    <div>
      <h1>Branch Compliance</h1>
      {loading ? (
        <Skeleton active />
      ) : error ? (
        <Alert message={error} type="error" />
      ) : (
        <Table dataSource={acts} columns={actColumns} rowKey="id" />
      )}
    </div>
  );
};

export default BranchCompliance;
