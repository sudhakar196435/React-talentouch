import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase"; // Import Firestore
import { format } from "date-fns"; // Import for formatting timestamps

const Submissions = () => {
  const { uid, branchId, submissionId } = useParams(); // Get params from URL
  const [answers, setAnswers] = useState([]);
  const [timestamp, setTimestamp] = useState(null); // Store submission timestamp

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!uid || !branchId || !submissionId) {
        console.error("Missing UID, branchId, or submissionId in URL.");
        return;
      }

      try {
        const submissionRef = doc(
          db,
          `users/${uid}/branches/${branchId}/submissions/${submissionId}`
        );

        const docSnap = await getDoc(submissionRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Submission Data:", data);

          setAnswers(data.answers || []); // Use 'answers' array
          setTimestamp(data.timestamp?.toDate() || null); // Convert Firestore timestamp
        } else {
          console.log("No such submission!");
        }
      } catch (error) {
        console.error("Error fetching submission:", error);
      }
    };

    fetchSubmission();
  }, [uid, branchId, submissionId]);

  return (
    <div>
      <h1>Submissions</h1>
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
              <p><strong>Question ID:</strong> {answer.questionId || "No Question ID"}</p>
              <p><strong>Remarks:</strong> {answer.remarks || "No remarks"}</p>
              <p><strong>Status:</strong> {answer.status || "Unknown"}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Submissions;
