import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { Table, Skeleton, Alert } from "antd";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserNav from "./UserNav";

const AuditQuestions = () => {
  const { actId } = useParams(); // Get actId from the route
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const questionsCollection = collection(db, `acts/${actId}/questions`);
      const questionsSnapshot = await getDocs(questionsCollection);

      if (questionsSnapshot.empty) {
        throw new Error("No questions found for this act.");
      }

      let questionData = [];
      questionsSnapshot.docs.forEach((doc) => {
        questionData.push({ id: doc.id, text: doc.data().text || "No text available" });
      });

      setQuestions(questionData);
    } catch (error) {
      console.error("❌ Error fetching questions:", error);
      toast.error(error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "Question", dataIndex: "text", key: "text" }, // Display only "text"
  ];

  return (
    <div>
      <UserNav />
      <div className="admin-container">
        <h1 className="admin-home-title">Audit Questions</h1>
        {loading ? (
          <Skeleton active />
        ) : error ? (
          <Alert message={error} type="error" />
        ) : (
          <Table dataSource={questions} columns={columns} rowKey="id" />
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default AuditQuestions;
