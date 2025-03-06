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
} from "antd";
import { HomeOutlined, AuditOutlined, BankOutlined } from "@ant-design/icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuditorNav from "./AuditorNav";
import "../Styles/AuditQuestions.css";

const { Panel } = Collapse;
const { Search } = Input;

const AuditQuestions = () => {
  const { userId, branchId } = useParams();
  const navigate = useNavigate();
  const db = getFirestore();

  const [branchDetails, setBranchDetails] = useState(null);
  const [acts, setActs] = useState([]);
  const [actQuestions, setActQuestions] = useState({}); // { actId: [questions] }
  // auditResponses: { actId: { selectedStatus: { [questionId]: value }, remarks: { [questionId]: value } } }
  const [auditResponses, setAuditResponses] = useState({});
  const [combinedAlreadySubmitted, setCombinedAlreadySubmitted] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Use one single key for saving progress for all acts
  const storageKey = `auditProgress_${userId}_${branchId}`;

  // Fetch branch details and acts (branch document is expected to have an 'acts' array)
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
  }, [db, userId, branchId]);

  useEffect(() => {
    fetchBranchAndActs();
  }, [fetchBranchAndActs]);

  // Fetch questions for a given act and store in actQuestions
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

  // When acts are loaded, fetch questions for each act.
  useEffect(() => {
    if (acts.length > 0) {
      acts.forEach((act) => {
        fetchQuestionsForAct(act.id);
      });
    }
  }, [acts, fetchQuestionsForAct]);

  // Load saved audit responses (for all acts) from localStorage
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

  // Frequency check for combined submission:
  // Query the submissions collection for any combined submission and compare timestamp
  const checkCombinedSubmissionStatus = useCallback(async () => {
    try {
      // Get frequency (in minutes) from branchDetails (default to 1 if not set)
      const auditFrequency = branchDetails?.auditFrequency || "1";
      const frequencyInMinutes = parseInt(auditFrequency, 10);
      const submissionsRef = collection(
        db,
        `users/${userId}/branches/${branchId}/submissions`
      );
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
        if (timeDifference < frequencyInMinutes) {
          setCombinedAlreadySubmitted(true);
        } else {
          setCombinedAlreadySubmitted(false);
        }
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

  // Update responses for a given act and question.
  // field: "selectedStatus" or "remarks"
  const handleResponseChange = (actId, questionId, field, value) => {
    setAuditResponses((prev) => {
      const actResponse = prev[actId] || { selectedStatus: {}, remarks: {} };
      actResponse[field] = { ...actResponse[field], [questionId]: value };
      return { ...prev, [actId]: actResponse };
    });
  };

  // Save audit progress (for all acts) to localStorage
  const handleSaveAudit = () => {
    localStorage.setItem(storageKey, JSON.stringify(auditResponses));
    toast.success("Progress saved successfully!");
  };

  // Submit combined audit responses for all acts
  const handleSubmitAudit = async () => {
    if (combinedAlreadySubmitted) {
      toast.warning(
        "You have already submitted this audit recently. Please wait for the next allowed submission."
      );
      return;
    }

    // Validate that every question for every act has a selected status
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
      // Combine answers from all acts
      let answers = [];
      acts.forEach((act) => {
        const responses = auditResponses[act.id] || {
          selectedStatus: {},
          remarks: {},
        };
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
        {loading ? (
          <div>Loading...</div>
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
                  {/* (Optional) Search input for questions per act */}
                  <div className="search-container">
                    <Search placeholder="Search questions..." />
                  </div>
                  {combinedAlreadySubmitted && (
                    <Alert
                      message="Audit Already Submitted"
                      description="You have already submitted this audit. Changes are not allowed."
                      type="warning"
                      showIcon
                    />
                  )}
                  {!actQuestions[act.id] || actQuestions[act.id].length === 0 ? (
                    <Empty
                      description="No questions available"
                      className="empty-state"
                    />
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
                                value={
                                  auditResponses[act.id]?.selectedStatus?.[
                                    question.id
                                  ] || ""
                                }
                                onChange={(e) =>
                                  handleResponseChange(
                                    act.id,
                                    question.id,
                                    "selectedStatus",
                                    e.target.value
                                  )
                                }
                                disabled={combinedAlreadySubmitted}
                              >
                                <option value="">Select Status</option>
                                <option value="Complied">Complied</option>
                                <option value="Not Complied">Not Complied</option>
                                <option value="Partial Complied">
                                  Partial Complied
                                </option>
                                <option value="Not Applicable">
                                  Not Applicable
                                </option>
                              </select>
                            </td>
                            <td className="status-cell">
                              <textarea
                                value={
                                  auditResponses[act.id]?.remarks?.[
                                    question.id
                                  ] || ""
                                }
                                onChange={(e) =>
                                  handleResponseChange(
                                    act.id,
                                    question.id,
                                    "remarks",
                                    e.target.value
                                  )
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
            <Button type="primary" onClick={handleSaveAudit}>Save</Button>
            <Button type="primary" onClick={handleSubmitAudit}>Submit Audit</Button>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default AuditQuestions;
