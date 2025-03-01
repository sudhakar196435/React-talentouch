import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc, addDoc, query, where } from "firebase/firestore";
import { Link } from "react-router-dom";
import { message } from 'antd';
import * as XLSX from 'xlsx';
import '../Styles/Actdetail.css';
import AdminNav from "./AdminNav";

const ActDetailPage = () => {
  const [acts, setActs] = useState([]);

  useEffect(() => {
    const fetchActs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "acts"));
        const actData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setActs(actData);
      } catch (error) {
        console.error("Error fetching acts: ", error);
      }
    };
    fetchActs();
  }, []);

  const deleteAllActs = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete all acts?");
    if (confirmDelete) {
      try {
        const querySnapshot = await getDocs(collection(db, "acts"));
        const deletePromises = querySnapshot.docs.map(docSnapshot => deleteDoc(doc(db, "acts", docSnapshot.id)));
        await Promise.all(deletePromises);
        setActs([]);
        message.success("All acts have been deleted successfully!");
      } catch (error) {
        console.error("Error deleting acts: ", error);
        message.error("Failed to delete acts.");
      }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const parsedData = XLSX.utils.sheet_to_json(sheet);

          for (const entry of parsedData) {
            if (entry.actCode && entry.actName && entry.questions) {
              // Check if act already exists
              const actQuery = query(collection(db, "acts"), where("actCode", "==", entry.actCode));
              const actSnapshot = await getDocs(actQuery);

              if (actSnapshot.empty) {
                const actRef = await addDoc(collection(db, "acts"), {
                  actCode: entry.actCode,
                  actName: entry.actName,
                });

                const questions = entry.questions.split(';').map(q => q.trim());
                const uniqueQuestions = [...new Set(questions)];
                
                const questionPromises = uniqueQuestions.map(async (question) => {
                  await addDoc(collection(db, `acts/${actRef.id}/questions`), { text: question });
                });

                await Promise.all(questionPromises);
              } else {
                const actRef = actSnapshot.docs[0].ref;
                const existingQuestionsSnapshot = await getDocs(collection(db, `acts/${actRef.id}/questions`));
                const existingQuestions = existingQuestionsSnapshot.docs.map(doc => doc.data().text);
                
                const newQuestions = entry.questions.split(';').map(q => q.trim()).filter(q => !existingQuestions.includes(q));
                const uniqueNewQuestions = [...new Set(newQuestions)];

                const questionPromises = uniqueNewQuestions.map(async (question) => {
                  await addDoc(collection(db, `acts/${actRef.id}/questions`), { text: question });
                });

                await Promise.all(questionPromises);
              }
            }
          }

          message.success("Acts and questions uploaded successfully! Duplicates were skipped.");
          window.location.reload();
        } catch (error) {
          console.error("Error uploading acts and questions: ", error);
          message.error("Failed to upload acts and questions.");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div>
      <AdminNav />
      <div className="admin-home-container">
        <div className="act-detail-page">
          <h1 className="page-title">Acts List</h1>
          <div className="action-buttons">
            <button onClick={deleteAllActs} className="delete-all-button">
              Delete All Acts
            </button>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="upload-file-input"
            />
          </div>

          <table className="acts-table">
            <thead>
              <tr>
                <th>Act Code</th>
                <th>Act Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {acts.map((act, index) => (
                <tr key={index}>
                  <td>{act.actCode}</td>
                  <td>{act.actName}</td>
                  <td>
                    <Link to={`/act/${act.id}`} className="view-details-button">
                      View Details
                    </Link>
                    <Link to={`/act/${act.id}/questions`} className="view-questions-button">
                      Manage Questions
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActDetailPage;

// Excel Format Example
// | actCode | actName            | questions                            |
// |---------|--------------------|--------------------------------------|
// | A001    | Environmental Act  | What is pollution?; Types of waste?  |
// | A002    | Labor Act          | What is minimum wage?; Labor rights? |

// Save this as an Excel file (.xlsx) and upload it!