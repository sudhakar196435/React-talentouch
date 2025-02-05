import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Typography, Spin, message, Card } from "antd";
import "../Styles/CompleteProfile.css";

const { Title } = Typography;

const CompleteProfile = () => {
  const [companyData, setCompanyData] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [noOfBranches, setNoOfBranches] = useState(0);
  const [branches, setBranches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setCompanyData(data);
          setNoOfBranches(data.noOfBranches || 0);
        }
      } catch (error) {
        message.error("Failed to fetch company details");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  const handleCompanyChange = (e) => {
    setCompanyData({ ...companyData, [e.target.name]: e.target.value });
  };

  const handleNoOfBranchesChange = (e) => {
    setNoOfBranches(Number(e.target.value));
  };

  const handleNext = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { ...companyData, noOfBranches });
      
      setCurrentStep(2);
    } catch (error) {
      message.error("Error updating company details");
    }
  };

  const handleBranchChange = (index, field, value) => {
    const updatedBranches = [...branches];
    updatedBranches[index] = { ...updatedBranches[index], [field]: value };
    setBranches(updatedBranches);
  };

  const handleSubmit = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const branchesCollectionRef = collection(db, "users", user.uid, "branches");
      
      for (const branch of branches) {
        await addDoc(branchesCollectionRef, branch);
      }
      
      message.success("Profile and branch details updated successfully!");
      navigate("/home");
    } catch (error) {
      message.error("Error updating profile");
    }
  };

  return (
    <div className="complete-profile-container">
      {loading ? (
        <Spin size="large" />
      ) : (
        <Card className="profile-card" title="Complete Your Profile">
          {currentStep === 1 ? (
            <Form layout="vertical">
              {[
                "companyName",
                "companyAddress",
                "contractEmployees",
                "coordinatorName",
                "directorName",
                "hazardous",
                "hpAndManPower",
                "industryType",
                "licenseNo",
                "licenseValidity",
                "medicalAdvisorName",
                "occupierName",
                "safetyOfficerName",
                "welfareOfficerName",
              ].map((field) => (
                <Form.Item label={field.replace(/([A-Z])/g, " $1").trim()} key={field}>
                  <Input name={field} value={companyData[field] || ""} onChange={handleCompanyChange} />
                </Form.Item>
              ))}
              <Form.Item label="Number of Branches">
                <Input type="number" value={noOfBranches} onChange={handleNoOfBranchesChange} />
              </Form.Item>
              <Button type="primary" onClick={handleNext}>Next</Button>
            </Form>
          ) : (
            <>
              <Title level={2}>Enter Branch Details ({noOfBranches} branches)</Title>
              {Array.from({ length: noOfBranches }).map((_, index) => (
                <Card className="branch-card" title={`Branch ${index + 1}`} key={index}>
                  <Form layout="vertical">
                    <Form.Item label={`Branch ${index + 1} Name`}>
                      <Input onChange={(e) => handleBranchChange(index, "branchName", e.target.value)} />
                    </Form.Item>
                    <Form.Item label={`Branch ${index + 1} Location`}>
                      <Input onChange={(e) => handleBranchChange(index, "location", e.target.value)} />
                    </Form.Item>
                  </Form>
                </Card>
              ))}
              <Button type="primary" onClick={handleSubmit}>Submit</Button>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default CompleteProfile;
