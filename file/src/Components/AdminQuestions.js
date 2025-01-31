import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { Spin } from "antd";
import { collection, doc, getDocs, addDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";
import AdminNav from "./AdminNav";
import { ToastContainer, toast } from 'react-toastify';
import "../Styles/AdminQuestions.css";

const AdminQuestions = () => {
  const { id } = useParams();
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [registerForm, setRegisterForm] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [editMode, setEditMode] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [editedRegisterForm, setEditedRegisterForm] = useState("");
  const [editedTimeLimit, setEditedTimeLimit] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      const questionsRef = collection(db, `acts/${id}/questions`);
      const querySnapshot = await getDocs(questionsRef);
      const fetchedQuestions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setQuestions(fetchedQuestions);
      setLoading(false);
    };

    fetchQuestions();
  }, [id]);

  const handleAddQuestion = async () => {
    if (newQuestion.trim() === "") {
      toast.error("Question text cannot be empty!");
      return;
    }

    const questionsRef = collection(db, `acts/${id}/questions`);
    const docRef = await addDoc(questionsRef, { text: newQuestion, registerForm, timeLimit });

    setQuestions([...questions, { id: docRef.id, text: newQuestion, registerForm, timeLimit }]);
    toast.success("Question added successfully!");
    setNewQuestion("");
    setRegisterForm("");
    setTimeLimit("");
  };

  const handleSaveEdit = async (questionId) => {
    const questionRef = doc(db, `acts/${id}/questions`, questionId);
    await updateDoc(questionRef, { text: editedText, registerForm: editedRegisterForm, timeLimit: editedTimeLimit });

    setQuestions(questions.map((q) => (q.id === questionId ? { ...q, text: editedText, registerForm: editedRegisterForm, timeLimit: editedTimeLimit } : q)));
    toast.success("Question updated successfully!");
    setEditMode(null);
  };

  const handleCancelEdit = () => {
    setEditMode(null);
    setEditedText("");
    setEditedRegisterForm("");
    setEditedTimeLimit("");
  };

  const handleDeleteQuestion = async (questionId) => {
    const questionRef = doc(db, `acts/${id}/questions`, questionId);
    await deleteDoc(questionRef);
    setQuestions(questions.filter((q) => q.id !== questionId));
    toast.success("Question deleted successfully!");
  };

  if (loading) return <div className="loading-container"><Spin size="large" /></div>;

  return (
    <div>
      <AdminNav />
      <div className="admin-questions-page">
        <div className="content-container">
        
          <h1 className="page-title">Manage Questions</h1>
          <div className="search-section">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="search-input"
            />
          </div>
          <div className="add-question-section">
            <label className="input-label">
              Question:
              <input 
                type="text" 
                value={newQuestion} 
                onChange={(e) => setNewQuestion(e.target.value)} 
                placeholder="Enter question" 
                className="input-field" 
              />
            </label>

            <label className="input-label">
              Register or Form:
              <input 
                type="text" 
                value={registerForm} 
                onChange={(e) => setRegisterForm(e.target.value)} 
                placeholder="Register or Form" 
                className="input-field" 
              />
            </label>

            <label className="input-label">
              Time Limit:
              <input 
                type="text" 
                value={timeLimit} 
                onChange={(e) => setTimeLimit(e.target.value)} 
                placeholder="Time Limit" 
                className="input-field" 
              />
            </label>

            <button onClick={handleAddQuestion} className="add-button">Add Question</button>
          </div>

          {questions.length > 0 ? (
            <table className="questions-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Register/Form</th>
                  <th>Time Limit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id}>
                    <td>{editMode === q.id ? 
                      <input 
                        type="text" 
                        value={editedText} 
                        onChange={(e) => setEditedText(e.target.value)} 
                        className="edit-field"
                      /> : q.text}
                    </td>
                    <td>{editMode === q.id ? 
                      <input 
                        type="text" 
                        value={editedRegisterForm} 
                        onChange={(e) => setEditedRegisterForm(e.target.value)} 
                        className="edit-field"
                      /> : q.registerForm || "N/A"}
                    </td>
                    <td>{editMode === q.id ? 
                      <input 
                        type="text" 
                        value={editedTimeLimit} 
                        onChange={(e) => setEditedTimeLimit(e.target.value)} 
                        className="edit-field"
                      /> : q.timeLimit || "N/A"}
                    </td>
                    <td>
                      {editMode === q.id ? (
                        <>
                          <button onClick={() => handleSaveEdit(q.id)} className="save-button">Save</button>
                          <button onClick={handleCancelEdit} className="cancel-button">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { 
                            setEditMode(q.id); 
                            setEditedText(q.text); 
                            setEditedRegisterForm(q.registerForm); 
                            setEditedTimeLimit(q.timeLimit); 
                          }} className="edit-button">Edit</button>
                          <button onClick={() => handleDeleteQuestion(q.id)} className="delete-button">Delete</button>
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
      <ToastContainer />
    </div>
  );
};

export default AdminQuestions;
