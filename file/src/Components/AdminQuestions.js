import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { Spin } from "antd";
import { collection, doc, getDocs, getDoc, addDoc, deleteDoc, updateDoc } from "firebase/firestore";
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
  const [risk, setRisk] = useState(""); // Default empty for Risk dropdown
  const [type, setType] = useState(""); // Default empty for Type dropdown
  const [section, setSection] = useState(""); // Section input state
  const [editMode, setEditMode] = useState(null); // Track the question being edited
  const [editedText, setEditedText] = useState("");
  const [editedRegisterForm, setEditedRegisterForm] = useState("");
  const [editedTimeLimit, setEditedTimeLimit] = useState("");
  const [editedRisk, setEditedRisk] = useState("");
  const [editedType, setEditedType] = useState("");
  const [editedSection, setEditedSection] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actData, setActData] = useState(null); // Store Act data (Code and Name)

  useEffect(() => {
    const fetchActData = async () => {
      const actRef = doc(db, `acts`, id);  // Assuming act details are stored in 'acts' collection
      const actDoc = await getDoc(actRef);
      if (actDoc.exists()) {
        setActData(actDoc.data());
      } else {
        toast.error("Act not found!");
      }
    };

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

    fetchActData();  // Fetch Act data
    fetchQuestions();  // Fetch Questions
  }, [id]);

  const handleAddQuestion = async () => {
    if (newQuestion.trim() === "") {
      toast.error("Question text cannot be empty!");
      return;
    }

    const questionsRef = collection(db, `acts/${id}/questions`);
    const docRef = await addDoc(questionsRef, { 
      text: newQuestion, 
      registerForm, 
      timeLimit, 
      risk, 
      type,
      section 
    });

    setQuestions([...questions, { id: docRef.id, text: newQuestion, registerForm, timeLimit, risk, type, section }]);
    toast.success("Question added successfully!");
    setNewQuestion("");
    setRegisterForm("");
    setTimeLimit("");
    setRisk("");
    setType("");
    setSection("");
  };

  const handleSaveEdit = async (questionId) => {
    const questionRef = doc(db, `acts/${id}/questions`, questionId);
    await updateDoc(questionRef, { 
      text: editedText, 
      registerForm: editedRegisterForm, 
      timeLimit: editedTimeLimit, 
      risk: editedRisk, 
      type: editedType,
      section: editedSection 
    });

    setQuestions(questions.map((q) => (q.id === questionId ? { ...q, text: editedText, registerForm: editedRegisterForm, timeLimit: editedTimeLimit, risk: editedRisk, type: editedType, section: editedSection } : q)));
    toast.success("Question updated successfully!");
    setEditMode(null);  // Exit edit mode
  };

  const handleCancelEdit = () => {
    setEditMode(null);
    setEditedText("");
    setEditedRegisterForm("");
    setEditedTimeLimit("");
    setEditedRisk("");
    setEditedType("");
    setEditedSection("");
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
        <h1 className="page-title">Manage Questions</h1>
        
        {/* Display Act Code and Name */}
        {actData && (
          <div className="act-details">
            <div className="act-details-container">
              <p><strong>Act Code:</strong> {actData.actCode}</p>
              <p><strong>Act Name:</strong> {actData.actName}</p>
            </div>
          </div>
        )}

        {/* Add Question Section */}
        <div className="add-question-section">
          <label className="input-label">Section:</label>
          <input type="text" value={section} onChange={(e) => setSection(e.target.value)} placeholder="Section" className="input-field" />
          <label className="input-label">Question:</label>
          <input type="text" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="Enter question" className="input-field" />
          <label className="input-label">Register/Form:</label>
          <input type="text" value={registerForm} onChange={(e) => setRegisterForm(e.target.value)} placeholder="Register or Form" className="input-field" />
          <label className="input-label">Risk:</label>
          <select value={risk} onChange={(e) => setRisk(e.target.value)} className="input-field">
            <option value="">Please select risk</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <label className="input-label">Time Limit:</label>
          <input type="text" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} placeholder="Time Limit" className="input-field" />
          <label className="input-label">Type:</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
            <option value="">Please select type</option>
            <option value="Display">Display</option>
            <option value="Licence">Licence</option>
            <option value="Register">Register</option>
            <option value="Remittance">Remittance</option>
            <option value="Return">Return</option>
            <option value="Rule">Rule</option>
            <option value="Activity">Activity</option>
          </select>
          <button onClick={handleAddQuestion} className="add-button">Add Question</button>
        </div>

        {/* Search Section */}
        <div className="search-section">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search questions..." className="search-input" />
        </div>

        {/* Display Questions */}
        {questions.length > 0 ? (
          <table className="questions-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Question</th>
                <th>Register/Form</th>
                <th>Time Limit</th>
                <th>Risk</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id}>
                  <td>{editMode === q.id ? 
                    <input type="text" value={editedSection} onChange={(e) => setEditedSection(e.target.value)} className="edit-field" /> : q.section || "N/A"}</td>
                  <td>{editMode === q.id ? 
                    <input type="text" value={editedText} onChange={(e) => setEditedText(e.target.value)} className="edit-field" /> : q.text}</td>
                  <td>{editMode === q.id ? 
                    <input type="text" value={editedRegisterForm} onChange={(e) => setEditedRegisterForm(e.target.value)} className="edit-field" /> : q.registerForm}</td>
                  <td>{editMode === q.id ? 
                    <input type="text" value={editedTimeLimit} onChange={(e) => setEditedTimeLimit(e.target.value)} className="edit-field" /> : q.timeLimit}</td>
                  <td>{editMode === q.id ? 
                    <select value={editedRisk} onChange={(e) => setEditedRisk(e.target.value)} className="edit-field">
                      <option value="">Select Risk</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select> : q.risk}</td>
                  <td>{editMode === q.id ? 
                    <select value={editedType} onChange={(e) => setEditedType(e.target.value)} className="edit-field">
                      <option value="">Select Type</option>
                      <option value="Display">Display</option>
                      <option value="Licence">Licence</option>
                      <option value="Register">Register</option>
                      <option value="Remittance">Remittance</option>
                      <option value="Return">Return</option>
                      <option value="Rule">Rule</option>
                      <option value="Activity">Activity</option>
                    </select> : q.type}</td>
                  <td>
                    {editMode === q.id ? (
                      <>
                        <button onClick={() => handleSaveEdit(q.id)} className="savebutton">Save</button>
                        <button onClick={handleCancelEdit} className="cancel-button">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditMode(q.id); setEditedText(q.text); setEditedRegisterForm(q.registerForm); setEditedTimeLimit(q.timeLimit); setEditedRisk(q.risk); setEditedType(q.type); setEditedSection(q.section); }} className="edit-button">Edit</button>
                        <button onClick={() => handleDeleteQuestion(q.id)} className="delete-button">Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No questions available</p>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default AdminQuestions;