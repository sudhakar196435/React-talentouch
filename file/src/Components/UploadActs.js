import React, { useState } from "react";
import * as XLSX from "xlsx";
import { collection, addDoc, getDocs, query, where, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { message } from 'antd'; // Importing necessary Ant Design components
import '../Styles/Uploadacts.css';
import AdminNav from "./AdminNav";
import { ToastContainer, toast } from 'react-toastify';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false); // State to handle loading
  const [uploadProgress, setUploadProgress] = useState(0); // State to handle upload percentage

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadProgress(0); // Reset progress when a new file is selected
  };

  const handleUpload = async () => {
    if (!file) {
      message.error("Please select a file first."); // Toast error for missing file
      return;
    }

    setLoading(true); // Show loading spinner
    setUploadProgress(0); // Reset progress on new upload

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const records = XLSX.utils.sheet_to_json(sheet);
      
      const totalRecords = records.length; // Total records to be processed

      try {
        for (let index = 0; index < totalRecords; index++) {
          const record = records[index];
          const actCode = record.Act_Code || "";
          if (!actCode) continue;

          const q = query(collection(db, "acts"), where("actCode", "==", actCode));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
          });

          await addDoc(collection(db, "acts"), {
            actCode,
            actName: record.Act_Name || "",
            enactYear: record.Enact_year || "",
            govType: record.Actby || "",
            state: record.Which_State || "",
            actNature: record.Nat_act || "",
            status: record.Status || "",
            createdAt: new Date(),
          });

          // Update progress percentage after each record
          setUploadProgress(Math.round(((index + 1) / totalRecords) * 100));
        }

        setLoading(false); // Hide loading spinner after completion
        setFile(null); // Reset file input
        toast.success("Data uploaded successfully!"); // Toast success message
      } catch (error) {
        setLoading(false); // Hide loading spinner on error
        console.error("Error uploading data: ", error);
        toast.error("Failed to upload data!"); // Toast error message
      }
    };

    reader.onerror = () => {
      setLoading(false); // Ensure loading is turned off in case of error during file reading
      message.error("Failed to read the file!");
    };

    reader.readAsArrayBuffer(file); // Start reading the file
  };

  return (
    <div>
      <AdminNav />
      <div className="Upload">
        <h1>Upload Excel File</h1>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
          key={file ? file.name : "default"} // Reset file input by changing the key
        />
        <button onClick={handleUpload} disabled={loading}>
          {loading ? `Uploading... ${uploadProgress}%` : "Upload"} {/* Show 'Uploading...' text with percentage */}
        </button>
        <div style={{ marginTop: "10px" }}>
          {loading && (
            <div>
              <progress value={uploadProgress} max={100} style={{ width: "100%" }} />
              <p>{uploadProgress}%</p> {/* Show progress bar */}
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Upload;
