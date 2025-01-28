import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Ensure firebase is properly initialized
import { collection, getDocs } from "firebase/firestore"; // Remove unused imports
import { onAuthStateChanged } from "firebase/auth"; // For monitoring auth state
import { useNavigate } from "react-router-dom"; // For navigation
import UserNav from "./UserNav"; // Import the navigation bar component
import { ToastContainer, toast } from "react-toastify"; // Correct import for ToastContainer and toast
import "react-toastify/dist/ReactToastify.css"; // Import the CSS for toastify


const UserAuditHistory = () => {
  const [user, setUser] = useState(null); // To store the logged-in user
  const [audits, setAudits] = useState([]); // To store the submitted audits
  const navigate = useNavigate(); // For navigation to login if not logged in

  useEffect(() => {
    // Check if the user is logged in
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser); // Set user if logged in
      } else {
        navigate("/login"); // Redirect to login page if no user
      }
    });

    return () => unsubscribe(); // Clean up the listener on component unmount
  }, [navigate]);

  useEffect(() => {
    if (user) {
      const fetchAudits = async () => {
        try {
          const auditsRef = collection(db, "users", user.uid, "Answers");
          const querySnapshot = await getDocs(auditsRef);
          const auditsData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setAudits(auditsData); // Set audits data in state
        } catch (error) {
          console.error("Error fetching audits:", error);
          toast.error("Error fetching audits: " + error.message);
        }
      };

      fetchAudits();
    }
  }, [user]);

  return (
    <div>
      <UserNav />
      <div className="user-audit-history-wrapper">
        <h1 className="admin-home-title">Submitted Audits</h1>
        {audits.length === 0 ? (
          <p className="no-audits-message">You have not submitted any audits yet.</p>
        ) : (
          <div className="audit-history-container">
            {audits.map((audit) => (
              <div key={audit.id} className="audit-history-item">
                <h3>Audit ID: {audit.id}</h3>
                <p><strong>Act ID:</strong> {audit.actId}</p>
                <p><strong>Submission Date:</strong> {audit.timestamp.toDate().toLocaleString()}</p>
                <h4>Audit Questions and Answers:</h4>
                <ul className="audit-questions-list">
                  {audit.answers.map((answer, index) => (
                    <li key={index}>
                      <p><strong>Question {index + 1}:</strong> {answer.questionText}</p>
                      <p><strong>Your Answer:</strong> {answer.answer ? "Yes" : "No"}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Toast container for showing the toast notifications */}
      <ToastContainer />
    </div>
  );
};

export default UserAuditHistory;
