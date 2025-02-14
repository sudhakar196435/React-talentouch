import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // Firestore instance
import { format } from "date-fns"; // Date formatting

const Submissions = () => {
  const { uid, branchId, submissionId } = useParams();
  const [answers, setAnswers] = useState([]);
  const [timestamp, setTimestamp] = useState(null);
  const [questions, setQuestions] = useState({}); // Store questionId -> text mappings

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!uid || !branchId || !submissionId) {
        console.error("Missing UID, branchId, or submissionId in URL.");
        return;
      }

      try {
        // Step 1: Get submission details
        const submissionRef = doc(
          db,
          `users/${uid}/branches/${branchId}/submissions/${submissionId}`
        );
        const docSnap = await getDoc(submissionRef);

        if (!docSnap.exists()) {
          console.log("No such submission!");
          return;
        }

        const data = docSnap.data();
        console.log("Submission Data:", data);

        setAnswers(data.answers || []);
        setTimestamp(data.timestamp?.toDate() || null);

        if (data.actId) {
          fetchQuestionsForAct(data.actId, data.answers || []);
        }
      } catch (error) {
        console.error("Error fetching submission:", error);
      }
    };

    const fetchQuestionsForAct = async (actId, answers) => {
      try {
        // Step 2: Get act document
        const actRef = doc(db, `acts/${actId}`);
        const actSnap = await getDoc(actRef);

        if (!actSnap.exists()) {
          console.log("No such act found!");
          return;
        }

        // Step 3: Fetch questions subcollection under this act
        const questionsRef = collection(db, `acts/${actId}/questions`);
        const querySnapshot = await getDocs(questionsRef);

        let questionsMap = {};
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          questionsMap[doc.id] = data.text || "No text available";
        });

        setQuestions(questionsMap);
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };

    fetchSubmission();
  }, [uid, branchId, submissionId]);

  return (
    <div>
      <h1>Answers in Submission</h1>
      {timestamp && (
        <p>
          <strong>Submission Timestamp:</strong>{" "}
          {format(timestamp, "MMM d, yyyy, hh:mm:ss a")}
        </p>
      )}

      {answers.length === 0 ? (
        <p>No answers found in this submission.</p>
      ) : (
        <ul>
          {answers.map((answer, index) => (
            <li key={index}>
              <p>
                <strong>Question:</strong>{" "}
                {questions[answer.questionId] || "Fetching question..."}
              </p>
              <p>
                <strong>Remarks:</strong> {answer.remarks || "No remarks"}
              </p>
              <p>
                <strong>Status:</strong> {answer.status || "Unknown"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Submissions;
