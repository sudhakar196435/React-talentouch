import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import UserNav from "./UserNav";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Styles/UserAuditHistory.css";
import { Spin ,Empty} from 'antd';

const UserAuditHistory = () => {
  const [user, setUser] = useState(null);
  const [audits, setAudits] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Initially true
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

              console.log("Fetched audit:", audit);

              // Fetch act details using actId
              const actDocRef = doc(db, "acts", audit.actId);
              console.log("Fetching act:", actDocRef);
              const actDocSnap = await getDoc(actDocRef);

              if (!actDocSnap.exists()) {
                throw new Error(`Act with ID ${audit.actId} not found`);
              }

              const actName = actDocSnap.data().actName;
              console.log("Act Name:", actName);

              // Prepare to fetch all questions in parallel
              const questionsWithText = [];
              for (const answer of audit.answers) {
                const questionDocRef = doc(
                  db,
                  "acts",
                  audit.actId,
                  "questions",
                  answer.questionId
                );

                try {
                  const questionDocSnap = await getDoc(questionDocRef);
                  if (!questionDocSnap.exists()) {
                    throw new Error(`Question with ID ${answer.questionId} not found`);
                  }

                  questionsWithText.push({
                    questionId: answer.questionId,
                    text: questionDocSnap.data().text,
                    answer: answer.answer,
                  });
                } catch (error) {
                  console.error("Error fetching question:", error.message);
                  toast.error(`Error fetching question: ${error.message}`);
                }
              }

              return {
                ...audit,
                actName,
                questions: questionsWithText,
              };
            })
          );

          setAudits(auditsData);
          setIsLoading(false); // Set loading to false once data is fetched
        } catch (error) {
          console.error("Error fetching audits or questions:", error);
          toast.error("Error fetching audits or questions: " + error.message);
          setIsLoading(false); // Stop loading in case of error
        }
      };

      fetchAudits();
    }
  }, [user]);

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
            {audits.map((audit) => (
              <div key={audit.id} className="audit-history-item">
                <div className="audit-header">

                  <p className="act-name">
                    <strong>Act Name:</strong> {audit.actName}
                  </p>
                </div>
                <p className="submission-date">
                  <strong>Submission Date:</strong>{" "}
                  {audit.timestamp.toDate().toLocaleString()}
                </p>
                <div className="questions-container">
                  <h4>Audit Questions and Answers</h4>
                  <div className="questions">
                    {audit.questions.map((question, index) => (
                      <div key={question.questionId} className="question-item">
                        <p className="question-text">
                          <strong>Question {index + 1}:</strong> {question.text}
                        </p>
                        <p className="answer-text">
                          <strong>Your Answer:</strong> {question.answer ? "Yes" : "No"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default UserAuditHistory;
