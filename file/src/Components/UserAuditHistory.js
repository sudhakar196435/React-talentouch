import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import UserNav from "./UserNav";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Styles/UserAuditHistory.css";
import { Spin, Empty,Button } from "antd";
import { jsPDF } from "jspdf"; // Import jsPDF
import "jspdf-autotable"; // Import autoTable
import { CheckCircleOutlined, ExclamationCircleOutlined, QuestionCircleOutlined,ArrowLeftOutlined } from '@ant-design/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
const UserAuditHistory = () => {
  const [user, setUser] = useState(null);
  const [audits, setAudits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [statusTotals, setStatusTotals] = useState({
    complied: 0,
    notComplied: 0,
    partialComplied: 0,
    notApplicable: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      const fetchAudits = async () => {
        try {
          const auditsRef = collection(db, "users", user.uid, "Answers");
          const querySnapshot = await getDocs(auditsRef);
          const auditsData = await Promise.all(
            querySnapshot.docs.map(async (docSnapshot) => {
              const audit = {
                id: docSnapshot.id,
                ...docSnapshot.data(),
              };

              try {
                const actDocRef = doc(db, "acts", audit.actId);
                const actDocSnap = await getDoc(actDocRef);
                audit.actName = actDocSnap.exists() ? actDocSnap.data().actName : "Unknown Act";
              } catch (error) {
                console.error("Error fetching act name:", error);
                audit.actName = "Unknown Act";
              }

              return audit;
            })
          );

          auditsData.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
          setAudits(auditsData);
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching audits:", error);
          toast.error("Error fetching audits: " + error.message);
          setIsLoading(false);
        }
      };

      fetchAudits();
    }
  }, [user]);

  const fetchAuditDetails = async (audit) => {
    try {
      const answersWithDetails = await Promise.all(
        audit.answers.map(async (answer) => {
          const questionDocRef = doc(
            db,
            "acts",
            audit.actId,
            "questions",
            answer.questionId
          );
          const questionDocSnap = await getDoc(questionDocRef);
          if (!questionDocSnap.exists()) {
            throw new Error(`Question with ID ${answer.questionId} not found`);
          }

          const questionData = questionDocSnap.data();

          return {
            questionId: answer.questionId,
            remark: answer.remark || "N/A", // Use the remark if available, else default to "N/A"
            status: answer.status || "Not Applicable", // Use the status if available, else default to "Not Applicable"
            text: questionData.text,
          };
        })
      );

      // Calculate the total counts for each status
      const totals = {
        complied: 0,
        notComplied: 0,
        partialComplied: 0,
        notApplicable: 0,
      };

      answersWithDetails.forEach((answer) => {
        switch (answer.status) {
          case "Complied":
            totals.complied += 1;
            break;
          case "Not Complied":
            totals.notComplied += 1;
            break;
          case "Partial Complied":
            totals.partialComplied += 1;
            break;
          case "Not Applicable":
            totals.notApplicable += 1;
            break;
          default:
            break;
        }
      });

      setStatusTotals(totals);

      setSelectedAudit({
        ...audit,
        answers: answersWithDetails,
      });
    } catch (error) {
      console.error("Error fetching audit details:", error);
      toast.error("Error fetching audit details: " + error.message);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    // Act Name and Submission Date
    doc.text(`Act Name: ${selectedAudit.actName}`, 20, 20);
    doc.text(`Submission Date: ${selectedAudit.timestamp.toDate().toLocaleString()}`, 20, 30);

    // Define table headers and data
    const tableHeaders = ['Question', 'Remark', 'Status'];
    const tableData = selectedAudit.answers.map(answer => [
      answer.text,
      answer.remark || 'N/A', // Default to 'N/A' if no remark
      answer.status || 'Not Applicable' // Default to 'Not Applicable' if no status
    ]);

    // Use autoTable to generate a styled table
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 40,  // Start the table after the title section
      theme: 'striped',  // Striped rows for better readability
      headStyles: {
        fillColor: [63, 81, 181],  // Blue header background
        textColor: 255,  // White text in the header
        fontStyle: 'bold',  // Bold header text
      },
      bodyStyles: {
        textColor: 50,  // Dark text for body
      },
      alternateRowStyles: {
        fillColor: [242, 242, 242],  // Light grey for alternate rows
      },
      margin: { top: 40, left: 20, right: 20 },  // Add margins for better layout
    });

    // Save the PDF with a dynamic filename based on the act name and submission date
    doc.save(`${selectedAudit.actName}_Audit_${selectedAudit.timestamp.toDate().toLocaleString()}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <UserNav />
      <div className="user-audit-history-wrapper">
        <h1 className="admin-home-title">Submitted Audits</h1>
        {audits.length === 0 ? (
          <Empty description="You have not submitted any audits yet." className="empty-state" />
        ) : (
          <div className="audit-history-container">
            {selectedAudit ? (
              <div className="audit-details">
              
  <Button onClick={() => setSelectedAudit(null)} icon={<ArrowLeftOutlined />} size="large">
    Back
  </Button>
                <h2>{selectedAudit.actName}</h2>
               


                {/* Display Total Counts for Each Status in a Graph */}
                <div className="status-totals">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
  <ResponsiveContainer width="50%" height={200}>  {/* Adjusted width and height */}
    <BarChart data={[
      { name: "Complied", value: statusTotals.complied },
      { name: "Not Complied", value: statusTotals.notComplied },
      { name: "Partial Complied", value: statusTotals.partialComplied },
      { name: "Not Applicable", value: statusTotals.notApplicable },
    ]}>
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <CartesianGrid strokeDasharray="3 3" />
      <Bar dataKey="value">
        {/* Apply colors based on status */}
        {[
          { name: 'Complied', color: '#28a745' }, // Green
          { name: 'Not Complied', color: '#dc3545' }, // Red
          { name: 'Partial Complied', color: '#ffc107' }, // Yellow
          { name: 'Not Applicable', color: '#007bff' }, // Blue
        ].map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</div>

<div className="total-container">
  <div className="total-item">
    <CheckCircleOutlined className="total-icon" />
    <p className="total-text">
      <strong>Total Questions:</strong> {selectedAudit.answers.length}
    </p>
  </div>
  <div className="total-item">
    <CheckCircleOutlined className="total-icon" />
    <p className="total-text">
      <strong>Complied:</strong> {statusTotals.complied}
    </p>
  </div>
  <div className="total-item">
    <ExclamationCircleOutlined className="total-icon" />
    <p className="total-text">
      <strong>Not Complied:</strong> {statusTotals.notComplied}
    </p>
  </div>
  <div className="total-item">
    <ExclamationCircleOutlined className="total-icon" />
    <p className="total-text">
      <strong>Partial Complied:</strong> {statusTotals.partialComplied}
    </p>
  </div>
 
  <div className="total-item">
    <QuestionCircleOutlined className="total-icon" />
    <p className="total-text">
      <strong>Not Applicable:</strong> {statusTotals.notApplicable}
    </p>
  </div>
</div>


<p className="submission-date">
  
  <strong>Submission Date:</strong> {selectedAudit.timestamp.toDate().toLocaleString()}
  <p><strong>Email:</strong> {user.email}</p>
</p>
                </div>


                {/* Table for displaying answers */}
                <table className="answers-table">
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Status</th>
                      <th>Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAudit.answers.map((answer, index) => (
                      <tr key={answer.questionId}>
                        <td>{answer.text}</td>
                        <td>{answer.status}</td>
                        <td>{answer.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Generate PDF Button */}
                <button onClick={generatePDF} className="generate-pdf-button">Generate PDF</button>
              </div>
            ) : (
             
                <div className="aud">
  {audits.map(audit => (
    <div key={audit.id} className="audit-history-item">
      <div className="audit-content">
        <p><strong>Act Name:</strong> {audit.actName}</p>
        <p><strong>Submission Date:</strong> {audit.timestamp.toDate().toLocaleString()}</p>
      </div>
      <button className="view-btn" onClick={() => fetchAuditDetails(audit)}>
        View
      </button>
    </div>
  ))}
</div>


              
            )}
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default UserAuditHistory;
