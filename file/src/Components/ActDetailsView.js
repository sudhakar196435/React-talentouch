import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import "../Styles/View.css";
import AdminNav from "./AdminNav";
import UserNav from "./UserNav";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Spin } from 'antd';
const ActDetailsView = () => {
  const { id } = useParams();
  const [act, setAct] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkUserAuth = useCallback(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      } else {
        fetchUserRole(user.uid);
      }
    });
  }, [navigate]);

  const fetchUserRole = async (uid) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      setUserRole(userSnap.data().role);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkUserAuth();

    const fetchActDetails = async () => {
      try {
        const docRef = doc(db, "acts", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const actData = docSnap.data();

          // Convert Firestore Timestamp to a readable string
          if (actData.createdAt && actData.createdAt.toDate) {
            actData.createdAt = actData.createdAt.toDate().toLocaleString();
          }

          setAct(actData);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching act details:", error);
      }
    };

    fetchActDetails();
  }, [id, checkUserAuth]);

  const handleSave = async () => {
    const docRef = doc(db, "acts", id);
    await updateDoc(docRef, act);
    alert("Act details updated successfully!");
    setIsEditing(false);
  };

  const handleDelete = async () => {
    const docRef = doc(db, "acts", id);
    await deleteDoc(docRef);
    alert("Act deleted successfully!");
    navigate("/admin");
  };

  const handleEditChange = (key, value) => {
    setAct((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="loading-container">
      <Spin size="large" />
    </div>
    );
  }

  // Sort the act entries to ensure consistent order
  const sortedActEntries = Object.entries(act).sort(([keyA], [keyB]) => {
    return keyA.localeCompare(keyB); // Sorting alphabetically by key name
  });

  return (
    <div>
      {userRole === "admin" ? <AdminNav /> : <UserNav />}

      <div className="admin-home-container">
        {act ? (
          <div className="act-details">
            <h2 className="details-title">Details for {act.actName}</h2>

            <div className="details-section">
              <table className="details-table">
                <tbody>
                  {sortedActEntries.map(([key, value]) =>
                    key !== "createdAt" ? ( // Prevent editing of createdAt
                      <tr key={key}>
                        <td>
                          <strong>{key.replace(/([A-Z])/g, " $1").trim()}</strong>
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={value || ""}
                              onChange={(e) => handleEditChange(key, e.target.value)}
                            />
                          ) : (
                            value
                          )}
                        </td>
                      </tr>
                    ) : (
                      <tr key={key}>
                        <td>
                          <strong>{key.replace(/([A-Z])/g, " $1").trim()}</strong>
                        </td>
                        <td>{value}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {userRole === "admin" && (
              <div className="action-buttons">
                {isEditing ? (
                  <>
                    <button className="save-button" onClick={handleSave}>
                      Save
                    </button>
                    <button className="cancel-button" onClick={() => setIsEditing(false)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button className="edit-button" onClick={() => setIsEditing(true)}>
                      Edit
                    </button>
                    <button className="delete-button" onClick={handleDelete}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActDetailsView;
