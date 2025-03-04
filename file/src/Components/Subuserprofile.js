import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Subusernav from "./Subusernav";
import Subusersidebar from "./Subusersidebar";
import { Descriptions, Skeleton } from "antd";

const SubUserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/AccessDenied");
      } else {
        try {
          const q = query(collection(db, "subUsers"), where("userId", "==", user.uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            setUserData(querySnapshot.docs[0].data());
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  return (
    <div>
      <Subusernav />
      <div className="settings-container flex">
        <Subusersidebar />

        <div className="settings-content w-full p-6">
          <h2 className="admin-home-title text-2xl font-semibold mb-4">Sub User Profile</h2>

          {loading ? (
            <Skeleton active />
          ) : !userData ? (
            <p className="text-gray-500">No profile data found.</p>
          ) : (
            <Descriptions bordered column={1} className="profile-table">
              <Descriptions.Item label="Name of Establishment">{userData.nameEstb}</Descriptions.Item>
              <Descriptions.Item label="Type">{userData.type}</Descriptions.Item>
              <Descriptions.Item label="Contact Person">{userData.contactPerson}</Descriptions.Item>
              <Descriptions.Item label="Email">{auth.currentUser?.email || "Not Available"}</Descriptions.Item>
              <Descriptions.Item label="Mobile No">{userData.mobileNo}</Descriptions.Item>
              <Descriptions.Item label="GST No">{userData.gstNo}</Descriptions.Item>
              <Descriptions.Item label="PF Code">{userData.pfCode}</Descriptions.Item>
              <Descriptions.Item label="ESI Code">{userData.esiCode}</Descriptions.Item>
              <Descriptions.Item label="Prof Tax No">{userData.profTaxNo}</Descriptions.Item>
              <Descriptions.Item label="Certifications">
                <ul className="list-disc list-inside">
                  {userData.certifications.seCertificate && <li>S&E Certificate</li>}
                  {userData.certifications.factoryLicence && <li>Factory Licence</li>}
                  {userData.certifications.principleEmployerLicence && <li>Principle Employer Licence</li>}
                </ul>
              </Descriptions.Item>
            </Descriptions>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubUserProfile;