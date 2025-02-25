import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Spin, Card } from "antd";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserNav from "./UserNav";
import '../Styles/Submissions.css';

const STATUS_COLORS = {
  "Complied": "#28a745",
  "Not Complied": "#dc3545",
  "Partial Complied": "#ffc107",
  "Not Applicable": "#007bff",
};

const Submissions = () => {
  const { uid, branchId, submissionId } = useParams();
  const [answers, setAnswers] = useState([]);
  const [timestamp, setTimestamp] = useState(null);
  const [questions, setQuestions] = useState({});
  const [actName, setActName] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState([]);

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
      
      processStatusData(data.answers || []);
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

  const processStatusData = (answers) => {
    const statusCount = answers.reduce((acc, { status }) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const formattedData = Object.keys(STATUS_COLORS).map((status) => ({
      name: status,
      value: statusCount[status] || 0,
    })).filter((item) => item.value > 0);

    setStatusData(formattedData);
  };

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
              <p><strong>Act Name:</strong> {actName}</p>
              <p><strong>Submission Timestamp:</strong> {format(timestamp, "MMM d, yyyy, hh:mm:ss a")}</p>
            </Card>
          )}
          <div className="chart-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            <ResponsiveContainer width={300} height={300}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <table className="questions-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Question</th>
                <th>Risk</th>
                <th>Type</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {answers.map((answer, index) => (
                <tr key={index}>
                  <td className="sno-cell">{index + 1}</td>
                  <td>{questions[answer.questionId] || "Loading..."}</td>
                  <td>{answer.risk}</td>
                  <td>{answer.type}</td>
                  <td>{answer.status}</td>
                  <td>{answer.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default Submissions;