import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ActDetails from "./Components/ActDetails";
import ActDetailsView from "./Components/ActDetailsView";
import Login from "./Components/Login";
import Register from "./Components/Register";
import Users from "./Components/Users";
import Home from "./Components/Home";
import AdminHome from "./Components/AdminHome";
import Index from "./Components/Index";
import Addact from "./Components/Addact";
import NotFound from "./Components/NotFound";
import ForgotPassword from "./Components/Forgotpassword";
import Settings from "./Components/Settings";
import ChangePassword from "./Components/Changepassword";
import UserDetail from "./Components/UserDetail";
import Email from "./Components/Email";
import AdminQuestions from "./Components/AdminQuestions";
import UserActs from "./Components/UserActs";
import UserAudit from "./Components/UserAudit";
import AdminSettings from "./Components/AdminSettings";
import UserAuditHistory from "./Components/UserAuditHistory"; // Import the component
import Upload from "./Components/UploadActs";
import CompleteProfile from "./Components/CompleteProfile";
import AuditorHome from "./Components/AuditorHome";
import AuditorUsers from "./Components/AuditorUsers";
import AuditorUserDetail from "./Components/AuditorUserDetails";
import AuditorSettings from "./Components/AuditorSettings";
import SubUsers from "./Components/SubUsers";
import Branches from "./Components/Branches";

const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/*" element={<NotFound />} />
          <Route path="/" element={<Index />} />
          <Route path="/act" element={<Addact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/users" element={<Users />} />
          <Route path="/adminhome" element={<AdminHome />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/email" element={<Email />} />
          <Route path="/home" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/adminsettings" element={<AdminSettings />} />
          <Route path="/changepassword" element={<ChangePassword />} />
          <Route path="/useracts" element={<UserActs />} />
          <Route path="/useraudit/:id" element={<UserAudit />} />
          <Route path="/acts" element={<ActDetails />} />
          <Route path="/act/:id" element={<ActDetailsView />} />
          <Route path="/users/:userId" element={<UserDetail />} />
          <Route path="/act/:id/questions" element={<AdminQuestions />} />
          <Route path="/myaudit" element={<UserAuditHistory />} />
          <Route path="/user-audit-history/:userId" element={<UserAuditHistory />} />
          <Route path="/UploadActs" element={<Upload />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route path="/auditorhome" element={<AuditorHome />} />
          <Route path="/auditorusers" element={<AuditorUsers />} />
          <Route path="/auditor/user/:userId" element={<AuditorUserDetail />} />
          <Route path="/auditorsettings" element={<AuditorSettings />} />

          {/* Ensure clicking "Sub Users" first leads to the Branches page */}
          <Route path="/subusers" element={<Branches />} />

          {/* Clicking a branch navigates to its sub-users */}
          <Route path="/branches" element={<Branches />} />
          <Route path="/branches/:branchId/sub-users" element={<SubUsers />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
