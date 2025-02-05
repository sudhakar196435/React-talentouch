import React, { useState } from "react";
import Branches from "./Branches";
import SubUsers from "./SubUsers";

const Dashboard = () => {
  const [selectedBranch, setSelectedBranch] = useState(null);

  return (
    <div>
      <Branches onSelectBranch={setSelectedBranch} />
      {selectedBranch && <SubUsers branchId={selectedBranch} />}
    </div>
  );
};

export default Dashboard;
