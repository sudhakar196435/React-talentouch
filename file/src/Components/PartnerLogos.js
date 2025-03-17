import React from "react";
import "../Styles/PartnerLogos.css"; // Import CSS file
import { FaHandshake } from "react-icons/fa";
import partner1 from "../Assets/partner1.png";
import partner2 from "../Assets/partner2.png";
import partner3 from "../Assets/partner3.png";
import partner4 from "../Assets/partner4.png";
import partner5 from "../Assets/partner5.png";
const logos = [partner1, partner2,partner3,partner4,partner5];

const PartnerLogos = () => {
  return (
    <div className="partners-container">
        <h2 className="partners-heading">
        <FaHandshake className="partners-icon" /> Our Partners <FaHandshake className="partners-icon" />
      </h2>
      <div className="logos">
        {logos.map((logo, index) => (
          <img key={index} src={logo} alt={`Partner ${index + 1}`} className="partner-logo" />
        ))}
       
      </div>
    </div>
  );
};

export default PartnerLogos;
