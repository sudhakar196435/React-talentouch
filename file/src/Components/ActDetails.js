import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Button ,Tag} from "antd";
import "../Styles/Actdetail.css";
import AdminNav from "./AdminNav";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom"; // Import useNavigate
import { DeleteOutlined, CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
const ActDetailPage = () => {
  const [acts, setActs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActs, setSelectedActs] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const fetchActs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "acts"));
        const actData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setActs(actData);
      } catch (error) {
        console.error("Error fetching acts: ", error);
      }
    };
    fetchActs();
  }, []);

  // Filter acts based on search term
  const filteredActs = acts.filter((act) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      act.actCode.toLowerCase().includes(searchLower) ||
      act.actName.toLowerCase().includes(searchLower)
    );
  });
  const statusColors = {
    active: "green",
    inactive: "red",
  };

  // Handle individual selection
  const handleSelectAct = (id) => {
    setSelectedActs((prev) =>
      prev.includes(id) ? prev.filter((actId) => actId !== id) : [...prev, id]
    );
  };

  // Handle Select All
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedActs([]);
    } else {
      setSelectedActs(filteredActs.map((act) => act.id));
    }
    setSelectAll(!selectAll);
  };

  // Bulk status update
  const updateSelectedStatus = async (newStatus) => {
    if (selectedActs.length === 0) {
      toast.warning("No acts selected!");
      return;
    }

    try {
      const updatePromises = selectedActs.map((id) =>
        updateDoc(doc(db, "acts", id), { status: newStatus })
      );
      await Promise.all(updatePromises);
      setActs((prev) =>
        prev.map((act) =>
          selectedActs.includes(act.id) ? { ...act, status: newStatus } : act
        )
      );
      toast.success(`Selected act was ${newStatus} successfully!`);
      setSelectedActs([]); // Clear selection
    } catch (error) {
      console.error("Error updating status: ", error);
      toast.error("Failed to update status.");
    }
  };

  // Bulk delete selected acts
  const deleteSelectedActs = async () => {
    if (selectedActs.length === 0) {
      toast.warning("No acts selected!");
      return;
    }
    const confirmDelete = window.confirm("Are you sure you want to delete selected acts?");
    if (confirmDelete) {
      try {
        const deletePromises = selectedActs.map((id) => deleteDoc(doc(db, "acts", id)));
        await Promise.all(deletePromises);
        setActs((prev) => prev.filter((act) => !selectedActs.includes(act.id)));
        setSelectedActs([]);
        toast.success("Selected acts deleted successfully!");
      } catch (error) {
        console.error("Error deleting acts: ", error);
        toast.error("Failed to delete selected acts.");
      }
    }
  };

  return (
    <div>
      <AdminNav />
      <div className="admin-home-container">
        <div className="act-detail-page">
          <h1 className="page-title">Acts List</h1>
          <div className="action-buttons">
            <input
              type="text"
              placeholder="Search by Act Code or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          
          </div>
         <div className="action-buttons-container">
         <Button onClick={deleteSelectedActs} danger icon={<DeleteOutlined />}>
  Delete Selected
</Button>

<Button onClick={() => updateSelectedStatus("active")}  type="dashed" icon={<CheckCircleOutlined />}>
  Activate Selected
</Button>

<Button onClick={() => updateSelectedStatus("inactive")} type="default" icon={<StopOutlined />}>
  Deactivate Selected
</Button>

</div>

          <table className="acts-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>S.No.</th>
                <th>Act Code</th>
                <th>Act Name</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredActs.map((act, index) => (
                <tr key={act.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedActs.includes(act.id)}
                      onChange={() => handleSelectAct(act.id)}
                    />
                  </td>
                  <td>{index + 1}</td>
                  <td>{act.actCode}</td>
                  <td>{act.actName}</td>
                  <td>
                  <Tag color={statusColors[act.status || "active"]}>
    {act.status ? act.status.charAt(0).toUpperCase() + act.status.slice(1) : "Active"}
  </Tag></td>
                  <td>
                  <div className="button-container">
  <Link to={`/act/${act.id}`} className="btn btn-small view-details">
    View Act Details 
  </Link>
  <Link to={`/act/${act.id}/questions`} className="btn btn-small view-questions">
    Manage Questions
  </Link>
</div>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ActDetailPage;
