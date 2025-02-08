import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Subusernav from "./Subusernav";
import Subusersidebar from "./Subusersidebar";

const SubUserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/login");
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
            // Skeleton Loader
            <div className="animate-pulse">
              <div className="h-6 bg-gray-300 rounded mb-2 w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
            </div>
          ) : !userData ? (
            <p className="text-gray-500">No profile data found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-left">
                <tbody>
                  <tr className="border-b">
                    <td className="p-3 font-semibold">Name of Establishment:</td>
                    <td className="p-3">{userData.nameEstb}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-semibold">Type:</td>
                    <td className="p-3">{userData.type}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-semibold">Contact Person:</td>
                    <td className="p-3">{userData.contactPerson}</td>
                  </tr>
                  <tr className="border-b">
                  <td className="p-3 font-semibold">Email:</td>
                  <td className="p-3">{auth.currentUser?.email || "Not Available"}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-semibold">Mobile No:</td>
                    <td className="p-3">{userData.mobileNo}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-semibold">GST No:</td>
                    <td className="p-3">{userData.gstNo}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-semibold">PF Code:</td>
                    <td className="p-3">{userData.pfCode}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-semibold">ESI Code:</td>
                    <td className="p-3">{userData.esiCode}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-semibold">Prof Tax No:</td>
                    <td className="p-3">{userData.profTaxNo}</td>
                  </tr>
                </tbody>
              </table>

              <h3 className="text-xl font-semibold mt-6 mb-2">Certifications:</h3>
              <ul className="list-disc list-inside">
                {userData.certifications.seCertificate && <li>S&E Certificate</li>}
                {userData.certifications.factoryLicence && <li>Factory Licence</li>}
                {userData.certifications.principleEmployerLicence && <li>Principle Employer Licence</li>}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubUserProfile;
