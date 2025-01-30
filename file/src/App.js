import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ActDetails from './Components/ActDetails';
import ActDetailsView from './Components/ActDetailsView';
import Login from './Components/Login';
import Register from './Components/Register';
import Users from './Components/Users';
import Home from './Components/Home';
import AdminHome from './Components/AdminHome';
import Index from './Components/Index';
import Addact from './Components/Addact';
import NotFound from './Components/NotFound';
import ForgotPassword from './Components/Forgotpassword';
import Settings from './Components/Settings';
import ChangePassword from './Components/Changepassword';
import UserDetail from './Components/UserDetail';
import Email from './Components/Email';
import AdminQuestions from "./Components/AdminQuestions";

import UserActs from './Components/UserActs';
import UserAudit from './Components/UserAudit';
import AdminSettings from './Components/AdminSettings';
import UserAuditHistory from './Components/UserAuditHistory';
import Upload from './Components/UploadActs';


const App = () => {
  return (
    <Router>
      <div>
        <Routes>
        <Route path="/*" element={<NotFound/>} />
        <Route path="/" element={<Index/>} />
        <Route path="/act" element={<Addact/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/users" element={<Users/>} />
        <Route path="/adminhome" element={<AdminHome/>} />
        <Route path="/forgot-password" element={<ForgotPassword/>} />
        <Route path="/email" element={<Email/>} />

        <Route path="/home" element={<Home/>} />
        <Route path="/settings" element={<Settings/>} />
        <Route path="/adminsettings" element={<AdminSettings/>} />
        <Route path="/changepassword" element={<ChangePassword/>} />
        <Route path="/useracts" element={<UserActs/>} />
        <Route path="/useraudit/:id" element={<UserAudit/>} />
     <Route path="/acts" element={<ActDetails/>} />
     <Route path="/act/:id" element={<ActDetailsView/>} />
     <Route path="/users/:userId" element={<UserDetail />} />
     <Route path="/act/:id/questions" element={<AdminQuestions />} />
    

     <Route path="/myaudit" element={<UserAuditHistory/>} />
     <Route path="/UploadActs" element={<Upload />}/>

        </Routes>
      </div>
    </Router>
  );
};

export default App;
