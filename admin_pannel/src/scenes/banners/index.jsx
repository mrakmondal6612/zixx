import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Switch } from '@mui/material';
import { getApiBase } from '@utils/apiBase';

const apiBase = getApiBase();

const Banners = () => {
  const theme = useTheme();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    page: 'home',
    position: 'hero',
    imageUrl: '',
    heading: '',
    description: '',
    linkText: 'Shop Now',
    linkUrl: '/',
    active: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // Filters for existing list
  const [filter, setFilter] = useState({ page: 'all', position: 'all', active: 'all' });

  // Inline edit state
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const token = useMemo(() => localStorage.getItem('token') || '', []);

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  }), [token]);

  const fetchList = async () => {
    try {
      setLoading(true);
      // Build query from filters (client route also supports same params; admin list shows all if no filter)
      const params = new URLSearchParams();
      if (filter.page !== 'all') params.append('page', filter.page);
      if (filter.position !== 'all') params.append('position', filter.position);
      if (filter.active !== 'all') params.append('active', filter.active);
      const url = `${apiBase}/admin/banners${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, { headers, credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load banners');
      setList(json.data || []);
    } catch (e) {
      alert(`Load failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);
  useEffect(() => { fetchList(); }, [filter.page, filter.position, filter.active]);

  // Preview URL for selected file or typed URL
  useEffect(() => {
    let url = '';
    if (imageFile) {
      url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(form.imageUrl?.trim() || '');
  }, [imageFile, form.imageUrl]);

  const pageOptions = [
    { value: 'home', label: 'Home' },
    { value: 'women', label: 'Women' },
    { value: 'men', label: 'Men' },
    { value: 'kids', label: 'Kids' },
  ];

  const positionOptions = {
    home: [
      { value: 'hero', label: 'Hero (Top)' },
      { value: 'new-arrivals', label: 'New Arrivals' },
      { value: 'featured', label: 'Featured' },
      { value: 'men-promo', label: 'Men Promo' },
    ],
    // Women page uses: featured (top), summer (section banner), new (new arrivals)
    women: [
      { value: 'featured', label: 'Featured (Top)' },
      { value: 'summer', label: 'Seasonal/Summer' },
      { value: 'new', label: 'New Arrivals' },
    ],
    // Men page uses: featured (top), best (best sellers), new (new arrivals)
    men: [
      { value: 'featured', label: 'Featured (Top)' },
      { value: 'best', label: 'Best Sellers' },
      { value: 'new', label: 'New Arrivals' },
    ],
    // Kids: mirror men for flexibility
    kids: [
      { value: 'featured', label: 'Featured (Top)' },
      { value: 'best', label: 'Best Sellers' },
      { value: 'new', label: 'New Arrivals' },
    ],
  };

  const currentPositions = positionOptions[form.page] || positionOptions.home;

  const handleTestFetch = async () => {
    const url = `${apiBase}/clients/banners?page=${encodeURIComponent(form.page)}&position=${encodeURIComponent(form.position)}&active=true`;
    try {
      const res = await fetch(url, { credentials: 'include' });
      const json = await res.json();
      alert(`Client fetch: ${res.status} — ${json?.data?.length ?? 0} item(s) for ${form.page}/${form.position}`);
    } catch (e) {
      alert('Client test fetch failed');
    }
  };

  const handleUpload = async () => {
    if (!imageFile) return alert('Select an image file first');
    try {
      const fd = new FormData();
      fd.append('image', imageFile);
      const res = await fetch(`${apiBase}/admin/banners/upload`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        body: fd,
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || 'Upload failed');
      // Save the uploaded URL into the form
      setForm((f) => ({ ...f, imageUrl: (json.url || '').trim() }));

      // If a heading is already provided, auto-create the banner to publish immediately
      const hasHeading = (form.heading || '').trim().length > 0;
      if (hasHeading) {
        // Normalize payload
        const normalizedLink = (() => {
          const lu = (form.linkUrl || '').trim();
          const isAbs = /^https?:\/\//i.test(lu);
          if (!lu) return '/';
          if (isAbs || lu.startsWith('/')) return lu;
          return '/' + lu;
        })();
        const payload = {
          ...form,
          page: String(form.page || '').toLowerCase().trim(),
          position: String(form.position || '').toLowerCase().trim(),
          imageUrl: (json.url || '').trim(),
          linkUrl: normalizedLink,
        };
        const createRes = await fetch(`${apiBase}/admin/banners`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          credentials: 'include',
        });
        const createJson = await createRes.json();
        if (!createRes.ok || !createJson.ok) throw new Error(createJson.message || 'Create failed');
        // Reset form and refresh list
        setForm({ page: 'home', position: 'hero', imageUrl: '', heading: '', description: '', linkText: 'Shop Now', linkUrl: '/', active: true });
        setImageFile(null);
        await fetchList();
        alert('Image uploaded and banner created');
      } else {
        alert('Image uploaded. Enter a Heading and click "Create Banner" to publish.');
      }
    } catch (e) {
      alert(e.message || 'Upload failed');
    }
  };

  const handleCreate = async () => {
    try {
      if (!form.imageUrl || !form.heading) return alert('Image and Heading are required');
      // Normalize payload
      const normalizedLink = (() => {
        const lu = (form.linkUrl || '').trim();
        const isAbs = /^https?:\/\//i.test(lu);
        if (!lu) return '/';
        if (isAbs || lu.startsWith('/')) return lu;
        return '/' + lu;
      })();
      const payload = {
        ...form,
        page: String(form.page || '').toLowerCase().trim(),
        position: String(form.position || '').toLowerCase().trim(),
        imageUrl: String(form.imageUrl || '').trim(),
        linkUrl: normalizedLink,
      };
      const res = await fetch(`${apiBase}/admin/banners`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || 'Create failed');
      setForm({ page: 'home', position: 'hero', imageUrl: '', heading: '', description: '', linkText: 'Shop Now', linkUrl: '/', active: true });
      setImageFile(null);
      await fetchList();
      alert('Banner created');
    } catch (e) {
      alert(e.message || 'Create failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this banner?')) return;
    try {
      const res = await fetch(`${apiBase}/admin/banners/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || 'Delete failed');
      await fetchList();
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      const res = await fetch(`${apiBase}/admin/banners/${banner._id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ active: !banner.active }),
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || 'Update failed');
      await fetchList();
    } catch (e) {
      alert(e.message || 'Update failed');
    }
  };

  const startEdit = (b) => {
    setEditId(b._id);
    setEditForm({
      page: b.page,
      position: b.position,
      imageUrl: b.imageUrl,
      heading: b.heading,
      description: b.description,
      linkText: b.linkText,
      linkUrl: b.linkUrl,
      active: !!b.active,
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    try {
      // Normalize payload
      const normalizedLink = (() => {
        const lu = (editForm.linkUrl || '').trim();
        const isAbs = /^https?:\/\//i.test(lu);
        if (!lu) return '/';
        if (isAbs || lu.startsWith('/')) return lu;
        return '/' + lu;
      })();
      const payload = {
        ...editForm,
        page: String(editForm.page || '').toLowerCase().trim(),
        position: String(editForm.position || '').toLowerCase().trim(),
        imageUrl: String(editForm.imageUrl || '').trim(),
        linkUrl: normalizedLink,
      };
      const res = await fetch(`${apiBase}/admin/banners/${editId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || 'Save failed');
      cancelEdit();
      await fetchList();
    } catch (e) {
      alert(e.message || 'Save failed');
    }
  };

  const duplicateBanner = async (b) => {
    try {
      const normalizedLink = (() => {
        const lu = (b.linkUrl || '').trim();
        const isAbs = /^https?:\/\//i.test(lu);
        if (!lu) return '/';
        if (isAbs || lu.startsWith('/')) return lu;
        return '/' + lu;
      })();
      const payload = { ...b };
      delete payload._id;
      payload.heading = `${payload.heading || 'Banner'} (copy)`;
      payload.page = String(payload.page || '').toLowerCase().trim();
      payload.position = String(payload.position || '').toLowerCase().trim();
      payload.imageUrl = String(payload.imageUrl || '').trim();
      payload.linkUrl = normalizedLink;
      const res = await fetch(`${apiBase}/admin/banners`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.message || 'Duplicate failed');
      await fetchList();
    } catch (e) {
      alert(e.message || 'Duplicate failed');
    }
  };

  return (
    <Box p={3}>
      <Typography 
        variant="h4" fontWeight={700} mb={2} 
        sx={{
          backgroundColor:  theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.background.default,
          fontWeight: 'bold',
          color: theme.palette.mode === 'dark' ? 'white' : 'black',
         }}
      >
        Banners</Typography>

      <Grid 
        container spacing={2}
      >
        <Grid item xs={12} md={5}>
          <Card>
            <CardHeader 
              sx={{ 
                backgroundColor:  theme.palette.mode === 'dark' ? theme.palette.background.default : "#838383",
                
              }}
              title="Create / Upload" 
            />
            <Divider 
            
            />
            <CardContent
            sx={{ 
              backgroundColor:  theme.palette.mode === 'dark' ? theme.palette.background.default : "#838383",
              color: theme.palette.mode === 'dark' ? 'white' : 'white',
              fontWeight: 'bold',
            }}
            >
              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <Select fullWidth value={form.page} onChange={(e) => setForm({ ...form, page: String(e.target.value), position: (positionOptions[String(e.target.value)]?.[0]?.value) || 'hero' })}>
                    {pageOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                  <Select 
                    sx={{ 
                      backgroundColor:  theme.palette.mode === 'dark' ? theme.palette.background.default : "#838383",
                      color: theme.palette.mode === 'dark' ? 'white' : 'white',
              fontWeight: 'bold',
                    }}
                    fullWidth value={form.position} onChange={(e) => setForm({ ...form, position: String(e.target.value) })}>
                    {currentPositions.map(opt => (
                      <MenuItem  key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Button variant="outlined" component="label">
                    Choose Image
                    <input type="file" accept="image/*" hidden onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                  </Button>
                  <Button variant="contained" onClick={handleUpload}>Upload</Button>
                </Stack>
                <TextField label="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} fullWidth />
                {/* Live Preview */}
                {(previewUrl || form.heading) && (
                  <Box display="flex" gap={2} alignItems="center">
                    <img src={previewUrl || '/placeholder.svg'} alt="preview" style={{ width: 160, height: 90, objectFit: 'cover', borderRadius: 8 }} />
                    <Box>
                      <Typography variant="subtitle2">{form.heading || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{form.page} / {form.position}</Typography>
                    </Box>
                  </Box>
                )}
                <TextField label="Heading" value={form.heading} onChange={(e) => setForm({ ...form, heading: e.target.value })} fullWidth />
                <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline minRows={2} />
                <Stack direction="row" spacing={2}>
                  <TextField label="Link Text" value={form.linkText} onChange={(e) => setForm({ ...form, linkText: e.target.value })} fullWidth />
                  <TextField label="Link URL" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} fullWidth />
                </Stack>
                <Select value={form.active ? 'true' : 'false'} onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })}>
                  <MenuItem value={'true'}>Active</MenuItem>
                  <MenuItem value={'false'}>Inactive</MenuItem>
                </Select>
                <Stack direction="row" spacing={2}>
                  <Button variant="outlined" onClick={handleTestFetch}>Test Fetch</Button>
                  <Button variant="contained" onClick={handleCreate}>Create Banner</Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card
            sx={{ 
              backgroundColor:  theme.palette.mode === 'dark' ? theme.palette.background.default : "#838383",
              color: theme.palette.mode === 'dark' ? 'white' : 'white',
              fontWeight: 'bold',
            }}
          > 
            <CardHeader title="Existing Banners" subheader={loading ? 'Loading...' : `${list.length} items`} />
            <Divider />
            <CardContent>
              {/* Filters */}
              <Stack direction="row" spacing={2} mb={2}>
                <Select size="small" value={filter.page} onChange={(e) => setFilter({ ...filter, page: String(e.target.value), position: 'all' })}>
                  <MenuItem value={'all'}>All Pages</MenuItem>
                  {pageOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
                <Select size="small" value={filter.position} onChange={(e) => setFilter({ ...filter, position: String(e.target.value) })}>
                  <MenuItem value={'all'}>All Positions</MenuItem>
                  {(filter.page === 'all' ? Object.values(positionOptions).flat() : positionOptions[filter.page] || []).map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
                <Select size="small" value={filter.active} onChange={(e) => setFilter({ ...filter, active: String(e.target.value) })}>
                  <MenuItem value={'all'}>All</MenuItem>
                  <MenuItem value={'true'}>Active</MenuItem>
                  <MenuItem value={'false'}>Inactive</MenuItem>
                </Select>
                <Button size="small" onClick={() => setFilter({ page: 'all', position: 'all', active: 'all' })}>Reset</Button>
              </Stack>

              <Stack spacing={2}>
                {list.map((b) => (
                  <Box key={b._id} display="flex" alignItems="center" gap={2}>
                    <img src={b.imageUrl} alt={b.heading} style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 8 }} />
                    {editId === b._id ? (
                      <Box flex={1}>
                        <Stack direction="row" spacing={2}>
                          <Select size="small" value={editForm.page} onChange={(e) => setEditForm({ ...editForm, page: String(e.target.value), position: (positionOptions[String(e.target.value)]?.[0]?.value) || 'hero' })}>
                            {pageOptions.map(opt => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
                          </Select>
                          <Select size="small" value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: String(e.target.value) })}>
                            {(positionOptions[editForm.page] || positionOptions.home).map(opt => (<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>))}
                          </Select>
                          <Select size="small" value={editForm.active ? 'true' : 'false'} onChange={(e) => setEditForm({ ...editForm, active: e.target.value === 'true' })}>
                            <MenuItem value={'true'}>Active</MenuItem>
                            <MenuItem value={'false'}>Inactive</MenuItem>
                          </Select>
                        </Stack>
                        <TextField size="small" label="Image URL" value={editForm.imageUrl} onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })} fullWidth sx={{ mt: 1 }} />
                        <TextField size="small" label="Heading" value={editForm.heading} onChange={(e) => setEditForm({ ...editForm, heading: e.target.value })} fullWidth sx={{ mt: 1 }} />
                        <TextField size="small" label="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} fullWidth multiline minRows={2} sx={{ mt: 1 }} />
                        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                          <TextField size="small" label="Link Text" value={editForm.linkText} onChange={(e) => setEditForm({ ...editForm, linkText: e.target.value })} fullWidth />
                          <TextField size="small" label="Link URL" value={editForm.linkUrl} onChange={(e) => setEditForm({ ...editForm, linkUrl: e.target.value })} fullWidth />
                        </Stack>
                      </Box>
                    ) : (
                      <Box flex={1}>
                        <Typography variant="subtitle1">{b.page} / {b.position}</Typography>
                        <Typography variant="body2">{b.heading}</Typography>
                        <Typography variant="caption" color="text.secondary">{b.linkText} → {b.linkUrl}</Typography>
                      </Box>
                    )}
                    {/* Active toggle */}
                    {editId !== b._id && (
                      <Stack alignItems="center" mr={1}>
                        <Typography variant="caption" color="text.secondary">{b.active ? 'Active' : 'Inactive'}</Typography>
                        <Switch size="small" checked={!!b.active} onChange={() => handleToggleActive(b)} />
                      </Stack>
                    )}
                    {/* Actions */}
                    {editId === b._id ? (
                      <>
                        <IconButton color="primary" onClick={saveEdit}><SaveIcon /></IconButton>
                        <IconButton onClick={cancelEdit}><CloseIcon /></IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton onClick={() => startEdit(b)}><EditIcon /></IconButton>
                        <IconButton onClick={() => duplicateBanner(b)}><ContentCopyIcon /></IconButton>
                        <IconButton color="error" onClick={() => handleDelete(b._id)}>
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </Box>
                ))}
                {list.length === 0 && !loading && (
                  <Typography variant="body2" color="text.secondary">No banners yet.</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Banners;
