import React, { useState, useEffect } from "react";
import { db } from "../firebase"; // Ensure Firebase is correctly initialized
import { Spin } from 'antd';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { useParams } from "react-router-dom";
import AdminNav from "./AdminNav"; // Import your Navbar component
import "../Styles/AdminQuestions.css";

const AdminQuestions = () => {
  const { id } = useParams(); // ID of the act
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState(""); // For adding a single question
  const [editMode, setEditMode] = useState(null); // Tracks the ID of the question being edited
  const [editedText, setEditedText] = useState(""); // Tracks the edited text
  const [searchQuery, setSearchQuery] = useState(""); // State for the search query
  const [filteredQuestions, setFilteredQuestions] = useState([]); // Filtered list of questions
  const [loading, setLoading] = useState(true);

  // Fetch questions from Firestore
  useEffect(() => {
    const fetchQuestions = async () => {
      const questionsRef = collection(db, `acts/${id}/questions`);
      const querySnapshot = await getDocs(questionsRef);
      const fetchedQuestions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setQuestions(fetchedQuestions);
      setFilteredQuestions(fetchedQuestions);
      setLoading(false);
    };

    fetchQuestions();
  }, [id]);

  // Filter questions based on search query
  useEffect(() => {
    if (searchQuery === "") {
      setFilteredQuestions(questions);
    } else {
      const filtered = questions.filter((q) =>
        q.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredQuestions(filtered);
    }
  }, [searchQuery, questions]);

  // Add a new question
  const handleAddQuestion = async () => {
    if (newQuestion.trim() === "") {
      alert("Question text cannot be empty!");
      return;
    }

    const questionsRef = collection(db, `acts/${id}/questions`);
    const docRef = await addDoc(questionsRef, { text: newQuestion });

    setQuestions([...questions, { id: docRef.id, text: newQuestion }]);
    setFilteredQuestions([...filteredQuestions, { id: docRef.id, text: newQuestion }]);
    setNewQuestion(""); // Clear input field
  };

  // Save an edited question
  const handleSaveEdit = async (questionId) => {
    if (editedText.trim() === "") {
      alert("Question text cannot be empty!");
      return;
    }

    const questionRef = doc(db, `acts/${id}/questions`, questionId);
    await updateDoc(questionRef, { text: editedText });

    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, text: editedText } : q
      )
    );

    setFilteredQuestions(
      filteredQuestions.map((q) =>
        q.id === questionId ? { ...q, text: editedText } : q
      )
    );

    setEditMode(null); // Exit edit mode
    setEditedText(""); // Clear edited text
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditMode(null);
    setEditedText("");
  };

  // Remove a question
  const handleDeleteQuestion = async (questionId) => {
    const questionRef = doc(db, `acts/${id}/questions`, questionId);
    await deleteDoc(questionRef);

    setQuestions(questions.filter((q) => q.id !== questionId));
    setFilteredQuestions(filteredQuestions.filter((q) => q.id !== questionId));
  };

  if (loading) return <div className="loading-container">
  <Spin size="large" />
</div>;

  return (
    <div>
    <AdminNav /> {/* Navbar added here */}
    <div className="admin-questions-page">
      <div className="content-container">
        <h1>Manage Questions</h1>

        {/* Search Question */}
        <div className="search-section">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="search-input"
          />
        </div>

        {/* Add New Question */}
        <div className="add-question-section">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Enter your question here"
            className="question-input"
          />
          <button onClick={handleAddQuestion} className="add-question-button">
            Add Question
          </button>
        </div>

        {/* Display Questions */}
        {filteredQuestions.length > 0 ? (
          <table className="questions-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((q) => (
                <tr key={q.id}>
                  <td>
                    {editMode === q.id ? (
                      <input
                        type="text"
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      q.text
                    )}
                  </td>
                  <td>
                    {editMode === q.id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(q.id)}
                          className="save-button"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="cancel-button"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditMode(q.id);
                            setEditedText(q.text);
                          }}
                          className="edit-button"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="delete-button"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No questions match your search.</p>
        )}
      </div>
    </div>
    </div>
  );
};

export default AdminQuestions;
