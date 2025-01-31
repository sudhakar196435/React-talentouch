import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import UserNav from "./UserNav";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Styles/UserAuditHistory.css";
import { Spin, Empty } from "antd";
import { jsPDF } from "jspdf"; // Import jsPDF

const UserAuditHistory = () => {
  const [user, setUser] = useState(null);
  const [audits, setAudits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      const fetchAudits = async () => {
        try {
          const auditsRef = collection(db, "users", user.uid, "Answers");
          const querySnapshot = await getDocs(auditsRef);
          const auditsData = await Promise.all(
            querySnapshot.docs.map(async (docSnapshot) => {
              const audit = {
                id: docSnapshot.id,
                ...docSnapshot.data(),
              };

              try {
                const actDocRef = doc(db, "acts", audit.actId);
                const actDocSnap = await getDoc(actDocRef);
                audit.actName = actDocSnap.exists() ? actDocSnap.data().actName : "Unknown Act";
              } catch (error) {
                console.error("Error fetching act name:", error);
                audit.actName = "Unknown Act";
              }

              return audit;
            })
          );

          auditsData.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
          setAudits(auditsData);
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching audits:", error);
          toast.error("Error fetching audits: " + error.message);
          setIsLoading(false);
        }
      };

      fetchAudits();
    }
  }, [user]);

  const fetchAuditDetails = async (audit) => {
    try {
      let yesCount = 0;
      let noCount = 0;

      const questionsWithText = await Promise.all(
        audit.answers.map(async (answer) => {
          const questionDocRef = doc(
            db,
            "acts",
            audit.actId,
            "questions",
            answer.questionId
          );
          const questionDocSnap = await getDoc(questionDocRef);
          if (!questionDocSnap.exists()) {
            throw new Error(`Question with ID ${answer.questionId} not found`);
          }

          // Count "Yes" and "No" answers
          if (answer.answer === true) {
            yesCount++;
          } else if (answer.answer === false) {
            noCount++;
          }

          return {
            questionId: answer.questionId,
            text: questionDocSnap.data().text,
            answer: answer.answer,
          };
        })
      );

      setSelectedAudit({
        ...audit,
        questions: questionsWithText,
        yesCount,
        noCount,
      });
    } catch (error) {
      console.error("Error fetching audit details:", error);
      toast.error("Error fetching audit details: " + error.message);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    // Act Name and Submission Date
    doc.text(`Act Name: ${selectedAudit.actName}`, 20, 20);
    doc.text(`Submission Date: ${selectedAudit.timestamp.toDate().toLocaleString()}`, 20, 30);
    
    // Question and Answer Section
    selectedAudit.questions.forEach((question, index) => {
      const yPosition = 40 + index * 20; // Dynamically position the content
      doc.text(`Question ${index + 1}: ${question.text}`, 20, yPosition);
      doc.text(`Answer: ${question.answer ? "Yes" : "No"}`, 20, yPosition + 10);
    });

    // Yes/No Count
    const yPositionForCounts = 40 + selectedAudit.questions.length * 20;
    doc.text(`Yes Count: ${selectedAudit.yesCount}`, 20, yPositionForCounts + 10);
    doc.text(`No Count: ${selectedAudit.noCount}`, 20, yPositionForCounts + 20);

    // Save the PDF
    doc.save(`${selectedAudit.actName}_Audit_${selectedAudit.timestamp.toDate().toLocaleString()}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <UserNav />
      <div className="user-audit-history-wrapper">
        <h1 className="admin-home-title">Submitted Audits</h1>
        {audits.length === 0 ? (
          <Empty description="You have not submitted any audits yet." className="empty-state" />
        ) : (
          <div className="audit-history-container">
            {selectedAudit ? (
              <div className="audit-details">
                <button onClick={() => setSelectedAudit(null)} className="back-button">Back</button>
                <h2>{selectedAudit.actName}</h2>
                <p><strong>Submission Date:</strong> {selectedAudit.timestamp.toDate().toLocaleString()}</p>
                <div className="questions-container">
                  {selectedAudit.questions.map((question, index) => (
                    <div key={question.questionId} className="question-item">
                      <p><strong>Question {index + 1}:</strong> {question.text}</p>
                      <p><strong>Your Answer:</strong> {question.answer ? "Yes" : "No"}</p>
                    </div>
                  ))}
                </div>

                {/* Yes/No Count Section */}
                <div className="count-section">
                  <span className="yes-count">Yes: {selectedAudit.yesCount}</span>
                  <span className="no-count">No: {selectedAudit.noCount}</span>
                </div>

                {/* Generate PDF Button */}
                <button onClick={generatePDF} className="generate-pdf-button">Generate PDF</button>
              </div>
            ) : (
              audits.map((audit) => (
                <div
                  key={audit.id}
                  className="audit-history-item"
                  onClick={() => fetchAuditDetails(audit)}
                >
                  <p><strong>Act Name:</strong> {audit.actName}</p>
                  <p><strong>Submission Date:</strong> {audit.timestamp.toDate().toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default UserAuditHistory;
