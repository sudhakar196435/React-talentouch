import React, { useState } from "react";
import * as XLSX from "xlsx";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import '../Styles/Uploadacts.css';
import AdminNav from "./AdminNav";

const Upload = () => {
  const [file, setFile] = useState(null);
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const records = XLSX.utils.sheet_to_json(sheet);

      try {
        for (const record of records) {
          await addDoc(collection(db, "acts"), {
            actCode: record.Act_Code || "",
            actName: record.Act_Name || "",
            enactYear: record.Enact_Year || "",
            govType: record.ActBy || "",
            state: record["Which State"] || "",
            actNature: record.Nat_act || "",
            status: record.Status || "",
            createdAt: new Date(),
          });
        }
        alert("Data uploaded successfully!");
      } catch (error) {
        console.error("Error uploading data: ", error);
        alert("Failed to upload data!");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <AdminNav/>
    <div className="Upload">
      <h1>Upload Excel File</h1>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
    </div>
    </div>
  );
};

export default Upload;
