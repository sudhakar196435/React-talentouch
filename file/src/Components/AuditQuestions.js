import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { Alert, Empty, Result, Button } from "antd";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuditorNav from "./AuditorNav";

const AuditQuestions = () => {
  const { userId, branchId, actId } = useParams(); // Extract IDs from URL
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [actDetails, setActDetails] = useState({});
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(new Map());
  const [remarks, setRemarks] = useState(new Map());
  const [searchQuery, setSearchQuery] = useState("");

  const db = getFirestore();

  // Unique key for saving progress in localStorage
  const storageKey = `auditProgress_${userId}_${branchId}_${actId}`;

  // Load saved progress from localStorage (if any)
  useEffect(() => {
    const savedProgress = localStorage.getItem(storageKey);
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        if (progress.selectedStatus) {
          setSelectedStatus(new Map(progress.selectedStatus));
        }
        if (progress.remarks) {
          setRemarks(new Map(progress.remarks));
        }
      } catch (error) {
        console.error("Error loading saved progress", error);
      }
    }
  }, [storageKey]);

  // Fetch Act Details
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
      console.error("❌ Error:", error);
    }
  }, [actId, db]);

  // Fetch Questions
  const fetchQuestions = useCallback(async () => {
    try {
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
      console.error("❌ Error:", error);
    }
  }, [actId, db]);

  // Check if audit is already submitted
  const checkSubmissionStatus = useCallback(async () => {
    try {
      const branchRef = doc(db, `users/${userId}/branches/${branchId}`);
      const branchSnap = await getDoc(branchRef);
  
      if (!branchSnap.exists()) {
        console.error("Branch not found.");
        return;
      }
  
      const auditFrequency = branchSnap.data().auditFrequency || "1"; // Default to "1" if not set
      const frequencyInMinutes = parseInt(auditFrequency, 10); // Convert string to integer
  
      // Use the submissions collection so previous submissions are preserved
      const submissionsRef = collection(db, `users/${userId}/branches/${branchId}/submissions`);
      const submissionsSnapshot = await getDocs(submissionsRef);
  
      let lastSubmissionTime = null;
  
      submissionsSnapshot.docs.forEach((doc) => {
        if (doc.data().actId === actId) {
          const timestamp = doc.data().timestamp.toDate();
          if (!lastSubmissionTime || timestamp > lastSubmissionTime) {
            lastSubmissionTime = timestamp;
          }
        }
      });
  
      if (lastSubmissionTime) {
        const currentTime = new Date();
        const timeDifference = (currentTime - lastSubmissionTime) / (1000 * 60); // Convert ms to minutes
  
        if (timeDifference < frequencyInMinutes) {
          setAlreadySubmitted(true);
        } else {
          setAlreadySubmitted(false); // Allow submission
        }
      } else {
        setAlreadySubmitted(false); // No previous submission, allow submission
      }
    } catch (error) {
      console.error("❌ Error checking submission status:", error);
    }
  }, [userId, branchId, actId, db]);

  // Handle Status Change
  const handleStatusChange = (questionId, value) => {
    setSelectedStatus(new Map(selectedStatus.set(questionId, value)));
  };

  // Handle Remarks Change
  const handleRemarksChange = (questionId, value) => {
    setRemarks(new Map(remarks.set(questionId, value)));
  };

  // Save Audit Progress to localStorage
  const handleSaveAudit = () => {
    const progress = {
      selectedStatus: Array.from(selectedStatus.entries()),
      remarks: Array.from(remarks.entries()),
    };
    localStorage.setItem(storageKey, JSON.stringify(progress));
    toast.success("Progress saved successfully!");
  };

  // Submit Answers
  const handleSubmitAudit = async () => {
    if (alreadySubmitted) {
      toast.warning("You have already submitted this audit recently. Please wait for the next allowed submission.");
      return;
    }
  
    try {
      // Store each submission separately in the submissions collection
      const submissionsRef = collection(db, `users/${userId}/branches/${branchId}/submissions`);
      const submissionTime = new Date();
      const submissionDocRef = doc(submissionsRef, `${actId}_${submissionTime.getTime()}`);
  
      const submissionData = {
        actId,
        branchId,
        userId,
        timestamp: submissionTime,
        // Only store questionId, status, and remarks to prevent redundancy
        answers: questions.map((question) => ({
          questionId: question.id,
          status: selectedStatus.get(question.id) || "Not Provided",
          remarks: remarks.get(question.id) || "No remarks",
        })),
      };
  
      await setDoc(submissionDocRef, submissionData);
  
      // Clear saved progress
      localStorage.removeItem(storageKey);
  
      setAlreadySubmitted(true);
      setSubmissionSuccess(true);
      toast.success("Audit submitted successfully!");
    } catch (error) {
      console.error("❌ Error submitting audit:", error);
      toast.error("Failed to submit audit.");
    }
  };

  useEffect(() => {
    fetchActDetails();
    fetchQuestions();
    checkSubmissionStatus();
  }, [fetchActDetails, fetchQuestions, checkSubmissionStatus]);

  // Filtered Questions based on search
  const filteredQuestions = questions.filter((q) =>
    q.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

          {/* Show already submitted message */}
          {alreadySubmitted && (
            <Alert
              message="Audit Already Submitted"
              description="You have already submitted the audit for this Act. Changes are not allowed."
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
                          onChange={(e) =>
                            handleStatusChange(question.id, e.target.value)
                          }
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
                          onChange={(e) =>
                            handleRemarksChange(question.id, e.target.value)
                          }
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
                <div className="action-buttons">
                  <button
                    onClick={handleSaveAudit}
                    className="save-audit-button"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleSubmitAudit}
                    className="submit-audit-button"
                  >
                    Submit Audit
                  </button>
                </div>
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
