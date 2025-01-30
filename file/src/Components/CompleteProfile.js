import React, { useState } from "react";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../Styles/CompleteProfile.css";

const CompleteProfile = () => {
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [hazardous, setHazardous] = useState("");
  const [industryType, setIndustryType] = useState("");
  const [contractEmployees, setContractEmployees] = useState("");
  const [occupierName, setOccupierName] = useState("");
  const [directorName, setDirectorName] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [licenseValidity, setLicenseValidity] = useState("");
  const [hpAndManPower, setHpAndManPower] = useState("");
  const [coordinatorName, setCoordinatorName] = useState("");
  const [safetyOfficerName, setSafetyOfficerName] = useState("");
  const [welfareOfficerName, setWelfareOfficerName] = useState("");
  const [medicalAdvisorName, setMedicalAdvisorName] = useState("");
  const navigate = useNavigate();

  const handleCompleteProfile = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;

    try {
      const userDoc = doc(db, "users", user.uid);
      await updateDoc(userDoc, {
        companyName,
        companyAddress,
        hazardous,
        industryType,
        contractEmployees,
        occupierName,
        directorName,
        licenseNo,
        licenseValidity,
        hpAndManPower,
        coordinatorName,
        safetyOfficerName,
        welfareOfficerName,
        medicalAdvisorName,
        profileCompleted: true, // Mark profile as complete
      });

      navigate("/home"); // Redirect to user home after completing profile
    } catch (err) {
      console.error("Error completing profile: ", err);
    }
  };

  return (
    <div className="complete-profile-container">
      <h2 className="form-title">Complete Your Profile</h2>
      <form className="complete-profile-form" onSubmit={handleCompleteProfile}>
        <div className="form-group">
          <label htmlFor="companyName">Company Name</label>
          <input
            type="text"
            id="companyName"
            placeholder="Enter Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="companyAddress">Company Address</label>
          <input
            type="text"
            id="companyAddress"
            placeholder="Enter Company Address"
            value={companyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
            required
          />
        </div>
        <div className="row">
          <div className="form-group half-width">
            <label htmlFor="hazardous">Hazardous / Non Hazardous</label>
            <input
              type="text"
              id="hazardous"
              placeholder="Enter Hazardous/Non Hazardous"
              value={hazardous}
              onChange={(e) => setHazardous(e.target.value)}
              required
            />
          </div>
          <div className="form-group half-width">
            <label htmlFor="industryType">Nature of Industry</label>
            <input
              type="text"
              id="industryType"
              placeholder="Enter Nature of Industry"
              value={industryType}
              onChange={(e) => setIndustryType(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="row">
          <div className="form-group half-width">
            <label htmlFor="contractEmployees">Contract Employees Strength</label>
            <input
              type="text"
              id="contractEmployees"
              placeholder="Enter Contract Employees Strength"
              value={contractEmployees}
              onChange={(e) => setContractEmployees(e.target.value)}
              required
            />
          </div>
          <div className="form-group half-width">
            <label htmlFor="occupierName">Name of the Occupier</label>
            <input
              type="text"
              id="occupierName"
              placeholder="Enter Occupier Name"
              value={occupierName}
              onChange={(e) => setOccupierName(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="row">
          <div className="form-group half-width">
            <label htmlFor="directorName">Name of the Facility Director</label>
            <input
              type="text"
              id="directorName"
              placeholder="Enter Director Name"
              value={directorName}
              onChange={(e) => setDirectorName(e.target.value)}
              required
            />
          </div>
          <div className="form-group half-width">
            <label htmlFor="licenseNo">License No</label>
            <input
              type="text"
              id="licenseNo"
              placeholder="Enter License No"
              value={licenseNo}
              onChange={(e) => setLicenseNo(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="row">
          <div className="form-group half-width">
            <label htmlFor="licenseValidity">License Validity</label>
            <input
              type="text"
              id="licenseValidity"
              placeholder="Enter License Validity"
              value={licenseValidity}
              onChange={(e) => setLicenseValidity(e.target.value)}
              required
            />
          </div>
          <div className="form-group half-width">
            <label htmlFor="hpAndManPower">Approved HP & Man Power</label>
            <input
              type="text"
              id="hpAndManPower"
              placeholder="Enter HP & Man Power"
              value={hpAndManPower}
              onChange={(e) => setHpAndManPower(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="row">
          <div className="form-group half-width">
            <label htmlFor="coordinatorName">Name of the Facility Co-ordinator</label>
            <input
              type="text"
              id="coordinatorName"
              placeholder="Enter Co-ordinator Name"
              value={coordinatorName}
              onChange={(e) => setCoordinatorName(e.target.value)}
              required
            />
          </div>
          <div className="form-group half-width">
            <label htmlFor="safetyOfficerName">Name of the Safety Officer</label>
            <input
              type="text"
              id="safetyOfficerName"
              placeholder="Enter Safety Officer Name"
              value={safetyOfficerName}
              onChange={(e) => setSafetyOfficerName(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="row">
          <div className="form-group half-width">
            <label htmlFor="welfareOfficerName">Name of the Welfare Officer</label>
            <input
              type="text"
              id="welfareOfficerName"
              placeholder="Enter Welfare Officer Name"
              value={welfareOfficerName}
              onChange={(e) => setWelfareOfficerName(e.target.value)}
              required
            />
          </div>
          <div className="form-group half-width">
            <label htmlFor="medicalAdvisorName">Factory Medical Advisor</label>
            <input
              type="text"
              id="medicalAdvisorName"
              placeholder="Enter Medical Advisor Name"
              value={medicalAdvisorName}
              onChange={(e) => setMedicalAdvisorName(e.target.value)}
              required
            />
          </div>
        </div>
        <button type="submit" className="submit-btn">Complete Profile</button>
      </form>
    </div>
  );
};

export default CompleteProfile;
