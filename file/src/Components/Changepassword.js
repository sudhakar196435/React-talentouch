import React, { useState } from "react";
import { Link } from "react-router-dom"; // Import Link for routing
import "../Styles/ChangePassword.css";
import UserNav from "./UserNav";
import {
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { ToastContainer, toast } from "react-toastify"; // Import ToastContainer and toast
import "react-toastify/dist/ReactToastify.css"; // Import the default toast styles

const Changepassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loading state

  const auth = getAuth();
  const user = auth.currentUser;

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      setSuccess("");
      toast.error("New passwords do not match"); // Show error toast
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setSuccess("");
      toast.error("Password must be at least 6 characters long"); // Show error toast
      return;
    }

    setIsLoading(true); // Start loading
    try {
      const credentials = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credentials); // Reauthenticate user

      await updatePassword(user, newPassword); // Update password
      setSuccess("Password updated successfully!");
      setError("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Show success toast
      toast.success("Password updated successfully!");
    } catch (err) {
      if (err.code === "auth/invalid-credential") {
        setError("Current password is incorrect");
        toast.error("Current password is incorrect"); // Show error toast
      } else {
        setError("Error updating password: " + err.message);
        toast.error("Error updating password: " + err.message); // Show error toast
      }
      setSuccess("");
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <div>
      <UserNav />
      <div className="settings-container">
        <div className="settings-sidebar">
          <ul className="settings-menu">
            <li className="settings-menu-item">
              <Link to="/settings">Profile</Link>
            </li>
            <li className="settings-menu-item active">
              <Link to="/changepassword">Change Password</Link>
            </li>
            <li className="settings-menu-item">
              <Link to="/two-step-verification">Two-Step Verification</Link>
            </li>
            <li className="settings-menu-item">
              <Link to="/privacy-settings">Privacy Settings</Link>
            </li>
            <li className="settings-menu-item">
              <Link to="/login">Logout</Link>
            </li>
          </ul>
        </div>

        <div className="settings-content">
          <div className="pass-content">
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="error1">{error}</p>}
              {success && <p className="success1">{success}</p>}
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Changing Password..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Toast Container for showing toasts */}
      <ToastContainer />
    </div>
  );
};

export default Changepassword;
