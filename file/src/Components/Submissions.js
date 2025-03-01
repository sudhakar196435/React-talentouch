import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Spin, Card, Table } from "antd";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserNav from "./UserNav";
import "../Styles/Submissions.css";

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
  // questions mapping: { [questionId]: { text, risk, type, registerForm, timeLimit } }
  const [questions, setQuestions] = useState({});
  // For combined submission, we now store act names in an array.
  const [actNames, setActNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState([]);

  useEffect(() => {
    console.log("URL Parameters:", { uid, branchId, submissionId });
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
      const submissionSnap = await getDoc(submissionRef);
      console.log("Submission document exists:", submissionSnap.exists());
      if (!submissionSnap.exists()) {
        toast.error("No such submission found!");
        setLoading(false);
        return;
      }
      const data = submissionSnap.data();
      console.log("Fetched submission data:", data);
      setAnswers(data.answers || []);
      setTimestamp(data.timestamp ? data.timestamp.toDate() : null);
      
      // Combined submission: there is no top-level actId.
      // Instead, extract unique actIds from each answer.
      if (data.answers && data.answers.length > 0) {
        const actIdSet = new Set();
        data.answers.forEach((answer) => {
          if (answer.actId) {
            actIdSet.add(answer.actId);
          }
        });
        const actIds = Array.from(actIdSet);
        console.log("Unique actIds from answers:", actIds);
        
        // Fetch act details for each actId to get act names.
        const actNamesFetched = await Promise.all(
          actIds.map(async (actId) => {
            try {
              const actRef = doc(db, "acts", actId);
              const actSnap = await getDoc(actRef);
              if (actSnap.exists()) {
                console.log(`Fetched act details for ${actId}:`, actSnap.data());
                return actSnap.data().actName || "Unknown Act";
              } else {
                console.log(`No act found for actId: ${actId}`);
                return "Unknown Act";
              }
            } catch (error) {
              console.error(`Error fetching act ${actId}:`, error);
              return "Unknown Act";
            }
          })
        );
        console.log("Fetched act names:", actNamesFetched);
        setActNames(actNamesFetched);
        
        // Fetch questions for each act and merge into a single mapping.
        await Promise.all(
          actIds.map(async (actId) => {
            await fetchQuestionsForAct(actId);
          })
        );
      } else {
        console.log("No answers found in submission.");
      }
      
      processStatusData(data.answers || []);
    } catch (error) {
      console.error("Error fetching submission:", error);
      toast.error("Error fetching submission.");
    }
    setLoading(false);
  };

  // Fetch questions from the questions subcollection for the given actId.
  const fetchQuestionsForAct = async (actId) => {
    try {
      const questionsRef = collection(db, `acts/${actId}/questions`);
      const questionsSnap = await getDocs(questionsRef);
      let questionsMap = {};
      questionsSnap.forEach((doc) => {
        console.log("Fetched question document:", doc.id, doc.data());
        const qData = doc.data();
        questionsMap[doc.id] = {
          text: qData.text || "No text available",
          registerForm: qData.registerForm || "N/A",
          timeLimit: qData.timeLimit || "N/A",
          risk: qData.risk || "N/A",
          type: qData.type || "N/A",
        };
      });
      console.log(`Questions fetched for act ${actId}:`, questionsMap);
      // Merge with any existing questions.
      setQuestions((prev) => ({ ...prev, ...questionsMap }));
    } catch (error) {
      console.error("Error fetching questions for act", actId, ":", error);
      toast.error("Error fetching questions.");
    }
  };

  // Process answers to create aggregated status data for the pie chart.
  const processStatusData = (answersArray) => {
    const statusCount = answersArray.reduce((acc, { status }) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const formattedData = Object.keys(STATUS_COLORS)
      .map((status) => ({
        name: status,
        value: statusCount[status] || 0,
      }))
      .filter((item) => item.value > 0);
    console.log("Processed status data:", formattedData);
    setStatusData(formattedData);
  };

  const columns = [
    { title: "S.No", key: "sno", render: (_, __, index) => index + 1 },
    {
      title: "Question",
      key: "question",
      render: (_, answer) =>
        questions[answer.questionId]?.text || "Loading..."
    },
    {
      title: "Risk",
      key: "risk",
      render: (_, answer) =>
        questions[answer.questionId]?.risk || "N/A"
    },
    {
      title: "Type",
      key: "type",
      render: (_, answer) =>
        questions[answer.questionId]?.type || "N/A"
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
                <strong>Act Name(s):</strong>{" "}
                {actNames.length > 0 ? actNames.join(", ") : "N/A"}
              </p>
              <p>
                <strong>Submission Timestamp:</strong>{" "}
                {format(timestamp, "MMM d, yyyy, hh:mm:ss a")}
              </p>
            </Card>
          )}
          <div
            className="chart-container"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "300px",
            }}
          >
            <ResponsiveContainer width={300} height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <Table
            dataSource={answers}
            columns={columns}
            rowKey={(record, index) =>
              record.questionId ? record.questionId : index
            }
          />
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default Submissions;
