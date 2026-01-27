import {
  Box,
  Grid,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import Header from "@components/Header";
import { useState, useEffect } from "react";
import { useGetAdminUsersQuery, useUpdateAdminUserMutation, useDeleteAdminUserMutation, useGetCustomersQuery } from "@state/api";

function UserCard({ user, onEdit, onDelete }) {

  const [showAll, setShowAll] = useState(false);
  const [address, setAddress] = useState({});


  useEffect(() => {
    let addr = {};
    try {
      if (user && typeof user.address === 'object' && user.address !== null) {
        addr = user.address;
      } else if (typeof user?.address === 'string') {
        addr = JSON.parse(user.address || '{}') || {};
      } else {
        addr = {};
      }
    } catch {
      addr = {};
    }
    setAddress(addr); // update state whenever user changes
  }, [user]); 

  return (
    <Box
      sx={{
        width: "100%",
        p: 1,
        borderRadius: "16px",
        bgcolor: "#46B4E7",
        boxShadow: 3,
        textAlign: "center",
      }}
    >
      {/* Profile Pic */}
      <img
        src={user.profile_pic}
        alt={user.first_name}
        style={{
          width: 90,
          height: 90,
          borderRadius: "50%",
          objectFit: "cover",
          margin: "0 auto",
        }}
      />

      {/* Basic Info */}
      <h3 style={{ marginTop: "0.1px", fontWeight: "800", fontSize: "18px" }}>
        {user.first_name} {user.last_name}
      </h3>
      <p style={{ fontSize: "14px", color: "#444" }}>{user.email}</p>
      <p
        style={{
          marginTop: "0.04px",
          fontSize: "14px",
          color: "#FFFFFF",
          fontWeight: "600",
        }}
      >
        Role:{" "}
        <span style={{ color: "#6203A1", fontSize: "14px" }}>{user.role}</span>
      </p>

      {/* Buttons */}
      <Box sx={{ mt: 1, display: "flex", justifyContent: "center", gap: 1 }}>
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            padding: "6px 12px",
            background: "#1976d2",
            color: "white",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
          }}
        >
          {showAll ? "Hide" : "See All"}
        </button>

        <button
          onClick={() => onEdit(user)}
          style={{
            padding: "6px 12px",
            background: "#FF9800",
            color: "white",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Edit
        </button>

        <button
          onClick={() => onDelete(user._id)}
          style={{
            padding: "6px 12px",
            background: "#D32F2F",
            color: "white",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Delete
        </button>
      </Box>

      {/* Expanded Info */}
      {showAll && (
        <Box sx={{ mt: 2, textAlign: "left", fontSize: "14px" }}>
          <p>
            <strong>Phone:</strong> {user.phone || "N/A"}
          </p>
          <p>
            <strong>Gender:</strong> {user.gender || "N/A"}
          </p>
          <p>
            <strong>DOB:</strong> {user.dob || "N/A"}
          </p>
          <p><strong>Address:</strong></p>
          <ul style={{ marginTop: 4, marginBottom: 8, paddingLeft: 18 }}>
            <li><strong>Personal:</strong> {address.personal_address || 'N/A'}</li>
            <li><strong>Shoping:</strong> {address.shoping_address || 'N/A'}</li>
            <li><strong>Billing:</strong> {address.billing_address || 'N/A'}</li>
            <li><strong>Village:</strong> {address.address_village || 'N/A'}</li>
            <li><strong>Landmark:</strong> {address.landmark || 'N/A'}</li>
            <li><strong>City:</strong> {address.city || 'N/A'}</li>
            <li><strong>State:</strong> {address.state || 'N/A'}</li>
            <li><strong>Zip:</strong> {address.zip || 'N/A'}</li>
            <li><strong>Country:</strong> {address.country || 'N/A'}</li>
          </ul>
          <p>
            <strong>Account Status: </strong>
            <strong style={{ color: user.isActive ? "green" : "#901313" }}>
              {user.isActive ? "Active" : "Inactive"}
            </strong>
          </p>
          <p>
            <strong> Email Status: </strong>
            <strong style={{ color: user.emailVerified ? "green" : "#901313" }}>
              {user.emailVerified ? "Email Verified" : "Email Not Verified"}
            </strong>
          </p>
          <p>
            <strong> Phone Status: </strong>
            <strong style={{ color: user.phoneVerified ? "green" : "#901313" }}>
              {user.phoneVerified ? "Phone Verified" : "Phone Not Verified"}
            </strong>
          </p>
          <p>
            <strong>Last Updated:</strong>{" "}
            {new Date(user.updatedAt).toLocaleString() || user.updatedAt || "N/A"}
          </p>
          <p>
            <strong>Joined:</strong>{" "}
            {new Date(user.createdAt).toLocaleString() || user.createdAt || "N/A"}
          </p>
        </Box>
      )}
    </Box>
  );
}

function Admin() {
  const theme = useTheme();
  const { data, isLoading: loading, isError } = useGetAdminUsersQuery(undefined, { refetchOnMountOrArgChange: true });
  // get customer count to display beside ADMIN header
  const { data: customersData } = useGetCustomersQuery();
  const totalCustomers = Array.isArray(customersData?.users) ? customersData.users.filter(u => String(u.role || '').toLowerCase() === 'admin').length : (Array.isArray(customersData) ? customersData.length : (customersData?.totalCustomers ?? 0));
  const [updateAdminUser] = useUpdateAdminUserMutation();
  const [deleteAdminUser] = useDeleteAdminUserMutation();
  const users = Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : [];

  // For editing
  const [openEdit, setOpenEdit] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const showToast = (message, severity = 'info') => setToast({ open: true, message, severity });
  const closeToast = (_, reason) => { if (reason === 'clickaway') return; setToast((t) => ({ ...t, open: false })); };

  const handleEditClick = (user) => {
    // Normalize address to object for safer editing
    let addr = {};
    try {
      if (typeof user.address === 'string') {
        addr = JSON.parse(user.address || '{}') || {};
      } else if (user && typeof user.address === 'object' && user.address !== null) {
        addr = user.address;
      }
    } catch (e) {
      addr = {};
    }
    setEditUser({ ...user, address: addr });
    setOpenEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editUser || !editUser._id) return;

    try {
      const payload = { ...editUser };
      Object.keys(payload).forEach((k) => { if (payload[k] === 'N/A') payload[k] = ''; });
      // Flatten address fields for backend merge
      const addr = editUser.address || {};
      payload.personal_address = addr.personal_address ?? undefined;
      payload.shoping_address = addr.shoping_address ?? undefined;
      payload.billing_address = addr.billing_address ?? undefined;
      payload.address_village = addr.address_village ?? undefined;
      payload.landmark = addr.landmark ?? undefined;
      payload.city = addr.city ?? undefined;
      payload.state = addr.state ?? undefined;
      payload.country = addr.country ?? undefined;
      payload.zip = addr.zip ?? undefined;
      delete payload.address;
      await updateAdminUser({ id: editUser._id, body: payload }).unwrap();
      showToast('Admin updated successfully', 'success');
      setOpenEdit(false);
      setEditUser(null);
    } catch (err) {
      console.error("Error updating user:", err);
      showToast(err?.data?.msg || err?.message || 'Failed to update admin', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteAdminUser({ id }).unwrap();
      showToast('Admin deleted', 'success');
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast(err?.data?.msg || err?.message || 'Failed to delete admin', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const addressFields = new Set([
      'personal_address', 'shoping_address', 'billing_address',
      'address_village', 'landmark', 'city', 'state', 'country', 'zip',
    ]);
    if (addressFields.has(name)) {
      setEditUser((prev) => ({
        ...prev,
        address: { ...(prev?.address || {}), [name]: value },
      }));
    } else {
      setEditUser((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <Box m="1.5rem 2.5rem">
  <Header title="ADMIN" subtitle="List of Admins" count={totalCustomers} />

      {isError && <p style={{ color: "red" }}>Failed to load admins</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <Grid container spacing={3} sx={{ mt: 4 }}>
          {users.map((user, idx) =>
            user && String(user.role || '').toLowerCase() === "admin" ? (
              <Grid
                item
                key={user._id || user.id || user.email || idx}
                xs={12}
                sm={6}
                md={4}
                lg={3}
                xl={2.4}
              >
                <UserCard
                  user={user}
                  onEdit={handleEditClick}
                  onDelete={handleDelete}
                />
              </Grid>
            ) : null
          )}
        </Grid>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          {editUser && (
            <>
              <TextField
                label="First Name"
                name="first_name"
                value={editUser.first_name || ""}
                onChange={handleChange}
              />
              <TextField
                label="Middle Name"
                name="middle_name"
                value={editUser.middle_name || ""}
                onChange={handleChange}
              />
              <TextField
                label="Last Name"
                name="last_name"
                value={editUser.last_name || ""}
                onChange={handleChange}
              />
              <TextField
                label="Role"
                name="role"
                value={editUser.role || ""}
                onChange={handleChange}
              />
              <TextField
                label="Email"
                name="email"
                value={editUser.email || ""}
                onChange={handleChange}
              />
              <TextField
                label="Phone"
                name="phone"
                value={editUser.phone || ""}
                onChange={handleChange}
              />
              <TextField
                label="Gender"
                name="gender"
                value={editUser.gender || ""}
                onChange={handleChange}
              />
              <TextField
                label="DOB"
                name="dob"
                value={editUser.dob || ""}
                onChange={handleChange}
              />
              <TextField
                label="Profile Pic URL"
                name="profile_pic"
                value={editUser.profile_pic || ""}
                onChange={handleChange}
              />
              {/* <TextField
                label="Address"
                name="address"
                value={editUser.address || ""}
                onChange={handleChange}
              /> */}
              <TextField
                label="Personal Address"
                name="personal_address"
                value={editUser.address.personal_address || ""}
                onChange={handleChange}
              />
              <TextField
                label="Shoping Address"
                name="shoping_address"
                value={editUser.address.shoping_address || ""}
                onChange={handleChange}
              />
              <TextField
                label="Billing Address"
                name="billing_address"
                value={editUser.address.billing_address || ""}
                onChange={handleChange}
              />
              <TextField
                label="Address Village"
                name="address_village"
                value={editUser.address.address_village || ""}
                onChange={handleChange}
              />
              <TextField
                label="Landmark"
                name="landmark"
                value={editUser.address.landmark || ""}
                onChange={handleChange}
              />
              <TextField
                label="City"
                name="city"
                value={editUser.address.city || ""}
                onChange={handleChange}
              />
              <TextField
                label="State"
                name="state"
                value={editUser.address.state || ""}
                onChange={handleChange}
              />
              <TextField
                label="Country"
                name="country"
                value={editUser.address.country || ""}
                onChange={handleChange}
              />
              <TextField
                label="Zip"
                name="zip"
                value={editUser.address.zip || ""}
                onChange={handleChange}
              />
              <TextField
                label="Account Status"
                name="isActive"
                value={editUser.isActive || ""}
                onChange={handleChange}
              />
              <TextField
                label="Email Status"
                name="emailVerified"
                value={editUser.emailVerified || ""}
                onChange={handleChange}
              />
              <TextField
                label="Phone Status"
                name="phoneVerified"
                value={editUser.phoneVerified || ""}
                onChange={handleChange}
              />


            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={toast.open} autoHideDuration={3000} onClose={closeToast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Admin;
