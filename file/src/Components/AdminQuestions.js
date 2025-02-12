import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc
} from "firebase/firestore";
import { Alert, Empty, Result, Button } from "antd";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuditorNav from "./AuditorNav";

const AuditQuestions = () => {
  console.log("DEBUG: AuditQuestions component is starting");

  const { userId, branchId, actId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [actDetails, setActDetails] = useState({});
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(new Map());
  const [remarks, setRemarks] = useState(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  // Holds the audit frequency (in minutes) for the current branch
  const [branchAuditFrequency, setBranchAuditFrequency] = useState(null);

  const db = getFirestore();

  // -------------------------------
  // Fetch Branch Details including auditFrequency
  // -------------------------------
  useEffect(() => {
    const fetchBranchDetails = async () => {
      console.log("DEBUG: AuditQuestions component is starting");
      try {
        const branchDocRef = doc(db, `users/${userId}/branches/${branchId}`);
        const branchSnapshot = await getDoc(branchDocRef);
        if (branchSnapshot.exists()) {
          const data = branchSnapshot.data();
          if (data.auditFrequency) {
            const freq = Number(data.auditFrequency);
            setBranchAuditFrequency(freq);
            console.log("Fetched auditFrequency:", freq, "minute(s)");
          } else {
            console.warn("auditFrequency not set on branch document. Defaulting to 1 minute.");
            setBranchAuditFrequency(1);
          }
        }
      } catch (error) {
        console.error("Error fetching branch details:", error);
      }
    };
    if (branchId) {
      fetchBranchDetails();
    }
  }, [db, userId, branchId]);

  // -------------------------------
  // Fetch Act Details
  // -------------------------------
  const fetchActDetails = useCallback(async () => {
    try {
      const actDocRef = doc(db, `acts/${actId}`);
      const actSnapshot = await getDoc(actDocRef);

      if (actSnapshot.exists()) {
        setActDetails(actSnapshot.data());
      } else {
        toast.error("Act details not found.");
      }
    } catch (error) {
      toast.error("Error fetching act details.");
      console.error("Error:", error);
    }
  }, [actId, db]);

  // -------------------------------
  // Fetch Questions
  // -------------------------------
  const fetchQuestions = useCallback(async () => {
    try {
      console.log("DEBUG: AuditQuestions component is starting");
      const questionsCollection = collection(db, `acts/${actId}/questions`);
      const questionsSnapshot = await getDocs(questionsCollection);

      if (questionsSnapshot.empty) {
        toast.warning("No questions found for this act.");
        return;
      }

      let questionData = [];
      questionsSnapshot.docs.forEach((doc) => {
        questionData.push({
          id: doc.id,
          text: doc.data().text || "No text available",
          registerForm: doc.data().registerForm || "N/A",
          timeLimit: doc.data().timeLimit || "N/A",
        });
      });

      setQuestions(questionData);
    } catch (error) {
      toast.error("Error fetching questions.");
      console.error("Error:", error);
    }
  }, [actId, db]);

  // -------------------------------
  // Check Submission Status
  // -------------------------------
  const checkSubmissionStatus = useCallback(async () => {
    try {
      const answersRef = collection(db, `users/${userId}/branches/${branchId}/answers`);
      const markerDocRef = doc(answersRef, `${actId}_submissionMarker`);
      const markerSnapshot = await getDoc(markerDocRef);

      // Use effective frequency: if branchAuditFrequency is null, default to 1 minute.
      const effectiveFreq = branchAuditFrequency || 1;
      const allowedMs = effectiveFreq * 60 * 1000;

      if (markerSnapshot.exists()) {
        const lastSubmissionTimestamp = markerSnapshot.data().timestamp;
        let lastSubmission;
        if (lastSubmissionTimestamp && typeof lastSubmissionTimestamp.toDate === "function") {
          lastSubmission = lastSubmissionTimestamp.toDate();
        } else {
          lastSubmission = new Date(lastSubmissionTimestamp);
        }
        const now = new Date();
        const elapsed = now.getTime() - lastSubmission.getTime();
        console.log("Check Submission Status:");
        console.log("Branch Audit Frequency (min):", effectiveFreq);
        console.log("Last submission:", lastSubmission);
        console.log("Elapsed (ms):", elapsed, "Allowed (ms):", allowedMs);
        if (elapsed < allowedMs) {
          setAlreadySubmitted(true);
        } else {
          setAlreadySubmitted(false);
        }
      } else {
        setAlreadySubmitted(false);
      }
    } catch (error) {
      console.error("Error checking submission status:", error);
    }
  }, [userId, branchId, actId, db, branchAuditFrequency]);

  // -------------------------------
  // Handlers for Status and Remarks changes
  // -------------------------------
  const handleStatusChange = (questionId, value) => {
    setSelectedStatus(new Map(selectedStatus.set(questionId, value)));
  };

  const handleRemarksChange = (questionId, value) => {
    setRemarks(new Map(remarks.set(questionId, value)));
  };

  // -------------------------------
  // Submit Audit
  // -------------------------------
  const handleSubmitAudit = async () => {
    try {
      console.log("DEBUG: AuditQuestions component is starting");
      const answersRef = collection(db, `users/${userId}/branches/${branchId}/answers`);
      const markerDocRef = doc(answersRef, `${actId}_submissionMarker`);
      const markerSnapshot = await getDoc(markerDocRef);
      const now = new Date();

      // Use effective frequency: if branchAuditFrequency is null, default to 1 minute.
      const effectiveFreq = branchAuditFrequency || 1;
      const allowedMs = effectiveFreq * 60 * 1000;

      if (markerSnapshot.exists()) {
        const lastSubmissionTimestamp = markerSnapshot.data().timestamp;
        let lastSubmission;
        if (lastSubmissionTimestamp && typeof lastSubmissionTimestamp.toDate === "function") {
          lastSubmission = lastSubmissionTimestamp.toDate();
        } else {
          lastSubmission = new Date(lastSubmissionTimestamp);
        }
        const elapsed = now.getTime() - lastSubmission.getTime();
        console.log("Attempting submission:");
        console.log("Branch Audit Frequency (min):", effectiveFreq);
        console.log("Elapsed (ms):", elapsed, "Allowed (ms):", allowedMs);
        if (elapsed < allowedMs) {
          toast.warning(
            `Audit already submitted. Next submission allowed after ${new Date(lastSubmission.getTime() + allowedMs).toLocaleTimeString()}`
          );
          return;
        }
      }
      // For each question, add a new answer document so that previous records are preserved.
      for (const question of questions) {
        await addDoc(answersRef, {
          questionText: question.text,
          registerForm: question.registerForm,
          timeLimit: question.timeLimit,
          status: selectedStatus.get(question.id) || "Not Provided",
          remarks: remarks.get(question.id) || "No remarks",
          timestamp: now,
          actId: actId,
          branchId: branchId,
        });
      }
      // Update (or create) the marker document with the current timestamp.
      await setDoc(markerDocRef, { timestamp: now });
      setSubmissionSuccess(true);
      toast.success("Audit submitted successfully for this Act!");
    } catch (error) {
      console.error("Error submitting audit:", error);
      toast.error("Failed to submit audit.");
    }
  };

  // -------------------------------
  // Initial Data Fetch & Periodic Status Check
  // -------------------------------
  useEffect(() => {
    fetchActDetails();
    fetchQuestions();
    checkSubmissionStatus();
    // Re-check every 10 seconds
    const interval = setInterval(() => {
      checkSubmissionStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchActDetails, fetchQuestions, checkSubmissionStatus]);

  // -------------------------------
  // Filter Questions based on search query
  // -------------------------------
  const filteredQuestions = questions.filter((q) =>
    q.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // -------------------------------
  // Render Success Screen if submission is successful
  // -------------------------------
  if (submissionSuccess) {
    return (
      <Result
        status="success"
        title="Audit Submitted Successfully!"
        subTitle="Your answers have been submitted successfully. Thank you for completing the audit."
        extra={[
          <Button type="primary" key="view" onClick={() => navigate("/myaudit")}>
            View Details
          </Button>,
          <Button key="back" onClick={() => navigate("/home")}>
            Back to Home
          </Button>,
        ]}
      />
    );
  }

  // -------------------------------
  // Render the Audit Questions UI
  // -------------------------------
  return (
    <div>
      <AuditorNav />
      <div className="user-audit-wrapper">
        <h1 className="admin-home-title">Audit Questions for Act</h1>
        {/* Display Act Details */}
        <div className="act-details-container">
          <p>
            <strong>Act Code:</strong> {actDetails.actCode || "N/A"}
          </p>
          <p>
            <strong>Act Name:</strong> {actDetails.actName || "N/A"}
          </p>
        </div>
        <div className="audit-content-container">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          {alreadySubmitted && (
            <Alert
              message="Audit Already Submitted"
              description="You have already submitted the audit for this Act within the allowed frequency interval. Please wait before re‑submitting."
              type="warning"
              showIcon
            />
          )}
          {filteredQuestions.length === 0 ? (
            <Empty description="No questions available" className="empty-state" />
          ) : (
            <>
              <table className="audit-questions-table">
                <thead>
                  <tr>
                    <th className="sno-column-header">S.No</th>
                    <th className="question-column-header">Question</th>
                    <th className="question-column-header">Register or Form</th>
                    <th className="question-column-header">Time Limit</th>
                    <th className="status-column-header">Status</th>
                    <th className="remarks-column-header">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((question, index) => (
                    <tr key={question.id}>
                      <td className="sno-cell">{index + 1}</td>
                      <td className="question-text">{question.text}</td>
                      <td className="question-text">{question.registerForm}</td>
                      <td className="question-text">{question.timeLimit}</td>
                      <td className="status-cell">
                        <select
                          value={selectedStatus.get(question.id) || ""}
                          onChange={(e) => handleStatusChange(question.id, e.target.value)}
                          className="status-dropdown"
                          disabled={alreadySubmitted}
                        >
                          <option value="">Select Status</option>
                          <option value="Complied">Complied</option>
                          <option value="Not Complied">Not Complied</option>
                          <option value="Partial Complied">Partial Complied</option>
                          <option value="Not Applicable">Not Applicable</option>
                        </select>
                      </td>
                      <td className="remarks-cell">
                        <textarea
                          value={remarks.get(question.id) || ""}
                          onChange={(e) => handleRemarksChange(question.id, e.target.value)}
                          placeholder="Add remarks"
                          className="remarks-textarea"
                          rows={2}
                          disabled={alreadySubmitted}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!alreadySubmitted && (
                <button onClick={handleSubmitAudit} className="submit-audit-button">
                  Submit Audit
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default AuditQuestions;
