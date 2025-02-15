import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Table, Skeleton, Card } from "antd";
import { format } from "date-fns";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserNav from "./UserNav";

const Submissions = () => {
  const { uid, branchId, submissionId } = useParams();
  const [answers, setAnswers] = useState([]);
  const [timestamp, setTimestamp] = useState(null);
  const [questions, setQuestions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmission();
  }, [uid, branchId, submissionId]);

  const fetchSubmission = async () => {
    if (!uid || !branchId || !submissionId) {
      toast.error("Missing parameters in URL.");
      return;
    }
    setLoading(true);

    try {
      const submissionRef = doc(db, `users/${uid}/branches/${branchId}/submissions/${submissionId}`);
      const docSnap = await getDoc(submissionRef);

      if (!docSnap.exists()) {
        toast.error("No such submission found!");
        setLoading(false);
        return;
      }

      const data = docSnap.data();
      setAnswers(data.answers || []);
      setTimestamp(data.timestamp?.toDate() || null);

      if (data.actId) {
        fetchQuestionsForAct(data.actId);
      }
    } catch (error) {
      console.error("Error fetching submission:", error);
      toast.error("Error fetching submission.");
    }
    setLoading(false);
  };

  const fetchQuestionsForAct = async (actId) => {
    try {
      const questionsRef = collection(db, `acts/${actId}/questions`);
      const querySnapshot = await getDocs(questionsRef);
      let questionsMap = {};

      querySnapshot.forEach((doc) => {
        questionsMap[doc.id] = doc.data().text || "No text available";
      });

      setQuestions(questionsMap);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Error fetching questions.");
    }
  };

  const columns = [
    {
      title: "Question",
      dataIndex: "questionId",
      key: "questionId",
      render: (questionId) => questions[questionId] || "Fetching question...",
    },
    { title: "Remarks", dataIndex: "remarks", key: "remarks" },
    { title: "Status", dataIndex: "status", key: "status" },
  ];

  return (
    <div>
      <UserNav />
      <div className="admin-container">
        <h1 className="admin-home-title">Submission Details</h1>
        {timestamp && (
          <Card style={{ marginBottom: "20px" }}>
            <p>
              <strong>Submission Timestamp:</strong> {format(timestamp, "MMM d, yyyy, hh:mm:ss a")}
            </p>
          </Card>
        )}
        {loading ? <Skeleton active /> : <Table dataSource={answers} columns={columns} rowKey="questionId" />}
      </div>
      <ToastContainer />
    </div>
  );
};

export default Submissions;