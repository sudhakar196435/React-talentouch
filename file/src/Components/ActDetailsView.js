import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import "../Styles/View.css";
import AdminNav from "./AdminNav";
import UserNav from "./UserNav";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const ActDetailsView = () => {
  const { id } = useParams(); // Retrieve the act ID from the URL
  const [act, setAct] = useState(null);
  const [userRole, setUserRole] = useState(null); // State to store the user role
  const [isEditing, setIsEditing] = useState(false); // Track if the component is in "edit mode"
  const [loading, setLoading] = useState(true); // For handling loading state
  const navigate = useNavigate(); // Hook for navigation

  const checkUserAuth = useCallback(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login"); // Redirect to login page if not logged in
      } else {
        fetchUserRole(user.uid); // Fetch user role
      }
    });
  }, [navigate]);

  const fetchUserRole = async (uid) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      setUserRole(userSnap.data().role); // Set user role
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
    
          // Check if createdAt exists and is a Firestore Timestamp
          if (actData.createdAt && actData.createdAt.toDate) {
            actData.createdAt = actData.createdAt.toDate().toLocaleString(); // Convert Firestore Timestamp to a readable string
          } else if (actData.createdAt) {
            // If createdAt is already a string or some other type, use it as is
            actData.createdAt = String(actData.createdAt);
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
    await updateDoc(docRef, act); // Save changes to Firestore
    alert("Act details updated successfully!");
    setIsEditing(false); // Exit "edit mode" after saving
  };

  const handleDelete = async () => {
    const docRef = doc(db, "acts", id);
    await deleteDoc(docRef); // Delete the act from Firestore
    alert("Act deleted successfully!");
    navigate("/admin"); // Redirect to admin page
  };

  const handleEditChange = (key, value) => {
    setAct((prev) => ({ ...prev, [key]: value })); // Update act details in state
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {userRole === "admin" ? <AdminNav /> : <UserNav />} {/* Conditional navigation bar */}
      
      <div className="admin-home-container">
        <div className="act-detail-page">
          {act ? (
            <div className="act-details">
              <h2 className="details-title">Details for {act.actName}</h2>
              <div className="details-section">
                <p>
                  <strong>Act Code:</strong>{" "}
                  {isEditing ? (
                    <input
                      type="text"
                      value={act.actCode || ""}
                      onChange={(e) => handleEditChange("actCode", e.target.value)}
                    />
                  ) : (
                    act.actCode
                  )}
                </p>
                <p>
                  <strong>Act Name:</strong>{" "}
                  {isEditing ? (
                    <input
                      type="text"
                      value={act.actName || ""}
                      onChange={(e) => handleEditChange("actName", e.target.value)}
                    />
                  ) : (
                    act.actName
                  )}
                </p>
                <p>
                  <strong>Created At:</strong> {act.createdAt}
                </p>

                <div className="details-map">
                  <h3>Details</h3>
                  <table className="details-table">
                    <thead>
                      <tr>
                        <th>Key</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {act.details &&
                        Object.entries(act.details).map(([key, value], index) => (
                          <tr key={index}>
                            <td>
                              <strong>{key}</strong>
                            </td>
                            <td>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={value || ""}
                                  onChange={(e) =>
                                    handleEditChange("details", {
                                      ...act.details,
                                      [key]: e.target.value,
                                    })
                                  }
                                />
                              ) : (
                                value
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Admin Action Buttons */}
              {userRole === "admin" && (
                <div className="action-buttons">
                  {isEditing ? (
                    <>
                      <button className="save-button" onClick={handleSave}>
                        Save
                      </button>
                      <button
                        className="cancel-button"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="edit-button"
                        onClick={() => setIsEditing(true)}
                      >
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
    </div>
  );
};

export default ActDetailsView;
