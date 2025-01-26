import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase"; // Adjust the path as necessary
import '../Styles/Actpage.css';
import AdminNav from "./AdminNav";
const Addact = () => {
  const [actCode, setActCode] = useState("");
  const [actName, setActName] = useState("");
  const [details, setDetails] = useState({
 
    status: "",
    section: "",
    compliance: "",
    description: "",
    registerForm: "",
    timeLimit: "",
    remarks: "",
  });

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "acts"), {
        actCode,
        actName,
        details,
        createdAt: new Date(),
      });
      alert("Act added successfully!");
      setActCode("");
      setActName("");
      setDetails({
        
        status: "",
        section: "",
        compliance: "",
        description: "",
        registerForm: "",
        timeLimit: "",
        remarks: "",
      });
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to add act!");
    }
  };

  return (
    <div><AdminNav/>
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <h1>Add Act</h1>
      <form onSubmit={handleSubmit}>
        <table className="act-form-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td><label>Act Code:</label></td>
              <td>
                <input
                  type="text"
                  value={actCode}
                  onChange={(e) => setActCode(e.target.value)}
                  required
                />
              </td>
            </tr>
            <tr>
              <td><label>Act Name:</label></td>
              <td>
                <input
                  type="text"
                  value={actName}
                  onChange={(e) => setActName(e.target.value)}
                  required
                />
              </td>
            </tr>
            <tr>
            </tr>
            <tr>
              <td><label>Status:</label></td>
              <td>
                <input
                  type="text"
                  name="status"
                  value={details.status}
                  onChange={handleDetailChange}
                />
              </td>
            </tr>
            <tr>
              <td><label>Section:</label></td>
              <td>
                <input
                  type="text"
                  name="section"
                  value={details.section}
                  onChange={handleDetailChange}
                />
              </td>
            </tr>
            <tr>
              <td><label>Compliance:</label></td>
              <td>
                <input
                  type="text"
                  name="compliance"
                  value={details.compliance}
                  onChange={handleDetailChange}
                />
              </td>
            </tr>
            <tr>
              <td><label>Description:</label></td>
              <td>
                <textarea
                  name="description"
                  value={details.description}
                  onChange={handleDetailChange}
                  rows="3"
                />
              </td>
            </tr>
            <tr>
              <td><label>Register/Form:</label></td>
              <td>
                <input
                  type="text"
                  name="registerForm"
                  value={details.registerForm}
                  onChange={handleDetailChange}
                />
              </td>
            </tr>
            <tr>
              <td><label>Time Limit:</label></td>
              <td>
                <input
                  type="text"
                  name="timeLimit"
                  value={details.timeLimit}
                  onChange={handleDetailChange}
                />
              </td>
            </tr>
            <tr>
              <td><label>Remarks:</label></td>
              <td>
                <textarea
                  name="remarks"
                  value={details.remarks}
                  onChange={handleDetailChange}
                  rows="3"
                />
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button type="submit" style={{ padding: "10px 20px", fontSize: "16px" }}>
            Add Act
          </button>
        </div>
      </form>
    </div>
    </div>
  );
};

export default Addact;
