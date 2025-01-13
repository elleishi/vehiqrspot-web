import React, { useState, useEffect, useRef} from 'react';
import { FaEdit, FaTrashAlt, FaQrcode, FaPrint, FaAngleLeft, FaAngleRight} from "react-icons/fa";
import RegisterWithQR from "../src/Register";
import jsPDF from "jspdf";
import "jspdf-autotable";

import { QRCodeCanvas } from 'qrcode.react';
import logo from '../src/Image/boxVehiqr.png';


//firebase
import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, deleteUser } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

import { db, storage } from '../firebaseConfig';

// style
import '../src/style/table.css';
import Swal from 'sweetalert2';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false); 
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(8); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [currentUser, setCurrentUser] = useState(null); 

  //state for edit info
  const [editInfo, setEditInfo] = useState({
    First_Name: "",
    Last_Name: "",
    Phone_Number: "",
    Address: "",
    Password: "",
    Role: "",
    Plate_Number: "",
    Vehicle_Type: ""
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "user"));
        const userData = querySnapshot.docs
          .map((doc) => {
            const user = doc.data();
            return {
            id: doc.id,
            name: `${user.firstName || "N/A"} ${user.lastName || ""}`,
            email: user.email || "N/A",
            phoneNumber: user.phoneNumber || "N/A",
            address: user.address || "N/A",
            role: user.role || "N/A",
            course: user.course || "N/A",
            department: user.department || "N/A",
            year: user.year || "N/A",
            vehicleType: user.vehicle?.vehicleType || "",
            plateNumber: user.vehicle?.plateNumber || "",
            qrImageURL: user.qrImageURL || null,
          };
        })

        .filter((user) =>
          ["Staff", "Student", "Faculty"].includes(user.role)
        ); 

      setUsers(userData);
      console.log("Fetched users:", userData);
    } catch (error) {
      console.error("Error fetching users:", error);
      Swal.fire("Error", "Failed to fetch user data. Please try again.", "error");
    }
  };

  fetchUsers();
}, []);


const exportUserQR = async (user) => {
  try {
    const { qrImageURL, name, email, phoneNumber, address, role, course } = user; // Extract user details
    const response = await fetch(qrImageURL);

    if (!response.ok) {
      throw new Error("Failed to fetch the QR code image");
    }

    const blob = await response.blob();
    const qrCode = new Image();
    qrCode.src = URL.createObjectURL(blob);

    const doc = new jsPDF();

    // Define margins for the page
    const margin = 10;
    const topMargin = 20; 
    const headerHeight = 5; 
    const qrCodeSize = 50;
    const gapBetweenHeaderAndQRCode = 10;
    const gapBetweenQRCodeAndDetails = 10; 

    qrCode.onload = () => {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("QR Code", margin, topMargin);
      doc.text("Personal Details", margin + 60, topMargin); 
      doc.setLineWidth(0.3);
      doc.line(margin, topMargin + headerHeight, 200, topMargin + headerHeight);
      doc.addImage(qrCode, "PNG", margin, topMargin + gapBetweenHeaderAndQRCode, qrCodeSize, qrCodeSize);

      const textX = margin + qrCodeSize + 10; 
      let textY = topMargin + gapBetweenHeaderAndQRCode + gapBetweenQRCodeAndDetails - 7;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Name: ${name}`, textX, textY);
      textY += 5;
      doc.text(`Email: ${email}`, textX, textY);
      textY += 5;
      doc.text(`Phone Number: ${phoneNumber}`, textX, textY);
      textY += 5;
      doc.text(`Address: ${address}`, textX, textY);
      textY += 5;
      doc.text(`Role: ${role}`, textX, textY);
      textY += 5;
      doc.text(`Course: ${course}`, textX, textY);

      // Save the PDF
      doc.save(`${name}_QRCode.pdf`);
    };
  } catch (error) {
    console.error("Error adding QR code image:", error);
  }
};



  

  //UserManagement Report (Generate Report)

  const exportTableToPDF = async () => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'in',
      format: 'letter',
    });
  
    // Margins and Starting Point
    const margin = 0.5;
    let startY = margin;
  
    const toDataURL = async (url) => {
      const response = await fetch(url, { mode: 'cors' });
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    };
  
    // Divider Spacing
    const dividerSpacingAbove = 1.3;
    const dividerSpacingBelow = 0.4;
  
    for (const [index, user] of users.entries()) {
      // Add a new page after every 4 users
      if (index > 0 && index % 4 === 0) {
        doc.addPage();
        startY = margin;
        doc.setFontSize(12);
        startY += 0.3;
      }
  
      // User Name (Section Title)
      doc.setFontSize(10);
      doc.text(`${user.name.toUpperCase()}`, margin, startY);
      startY += 0.2;
  
      // Draw Header Background Color
      doc.setFillColor(230, 230, 230);
      doc.rect(margin, startY, 7.5, 0.3, 'F'); // Draw Header Rectangle
  
      // Header Row
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Personal Information', margin + 0.1, startY + 0.2);
      doc.text('Vehicle Information', margin + 2.5, startY + 0.2);
      doc.text('QR Code', margin + 6.5, startY + 0.2);
  
      startY += 0.6; // Move below the header
  
      // Personal Information
      doc.setFontSize(8);
      doc.text(`Name: ${user.name}`, margin, startY);
      doc.text(`Email: ${user.email}`, margin, startY + 0.2);
      doc.text(`Address: ${user.address}`, margin, startY + 0.4);
      doc.text(`Contact Number: ${user.phoneNumber}`, margin, startY + 0.6);
      doc.text(`Role: ${user.role}`, margin, startY + 0.8);
  
      if (user.role === 'Student') {
        doc.text(`Course: ${user.course}`, margin, startY + 1.0);
        doc.text(`Year Level: ${user.year}`, margin, startY + 1.2);
      } else if (user.role === 'Faculty') {
        doc.text(`Department: ${user.department}`, margin, startY + 1.0);
      }
  
      // Vehicle Information
      doc.text(`Vehicle Type: ${user.vehicleType}`, margin + 2.5, startY);
      doc.text(`Plate Number: ${user.plateNumber}`, margin + 2.5, startY + 0.2);
  
      // QR Code
      try {
        if (user.qrImageURL) {
          const qrBase64 = await toDataURL(user.qrImageURL);
          doc.addImage(qrBase64, 'PNG', margin + 6.5, startY, 0.8, 0.8);
        }
      } catch (error) {
        console.error('Error adding QR code image:', error);
      }
  
      // Add Spacing Above Divider
      startY += dividerSpacingAbove;
  
      // Add Section Divider
      doc.setDrawColor(150, 150, 150); // Light Gray
      doc.setLineWidth(0.01); // Thin line
      doc.line(margin, startY, 7.5 + margin, startY);
  
      // Add Spacing Below Divider
      startY += dividerSpacingBelow;
    }
  
    // Save PDF
    doc.save('user-management-report.pdf');
  };


  const fetchCurrentUser = async (uid) => {
    const userDocRef = doc(db, "user", uid);
    const userSnap = await getDoc(userDocRef);
  
    if (userSnap.exists()) {
      const userData = userSnap.data();
      setCurrentUser({
        id: uid,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        address: userData.address,
        role: userData.role,
        vehicle: userData.vehicle?.vehicleType || "",
        plateNumber: userData.vehicle?.plateNumber || "",
      });
      console.log("User data:", userData);
      return userData; 
    } else {
      console.error("User not found!");
      return null;
    }
  };
  //qr code in user management

  // dont change ****************************************************************************
  const [qrValue, setQrValue] = useState("");
    const qrRef = useRef(null);
  
    const handleSaveClick = async () => {
      if (currentUser) {
        // Fetch current user before proceeding
        const userData = await fetchCurrentUser(currentUser.id);
        
        if (!userData) {
          console.error("User data could not be retrieved.");
          return;
        }
    
        console.log("Current User Vehicle:", currentUser.vehicle); // Log the vehicle to verify data
    
        try {
          await updateDoc(userDocRef, {
            firstName: editInfo.First_Name,
            lastName: editInfo.Last_Name,
            phoneNumber: editInfo.Phone_Number,
            address: editInfo.Address,
          });
    
          // Update the local state
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user.id === currentUser.id
                ? {
                    ...user,
                    name: `${editInfo.First_Name} ${editInfo.Last_Name}`,
                    phoneNumber: editInfo.Phone_Number,
                    address: editInfo.Address,
                  }
                : user
            )
          );
    
          const newQrValue = JSON.stringify({
            uid: currentUser.id,
            firstName: editInfo.First_Name,
            lastName: editInfo.Last_Name,
            phoneNumber: editInfo.Phone_Number,
            address: editInfo.Address,
            role: currentUser.role,
            plateNumber: currentUser.vehicle?.plateNumber || "",
          });
          console.log("New QR value:", newQrValue);
          setQrValue(newQrValue); // Trigger QR code generation
    
          const canvas = qrRef.current.querySelector("canvas");
          if (canvas) {
            canvas.toBlob(async (blob) => {
              if (blob) {
                const currentMonth = new Date().toISOString().split("T")[0].slice(0, 7);
                const storageRef = ref(storage, `qrCodes/${currentMonth}/${currentUser.id}.png`);
                await uploadBytes(storageRef, blob);
    
                const downloadURL = await getDownloadURL(storageRef);
    
                // Update QR code URL in Firestore
                await updateDoc(userDocRef, { qrImageURL: downloadURL });
    
                Swal.fire("Success", "Account and QR code updated successfully!", "success");
                setShowEditForm(false);
                setCurrentUser(null);
              } else {
                console.error("Failed to create QR code blob!");
              }
            }, "image/png");
          } else {
            console.error("QR code canvas not found!");
          }
        } catch (error) {
          Swal.fire("Error", "Failed to update user details or QR code. Try again!", "error");
        }
      } else {
        console.error("No current user selected.");
      }
    };
    
  

// dont change ****************************************************************************
const handleDeleteUser = async (userId) => {
   const result = await Swal.fire({
    title: 'Are you sure?',
    text: "Do you want to delete this user? This action cannot be undone.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#66894c',
    cancelButtonColor: '#a9bc9a',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel'
  });

  if (result.isConfirmed) {
  try {
    await deleteDoc(doc(db, "user", userId));

    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));

    Swal.fire({
      icon: "success",
      title: "Deleted",
      text: "User account has been successfully deleted.",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "An error occurred while deleting the account. Please try again.",
    });
  }
};
}

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditInfo((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  
  
  const handleEditClick = (user) => {
    setCurrentUser(user);
    setShowEditForm(true);
    setEditInfo({
      First_Name: user.name.split(" ")[0],
      Last_Name: user.name.split(" ")[1],
      Phone_Number: user.phoneNumber,
      Address: user.address,
    });
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phoneNumber.includes(searchTerm)
    && user.role !== "Admin" && user.role !== "Security" 
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleCreateAccountClick = () => {
    setShowForm(true);
  };

  const handleCloseModal = () => {
    setShowForm(false);
    setShowEditForm(false); 
    setCurrentUser(null);
  };

  
  return (
    <div className="Usermanage">
      <div className="Usermanage-con">
        <button className="create" onClick={handleCreateAccountClick}>
          Create Account
        </button>

        {showForm && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <RegisterWithQR onClose={handleCloseModal} />
            </div>
          </div>
        )}

        {showEditForm && currentUser && ( 
          <div className="modal-overlay-edit" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>

              <h3 className='edit'>Edit Information</h3>    
                  <div className="reg-con">
                    <div className="reg-input">
                      <input
                        type="text"
                        name="First_Name"
                        value={editInfo.First_Name} 
                        onChange={handleInputChange}
                        placeholder="First Name"
                      />
                    </div>
                    <div className="reg-input">
                      <input
                        type="text"
                        name="Last_Name"
                        value={editInfo.Last_Name} 
                        onChange={handleInputChange}
                        placeholder="Last Name"
                      />
                    </div>
                  </div>
                  <div className="reg-con">
                    <div className="reg-input">
                      <input
                        type="text"
                        name="Phone_Number"
                        value={editInfo.Phone_Number}
                        onChange={handleInputChange}
                        placeholder="Phone No."
                      />
                    </div>
                    <div className="reg-input">

                  <input
                    type="text"
                    name="Address"
                    value={editInfo.Address}
                    onChange={handleInputChange}
                    placeholder="Address"
                    />
                    </div>
                    </div>
                          <div className="reg-button">
                            <button className="btn-reg" onClick={handleCloseModal}>Cancel</button>
                            <button className="btn-reg" onClick={handleSaveClick}>Save</button>
                          </div>
                        </div>
                      </div>
                    )}

        <div className="UserTable">
          <div className="header-container">
            <div className="headerText">
              <h3>Accounts</h3>
            </div>
            <div className="button-container">
              <input
                className="search-input-tbl"
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
              <button className='icon-search' onClick={exportTableToPDF}>
                <FaPrint  className='icon-td' />
              </button>
            </div>
          </div>
            <table className="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Phone</th>
                <th scope="col">Address</th>
                <th scope="col">Role</th>
                <th scope="col">Course</th>
                <th scope="col">Department</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phoneNumber}</td>
                    <td>{user.address}</td>
                    <td>{user.role}</td>
                    <td>{user.course}</td>
                    <td>{user.role === "Faculty" ? user.department : "N/A"} </td>
                    <td>

                      <button className="btn"  onClick={() => handleDeleteUser(user.id)}>
                        <FaTrashAlt className='icon-td'/>
                      </button>
                      <button
                        className="btn"
                        onClick={() => exportUserQR(user)}
                      >
                      <FaQrcode className="icon-td" />
                      </button>

                    </td>
                  </tr>
                ))
              ) : (
                <tr className="no-data-row">
                  <td colSpan="6">No users found</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="pagination">
            <button onClick={prevPage} disabled={currentPage === 1}> <FaAngleLeft /> </button>
            <div className='page-container'>
              <span>Page {currentPage} of {totalPages}</span>
            </div>
            <button onClick={nextPage} disabled={currentPage === totalPages}> <FaAngleRight /> </button>
          </div>
        </div>

        <div style={{ display: "none", margin: "3px" }} ref={qrRef}>
        <QRCodeCanvas
          value={qrValue}
          size={300}
          bgColor={"#fff"}
          fgColor={"#4F653E"}
          level="L"
          imageSettings={{
            src: logo,
            height: 60,
            width: 60,
            excavate: true,

          }}
        />
      </div>

      </div>

      
    </div>

    

  );
};

export default UserManagement;
