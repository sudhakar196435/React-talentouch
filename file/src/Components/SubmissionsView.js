import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Table, Empty, Skeleton, Button, Select, Collapse, Card } from "antd";
import { useNavigate } from "react-router-dom";
import AuditorNav from "./AuditorNav";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { toast, ToastContainer } from "react-toastify";
import { DownloadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import "react-toastify/dist/ReactToastify.css";

const { Option } = Select;
const { Panel } = Collapse;

const STATUS_COLORS = {
  "Complied": "#28a745",
  "Not Complied": "#dc3545",
  "Partial Complied": "#ffc107",
  "Not Applicable": "#007bff",
};

const SubmissionsView = () => {
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [submissionsData, setSubmissionsData] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Processed submission details:
  const [groupedAnswers, setGroupedAnswers] = useState({});
  const [actMapping, setActMapping] = useState({});
  // For each act, store its questions (fetched on panel expansion)
  const [actQuestions, setActQuestions] = useState({});
  // Track which act's questions have been fetched
  const [fetchedActs, setFetchedActs] = useState({});
  const [statusData, setStatusData] = useState([]);

  const navigate = useNavigate();

  // Fetch companies from "users" collection (only those with companyName)
  const fetchCompanies = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const companyList = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((company) => company.companyName);
      setCompanies(companyList);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  // Fetch branches for a given company.
  const fetchBranches = async (companyId) => {
    try {
      const snapshot = await getDocs(collection(db, `users/${companyId}/branches`));
      const branchList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBranches(branchList);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  // Fetch combined submissions for a given company and branch.
  const fetchSubmissions = async (companyId, branchId) => {
    if (!companyId || !branchId) return;
    setLoading(true);
    try {
      const submissionsRef = collection(db, `users/${companyId}/branches/${branchId}/submissions`);
      const snapshot = await getDocs(submissionsRef);
      if (snapshot.empty) {
        setSubmissionsData([]);
      } else {
        const submissionsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort submissions by timestamp descending.
        submissionsList.sort((a, b) => {
          if (a.timestamp && b.timestamp) {
            return b.timestamp.seconds - a.timestamp.seconds;
          }
          return 0;
        });
        setSubmissionsData(submissionsList);
        // Preselect the latest submission.
        setSelectedSubmission(submissionsList[0]);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
    setLoading(false);
  };
  const downloadExcel = () => {
    if (!selectedSubmission || !groupedAnswers) {
      toast.error("No submission data available for download.");
      return;
    }
  
    // Prepare data for export
    const exportData = [];
    Object.keys(groupedAnswers).forEach((actId) => {
      const actName = actMapping[actId] || "Unknown Act";
      const answersWithQuestions = mergeAnswersWithQuestions(actId, groupedAnswers[actId]);
  
      answersWithQuestions.forEach((answer) => {
        exportData.push({
          "Act Name": actName,
          "Question": answer.questionText || "N/A",
          "Register/Form": answer.registerForm || "N/A",
          "Time Limit": answer.timeLimit || "N/A",
          "Risk": answer.risk || "N/A",
          "Type": answer.type || "N/A",
          "Status": answer.status || "N/A",
          "Remarks": answer.remarks || "N/A",
        });
      });
    });
  
    // Convert data to a worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");
  
    // Download the file
    XLSX.writeFile(workbook, `Audit_Submissions_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
  };

  // Process a selected submission: group answers by actId and fetch act details.
  const processSubmission = async (submission) => {
    if (!submission || !submission.answers) {
      setGroupedAnswers({});
      setActMapping({});
      setStatusData([]);
      return;
    }
    const answers = submission.answers;
    const groups = {};
    const actMap = {};
    const actIdSet = new Set();
    answers.forEach((answer) => {
      if (answer.actId) {
        actIdSet.add(answer.actId);
        if (!groups[answer.actId]) groups[answer.actId] = [];
        groups[answer.actId].push(answer);
      }
    });
    await Promise.all(
      Array.from(actIdSet).map(async (actId) => {
        try {
          const actRef = doc(db, "acts", actId);
          const actSnap = await getDoc(actRef);
          actMap[actId] = actSnap.exists() ? actSnap.data().actName || "Unknown Act" : "Unknown Act";
        } catch (error) {
          actMap[actId] = "Unknown Act";
        }
      })
    );
    setGroupedAnswers(groups);
    setActMapping(actMap);
    processStatusData(answers);
  };

  // Compute status data for the pie chart.
  const processStatusData = (answersArray) => {
    const statusCount = answersArray.reduce((acc, { status }) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const formattedData = Object.keys(STATUS_COLORS)
      .map((status) => ({
        name: status,
        value: statusCount[status] || 0,
      }))
      .filter((item) => item.value > 0);
    setStatusData(formattedData);
  };

  // Fetch questions for a given act when its panel is expanded.
  const fetchQuestionsForAct = async (actId) => {
    try {
      const questionsRef = collection(db, `acts/${actId}/questions`);
      const questionsSnap = await getDocs(questionsRef);
      let questionsArray = [];
      questionsSnap.forEach((doc) => {
        questionsArray.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setActQuestions((prev) => ({ ...prev, [actId]: questionsArray }));
      setFetchedActs((prev) => ({ ...prev, [actId]: true }));
    } catch (error) {
      console.error("Error fetching questions for act", actId, error);
    }
  };

  // Merge answers with their corresponding question details.
  const mergeAnswersWithQuestions = (actId, answersForAct) => {
    if (!actQuestions[actId]) return answersForAct;
    return answersForAct.map((answer) => {
      const question = actQuestions[actId].find((q) => q.id === answer.questionId);
      return {
        ...answer,
        questionText: question ? question.text : "N/A",
        risk: question ? question.risk : "N/A",
        type: question ? question.type : "N/A",
        registerForm: question ? question.registerForm : "N/A",
        timeLimit: question ? question.timeLimit : "N/A",
      };
    });
  };

  // When a panel is expanded, fetch questions for that act if not already done.
  const handlePanelChange = (activeKey) => {
    if (!activeKey || (Array.isArray(activeKey) && activeKey.length === 0)) return;
    const actId = Array.isArray(activeKey) ? activeKey[0] : activeKey;
    if (actId && !fetchedActs[actId]) {
      fetchQuestionsForAct(actId);
    }
  };

  // Process submission whenever the selected submission changes.
  React.useEffect(() => {
    processSubmission(selectedSubmission);
  }, [selectedSubmission]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany && selectedBranch) {
      fetchSubmissions(selectedCompany, selectedBranch);
    }
  }, [selectedCompany, selectedBranch]);

  const columns = [
    { title: "S.No", key: "sno", render: (_, __, index) => index + 1 },
    {
      title: "Question",
      key: "question",
      render: (_, record) => record.questionText || "Loading...",
    },
    {
      title: "Register/Form",
      key: "registerForm",
      render: (_, record) => record.registerForm || "N/A",
    },
    {
      title: "Time Limit",
      key: "timeLimit",
      render: (_, record) => record.timeLimit || "N/A",
    },
    {
      title: "Risk",
      key: "risk",
      render: (_, record) => record.risk || "N/A",
    },
    {
      title: "Type",
      key: "type",
      render: (_, record) => record.type || "N/A",
    },
    { title: "Status", dataIndex: "status", key: "status" },
    { title: "Remarks", dataIndex: "remarks", key: "remarks" },
  ];

  return (
    <div>
      <AuditorNav />
      <div className="admin-home-container">
        <h1 className="admin-home-title">Audit Submissions</h1>
        <Select
          placeholder="Select Company"
          style={{ width: 300, marginBottom: 20 }}
          onChange={(value) => {
            setSelectedCompany(value);
            setSelectedBranch(null);
            setSubmissionsData([]);
            setSelectedSubmission(null);
            fetchBranches(value);
          }}
        >
          {companies.map((company) => (
            <Option key={company.id} value={company.id}>
              {company.companyName}
            </Option>
          ))}
        </Select>
        {selectedCompany && (
          <Select
            placeholder="Select Branch"
            style={{ width: 300, marginLeft: 20, marginBottom: 20 }}
            onChange={(value) => {
              setSelectedBranch(value);
              fetchSubmissions(selectedCompany, value);
            }}
          >
            {branches.map((branch) => (
              <Option key={branch.id} value={branch.id}>
                {branch.branchName}
              </Option>
            ))}
          </Select>
        )}
        {loading ? (
          <Skeleton active />
        ) : !submissionsData.length ? (
          <Empty description="No submissions available" />
        ) : (
          <>
            <Select
              placeholder="Select Submission"
              style={{ width: 300, marginBottom: 20 }}
              onChange={(value) => {
                const sub = submissionsData.find((s) => s.id === value);
                setSelectedSubmission(sub);
              }}
              value={selectedSubmission ? selectedSubmission.id : undefined}
            >
              {submissionsData.map((sub) => (
                <Option key={sub.id} value={sub.id}>
                  {sub.timestamp
                    ? new Date(sub.timestamp.seconds * 1000).toLocaleString()
                    : "No Timestamp"}
                </Option>
              ))}
            </Select>
            {selectedSubmission && (
              <>
               {selectedCompany && selectedBranch && (
  <Card style={{ marginBottom: 20, padding: 20 }}>
    <p>
      <strong>Company Name:</strong>{" "}
      {companies.find((c) => c.id === selectedCompany)?.companyName || "N/A"}
    </p>
    <p>
      <strong>Branch Name:</strong>{" "}
      {branches.find((b) => b.id === selectedBranch)?.branchName || "N/A"}
    </p>
    <p>
      <strong>Combined Act Name(s):</strong>{" "}
      {Object.values(actMapping).length > 0
        ? Object.values(actMapping).join(", ")
        : "N/A"}
    </p>
    <p>
      <strong>Submission Timestamp:</strong>{" "}
      {selectedSubmission?.timestamp
        ? new Date(selectedSubmission.timestamp.seconds * 1000).toLocaleString()
        : "N/A"}
    </p>
  </Card>
)}
                <Button type="primary" icon={<DownloadOutlined />} onClick={downloadExcel} style={{ marginBottom: 20 }}>
  Download as Excel
</Button>
                {/* Graph for aggregated status data */}
                <Card style={{ marginBottom: 20 }}>
                  <div
                    className="chart-container"
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "300px",
                    }}
                  >
                    <ResponsiveContainer width={300} height={300}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <Collapse accordion onChange={handlePanelChange}>
                  {Object.entries(groupedAnswers).map(([actId, answersForAct]) => (
                    <Panel header={actMapping[actId] || "Unknown Act"} key={actId}>
                      <Table
                        dataSource={mergeAnswersWithQuestions(actId, answersForAct)}
                        columns={columns}
                        rowKey={(record, index) =>
                          record.questionId ? record.questionId : index
                        }
                        pagination={false}
                      />
                    </Panel>
                  ))}
                </Collapse>
              </>
            )}
          </>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default SubmissionsView;
