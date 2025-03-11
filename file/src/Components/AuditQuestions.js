import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import {
  Alert,
  Empty,
  Result,
  Button,
  Breadcrumb,
  Collapse,
  Input,
  DatePicker,
  Select,
  Skeleton,
} from "antd";
import { HomeOutlined, AuditOutlined, BankOutlined } from "@ant-design/icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuditorNav from "./AuditorNav";
import "../Styles/AuditQuestions.css";
import moment from "moment";

const { Panel } = Collapse;
const { Search } = Input;
const { Option } = Select;

const AuditQuestions = () => {
  const { userId, branchId } = useParams();
  const navigate = useNavigate();
  const db = getFirestore();

  const [branchDetails, setBranchDetails] = useState(null);
  const [acts, setActs] = useState([]);
  const [actQuestions, setActQuestions] = useState({}); // { actId: [questions] }
  const [auditResponses, setAuditResponses] = useState({});
  const [combinedAlreadySubmitted, setCombinedAlreadySubmitted] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // For Quarterly and Half Yearly, we store a string; for Monthly and Yearly, separate state.
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [selectedMonth, setSelectedMonth] = useState(moment().month()); // 0-indexed (0 = Jan)
  const [selectedPeriod, setSelectedPeriod] = useState(null); // used for Quarterly/Half-Yearly

  // Key for localStorage
  const storageKey = `auditProgress_${userId}_${branchId}`;

  // Helper to get formatted period string
  const getFormattedPeriod = () => {
    const frequency = branchDetails?.auditFrequency;
    if (frequency === "Monthly") {
      const monthStr = String(selectedMonth + 1).padStart(2, "0");
      return `${selectedYear}-${monthStr}`;
    } else if (frequency === "Yearly") {
      return String(selectedYear);
    } else if (frequency === "Quarterly" && selectedPeriod) {
      return selectedPeriod; // e.g., "2023-Q3"
    } else if (frequency === "Half Yearly" && selectedPeriod) {
      return selectedPeriod; // e.g., "2023-H1"
    }
    return null;
  };

  // Render period picker with future periods disabled
  const renderPeriodPicker = () => {
    const frequency = branchDetails?.auditFrequency;
    if (!frequency) return null;
    const currentYear = moment().year();
    const currentMonth = moment().month();
    const years = [];
    for (let year = currentYear; year >= currentYear - 10; year--) {
      years.push({ label: String(year), value: year });
    }
    if (frequency === "Monthly") {
      const months = moment.months().map((m, idx) => ({ label: m, value: idx }));
      const filteredMonths = selectedYear === currentYear 
        ? months.filter((m) => m.value <= currentMonth)
        : months;
      return (
        <div style={{ display: "flex", gap: "8px" }}>
          <Select style={{ width: 100 }} value={selectedYear} onChange={setSelectedYear}>
            {years.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
            ))}
          </Select>
          <Select style={{ width: 120 }} value={selectedMonth} onChange={setSelectedMonth}>
            {filteredMonths.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
            ))}
          </Select>
        </div>
      );
    } else if (frequency === "Yearly") {
      return (
        <Select style={{ width: 120 }} value={selectedYear} onChange={setSelectedYear}>
          {years.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
          ))}
        </Select>
      );
    } else if (frequency === "Quarterly") {
      const options = [];
      for (let year = currentYear; year >= currentYear - 10; year--) {
        if (year === currentYear) {
          const currentQuarter = Math.ceil((moment().month() + 1) / 3);
          for (let q = 1; q <= currentQuarter; q++) {
            options.push({ label: `${year} - Q${q}`, value: `${year}-Q${q}` });
          }
        } else {
          options.push({ label: `${year} - Q1`, value: `${year}-Q1` });
          options.push({ label: `${year} - Q2`, value: `${year}-Q2` });
          options.push({ label: `${year} - Q3`, value: `${year}-Q3` });
          options.push({ label: `${year} - Q4`, value: `${year}-Q4` });
        }
      }
      const defaultQuarter = `${currentYear}-Q${Math.ceil((moment().month() + 1) / 3)}`;
      return (
        <Select style={{ width: 200 }} value={selectedPeriod || defaultQuarter} onChange={setSelectedPeriod}>
          {options.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
          ))}
        </Select>
      );
    } else if (frequency === "Half Yearly") {
      const options = [];
      for (let year = currentYear; year >= currentYear - 10; year--) {
        if (year === currentYear) {
          const half = currentMonth < 6 ? "H1" : "H2";
          options.push({ label: `${year} - ${half}`, value: `${year}-${half}` });
        } else {
          options.push({ label: `${year} - H1`, value: `${year}-H1` });
          options.push({ label: `${year} - H2`, value: `${year}-H2` });
        }
      }
      const defaultHalf = `${currentYear}-${currentMonth < 6 ? "H1" : "H2"}`;
      return (
        <Select style={{ width: 200 }} value={selectedPeriod || defaultHalf} onChange={setSelectedPeriod}>
          {options.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
          ))}
        </Select>
      );
    }
    return null;
  };

  const fetchBranchAndActs = useCallback(async () => {
    try {
      const branchRef = doc(db, `users/${userId}/branches/${branchId}`);
      const branchSnap = await getDoc(branchRef);
      if (!branchSnap.exists()) {
        toast.error("Branch not found.");
        return;
      }
      const branchData = branchSnap.data();
      setBranchDetails(branchData);
      if (!selectedPeriod) {
        const frequency = branchData.auditFrequency;
        if (frequency === "Quarterly") {
          const currentYear = new Date().getFullYear();
          const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
          setSelectedPeriod(`${currentYear}-Q${currentQuarter}`);
        } else if (frequency === "Half Yearly") {
          const currentYear = new Date().getFullYear();
          const half = new Date().getMonth() < 6 ? "H1" : "H2";
          setSelectedPeriod(`${currentYear}-${half}`);
        }
      }
      const actIds = branchData.acts || [];
      let actsData = [];
      for (const actId of actIds) {
        const actRef = doc(db, `acts/${actId}`);
        const actSnap = await getDoc(actRef);
        if (actSnap.exists()) {
          actsData.push({ id: actId, ...actSnap.data() });
        }
      }
      setActs(actsData);
    } catch (error) {
      toast.error("Error fetching branch or acts.");
      console.error("❌ Error:", error);
    } finally {
      setLoading(false);
    }
  }, [db, userId, branchId, selectedPeriod]);

  useEffect(() => {
    fetchBranchAndActs();
  }, [fetchBranchAndActs]);

  const fetchQuestionsForAct = useCallback(
    async (actId) => {
      try {
        const questionsCollection = collection(db, `acts/${actId}/questions`);
        const questionsSnapshot = await getDocs(questionsCollection);
        let questionsData = [];
        questionsSnapshot.docs.forEach((doc) => {
          questionsData.push({
            id: doc.id,
            text: doc.data().text || "No text available",
            registerForm: doc.data().registerForm || "N/A",
            timeLimit: doc.data().timeLimit || "N/A",
            risk: doc.data().risk || "N/A",
            type: doc.data().type || "N/A",
          });
        });
        setActQuestions((prev) => ({ ...prev, [actId]: questionsData }));
      } catch (error) {
        toast.error("Error fetching questions.");
        console.error("❌ Error:", error);
      }
    },
    [db]
  );

  // Defer fetching questions until panel expansion.
  useEffect(() => {
    // Do not fetch questions immediately.
  }, [acts, fetchQuestionsForAct]);

  useEffect(() => {
    const savedProgress = localStorage.getItem(storageKey);
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setAuditResponses(progress);
      } catch (error) {
        console.error("Error loading saved progress", error);
      }
    }
  }, [storageKey]);

  const checkCombinedSubmissionStatus = useCallback(async () => {
    try {
      const auditFrequency = branchDetails?.auditFrequency || "1";
      const frequencyInMinutes = parseInt(auditFrequency, 10);
      const submissionsRef = collection(db, `users/${userId}/branches/${branchId}/submissions`);
      const submissionsSnapshot = await getDocs(submissionsRef);
      let lastSubmissionTime = null;
      submissionsSnapshot.docs.forEach((doc) => {
        if (doc.data().isCombinedSubmission) {
          const timestamp = doc.data().timestamp.toDate();
          if (!lastSubmissionTime || timestamp > lastSubmissionTime) {
            lastSubmissionTime = timestamp;
          }
        }
      });
      if (lastSubmissionTime) {
        const currentTime = new Date();
        const timeDifference = (currentTime - lastSubmissionTime) / (1000 * 60);
        setCombinedAlreadySubmitted(timeDifference < frequencyInMinutes);
      } else {
        setCombinedAlreadySubmitted(false);
      }
    } catch (error) {
      console.error("❌ Error checking combined submission status:", error);
    }
  }, [db, userId, branchId, branchDetails]);

  useEffect(() => {
    if (branchDetails) {
      checkCombinedSubmissionStatus();
    }
  }, [branchDetails, checkCombinedSubmissionStatus]);

  const handleResponseChange = (actId, questionId, field, value) => {
    setAuditResponses((prev) => {
      const actResponse = prev[actId] || { selectedStatus: {}, remarks: {} };
      actResponse[field] = { ...actResponse[field], [questionId]: value };
      return { ...prev, [actId]: actResponse };
    });
  };

  const handleSaveAudit = () => {
    localStorage.setItem(storageKey, JSON.stringify(auditResponses));
    toast.success("Progress saved successfully!");
  };

  const handleSubmitAudit = async () => {
    const periodStr = getFormattedPeriod();
    if (combinedAlreadySubmitted) {
      toast.warning(
        "You have already submitted this audit for the selected period. Please choose another period or wait for the next allowed submission."
      );
      return;
    }
    let allQuestionsAnswered = true;
    acts.forEach((act) => {
      const questionsForAct = actQuestions[act.id] || [];
      questionsForAct.forEach((question) => {
        const actResponse = auditResponses[act.id];
        if (
          !actResponse ||
          !actResponse.selectedStatus ||
          !actResponse.selectedStatus[question.id] ||
          actResponse.selectedStatus[question.id].trim() === ""
        ) {
          allQuestionsAnswered = false;
        }
      });
    });
    if (!allQuestionsAnswered) {
      toast.error("Please select a status for all questions before submitting.");
      return;
    }
    try {
      let answers = [];
      acts.forEach((act) => {
        const responses = auditResponses[act.id] || { selectedStatus: {}, remarks: {} };
        const questionsForAct = actQuestions[act.id] || [];
        questionsForAct.forEach((question) => {
          answers.push({
            actId: act.id,
            questionId: question.id,
            status: responses.selectedStatus[question.id],
            remarks: responses.remarks[question.id] || "No remarks",
          });
        });
      });
      const submissionsRef = collection(db, `users/${userId}/branches/${branchId}/submissions`);
      const submissionTime = new Date();
      const submissionDocRef = doc(submissionsRef, `combined_${submissionTime.getTime()}`);
      const submissionData = {
        isCombinedSubmission: true,
        branchId,
        userId,
        timestamp: submissionTime,
        period: periodStr,
        answers,
      };
      await setDoc(submissionDocRef, submissionData);
      localStorage.removeItem(storageKey);
      setCombinedAlreadySubmitted(true);
      setSubmissionSuccess(true);
      toast.success("Audit submitted successfully!");
    } catch (error) {
      console.error("❌ Error submitting audit:", error);
      toast.error("Failed to submit audit.");
    }
  };

  const processSubmission = async (submission) => {
    if (!submission || !submission.answers) {
      return;
    }
    processStatusData(submission.answers);
  };

  const mergeAnswersWithQuestions = (actId, answersForAct) => {
    if (!actQuestions[actId]) return answersForAct;
    return answersForAct.map((answer) => {
      const question = actQuestions[actId].find((q) => q.id === answer.questionId);
      return {
        ...answer,
        questionText: question ? question.text : "N/A",
        risk: question ? question.risk : "N/A",
        type: question ? question.type : "N/A",
        registerForm: question ? question.registerForm : "N/A",
        timeLimit: question ? question.timeLimit : "N/A",
      };
    });
  };

  const handlePanelChange = (activeKey) => {
    if (!activeKey || (Array.isArray(activeKey) && activeKey.length === 0)) return;
    const actId = Array.isArray(activeKey) ? activeKey[0] : activeKey;
    if (actId) {
      fetchQuestionsForAct(actId);
    }
  };

  useEffect(() => {
    processSubmission(branchDetails && branchDetails.submission ? branchDetails.submission : null);
  }, []);

  useEffect(() => {
    // Original code did not use company/branch dropdowns.
  }, []);

  const columns = [
    { title: "S.No", key: "sno", render: (_, __, index) => index + 1 },
    {
      title: "Question",
      key: "question",
      render: (_, record) => record.questionText || "Loading...",
    },
    {
      title: "Register/Form",
      key: "registerForm",
      render: (_, record) => record.registerForm || "N/A",
    },
    {
      title: "Time Limit",
      key: "timeLimit",
      render: (_, record) => record.timeLimit || "N/A",
    },
    {
      title: "Risk",
      key: "risk",
      render: (_, record) => record.risk || "N/A",
    },
    {
      title: "Type",
      key: "type",
      render: (_, record) => record.type || "N/A",
    },
    { title: "Status", dataIndex: "status", key: "status" },
    { title: "Remarks", dataIndex: "remarks", key: "remarks" },
  ];

  return (
    <div>
      <AuditorNav />
      <div className="user-audit-wrapper">
        <h1 className="admin-home-title">Audit Questions for All Acts</h1>
        <Breadcrumb style={{ marginBottom: "20px" }}>
          <Breadcrumb.Item href="/AuditorHome">
            <HomeOutlined /> Home
          </Breadcrumb.Item>
          <Breadcrumb.Item href="/auditorviewacts">
            <BankOutlined /> Assigned Branches
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <AuditOutlined /> Audit
          </Breadcrumb.Item>
        </Breadcrumb>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ marginRight: "8px", fontWeight: "bold" }}>Select Period:</label>
          {renderPeriodPicker()}
        </div>
        {loading ? (
          <Skeleton active className="skeleton-loader" />
        ) : !branchDetails ? (
          <div>Branch details not available</div>
        ) : acts.length === 0 ? (
          <Empty description="No acts available" className="empty-state" />
        ) : (
          <Collapse accordion onChange={handlePanelChange}>
            {acts.map((act) => (
              <Panel header={`${act.actCode} - ${act.actName}`} key={act.id}>
                <div className="act-panel">
                  <div className="act-details-container">
                    <p>
                      <strong>Act Code:</strong> {act.actCode || "N/A"}
                    </p>
                    <p>
                      <strong>Act Name:</strong> {act.actName || "N/A"}
                    </p>
                  </div>
                  <div className="search-container">
                    <Search placeholder="Search questions..." />
                  </div>
                  <Alert
                    message="Audit Already Submitted"
                    description="You have already submitted this audit. Changes are not allowed."
                    type="warning"
                    showIcon
                    style={{ marginBottom: "16px" }}
                  />
                  {!actQuestions[act.id] || actQuestions[act.id].length === 0 ? (
                    <Empty description="No questions available" className="empty-state" />
                  ) : (
                    <div className="table-container">
                      <table className="acts-table">
                        <thead>
                          <tr>
                            <th>S.No</th>
                            <th>Question</th>
                            <th>Register or Form</th>
                            <th>Time Limit</th>
                            <th>Risk</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mergeAnswersWithQuestions(act.id, branchDetails && branchDetails.submission ? branchDetails.submission.answers : []).map(
                            (record, index) => (
                              <tr key={record.questionId ? record.questionId : index}>
                                <td className="sno-cell">{index + 1}</td>
                                <td>{record.questionText}</td>
                                <td>{record.registerForm}</td>
                                <td>{record.timeLimit}</td>
                                <td>{record.risk}</td>
                                <td>{record.type}</td>
                                <td className="status-cell">{record.status}</td>
                                <td className="status-cell">{record.remarks}</td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Panel>
            ))}
          </Collapse>
        )}
        {!combinedAlreadySubmitted && (
          <div className="action-buttons">
            <Button type="primary" onClick={handleSaveAudit}>
              Save
            </Button>
            <Button type="primary" onClick={handleSubmitAudit}>
              Submit Audit
            </Button>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default AuditQuestions;
