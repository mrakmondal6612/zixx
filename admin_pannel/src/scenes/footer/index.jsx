import React, { useState, useEffect } from 'react';
import { Box, Button, Card, TextField, Typography, Grid, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { tokensDark, tokensLight } from '../../theme';
import Header from '../../components/Header';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import getApiBase from '@utils/apiBase';
import FooterServices from './FooterServices';

const getAuthHeader = () => {
  try {
    const token = localStorage.getItem('token') || '';
    if (!token) return '';
    // If token already includes 'Bearer', return as-is, else prefix
    return token.startsWith('Bearer') ? token : `Bearer ${token}`;
  } catch (e) {
    return '';
  }
};


// Lightweight toast fallback for dev: replace react-toastify
const toast = {
  success: (msg) => { try { console.log('SUCCESS:', msg); } catch{} alert(msg); },
  error: (msg) => { try { console.error('ERROR:', msg); } catch{} alert(msg); }
};

const FooterManagement = () => {
  const theme = useTheme();
  const colors = theme.palette.mode === 'dark' ? tokensDark : tokensLight;
  const authHeader = getAuthHeader;
  // Use centralized API base helper so DEV mode uses local proxy and
  // production resolves to the deployed backend. This avoids direct
  // cross-origin requests during local dev when VITE_BACKEND_SERVER is set.
  const backendUrl = getApiBase();

  const [footerData, setFooterData] = useState({
    logo: '',
    description: '',
    contactInfo: {
      address: '',
      phone: '',
      email: '',
    },
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
    },
    quickLinks: [],
    accountLinks: [],
    exclusive: { title: 'Exclusive', subtitle: 'Subscribe', note: 'Get 10% off your first order' },
    socialLinksExtra: [],
    services: [],
    copyrightText: '',
    companyName: 'ZIXX',
  });

  const [newQuickLink, setNewQuickLink] = useState({ title: '', url: '' });
  const [newAccountLink, setNewAccountLink] = useState({ title: '', url: '' });
  const [newSocialExtra, setNewSocialExtra] = useState({ label: '', url: '' });

  useEffect(() => {
    fetchFooterData();
  }, []);

  const fetchFooterData = async () => {
    try {
      const tokenHeader = getAuthHeader();
      const response = await axios.get(`${backendUrl}/admin/footer`, {
        headers: tokenHeader ? { Authorization: tokenHeader } : {},
        withCredentials: true,
      });
      // Normalize response so missing arrays/objects don't break the UI
      const data = response.data || {};
      // prepare default services if none present so admin can edit them
      const defaultServices = [
        { icon: '', title: 'FREE AND FAST DELIVERY', description: 'Free delivery for all orders over ₹140' },
        { icon: '', title: '24/7 CUSTOMER SERVICE', description: 'Friendly 24/7 customer support' },
        { icon: '', title: 'MONEY BACK GUARANTEE', description: 'We return money within 30 days' }
      ];

      setFooterData({
        logo: data.logo || '',
        description: data.description || '',
        contactInfo: data.contactInfo || { address: '', phone: '', email: '' },
        socialLinks: data.socialLinks || { facebook: '', twitter: '', instagram: '', linkedin: '' },
        quickLinks: Array.isArray(data.quickLinks) ? data.quickLinks : [],
        accountLinks: Array.isArray(data.accountLinks) ? data.accountLinks : [],
        exclusive: data.exclusive || { title: 'Exclusive', subtitle: 'Subscribe', note: 'Get 10% off your first order' },
        socialLinksExtra: Array.isArray(data.socialLinksExtra) ? data.socialLinksExtra : [],
        services: Array.isArray(data.services) && data.services.length > 0 ? data.services : defaultServices,
        copyrightText: data.copyrightText || '',
        companyName: data.companyName || 'ZIXX'
      });

      // Cache footer data for other components (like order shipping labels)
      try {
        localStorage.setItem('admin_footer_data', JSON.stringify({
          companyName: data.companyName || 'ZIXX',
          contactInfo: data.contactInfo || { address: '', phone: '', email: '' }
        }));
      } catch (e) {
        console.warn('Failed to cache footer data in localStorage', e);
      }
    } catch (error) {
      console.error('ERROR: Error fetching footer data', error?.response?.data || error.message || error);
      toast.error('Error fetching footer data');
    }
  };

  const setServices = (services) => {
    setFooterData(prev => ({ ...prev, services }));
  };

  const handleChange = (e, section, field) => {
    if (section) {
      setFooterData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: e.target.value
        }
      }));
    } else {
      setFooterData(prev => ({
        ...prev,
        [field]: e.target.value
      }));
    }
  };

  const handleQuickLinkChange = (e, field) => {
    setNewQuickLink(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const addQuickLink = () => {
    if (newQuickLink.title && newQuickLink.url) {
      setFooterData(prev => ({
        ...prev,
        quickLinks: [...prev.quickLinks, newQuickLink]
      }));
      setNewQuickLink({ title: '', url: '' });
    }
  };

  const addAccountLink = () => {
    if (newAccountLink.title && newAccountLink.url) {
      setFooterData(prev => ({
        ...prev,
        accountLinks: [...(prev.accountLinks || []), newAccountLink]
      }));
      setNewAccountLink({ title: '', url: '' });
    }
  };

  // Add empty editable row for inline editing (allows adding multiple entries)
  const addQuickLinkInline = () => {
    setFooterData(prev => ({ ...prev, quickLinks: [...(prev.quickLinks || []), { title: '', url: '' }] }));
  };

  const addAccountLinkInline = () => {
    setFooterData(prev => ({ ...prev, accountLinks: [...(prev.accountLinks || []), { title: '', url: '' }] }));
  };

  const addSocialExtraInline = () => {
    setFooterData(prev => ({ ...prev, socialLinksExtra: [...(prev.socialLinksExtra || []), { label: '', url: '' }] }));
  };

  const removeQuickLink = (index) => {
    setFooterData(prev => ({
      ...prev,
      quickLinks: prev.quickLinks.filter((_, i) => i !== index)
    }));
  };

  const removeAccountLink = (index) => {
    setFooterData(prev => ({
      ...prev,
      accountLinks: (prev.accountLinks || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.put(
        `${backendUrl}/admin/footer`,
        footerData,
        {
          headers: {
            Authorization: authHeader()
          }
          ,
          withCredentials: true
        }
      );
      // Update local UI state with server response to reflect applied changes
      if (response && response.data) setFooterData(response.data);
      toast.success('Footer updated successfully');
    } catch (error) {
      console.error('ERROR: Error updating footer', error?.response?.data || error.message || error);
      toast.error('Error updating footer');
    }
  };

  return (
    <Box m="20px">
      <Header title="FOOTER MANAGEMENT" subtitle="Manage Website Footer Content" />

      <Card sx={{ p: 3, backgroundColor: colors.primary[400] }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h5" mb={2}>Basic Information</Typography>
            <TextField
              fullWidth
              label="Company Name"
              value={footerData.companyName}
              onChange={(e) => handleChange(e, null, 'companyName')}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Logo URL"
              value={footerData.logo}
              onChange={(e) => handleChange(e, null, 'logo')}
              margin="normal"
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={footerData.description}
              onChange={(e) => handleChange(e, null, 'description')}
              margin="normal"
            />
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12}>
            <Typography variant="h5" mb={2}>Contact Information</Typography>
            <TextField
              fullWidth
              label="Address"
              value={footerData.contactInfo.address}
              onChange={(e) => handleChange(e, 'contactInfo', 'address')}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Phone"
              value={footerData.contactInfo.phone}
              onChange={(e) => handleChange(e, 'contactInfo', 'phone')}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              value={footerData.contactInfo.email}
              onChange={(e) => handleChange(e, 'contactInfo', 'email')}
              margin="normal"
            />
          </Grid>

          {/* Social Links */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h5" mb={2}>Social Links</Typography>
              <IconButton size="small" onClick={addSocialExtraInline} color="primary"><AddIcon /></IconButton>
            </Box>
            <TextField
              fullWidth
              label="Facebook URL"
              value={footerData.socialLinks.facebook}
              onChange={(e) => handleChange(e, 'socialLinks', 'facebook')}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Twitter URL"
              value={footerData.socialLinks.twitter}
              onChange={(e) => handleChange(e, 'socialLinks', 'twitter')}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Instagram URL"
              value={footerData.socialLinks.instagram}
              onChange={(e) => handleChange(e, 'socialLinks', 'instagram')}
              margin="normal"
            />
            <TextField
              fullWidth
              label="LinkedIn URL"
              value={footerData.socialLinks.linkedin}
              onChange={(e) => handleChange(e, 'socialLinks', 'linkedin')}
              margin="normal"
            />

            <Typography variant="subtitle1" mt={2}>Additional Social Links</Typography>
            {(footerData.socialLinksExtra || []).map((s, idx) => (
              <Box key={idx} display="flex" alignItems="center" gap={1} mt={1}>
                <TextField label="Label" value={s.label} onChange={(e) => setFooterData(prev => ({
                  ...prev,
                  socialLinksExtra: prev.socialLinksExtra.map((si, i) => i === idx ? { ...si, label: e.target.value } : si)
                }))} />
                <TextField label="URL" value={s.url} onChange={(e) => setFooterData(prev => ({
                  ...prev,
                  socialLinksExtra: prev.socialLinksExtra.map((si, i) => i === idx ? { ...si, url: e.target.value } : si)
                }))} />
                <IconButton onClick={() => setFooterData(prev => ({ ...prev, socialLinksExtra: prev.socialLinksExtra.filter((_, i) => i !== idx) }))} color="error"><DeleteIcon /></IconButton>
              </Box>
            ))}
            <Box display="flex" alignItems="center" gap={1} mt={2}>
              <TextField label="New Social Label" value={newSocialExtra.label} onChange={(e) => setNewSocialExtra(prev => ({ ...prev, label: e.target.value }))} />
              <TextField label="New Social URL" value={newSocialExtra.url} onChange={(e) => setNewSocialExtra(prev => ({ ...prev, url: e.target.value }))} />
              <IconButton onClick={() => {
                if (newSocialExtra.label && newSocialExtra.url) {
                  setFooterData(prev => ({ ...prev, socialLinksExtra: [...(prev.socialLinksExtra || []), { label: newSocialExtra.label, url: newSocialExtra.url }] }));
                  setNewSocialExtra({ label: '', url: '' });
                }
              }} color="primary"><AddIcon /></IconButton>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h5" mb={2}>Quick Links</Typography>
              <IconButton size="small" onClick={addQuickLinkInline} color="primary"><AddIcon /></IconButton>
            </Box>
            {footerData.quickLinks.map((link, index) => (
              <Box key={index} display="flex" alignItems="center" mb={2}>
                <TextField
                  sx={{ mr: 1 }}
                  label="Title"
                  value={link.title}
                  onChange={(e) => setFooterData(prev => ({
                    ...prev,
                    quickLinks: prev.quickLinks.map((l, i) => i === index ? { ...l, title: e.target.value } : l)
                  }))}
                />
                <TextField
                  sx={{ mr: 1 }}
                  label="URL"
                  value={link.url}
                  onChange={(e) => setFooterData(prev => ({
                    ...prev,
                    quickLinks: prev.quickLinks.map((l, i) => i === index ? { ...l, url: e.target.value } : l)
                  }))}
                />
                <IconButton onClick={() => removeQuickLink(index)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Box display="flex" alignItems="center" mb={2}>
              <TextField
                sx={{ mr: 1 }}
                label="New Link Title"
                value={newQuickLink.title}
                onChange={(e) => handleQuickLinkChange(e, 'title')}
              />
              <TextField
                sx={{ mr: 1 }}
                label="New Link URL"
                value={newQuickLink.url}
                onChange={(e) => handleQuickLinkChange(e, 'url')}
              />
              <IconButton onClick={addQuickLink} color="primary">
                <AddIcon />
              </IconButton>
            </Box>
          </Grid>

          {/* Account Links */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h5" mb={2}>Account Links (Displayed in Account column)</Typography>
              <IconButton size="small" onClick={addAccountLinkInline} color="primary"><AddIcon /></IconButton>
            </Box>
            {(footerData.accountLinks || []).map((link, index) => (
              <Box key={index} display="flex" alignItems="center" mb={2}>
                <TextField
                  sx={{ mr: 1 }}
                  label="Title"
                  value={link.title}
                  onChange={(e) => setFooterData(prev => ({
                    ...prev,
                    accountLinks: prev.accountLinks.map((l, i) => i === index ? { ...l, title: e.target.value } : l)
                  }))}
                />
                <TextField
                  sx={{ mr: 1 }}
                  label="URL"
                  value={link.url}
                  onChange={(e) => setFooterData(prev => ({
                    ...prev,
                    accountLinks: prev.accountLinks.map((l, i) => i === index ? { ...l, url: e.target.value } : l)
                  }))}
                />
                <IconButton onClick={() => removeAccountLink(index)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
            <Box display="flex" alignItems="center" mb={2}>
              <TextField
                sx={{ mr: 1 }}
                label="New Account Title"
                value={newAccountLink.title}
                onChange={(e) => setNewAccountLink(prev => ({ ...prev, title: e.target.value }))}
              />
              <TextField
                sx={{ mr: 1 }}
                label="New Account URL"
                value={newAccountLink.url}
                onChange={(e) => setNewAccountLink(prev => ({ ...prev, url: e.target.value }))}
              />
              <IconButton onClick={addAccountLink} color="primary">
                <AddIcon />
              </IconButton>
            </Box>
          </Grid>

          {/* Exclusive Section */}
          <Grid item xs={12}>
            <Typography variant="h5" mb={2}>Exclusive Section</Typography>
            <TextField
              fullWidth
              label="Title"
              value={footerData.exclusive?.title}
              onChange={(e) => setFooterData(prev => ({ ...prev, exclusive: { ...prev.exclusive, title: e.target.value } }))}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Subtitle"
              value={footerData.exclusive?.subtitle}
              onChange={(e) => setFooterData(prev => ({ ...prev, exclusive: { ...prev.exclusive, subtitle: e.target.value } }))}
              margin="normal"
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Note"
              value={footerData.exclusive?.note}
              onChange={(e) => setFooterData(prev => ({ ...prev, exclusive: { ...prev.exclusive, note: e.target.value } }))}
              margin="normal"
            />
          </Grid>

          {/* Footer Services Section */}
          <Grid item xs={12}>
            <FooterServices services={footerData.services || []} setServices={setServices} />
          </Grid>

          {/* Copyright Text */}
          <Grid item xs={12}>
            <Typography variant="h5" mb={2}>Copyright Information</Typography>
            <TextField
              fullWidth
              label="Copyright Text"
              value={footerData.copyrightText}
              onChange={(e) => handleChange(e, null, 'copyrightText')}
              margin="normal"
            />
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleSubmit}
              sx={{ mt: 2 }}
            >
              Save Footer Changes
            </Button>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};

export default FooterManagement;