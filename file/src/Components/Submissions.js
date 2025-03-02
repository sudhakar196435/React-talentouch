import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Spin, Card, Table, Collapse } from "antd";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserNav from "./UserNav";
import "../Styles/Submissions.css";

const { Panel } = Collapse;

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
  // actMapping: { [actId]: actName }
  const [actMapping, setActMapping] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState([]);
  // Track which act's questions have been fetched
  const [fetchedActs, setFetchedActs] = useState({});

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
      const submissionSnap = await getDoc(submissionRef);
      if (!submissionSnap.exists()) {
        toast.error("No such submission found!");
        setLoading(false);
        return;
      }
      const data = submissionSnap.data();
      setAnswers(data.answers || []);
      setTimestamp(data.timestamp ? data.timestamp.toDate() : null);

      if (data.answers && data.answers.length > 0) {
        const actIdSet = new Set();
        data.answers.forEach((answer) => {
          if (answer.actId) {
            actIdSet.add(answer.actId);
          }
        });
        const actIds = Array.from(actIdSet);
        const actMap = {};
        await Promise.all(
          actIds.map(async (actId) => {
            try {
              const actRef = doc(db, "acts", actId);
              const actSnap = await getDoc(actRef);
              if (actSnap.exists()) {
                actMap[actId] = actSnap.data().actName || "Unknown Act";
              } else {
                actMap[actId] = "Unknown Act";
              }
            } catch (error) {
              actMap[actId] = "Unknown Act";
            }
          })
        );
        setActMapping(actMap);
      }

      processStatusData(data.answers || []);
    } catch (error) {
      toast.error("Error fetching submission.");
    }
    setLoading(false);
  };

  const fetchQuestionsForAct = async (actId) => {
    try {
      const questionsRef = collection(db, `acts/${actId}/questions`);
      const questionsSnap = await getDocs(questionsRef);
      let questionsMap = {};
      questionsSnap.forEach((doc) => {
        const qData = doc.data();
        questionsMap[doc.id] = {
          text: qData.text || "No text available",
          registerForm: qData.registerForm || "N/A",
          timeLimit: qData.timeLimit || "N/A",
          risk: qData.risk || "N/A",
          type: qData.type || "N/A",
        };
      });
      setQuestions((prev) => ({ ...prev, ...questionsMap }));
      setFetchedActs((prev) => ({ ...prev, [actId]: true }));
    } catch (error) {
      toast.error("Error fetching questions.");
    }
  };

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
    setStatusData(formattedData);
  };

  // Group answers by actId.
  const groupAnswersByAct = () => {
    const groups = {};
    answers.forEach((ans) => {
      if (!ans.actId) return;
      if (!groups[ans.actId]) groups[ans.actId] = [];
      groups[ans.actId].push(ans);
    });
    return groups;
  };

  const groupedAnswers = groupAnswersByAct();

  const handlePanelChange = (activeKey) => {
    if (!activeKey || (Array.isArray(activeKey) && activeKey.length === 0)) {
      return;
    }
    const actId = Array.isArray(activeKey) ? activeKey[0] : activeKey;
    if (actId && !fetchedActs[actId]) {
      fetchQuestionsForAct(actId);
    }
  };

  const columns = [
    { title: "S.No", key: "sno", render: (_, __, index) => index + 1 },
    {
      title: "Question",
      key: "question",
      render: (_, answer) =>
        questions[answer.questionId]?.text || "Loading...",
    },
    {
      title: "Register/Form",
      key: "registerForm",
      render: (_, answer) =>
        questions[answer.questionId]?.registerForm || "N/A",
    },
    {
      title: "Time Limit",
      key: "timeLimit",
      render: (_, answer) =>
        questions[answer.questionId]?.timeLimit || "N/A",
    },
    {
      title: "Risk",
      key: "risk",
      render: (_, answer) =>
        questions[answer.questionId]?.risk || "N/A",
    },
    {
      title: "Type",
      key: "type",
      render: (_, answer) =>
        questions[answer.questionId]?.type || "N/A",
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
          <Card style={{ marginBottom: "20px" }}>
            <p>
              <strong>Combined Act Name(s):</strong>{" "}
              {Object.values(actMapping).length > 0
                ? Object.values(actMapping).join(", ")
                : "N/A"}
            </p>
            <p>
              <strong>Submission Timestamp:</strong>{" "}
              {timestamp ? format(timestamp, "MMM d, yyyy, hh:mm:ss a") : "N/A"}
            </p>
          </Card>
          <Collapse accordion onChange={handlePanelChange}>
            {Object.entries(groupedAnswers).map(([actId, answersForAct]) => (
              <Panel header={actMapping[actId] || "Unknown Act"} key={actId}>
                <Table
                  dataSource={answersForAct}
                  columns={columns}
                  rowKey={(record, index) =>
                    record.questionId ? record.questionId : index
                  }
                />
              </Panel>
            ))}
          </Collapse>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default Submissions;
