import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase"; // Import Firebase auth & db
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { Spin } from 'antd';
const SubUserForm = () => {
  const [formData, setFormData] = useState({
    nameEstb: "",
    type: "",
    contactPerson: "",
    mobileNo: "",
    gstNo: "",
    pfCode: "",
    esiCode: "",
    profTaxNo: "",
    certifications: {
      seCertificate: false,
      factoryLicence: false,
      principleEmployerLicence: false,
    },
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Track authenticated user & check if they already submitted the form
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const q = query(collection(db, "subUsers"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            navigate("/subuserhome"); // Redirect if already submitted
          }
        } catch (error) {
          console.error("Error checking existing submission:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    if (name in formData.certifications) {
      setFormData({
        ...formData,
        certifications: { ...formData.certifications, [name]: checked },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("You must be logged in to submit the form.");
      return;
    }

    try {
      await addDoc(collection(db, "subUsers"), {
        ...formData,
        userId: currentUser.uid, // Store user ID for tracking
        createdAt: new Date(),
      });
      console.log("Form Data Saved Successfully");
      navigate("/subuserhome");
    } catch (error) {
      console.error("Error saving form data:", error);
    }
  };

  if (loading) return  <div className="loading-container">
  <Spin size="large" />
</div>;

  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <input type="text" name="nameEstb" value={formData.nameEstb} onChange={handleChange} placeholder="Name of Establishment" className="border p-2 w-full" required />
      
      <select name="type" value={formData.type} onChange={handleChange} className="border p-2 w-full" required>
        <option value="">Select Type</option>
        <option value="Branch">Branch</option>
        <option value="Contractor">Contractor</option>
        <option value="Factory">Factory</option>
        <option value="Admin Office">Admin Office</option>
        <option value="Project Site">Project Site</option>
      </select>
      
      <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} placeholder="Contact Person" className="border p-2 w-full" required />
      <input type="tel" name="mobileNo" value={formData.mobileNo} onChange={handleChange} placeholder="Mobile No" className="border p-2 w-full" required />
      <input type="text" name="gstNo" value={formData.gstNo} onChange={handleChange} placeholder="GST No" className="border p-2 w-full" required />
      <input type="text" name="pfCode" value={formData.pfCode} onChange={handleChange} placeholder="PF Code" className="border p-2 w-full" required />
      <input type="text" name="esiCode" value={formData.esiCode} onChange={handleChange} placeholder="ESI Code" className="border p-2 w-full" required />
      <input type="text" name="profTaxNo" value={formData.profTaxNo} onChange={handleChange} placeholder="Prof Tax No" className="border p-2 w-full" required />
      
      <div className="border p-4 rounded-lg">
        <label className="font-semibold">Certifications:</label>
        <div>
          <input type="checkbox" name="seCertificate" checked={formData.certifications.seCertificate} onChange={handleChange} /> S&E Certificate
        </div>
        <div>
          <input type="checkbox" name="factoryLicence" checked={formData.certifications.factoryLicence} onChange={handleChange} /> Factory Licence
        </div>
        <div>
          <input type="checkbox" name="principleEmployerLicence" checked={formData.certifications.principleEmployerLicence} onChange={handleChange} /> Principle Employer Licence
        </div>
      </div>
      
      <button type="submit" className="bg-blue-500 text-white p-2 rounded-lg w-full">Submit</button>
    </form>
  );
};

export default SubUserForm;
