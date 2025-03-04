import React, { useState, useEffect } from "react";
import { 
  getAuth, 
  onAuthStateChanged, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Result,Spin } from "antd";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import '../Styles/ChangePassword.css'

const db = getFirestore();

const ChangePassword = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordUpdated, setIsPasswordUpdated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserRole(currentUser.uid);
      } else {
        navigate("/AccessDenied"); // Redirect to login if no user
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const fetchUserRole = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role); // Assuming role is stored in Firestore
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const onFinish = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("User session expired. Please log in again.");
        return;
      }

      // Reauthenticate the user
      const credential = EmailAuthProvider.credential(currentUser.email, values.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Now update the password
      await updatePassword(currentUser, values.newPassword);
      setIsPasswordUpdated(true);
      toast.success("Password updated successfully!");
    } catch (error) {
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        toast.error("Incorrect current password! Please try again.");
      } else if (error.code === "auth/requires-recent-login") {
        toast.error("Please log in again to change your password.");
        navigate("/login"); // Redirect to login
      } else {
        toast.error(error.message);
      }
    }
  };

  const handleNavigate = () => {
    if (userRole === "admin") {
      navigate("/adminsettings");
    } else if (userRole === "user") {
      navigate("/settings");
    } else if (userRole === "auditor") {
      navigate("/AuditorSettings");
    } else {
      navigate("/Subuserprofile"); // Default for normal users
    }
  };

  if (loading) {
    return    <div className="loading-container">
    <Spin size="large" />
  </div>;
  }

  return (
    <div className="pass">
      <Button onClick={() => navigate(-1)} style={{ marginRight: 10 }}>
  Go Back
</Button>

    <Card style={{ maxWidth: 400, margin: "auto", marginTop: "50px", padding: "20px" }}>
      
      <ToastContainer />
      {isPasswordUpdated ? (
        <Result
          status="success"
          title="Password Updated Successfully!"
          subTitle="Your password has been changed successfully. You can continue using your account."
          extra={[
            <Button type="primary" onClick={handleNavigate}>
              Go to Dashboard
            </Button>,
          ]}
        />
      ) : (
        <>
        <h1 className="change-password-title">Change Password</h1>

{user && <p className="change-password-email">📧 {user.email}</p>}

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Current Password"
              name="currentPassword"
              rules={[{ required: true, message: "Please enter your current password!" }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="New Password"
              name="newPassword"
              rules={[{ required: true, message: "Please enter your new password!" }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              rules={[{ required: true, message: "Please confirm your password!" }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Update Password
              </Button>
            </Form.Item>
          </Form>
        </>
      )}
    </Card>
    </div>
  );
};

export default ChangePassword;
