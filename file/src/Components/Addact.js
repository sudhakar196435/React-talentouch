import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase"; // Adjust the path as necessary
import '../Styles/Actpage.css';
import AdminNav from "./AdminNav";

const statesOfIndia = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

const Addact = () => {
  const [actCode, setActCode] = useState("");
  const [actName, setActName] = useState("");
  const [govType, setGovType] = useState("Central Government");
  const [state, setState] = useState("");
  const [status, setStatus] = useState("Active");
  const [actNature, setActNature] = useState("Act");
  const [enactYear, setEnactYear] = useState(currentYear);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "acts"), {
        actCode,
        actName,
        govType,
        state: govType === "State Government" ? state : "", 
        status,
        actNature,
        enactYear,
        createdAt: new Date(),
      });
      alert("Act added successfully!");
      setActCode("");
      setActName("");
      setGovType("Central Government");
      setState("");
      setStatus("Active");
      setActNature("Act");
      setEnactYear(currentYear);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to add act!");
    }
  };

  return (
    <div>
      <AdminNav />
      <div className="Add">
        <h1>Add Act</h1>
        <form onSubmit={handleSubmit}>
          <table>
            <tbody>
              <tr>
                <td><label>Act Code:</label></td>
                <td>
                  <input type="text" value={actCode} onChange={(e) => setActCode(e.target.value)} required />
                </td>
              </tr>
              <tr>
                <td><label>Act Name:</label></td>
                <td>
                  <input type="text" value={actName} onChange={(e) => setActName(e.target.value)} required />
                </td>
              </tr>
              <tr>
                <td><label>Government Type:</label></td>
                <td>
                  <select value={govType} onChange={(e) => setGovType(e.target.value)}>
                    <option value="Central Government">Central Government</option>
                    <option value="State Government">State Government</option>
                  </select>
                </td>
              </tr>
              {govType === "State Government" && (
                <tr>
                  <td><label>Select State:</label></td>
                  <td>
                    <select value={state} onChange={(e) => setState(e.target.value)}>
                      <option value="">Select State</option>
                      {statesOfIndia.map((state, index) => (
                        <option key={index} value={state}>{state}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              )}
              <tr>
                <td><label>Status:</label></td>
                <td>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td><label>Act Nature:</label></td>
                <td>
                  <select value={actNature} onChange={(e) => setActNature(e.target.value)}>
                    <option value="Act">Act</option>
                    <option value="Rule">Rule</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td><label>Enact Year:</label></td>
                <td>
                  <select value={enactYear} onChange={(e) => setEnactYear(e.target.value)}>
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
          <div>
            <button className="bn"type="submit">Add Act</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Addact;
