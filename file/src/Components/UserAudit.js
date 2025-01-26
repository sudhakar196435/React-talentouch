import React, { useState, useEffect } from "react";
import { db } from "../firebase"; // Ensure this is correctly initialized in firebase.js
import { collection, getDocs, doc, setDoc, query, where } from "firebase/firestore";
import { useParams } from "react-router-dom"; // To get the actId from the URL
import UserNav from "./UserNav"; // Import the navigation bar component

import "../Styles/UserAudit.css"; // Import CSS for styling

const UserAudit = () => {
  const { id } = useParams(); // Get actId from URL
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState(new Set()); // To track selected checkboxes

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
    try {
      const user = "2210030009cse@gmail.com"; // Replace with the actual user's email or UID
      const userRef = doc(db, "users", user); // Reference to user's document

      // Check if audit for this act already exists
      const answersRef = collection(userRef, "Answers");
      const auditQuery = query(answersRef, where("actId", "==", id));
      const querySnapshot = await getDocs(auditQuery);

      if (!querySnapshot.empty) {
        // If an audit already exists for this act, don't store duplicate answers
        console.log("Audit already submitted for this act.");
        return;
      }

      // If no existing audit, proceed to submit the answers
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
      const answerDocRef = doc(answersRef); // Create a new document for the answers
      await setDoc(answerDocRef, {
        actId: id,
        answers: answersData,
        timestamp: new Date(),
      });

      console.log("Audit submitted successfully!");

    } catch (error) {
      console.error("Error submitting audit:", error);
    }
  };

  return (
    <div>
      <UserNav />
      <div className="audit-container">
        <h2>Audit Questions for Act</h2>

        <table className="audit-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Select</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((question) => (
              <tr key={question.id}>
                <td>{question.text}</td>
                <td>
                  <input
                    type="checkbox"
                    onChange={() => handleCheckboxChange(question.id)}
                    checked={selectedQuestions.has(question.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={handleSubmitAudit} className="submit-button">Submit Audit</button>
      </div>
    </div>
  );
};

export default UserAudit;
