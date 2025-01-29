import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // Ensure this is correctly initialized in firebase.js
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom"; // For navigation
import UserNav from "./UserNav"; // Import the navigation bar component
import { onAuthStateChanged } from "firebase/auth"; // For monitoring auth state
import { ToastContainer, toast } from "react-toastify"; // Correct import for ToastContainer and toast
import "react-toastify/dist/ReactToastify.css"; // Import the CSS for toastify
import '../Styles/UserAudit.css';
import { Empty } from "antd"; // Import Ant Design's Empty component


const UserAudit = () => {
  const { id } = useParams(); // Get actId from URL
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState(new Set()); // To track selected checkboxes
  const [user, setUser] = useState(null); // To store the logged-in user
  const [searchQuery, setSearchQuery] = useState(""); // State for the search query
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
    const fetchQuestions = async () => {
      try {
        const questionsRef = collection(db, `acts/${id}/questions`);
        const querySnapshot = await getDocs(questionsRef);
        const questionsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          text: doc.data().text, // Assuming the question text is stored under 'text'
        }));
        setQuestions(questionsData); // Set questions data in state
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };

    fetchQuestions();
  }, [id]);

  // Handle checkbox selection
  const handleCheckboxChange = (questionId) => {
    const updatedSelection = new Set(selectedQuestions);
    if (updatedSelection.has(questionId)) {
      updatedSelection.delete(questionId); // Uncheck the box
    } else {
      updatedSelection.add(questionId); // Check the box
    }
    setSelectedQuestions(updatedSelection);
  };

  const handleSubmitAudit = async () => {
    if (!user) return; // Ensure there's a user logged in

    try {
      const userRef = doc(db, "users", user.uid); // Reference to user's document

      const answersData = [];
      
      // Collect selected question IDs and their answers (boolean)
      questions.forEach((question) => {
        const answer = selectedQuestions.has(question.id); // true if checked, false if not
        const questionAnswer = {
          questionId: question.id,
          answer: answer, // Boolean answer based on checkbox state
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

      // Show success toast
      toast.success("Audit submitted successfully!");

    } catch (error) {
      // Show error toast
      toast.error("Error submitting audit: " + error.message);
    }
  };

  // Filter questions based on the search query
  const filteredQuestions = questions.filter((question) =>
    question.text.includes(searchQuery) // Case-sensitive search
  );

  return (
    <div>
      <UserNav />
      <div className="user-audit-wrapper">
        <h1 className="admin-home-title">Audit Questions for Act</h1>
        
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
                    <th className="sno-column-header">S.No</th> {/* Serial Number Header */}
                    <th className="question-column-header">Question</th>
                    <th className="checkbox-column-header">Select</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((question, index) => (
                    <tr key={question.id}>
                      <td className="sno-cell">{index + 1}</td> {/* Display serial number */}
                      <td className="question-text">{question.text}</td>
                      <td className="checkbox-cell">
                        <input
                          type="checkbox"
                          onChange={() => handleCheckboxChange(question.id)}
                          checked={selectedQuestions.has(question.id)}
                          className="question-checkbox"
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

      {/* Toast container for showing the toast notifications */}
      <ToastContainer />
    </div>
  );
};

export default UserAudit;
