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
  Select,Skeleton,
} from "antd";
import { HomeOutlined, AuditOutlined, BankOutlined } from "@ant-design/icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuditorNav from "./AuditorNav";
import "../Styles/AuditQuestions.css";
import moment from "moment";

const { Panel } = Collapse;
const { Search } = Input;

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

  // For Quarterly and Half Yearly, we store a string (selectedPeriod).
  // For Monthly and Yearly, we now use separate state:
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [selectedMonth, setSelectedMonth] = useState(moment().month()); // 0-indexed (0=January)
  const [selectedPeriod, setSelectedPeriod] = useState(null); // used for Quarterly/Half-Yearly

  // Key for localStorage
  const storageKey = `auditProgress_${userId}_${branchId}`;

  // Helper function to get formatted period string based on frequency
  const getFormattedPeriod = () => {
    const frequency = branchDetails?.auditFrequency;
    if (frequency === "Monthly") {
      // Format month as two-digit string
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

  // Fetch branch details and acts
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

      // Set default period for Quarterly/Half-Yearly if not set
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

  // Fetch questions for each act
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

  useEffect(() => {
    if (acts.length > 0) {
      acts.forEach((act) => {
        fetchQuestionsForAct(act.id);
      });
    }
  }, [acts, fetchQuestionsForAct]);

  // Load saved progress
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

  // Check if a submission for the selected period already exists
  const checkCombinedSubmissionStatus = useCallback(async () => {
    try {
      const periodStr = getFormattedPeriod();
      if (!periodStr) {
        setCombinedAlreadySubmitted(false);
        return;
      }
      const submissionsRef = collection(
        db,
        `users/${userId}/branches/${branchId}/submissions`
      );
      const submissionsSnapshot = await getDocs(submissionsRef);
      let submissionFound = false;
      submissionsSnapshot.docs.forEach((doc) => {
        if (
          doc.data().isCombinedSubmission &&
          doc.data().period === periodStr
        ) {
          submissionFound = true;
        }
      });
      setCombinedAlreadySubmitted(submissionFound);
    } catch (error) {
      console.error("❌ Error checking combined submission status:", error);
    }
  }, [db, userId, branchId, selectedPeriod, branchDetails, selectedYear, selectedMonth]);

  useEffect(() => {
    if (branchDetails) {
      checkCombinedSubmissionStatus();
    }
  }, [branchDetails, selectedPeriod, selectedYear, selectedMonth, checkCombinedSubmissionStatus]);

  // Update responses for a question
  const handleResponseChange = (actId, questionId, field, value) => {
    setAuditResponses((prev) => {
      const actResponse = prev[actId] || { selectedStatus: {}, remarks: {} };
      actResponse[field] = { ...actResponse[field], [questionId]: value };
      return { ...prev, [actId]: actResponse };
    });
  };

  // Save progress
  const handleSaveAudit = () => {
    localStorage.setItem(storageKey, JSON.stringify(auditResponses));
    toast.success("Progress saved successfully!");
  };

  // Submit audit responses
  const handleSubmitAudit = async () => {
    const periodStr = getFormattedPeriod();
    if (combinedAlreadySubmitted) {
      toast.warning(
        "You have already submitted this audit for the selected period. Please choose another period or wait for the next allowed submission."
      );
      return;
    }

    // Validate all questions answered
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

      const submissionsRef = collection(
        db,
        `users/${userId}/branches/${branchId}/submissions`
      );
      const submissionTime = new Date();
      const submissionDocRef = doc(
        submissionsRef,
        `combined_${submissionTime.getTime()}`
      );
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

  // Render period picker based on audit frequency using Ant Design's Select components
  const renderPeriodPicker = () => {
    const frequency = branchDetails?.auditFrequency;
    if (!frequency) return null;

    const currentYear = moment().year();
    const years = [];
    for (let year = currentYear; year >= currentYear - 10; year--) {
      years.push({ label: String(year), value: year });
    }

    if (frequency === "Monthly") {
      const currentYear = moment().year();
      const currentMonth = moment().month(); // 0-based index (Jan = 0, Dec = 11)
    
      const months = moment.months().map((m, idx) => ({ label: m, value: idx }));
    
      // Exclude next month if the selected year is the current year
      const filteredMonths =
        selectedYear === currentYear
          ? months.filter((m) => m.value <= currentMonth)
          : months;
    
      return (
        <div style={{ display: "flex", gap: "8px" }}>
          <Select
            style={{ width: 100 }}
            value={selectedYear}
            onChange={(value) => setSelectedYear(value)}
          >
            {years.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
          <Select
            style={{ width: 120 }}
            value={selectedMonth}
            onChange={(value) => setSelectedMonth(value)}
          >
            {filteredMonths.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        </div>
      );
    }
     else if (frequency === "Yearly") {
      return (
        <Select
          style={{ width: 120 }}
          value={selectedYear}
          onChange={(value) => setSelectedYear(value)}
        >
          {years.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>
              {opt.label}
            </Select.Option>
          ))}
        </Select>
      );
    } else if (frequency === "Quarterly") {
      const options = [];
      for (let year = currentYear; year  >= currentYear - 10; year--) {
        options.push({ label: `${year} - Q1`, value: `${year}-Q1` });
        options.push({ label: `${year} - Q2`, value: `${year}-Q2` });
        options.push({ label: `${year} - Q3`, value: `${year}-Q3` });
        options.push({ label: `${year} - Q4`, value: `${year}-Q4` });
      }
      return (
        <Select
          style={{ width: 200 }}
          value={selectedPeriod || `${currentYear}-Q${Math.ceil((moment().month() + 1) / 3)}`}
          onChange={(value) => setSelectedPeriod(value)}
        >
          {options.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>
              {opt.label}
            </Select.Option>
          ))}
        </Select>
      );
    } else if (frequency === "Half Yearly") {
      const options = [];
      for (let year = currentYear; year >= currentYear - 10; year--) {
        options.push({ label: `${year} - H1`, value: `${year}-H1` });
        options.push({ label: `${year} - H2`, value: `${year}-H2` });
      }
      return (
        <Select
          style={{ width: 200 }}
          value={selectedPeriod || `${currentYear}-${moment().month() < 6 ? "H1" : "H2"}`}
          onChange={(value) => setSelectedPeriod(value)}
        >
          {options.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>
              {opt.label}
            </Select.Option>
          ))}
        </Select>
      );
    }
    return null;
  };

  if (submissionSuccess) {
    return (
      <Result
        status="success"
        title="Audit Submitted Successfully!"
        subTitle="Your combined audit responses have been submitted successfully. Thank you!"
        extra={[
          <Button
            type="primary"
            key="view"
            onClick={() => navigate("/auditorsubmissions")}
          >
            View Details
          </Button>,
          <Button key="back" onClick={() => navigate("/AuditorHome")}>
            Back to Home
          </Button>,
        ]}
      />
    );
  }

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
          <Collapse accordion>
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
                  {combinedAlreadySubmitted && (
                   <Alert
                   message="Audit Already Submitted"
                   description="You have already submitted this audit. Changes are not allowed."
                   type="warning"
                   showIcon
                   style={{ marginBottom: "16px" }} // Adjust the value as needed
                 />
                 
                  )}
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
                          {actQuestions[act.id].map((question, index) => (
                            <tr key={question.id}>
                              <td className="sno-cell">{index + 1}</td>
                              <td>{question.text}</td>
                              <td>{question.registerForm}</td>
                              <td>{question.timeLimit}</td>
                              <td>{question.risk}</td>
                              <td>{question.type}</td>
                              <td className="status-cell">
                                <select
                                  value={auditResponses[act.id]?.selectedStatus?.[question.id] || ""}
                                  onChange={(e) =>
                                    handleResponseChange(act.id, question.id, "selectedStatus", e.target.value)
                                  }
                                  disabled={combinedAlreadySubmitted}
                                >
                                  <option value="">Select Status</option>
                                  <option value="Complied">Complied</option>
                                  <option value="Not Complied">Not Complied</option>
                                  <option value="Partial Complied">Partial Complied</option>
                                  <option value="Not Applicable">Not Applicable</option>
                                </select>
                              </td>
                              <td className="status-cell">
                                <textarea
                                  value={auditResponses[act.id]?.remarks?.[question.id] || ""}
                                  onChange={(e) =>
                                    handleResponseChange(act.id, question.id, "remarks", e.target.value)
                                  }
                                  placeholder="Add remarks"
                                  rows={3}
                                  disabled={combinedAlreadySubmitted}
                                />
                              </td>
                            </tr>
                          ))}
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
