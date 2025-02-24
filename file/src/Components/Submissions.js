import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Table, Spin, Card } from "antd";
import { format } from "date-fns";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserNav from "./UserNav";
import '../Styles/Submissions.css'
const Submissions = () => {
  const { uid, branchId, submissionId } = useParams();
  const [answers, setAnswers] = useState([]);
  const [timestamp, setTimestamp] = useState(null);
  const [questions, setQuestions] = useState({});
  const [actName, setActName] = useState("");
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
        await Promise.all([fetchActDetails(data.actId), fetchQuestionsForAct(data.actId)]);
      }
    } catch (error) {
      console.error("Error fetching submission:", error);
      toast.error("Error fetching submission.");
    }

    setLoading(false);
  };

  const fetchActDetails = async (actId) => {
    try {
      const actRef = doc(db, "acts", actId);
      const actSnap = await getDoc(actRef);
      if (actSnap.exists()) {
        setActName(actSnap.data().actName || "Unknown Act");
      } else {
        setActName("Unknown Act");
      }
    } catch (error) {
      console.error("Error fetching act details:", error);
      toast.error("Error fetching act details.");
    }
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
      render: (questionId) => questions[questionId] || "Loading...",
    },
    { title: "Status", dataIndex: "status", key: "status" },
    { title: "Remarks", dataIndex: "remarks", key: "remarks" },
    
  ];

  return (
    <div>
      <UserNav />
      {loading ? (
       <div className="loading-container">
         <Spin size="large" />
       </div>
      ) : (
        <div className="admin-container">
          <h1 className="admin-home-title">Submission Details</h1>
          {timestamp && (
            <Card style={{ marginBottom: "20px" }}>
              <p>
                <strong>Act Name:</strong> {actName}
              </p>
              <p>
                <strong>Submission Timestamp:</strong> {format(timestamp, "MMM d, yyyy, hh:mm:ss a")}
              </p>
            </Card>
          )}
          <Table dataSource={answers} columns={columns} rowKey="questionId" />
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default Submissions;
