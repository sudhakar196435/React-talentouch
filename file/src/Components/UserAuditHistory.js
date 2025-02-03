import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom"; // Add useParams
import UserNav from "./UserNav";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Styles/UserAuditHistory.css";
import { Spin, Empty, Button } from "antd";
import { jsPDF } from "jspdf"; // Import jsPDF
import "jspdf-autotable"; // Import autoTable
import { CheckCircleOutlined, ExclamationCircleOutlined, QuestionCircleOutlined, ArrowLeftOutlined ,DownloadOutlined} from '@ant-design/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import logo from "../Assets/logo.png"; // Import your logo
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
  const { userId } = useParams(); // Get userId from URL params
  
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
    const fetchAudits = async () => {
      try {
        // Use userId from params if available, otherwise use the current user's ID
        const targetUserId = userId || user?.uid;
        if (!targetUserId) return; // Exit if no user ID is available

        const auditsRef = collection(db, "users", targetUserId, "Answers");
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

    if (user || userId) {
      fetchAudits();
    }
  }, [user, userId]); // Add userId to dependency array

  const fetchAuditDetails = async (audit) => {
    try {
      const answersWithDetails = await Promise.all(
        audit.answers.map(async (answer) => {
          // Fetch question details from the acts collection
          const questionDocRef = doc(
            db,
            "acts",
            audit.actId, // Act ID
            "questions",
            answer.questionId // Question ID
          );
          const questionDocSnap = await getDoc(questionDocRef);

          if (!questionDocSnap.exists()) {
            throw new Error(`Question with ID ${answer.questionId} not found`);
          }

          const questionData = questionDocSnap.data();

          return {
            questionId: answer.questionId,
            remark: answer.remark || "N/A",
            status: answer.status || "Not Applicable",
            text: questionData.text || "N/A",
            registerForm: questionData.registerForm || "N/A", // Fetch registerForm
            timeLimit: questionData.timeLimit || "N/A", // Fetch timeLimit
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
  
    // Add Company Logo
    const imgWidth = 50;
    const imgHeight = 15;
    doc.addImage(logo, "PNG", 150, 10, imgWidth, imgHeight);
  
    // Set company name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102); // Dark Blue
    doc.text("Talentouch", 20, 20);
  
    // Add email below company name
    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Email: info@talentouch.com", 20, 28);
  
     // Act Name - Centered with Underline
     doc.setFont("helvetica", "bold");
     doc.setFontSize(18);
     doc.setTextColor(0, 0, 0);
     doc.text(`${selectedAudit.actName}`, 105, 45, { align: "center" });
     doc.setDrawColor(0, 0, 0);
     doc.line(50, 48, 160, 48); // Underline
  
    // Submission Date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Submission Date: ${selectedAudit.timestamp.toDate().toLocaleString()}`,  105, 55, { align: "center" });
  
    // Compliance Summary Data
    const complianceCounts = {
      complied: selectedAudit.answers.filter(a => a.status === "Complied").length,
      notComplied: selectedAudit.answers.filter(a => a.status === "Not Complied").length,
      partialComplied: selectedAudit.answers.filter(a => a.status === "Partial Complied").length,
      notApplicable: selectedAudit.answers.filter(a => a.status === "Not Applicable").length
    };
  
    // Draw a compliance summary box
    doc.setFillColor(255, 248, 245); 
    doc.rect(20, 60, 170, 30, "F"); // This creates a rectangle with no border radius

  
    // Compliance Summary Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 102);
    doc.text("Compliance Summary", 105, 68, { align: "center" });
  
    // Display Compliance Counts
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Complied: ${complianceCounts.complied}`, 30, 78);
    doc.text(`Not Complied: ${complianceCounts.notComplied}`, 80, 78);
    doc.text(`Partial Complied: ${complianceCounts.partialComplied}`, 30, 86);
    doc.text(`Not Applicable: ${complianceCounts.notApplicable}`, 80, 86);
  
    // Table Headers and Data
    const tableHeaders = ['Question', 'Register Form', 'Time Limit', 'Status', 'Remark'];
    const tableData = selectedAudit.answers.map(answer => [
      answer.text,
      answer.registerForm || 'N/A',
      answer.timeLimit || 'N/A',
      answer.status || 'Not Applicable',
      answer.remark || 'N/A',
    ]);
  
    // AutoTable with Styling
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 95,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 128, 128], // Teal
        textColor: 255,
        fontStyle: 'bold',
      },
      bodyStyles: {
        textColor: 50,
      },
      alternateRowStyles: {
        fillColor: [230, 230, 230], // Light Gray
      },
      margin: { top: 60, left: 20, right: 20 },
    });
  
    // Save the PDF with formatted name
    doc.save(`${selectedAudit.actName}_Audit_${selectedAudit.timestamp.toDate().toLocaleString()}.pdf`);
  };
  const [size] = useState('large');

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
                <Button type="primary"icon={<DownloadOutlined />}size={size}onClick={generatePDF}>Generate PDF</Button>
                <h2>{selectedAudit.actName}</h2>

                {/* Display Total Counts for Each Status in a Graph */}
                <div className="status-totals">
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <ResponsiveContainer width="50%" height={200}>
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
                          {[
                            { name: 'Complied', color: '#28a745' },
                            { name: 'Not Complied', color: '#dc3545' },
                            { name: 'Partial Complied', color: '#ffc107' },
                            { name: 'Not Applicable', color: '#007bff' },
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
                    <p><strong>Email:</strong> {user?.email}</p>
                  </p>
                </div>

                {/* Table for displaying answers */}
                <table className="answers-table">
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Register Form</th>
                      <th>Time Limit</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAudit.answers.map((answer, index) => (
                      <tr key={answer.questionId}>
                        <td>{answer.text}</td>
                        <td>{answer.registerForm}</td>
                        <td>{answer.timeLimit}</td>
                        <td>{answer.status}</td>
                        <td>{answer.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Generate PDF Button */}
               

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