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
            if (entry.actCode && entry.actName && entry.question) {
              const actQuery = query(collection(db, "acts"), where("actCode", "==", entry.actCode));
              const existingActs = await getDocs(actQuery);
  
              let actRef;
              if (existingActs.empty) {
                // Create new act if it doesn't exist
                actRef = await addDoc(collection(db, "acts"), {
                  actCode: entry.actCode,
                  actName: entry.actName,
                });
              } else {
                // Use existing act ID
                actRef = existingActs.docs[0].ref;
              }
  
              const questionData = {
                section: entry.section || "",
                text: entry.question || "",
                registerForm: entry["Register/Form"] || "",
                timeLimit: entry["Time Limit"] || "",
                risk: entry.risk || "",
                type: entry.type || "",
              };
  
              // Check if the question already exists in the act
              const questionsQuery = query(
                collection(db, `acts/${actRef.id}/questions`),
                where("text", "==", questionData.text)
              );
              const existingQuestions = await getDocs(questionsQuery);
  
              if (existingQuestions.empty) {
                // Add the question only if it's unique
                await addDoc(collection(db, `acts/${actRef.id}/questions`), questionData);
                message.success(`New question added to Act ${entry.actCode}`);
              } else {
                message.warning(`Question already exists for Act ${entry.actCode}: ${questionData.text}`);
              }
            }
          }
  
          message.success("Acts and questions processed successfully!");
          window.location.reload();
        } catch (error) {
          console.error("Error uploading acts and questions: ", error);
          message.error("Failed to upload acts and questions.");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };
  
  // This way:
  // - New acts are added if actCode doesn’t exist.
  // - Questions are added to existing acts only if they are unique.
  // - You get a success message for added questions and a warning for duplicates.
  
  // Let me know if you want any adjustments or enhancements! 🚀
  

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
// | actCode | actName            | section | question                    | Register/Form | Time Limit | risk     | type   |
// |---------|--------------------|---------|----------------------------|----------------|-------------|----------|--------|
// | A001    | Environmental Act  | Sec 1   | What is pollution?         | Form A         | 7 days      | High     | MCQ    |
// | A002    | Labor Act          | Sec 2   | What is minimum wage?      | Form B         | 14 days     | Medium   | Text   |

// Save this as an Excel file (.xlsx) and upload it!
