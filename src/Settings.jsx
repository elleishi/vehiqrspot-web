import React, { useState, useEffect } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword, updateEmail } from 'firebase/auth';
import Swal from 'sweetalert2';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Importing eye icons for visibility toggle
import '../src/style/ModalRegister.css';

const Settings = () => {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [users, setUsers] = useState([]); 
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false); 
  const [showNewPassword, setShowNewPassword] = useState(false); 

  // Fetch logged-in user's email from Firebase Authentication
  useEffect(() => {
    const currentUser = auth.currentUser; 
    if (currentUser) {
      setEmail(currentUser.email);
    }
  }, []); 

  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "user"));
        const userData = querySnapshot.docs.map((doc) => {
          const user = doc.data();
          return {
            id: doc.id,
            name: `${user.firstName || "N/A"} ${user.lastName || ""}`,
            email: user.email || "N/A",
            role: user.role || "N/A",
          };
        }).filter((user) =>
          ["Admin"].includes(user.role) 
        );

        setUsers(userData);  // Set users in state
        console.log("Fetched users:", userData);
      } catch (error) {
        console.error("Error fetching users:", error);
        Swal.fire("Error", "Failed to fetch user data. Please try again.", "error");
      }
    };

    fetchUsers();
  }, []); 

  const handleOpenChangePasswordModal = () => {
    setShowChangePasswordModal(true);
  };

  const handleCloseModal = () => {
    setShowChangePasswordModal(false);
    setError('');
    setSuccess('');
    setCurrentPassword('');
    setNewPassword('');

  };

  // Handle input changes for the modal form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'currentPassword') {
      setCurrentPassword(value);
    } else if (name === 'newPassword') {
      setNewPassword(value);
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value);
    }
  };

  const handleSaveClick = async () => {
    if (!currentPassword || currentPassword.trim() === "") {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please enter your current password.',
      });
      return;
    }
  
    if (!newPassword || newPassword.trim() === "") {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please enter a new password.',
      });
      return;
    }

  try {
    const user = auth.currentUser;
    if (!user) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No authenticated user found. Please log in again.',
      });
      return;
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    await updatePassword(user, newPassword);

    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Password changed successfully!',
    });
    handleCloseModal();
  } catch (error) {
    console.error('Error changing password:', error);
    let errorMessage = 'Failed to change password.';

    if (error.code === 'auth/wrong-password') {
      errorMessage = 'The current password is incorrect.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'The new password is too weak.';
    } else if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'You need to log in again to change your password.';
    }

    console.log("Email:", auth.currentUser.email);
console.log("Current Password:", currentPassword);

    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: errorMessage,
    });
  }
};

  const handleSubmit = (e) => {
    e.preventDefault();
  };



  return (
    <div className="Settings">
      <form onSubmit={handleSubmit}>
        <h2>Settings</h2>
        <div>
          <label>Email:</label>
          <label className='email-set'><h6>
          {users[0]?.email || email}
            </h6></label>
        </div>
        <div className='set-button'>
        <div className='btn-set' type="button" onClick={handleOpenChangePasswordModal}><h5>Change Password?</h5></div>

        </div>
      </form>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="modal-overlay-edit" onClick={handleCloseModal}>
          <div className="modal-content-settings" onClick={(e) => e.stopPropagation()}>
            <h3 className="edit">Change Password</h3>
            <div className="reg-con-settings">
              <div className="input-group">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="currentPassword"
                  value={currentPassword}
                  onChange={handleInputChange}
                  placeholder="Current Password"
                />
                <div className="btn-reg-set" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                  {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </div>
            <div className="reg-con-settings">
              <div className="input-group">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={newPassword}
                  onChange={handleInputChange}
                  placeholder="New Password"
                />
                <div className="btn-reg-set"  onClick={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </div>
            <div className="reg-button">
              <button className="btn-reg" onClick={handleCloseModal}>
                Cancel
              </button>
              <button className="btn-reg" onClick={handleSaveClick}>
                Save
              </button>
            </div>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}
          </div>
        </div>
      )}


        {showChangeEmailModal && (
        <div className="modal-overlay-edit" onClick={handleCloseChangeEmailModal}>
          <div className="modal-content-settings" onClick={(e) => e.stopPropagation()}>
            <h3 className="edit">Change Email</h3>
            <div className="reg-con-settings">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="New Email Address"
              />
            </div>
            <div className="reg-con-settings">
              <div className="input-group">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current Password"
                />
                <div className="btn-reg-set" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                  {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
            </div>
            <div className="reg-button">
              <button className="btn-reg" onClick={handleCloseChangeEmailModal}>
                Cancel
              </button>
              <button className="btn-reg" onClick={handleChangeEmail}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default Settings;
