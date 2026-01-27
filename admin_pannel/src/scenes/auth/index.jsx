import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, CardHeader, Divider, Grid, Stack, TextField, Typography, Select, MenuItem, Snackbar, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Header from '@components/Header';
import { getApiBase } from '@utils/apiBase';

const apiBase = getApiBase();

const AuthManagement = () => {
  const theme = useTheme();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ page: 'login', title: '', description: '', bannerImage: '', active: true });
  const [editId, setEditId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });
  const closeToast = () => setToast((t) => ({ ...t, open: false }));

  const token = useMemo(() => localStorage.getItem('token') || '', []);
  const headers = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }), [token]);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/admin/auth-pages`, { headers, credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load');
      setList(json.data || []);
    } catch (e) {
      showToast(e.message || 'Load failed', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, []);

  const handleUpload = async () => {
    if (!imageFile) { showToast('Select image file', 'error'); return; }
    try {
      const fd = new FormData();
      fd.append('image', imageFile);
      const res = await fetch(`${apiBase}/admin/auth-pages/upload`, { method: 'POST', headers: { Authorization: token ? `Bearer ${token}` : '' }, body: fd, credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || 'Upload failed');
      setForm(f => ({ ...f, bannerImage: json.url || '' }));
      showToast('Image uploaded', 'success');
    } catch (e) { showToast(e.message || 'Upload failed', 'error'); }
  };

  // Create removed: admin should only edit existing auth pages. Use the list -> Edit flow.

  const startEdit = (item) => { setEditId(item._id); setForm({ page: item.page, title: item.title || '', description: item.description || '', bannerImage: item.bannerImage || '', active: !!item.active }); };
  const cancelEdit = () => { setEditId(null); setForm({ page: 'login', title: '', description: '', bannerImage: '', active: true }); };

  const saveEdit = async () => {
    try {
      // Ensure edits are published by default: if admin didn't explicitly set active=false, publish (active=true)
      const payload = { ...form };
      if (typeof payload.active === 'undefined' || payload.active !== false) payload.active = true;
      const res = await fetch(`${apiBase}/admin/auth-pages/${editId}`, { method: 'PATCH', headers, body: JSON.stringify(payload), credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || 'Save failed');
      cancelEdit();
      await fetchList();
      // Warm public endpoint so frontend sees update immediately
      try { await fetch(`${apiBase.replace(/\/admin$/, '')}/auth-pages/${encodeURIComponent(form.page)}`, { credentials: 'include' }); } catch (e) { /* ignore */ }
      showToast('Auth page updated and published', 'success');
    } catch (e) { showToast(e.message || 'Save failed', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    try {
      const res = await fetch(`${apiBase}/admin/auth-pages/${id}`, { method: 'DELETE', headers, credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || 'Delete failed');
      await fetchList();
      showToast('Auth page deleted', 'success');
    } catch (e) { showToast(e.message || 'Delete failed', 'error'); }
  };

  return (
    <Box p={3}>
      <Header title="AUTH PAGE" subtitle="Manage Login / Signup page content" />
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardHeader title="Edit / Upload" />
            <Divider />
            <CardContent>
              <Stack spacing={2}>
                <Select fullWidth value={form.page} onChange={(e) => setForm({ ...form, page: e.target.value })} disabled={!editId}>
                  <MenuItem value={'login'}>Login</MenuItem>
                  <MenuItem value={'signup'}>Signup</MenuItem>
                </Select>
                <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth disabled={!editId} />
                <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline minRows={3} disabled={!editId} />
                <Stack direction="row" spacing={2}>
                  <Button variant="outlined" component="label" disabled={!editId}>Choose Image<input type="file" accept="image/*" hidden onChange={(e) => setImageFile(e.target.files?.[0] || null)} /></Button>
                  <Button variant="contained" onClick={handleUpload} disabled={!editId || !imageFile}>Upload</Button>
                </Stack>
                <TextField label="Banner Image URL" value={form.bannerImage} onChange={(e) => setForm({ ...form, bannerImage: e.target.value })} fullWidth disabled={!editId} />
                <Select value={form.active ? 'true' : 'false'} onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })} disabled={!editId}>
                  <MenuItem value={'true'}>Active</MenuItem>
                  <MenuItem value={'false'}>Inactive</MenuItem>
                </Select>
                <Stack direction="row" spacing={2}>
                  <Button variant="outlined" onClick={() => { setForm({ page: 'login', title: '', description: '', bannerImage: '', active: true }); setImageFile(null); }} disabled={!editId}>Reset</Button>
                  {editId ? (
                    <Button variant="contained" onClick={saveEdit}>Save</Button>
                  ) : (
                    <Button variant="contained" disabled onClick={() => {}}>
                      Select an item to edit
                    </Button>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardHeader title="Existing Auth Pages" subheader={loading ? 'Loading...' : `${list.length} items`} />
            <Divider />
            <CardContent>
              <Stack spacing={2}>
                {list.map((p) => (
                  <Box key={p._id} display="flex" alignItems="center" gap={2}>
                    <img src={p.bannerImage || '/placeholder.svg'} alt={p.title} style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 8 }} />
                    <Box flex={1}>
                      <Typography variant="subtitle1">{p.page}</Typography>
                      <Typography variant="body2">{p.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.description}</Typography>
                    </Box>
                    <Stack>
                      <Button size="small" onClick={() => startEdit(p)}>Edit</Button>
                      <Button size="small" color="error" onClick={() => handleDelete(p._id)}>Delete</Button>
                    </Stack>
                  </Box>
                ))}
                {list.length === 0 && !loading && <Typography variant="body2" color="text.secondary">No auth page content yet.</Typography>}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
        <Snackbar open={toast.open} autoHideDuration={3000} onClose={closeToast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={closeToast} severity={toast.severity} sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        </Snackbar>
    </Box>
  );
};

export default AuthManagement;
