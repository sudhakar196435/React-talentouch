import React, { useState, useEffect } from "react";
import { db } from "../firebase"; // Ensure this is correctly initialized in firebase.js
import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { useParams } from "react-router-dom";
import "../Styles/AddQuestions.css";

const AddQuestions = () => {
  const { id } = useParams(); // ID of the act
  const [questions, setQuestions] = useState([]);
  const [newQuestions, setNewQuestions] = useState([""]); // Initialize with one empty question
  const [loading, setLoading] = useState(true);

  // Fetch questions from Firestore
  useEffect(() => {
    const fetchQuestions = async () => {
      const questionsRef = collection(db, `acts/${id}/questions`);
      const querySnapshot = await getDocs(questionsRef);
      const questionData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setQuestions(questionData);
      setLoading(false);
    };

    fetchQuestions();
  }, [id]);

  // Handle adding new questions to Firestore
  const handleAddQuestions = async () => {
    const questionsRef = collection(db, `acts/${id}/questions`);

    // Add each question
    for (const questionText of newQuestions) {
      if (questionText.trim()) {
        await addDoc(questionsRef, { text: questionText });
      }
    }

    // Fetch updated questions after adding
    const querySnapshot = await getDocs(questionsRef);
    const updatedQuestions = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setQuestions(updatedQuestions);
    setNewQuestions([""]); // Reset input fields
  };

  // Handle deleting a question
  const handleDeleteQuestion = async (questionId) => {
    const questionRef = doc(db, `acts/${id}/questions`, questionId);
    await deleteDoc(questionRef);

    // Update local state
    setQuestions(questions.filter((q) => q.id !== questionId));
  };

  // Handle editing a question
  const handleEditQuestion = async (questionId, newText) => {
    const questionRef = doc(db, `acts/${id}/questions`, questionId);
    await updateDoc(questionRef, { text: newText });

    // Update local state
    setQuestions(
      questions.map((q) => (q.id === questionId ? { ...q, text: newText } : q))
    );
  };

  // Add more input fields for adding multiple questions
  const handleAddInput = () => {
    setNewQuestions([...newQuestions, ""]);
  };

  // Update the question text in the input fields
  const handleInputChange = (index, value) => {
    const updatedQuestions = [...newQuestions];
    updatedQuestions[index] = value;
    setNewQuestions(updatedQuestions);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="add-questions-page">
      <h1>Add Questions for Act</h1>

      {/* Existing Questions */}
      {questions.length > 0 && (
        <table className="questions-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((question) => (
              <tr key={question.id}>
                <td>{question.text}</td>
                <td>
                  <button
                    onClick={() => {
                      const newText = prompt("Edit Question:", question.text);
                      if (newText) handleEditQuestion(question.id, newText);
                    }}
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDeleteQuestion(question.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add New Questions */}
      <h2>Add New Questions</h2>
      {newQuestions.map((q, index) => (
        <div key={index} className="input-group">
          <input
            type="text"
            value={q}
            onChange={(e) => handleInputChange(index, e.target.value)}
            placeholder={`Question ${index + 1}`}
          />
        </div>
      ))}
      <button onClick={handleAddInput}>Add More</button>
      <button onClick={handleAddQuestions}>Submit Questions</button>
    </div>
  );
};

export default AddQuestions;
