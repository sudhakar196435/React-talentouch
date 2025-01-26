import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase"; // Firebase Auth and Firestore
import { doc, getDoc } from "firebase/firestore";
import emailjs from "emailjs-com";

const Email = () => {
  const [userDetails, setUserDetails] = useState(null); // User details
  const [loading, setLoading] = useState(true);

  // Fetch current logged-in user's profile from Firestore
  useEffect(() => {
    const fetchUserProfile = async () => {
      const currentUser = auth.currentUser;

      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid)); // Assuming users are stored by their UID
          if (userDoc.exists()) {
            setUserDetails(userDoc.data());
          } else {
            console.error("User profile not found in Firestore.");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        console.error("No user is currently logged in.");
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, []);

  // Send email with user details
  const sendEmail = (e) => {
    e.preventDefault();

    if (!userDetails) {
      alert("No user details available to send.");
      return;
    }

    const serviceID = "service_c36fmij"; // Replace with your EmailJS service ID
    const templateID = "template_r1ujk21"; // Replace with your EmailJS template ID
    const userID = "VTtmali6bgh-tzEk6"; // Replace with your EmailJS user ID

    const templateParams = {
      email: auth.currentUser.email, // Logged-in user's email
      fullName: userDetails.fullName,
      mobileNumber: userDetails.mobileNumber,
      message: `Hello ${userDetails.fullName},\n\nHere are your profile details:\n\nFull Name: ${userDetails.fullName}\nEmail: ${auth.currentUser.email}\nMobile Number: ${userDetails.mobileNumber}\n\nThank you for using our service!`, // Example message
    };

    emailjs
      .send(serviceID, templateID, templateParams, userID)
      .then((response) => {
        alert("Profile details sent to your email successfully!");
        console.log("Email sent:", response.status, response.text);
      })
      .catch((error) => {
        alert("Failed to send email. Please try again.");
        console.error("Error sending email:", error);
      });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Send Profile Details to Email</h2>
      {userDetails ? (
        <form onSubmit={sendEmail}>
          <div className="mb-4">
            <p>
              <strong>Full Name:</strong> {userDetails.fullName}
            </p>
            <p>
              <strong>Email:</strong> {auth.currentUser.email}
            </p>
            <p>
              <strong>Mobile Number:</strong> {userDetails.mobileNumber}
            </p>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Send Profile Details
          </button>
        </form>
      ) : (
        <p>No user details available. Please ensure you are logged in.</p>
      )}
    </div>
  );
};

export default Email;
