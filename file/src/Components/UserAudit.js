import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Ensure this is correctly initialized in firebase.js
import { collection, getDocs, doc, setDoc, getDoc as getSingleDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom"; // For navigation
import UserNav from "./UserNav"; // Import the navigation bar component
import { onAuthStateChanged } from "firebase/auth"; // For monitoring auth state
import '../Styles/UserAudit.css';
import { Empty } from "antd"; // Import Ant Design's Empty component
import { Result, Button } from 'antd'; // Import Result and Button for success message

const UserAudit = () => {
  const { id } = useParams(); // Get actId from URL
  const [questions, setQuestions] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(new Map()); // To track selected status for each question
  const [remarks, setRemarks] = useState(new Map()); // To track remarks for each question
  const [user, setUser] = useState(null); // To store the logged-in user
  const [searchQuery, setSearchQuery] = useState(""); // State for the search query
  const [submitSuccess, setSubmitSuccess] = useState(false); // State to track submission status
  const [actDetails, setActDetails] = useState({ actCode: "", actName: "" }); // To store act details (code and name)
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
    const fetchActDetails = async () => {
      try {
        // Fetch act details using the actId
        const actRef = doc(db, "acts", id); // Reference to the act document
        const actDoc = await getSingleDoc(actRef); // Fetch the document

        if (actDoc.exists()) {
          const actData = actDoc.data();
          setActDetails({
            actCode: actData.actCode || "", // Default to empty string if not present
            actName: actData.actName || ""  // Default to empty string if not present
          });
        } else {
          console.log("Act not found");
        }
      } catch (error) {
        console.error("Error fetching act details:", error);
      }
    };

    fetchActDetails();
  }, [id]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const questionsRef = collection(db, `acts/${id}/questions`);
        const querySnapshot = await getDocs(questionsRef);
        const questionsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          text: doc.data().text,
          timeLimit: doc.data().timeLimit,
          registerForm: doc.data().registerForm,
        }));
        setQuestions(questionsData); // Set questions data in state
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };

    fetchQuestions();
  }, [id]);

  // Handle status selection change
  const handleStatusChange = (questionId, status) => {
    setSelectedStatus((prevStatus) => new Map(prevStatus).set(questionId, status));
  };

  // Handle remarks change
  const handleRemarksChange = (questionId, remarksText) => {
    setRemarks((prevRemarks) => new Map(prevRemarks).set(questionId, remarksText));
  };

  const handleSubmitAudit = async () => {
    if (!user) return; // Ensure there's a user logged in

    try {
      const userRef = doc(db, "users", user.uid); // Reference to user's document

      const answersData = [];
      
      // Collect selected status and remarks for each question
      questions.forEach((question) => {
        const status = selectedStatus.get(question.id) || ''; // Get selected status
        const remark = remarks.get(question.id) || ''; // Get remarks
        const questionAnswer = {
          questionId: question.id,
          status: status, // Status selected from dropdown
          remark: remark, // Remark text
        };
        answersData.push(questionAnswer);
      });

      // Store the answers in the "Answers" subcollection for the user
      const answersRef = collection(userRef, "Answers");
      const answerDocRef = doc(answersRef); // Create a new document for the answers
      await setDoc(answerDocRef, {
        actId: id,
        answers: answersData,
        timestamp: new Date(),
      });

      // Set success state
      setSubmitSuccess(true);

    } catch (error) {
      // Show error toast
      console.error("Error submitting audit: " + error.message);
    }
  };

  // Filter questions based on the search query
  const filteredQuestions = questions.filter((question) =>
    question.text.includes(searchQuery) // Case-sensitive search
  );

  if (submitSuccess) {
    return (
      <div>
        <UserNav />
        <Result
          status="success"
          title="Audit Submitted Successfully!"
          subTitle="Your answers have been submitted successfully. Thank you for completing the audit."
          extra={[
            <Button type="primary" key="view" onClick={() => navigate("/myaudit")}>
              View Details
            </Button>,
            <Button key="back" onClick={() => navigate("/home")}>Back to Home</Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div>
      <UserNav />
      <div className="user-audit-wrapper">
        <h1 className="admin-home-title">Audit Questions for Act</h1>
        
        {/* Display act code and act name */}
        <div className="act-details-container">
          <p><strong>Act Code:</strong> {actDetails.actCode}</p>
          <p><strong>Act Name:</strong> {actDetails.actName}</p>
        </div>

        <div className="audit-content-container">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} // Handle search input change
              className="search-input"
            />
          </div>
          {filteredQuestions.length === 0 ? (
            <Empty description="No questions available" className="empty-state" />
          ) : (
            <>
              <table className="audit-questions-table">
                <thead>
                  <tr>
                    <th className="sno-column-header">S.No</th>
                    <th className="question-column-header">Question</th>
                    <th className="question-column-header"> Register or Form</th>
                    <th className="question-column-header"> Time Limit</th>
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
                          value={selectedStatus.get(question.id) || ''}
                          onChange={(e) => handleStatusChange(question.id, e.target.value)}
                          className="status-dropdown"
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
                          value={remarks.get(question.id) || ''}
                          onChange={(e) => handleRemarksChange(question.id, e.target.value)}
                          placeholder="Add remarks"
                          className="remarks-textarea"
                          rows={2}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={handleSubmitAudit} className="submit-audit-button">Submit Audit</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAudit;
