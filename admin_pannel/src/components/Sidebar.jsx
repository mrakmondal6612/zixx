import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setMode } from "@state";

import {
  Box,
  Divider,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from "@mui/material";

import {
  SettingsOutlined,
  ChevronLeft,
  ChevronRightOutlined,
  HomeOutlined,
  ShoppingCartOutlined,
  Groups2Outlined,
  ReceiptLongOutlined,
  PublicOutlined,
  PointOfSaleOutlined,
  TodayOutlined,
  CalendarMonthOutlined,
  AdminPanelSettingsOutlined,
  TrendingUpOutlined,
  PieChartOutlined,
  LocalShippingOutlined,
  LightModeOutlined,
  DarkModeOutlined,
  Menu as MenuIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import FlexBetween from "./FlexBetween";
import profileImage from "@assets/profile.jpg";
import { getApiBase } from "@utils/apiBase";

const navItems = [
  { text: "Dashboard", icon: <HomeOutlined /> },
  { text: "Client Facing", icon: null },
  { text: "Products", icon: <ShoppingCartOutlined /> },
  { text: "Testimonials", icon: <ReceiptLongOutlined /> },
  { text: "Customers", icon: <Groups2Outlined /> },
  { text: "Orders", icon: <LocalShippingOutlined /> },
  { text: "Transactions", icon: <ReceiptLongOutlined /> },
  { text: "Geography", icon: <PublicOutlined /> },
  { text: "Sales", icon: null },
  { text: "Overview", icon: <PointOfSaleOutlined /> },
  { text: "Daily", icon: <TodayOutlined /> },
  { text: "Monthly", icon: <CalendarMonthOutlined /> },
  { text: "Breakdown", icon: <PieChartOutlined /> },
  { text: "Management", icon: null },
  { text: "Admin", icon: <AdminPanelSettingsOutlined /> },
  { text: "Auth", icon: <ReceiptLongOutlined /> },
  { text: "Banners", icon: <ReceiptLongOutlined /> },
  { text: "Footer", icon: <ReceiptLongOutlined /> },
  { text: "Performance", icon: <TrendingUpOutlined /> },
];

const Sidebar = ({
  user,
  drawerWidth,
  isSidebarOpen,
  setIsSidebarOpen,
  isNonMobile,
}) => {
  const { pathname } = useLocation();
  const [active, setActive] = useState("");
  const navigate = useNavigate();
  const theme = useTheme();
  const dispatch = useDispatch();
  
  
  // Settings menu state
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const settingsOpen = Boolean(settingsAnchor);
  const openSettings = (e) => setSettingsAnchor(e.currentTarget);
  const closeSettings = () => setSettingsAnchor(null);

  // Empty DB modal state
  const [emptyModalOpen, setEmptyModalOpen] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [confirmTokenInput, setConfirmTokenInput] = useState("");
  const [emptyInProgress, setEmptyInProgress] = useState(false);
  const [emptyResult, setEmptyResult] = useState(null);
  const [emptyError, setEmptyError] = useState(null);
  // DB status and init dummy state
  const [dbEmpty, setDbEmpty] = useState(null); // null=unknown, true/false known
  const [initInProgress, setInitInProgress] = useState(false);
  const [initResult, setInitResult] = useState(null);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const onOpen = () => setEmptyModalOpen(true);
    window.addEventListener('openEmptyDatabaseModal', onOpen);
    return () => window.removeEventListener('openEmptyDatabaseModal', onOpen);
  }, []);

  // Poll DB status once on mount to determine whether to show Dummy Dataset button
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE || ''}/admin/db-status`, { credentials: 'include' });
        if (!res.ok) return setDbEmpty(null);
        const j = await res.json();
        setDbEmpty(Boolean(j.empty));
      } catch (e) {
        setDbEmpty(null);
      }
    };
    check();
  }, []);

  const handleInitDummy = async () => {
    setInitError(null);
    setInitResult(null);
    try {
      setInitInProgress(true);
      const res = await fetch(`${import.meta.env.VITE_API_BASE || ''}/admin/init-dummy`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const j = await res.json();
      setInitInProgress(false);
      if (!res.ok) {
        setInitError(j?.msg || j?.error || 'Failed to initialize dummy data');
        return;
      }
      setInitResult(j);
      // refresh db status
      setDbEmpty(false);
    } catch (e) {
      setInitInProgress(false);
      setInitError(String(e));
    }
  };

  const handleEmptyConfirm = async () => {
    setEmptyError(null);
    setEmptyResult(null);
    if (confirmPhrase.trim() !== 'EMPTY DATABASE') {
      setEmptyError('Please type EXACTLY "EMPTY DATABASE" to confirm');
      return;
    }
    // confirm token is optional client-side; server will validate if required
    try {
      setEmptyInProgress(true);
      const res = await fetch(`${import.meta.env.VITE_API_BASE || ''}/admin/empty-database`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmToken: confirmTokenInput.trim() }),
      });
      const json = await res.json();
      setEmptyInProgress(false);
      if (!res.ok) {
        setEmptyError(json?.msg || json?.error || 'Failed to empty database');
        return;
      }
      setEmptyResult(json);
    } catch (e) {
      setEmptyInProgress(false);
      setEmptyError(String(e));
    }
  };

  // Resolve avatar/photo URL for user/admin with robust fallbacks
  const resolveAvatarSrc = () => {
    try {
      const candidates = [
        user && user.profile_pic,
        user && (user.photo || user.avatar || user.image || user.imageUrl || user.profileImage || user.picture || user.profilePic || user.profile_photo || user.photoURL),
        user && user.adminPhoto,
        user && user.userPhoto,
      ].filter(Boolean);

      const apiBase = getApiBase();
      const origin = apiBase.replace(/\/?api\/?$/i, '').replace(/\/$/, '');

      for (const c of candidates) {
        const raw = String(c).trim();
        if (!raw) continue;
        // Skip default/placeholder URLs
        if (raw.includes('example.com') || raw.includes('default-profile-pic')) continue;
        if (/^https?:\/\//i.test(raw)) return raw;
        if (raw.startsWith('/')) return origin + raw;
        return `${origin}/${raw}`;
      }
    } catch (e) {}
    return profileImage;
  };

  

  useEffect(() => {
    setActive(pathname.substring(1));
  }, [pathname]);

  return (
    <Box component="nav">
      {isSidebarOpen && (
        <Drawer
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          variant={isNonMobile ? "persistent" : "temporary"}
          anchor="left"
          ModalProps={{ keepMounted: true }}
          sx={{
            width: isNonMobile ? drawerWidth : "85vw",
            "& .MuiDrawer-paper": {
              color: theme.palette.secondary[200],
              backgroundColor: theme.palette.background.alt,
              boxSizing: "border-box",
              borderWidth: isNonMobile ? 0 : "2px",
              width: isNonMobile ? drawerWidth : "85vw",
              maxWidth: isNonMobile ? drawerWidth : "320px",
            },
          }}
        >
          <Box
            width="100%"
            display="flex"
            flexDirection="column"
            height="100%"
            sx={{ pt: { xs: 'calc(56px + env(safe-area-inset-top))', sm: '64px' } }}
          >
            {/* HEADER WITH ZIXX */}
            <Box m="1.5rem 2rem 2rem 3rem">
              <FlexBetween>
                <Box
                  display="flex"
                  alignItems="center"
                  gap="0.5rem"
                  sx={{ cursor: "pointer" }}
                  onClick={() => {
                    let frontend = import.meta.env.VITE_FRONTEND_URL;
                    if (!frontend || typeof frontend !== 'string' || !/^https?:\/\//i.test(frontend)) {
                      frontend = 'https://zixx.in';
                    }
                    try { const u = new URL(frontend); frontend = u.origin; } catch (e) {}
                    window.location.href = `${frontend.replace(/\/$/, '')}/`;
                  }}
                >
                  <Typography variant="h3" fontWeight="bold" sx={{ display: "flex", flexDirection: "column", alignItems: "center" }} color={theme.palette.secondary[100]}>
                    ZIXX
                    <br />
                  <Typography className="text-[10px] text-gray-500 justify-center" color={theme.palette.primary[300]}>
                    ( Return Back )
                  </Typography>
                  </Typography>
                </Box>
                {!isNonMobile && (
                  <IconButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    <ChevronLeft />
                  </IconButton>
                )}
              </FlexBetween>
            </Box>

            {/* NAVIGATION ITEMS */}
            <Box flexGrow={1} display="flex" flexDirection="column">
              <List>
                {navItems.map(({ text, icon }) => {
                  if (!icon) {
                    return (
                      <Typography key={text} sx={{ m: "2.25rem 0 1rem 3rem" }}>
                        {text}
                      </Typography>
                    );
                  }

                  const lcText = text.toLowerCase();

                  return (
                    <ListItem key={text} disablePadding>
                      <ListItemButton
                        onClick={() => {
                          navigate(`/${lcText}`);
                          setActive(lcText);
                          if (!isNonMobile) setIsSidebarOpen(false);
                        }}
                        sx={{
                          backgroundColor:
                            active === lcText
                              ? "#D92030"
                              : "transparent",
                          color:
                            active === lcText
                              ? "#ffffff"
                              : theme.palette.secondary[100],
                          "&:hover": {
                            backgroundColor: active === lcText
                              ? "#D92030"
                              : "rgba(217, 32, 48, 0.1)"
                          }
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            ml: "2rem",
                            color:
                              active === lcText
                                ? "#ffffff"
                                : theme.palette.secondary[200],
                          }}
                        >
                          {icon}
                        </ListItemIcon>
                        <ListItemText primary={text} />
                        {active === lcText && (
                          <ChevronRightOutlined sx={{ ml: "auto" }} />
                        )}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Box>

            {/* FOOTER PROFILE & SYNC */}
            <Divider sx={{ mt: 2, mb: 1 }} />
            <Box
              className="sidebar-profile-section"
              display="flex"
              flexDirection="column"
              alignItems="center"
              mt={1}
              mx={{ xs: 1, sm: 2 }}
              mb={2}
            >
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                width="100%"
              >
                <Box
                  component="img"
                  alt="profile"
                  src={resolveAvatarSrc()}
                  height="48px"
                  width="48px"
                  borderRadius="50%"
                  sx={{ objectFit: "cover", mb: 0.5 }}
                  onError={(e) => { try { e.currentTarget.src = profileImage; } catch (_) {} }}
                />
                <Typography
                  fontWeight="bold"
                  fontSize={{ xs: "0.9rem", sm: "1rem" }}
                  sx={{ color: theme.palette.secondary[100], mb: 1, textAlign: "center" }}
                >
                  {user && (user.name || user.first_name) 
                    ? (user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim()) 
                    : "Admin User"}
                </Typography>
                <Typography
                  fontSize={{ xs: "0.75rem", sm: "0.85rem" }}
                  sx={{ color: theme.palette.secondary[200], mb: 1, textAlign: "center" }}
                >
                  {user?.occupation || user?.role || "Administrator"}
                </Typography>
              </Box>
              <Box
                display="flex"
                flexDirection={{ xs: "column", sm: "row" }}
                alignItems="center"
                justifyContent="center"
                width="100%"
                gap={{ xs: 1, sm: 2 }}
                mt={1}
              >
                <IconButton
                  size="small"
                  onClick={openSettings}
                  sx={{ 
                    color: theme.palette.secondary[300],
                    '&:hover': { 
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.primary.main 
                    }
                  }}
                  title="Settings"
                >
                  <SettingsOutlined sx={{ fontSize: { xs: "20px", sm: "24px" } }} />
                </IconButton>
                {/* {dbEmpty === true ? (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Button
                      variant="contained"
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 700, borderRadius: 2 }}
                      onClick={handleInitDummy}
                      disabled={initInProgress}
                    >
                      {initInProgress ? 'Initializing...' : 'DUMMY DATASET'}
                    </Button>
                  </Box>
                ) : (
                  <Button
                    variant="contained"
                    size="small"
                    color="error"
                    sx={{ 
                      fontWeight: 700, 
                      borderRadius: 2, 
                      px: { xs: 1.5, sm: 2 },
                      py: 0.5,
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      minWidth: { xs: "80px", sm: "auto" },
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onClick={() => {
                      // open destructive confirm modal
                      const ev = new CustomEvent('openEmptyDatabaseModal');
                      window.dispatchEvent(ev);
                    }}
                  >
                    EMPTY DATABASE
                  </Button>
                )}
                {initError && <Alert severity="error" sx={{ mt: 1 }}>{initError}</Alert>}
                {initResult && <Alert severity="success" sx={{ mt: 1 }}>Initialized dummy dataset successfully.</Alert>} */}
              </Box>
              
            </Box>

            {/* Empty Database Confirmation Dialog */}
            <Dialog open={emptyModalOpen} onClose={() => setEmptyModalOpen(false)} maxWidth="sm" fullWidth>
              <DialogTitle color="error">Empty Database (Destructive)</DialogTitle>
              <DialogContent>
                <Typography sx={{ mb: 1 }} color="textSecondary">
                  This action will drop all non-system collections from the connected database. This is irreversible.
                </Typography>
                <Alert severity="warning" sx={{ mb: 1 }}>
                  Only enable this endpoint in a safe development environment. Configure a server-side confirm token and keep it secret — do not expose it to client-side code or commit env files to source control.
                </Alert>
                <TextField
                  label="Type EXACT phrase to confirm"
                  placeholder="EMPTY DATABASE"
                  fullWidth
                  value={confirmPhrase}
                  onChange={(e) => setConfirmPhrase(e.target.value)}
                  sx={{ mb: 1 }}
                />
                <TextField
                  label="One-time confirm token (optional)"
                  placeholder="If your server requires a one-time token, enter it here"
                  fullWidth
                  value={confirmTokenInput}
                  onChange={(e) => setConfirmTokenInput(e.target.value)}
                  sx={{ mb: 1 }}
                />
                {emptyError && <Alert severity="error" sx={{ mt: 1 }}>{emptyError}</Alert>}
                {emptyResult && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    Success: Dropped {Array.isArray(emptyResult.dropped) ? emptyResult.dropped.length : 0} collections.
                    <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{JSON.stringify(emptyResult, null, 2)}</pre>
                  </Alert>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setEmptyModalOpen(false)} disabled={emptyInProgress}>Cancel</Button>
                <Button color="error" variant="contained" onClick={handleEmptyConfirm} disabled={emptyInProgress}>
                  {emptyInProgress ? 'Emptying...' : 'Confirm Empty'}
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Drawer>
      )}

      {/* Settings Menu */}
      {/* EMPTY DATABASE confirmation modal and logic */}
      {/* Using a window event to avoid prop drilling; keeps modal here local to Sidebar */}
      {(() => {
        // local state via closures is awkward in JSX; use hooks near top instead
        return null;
      })()}

      <Menu
        anchorEl={settingsAnchor}
        open={settingsOpen}
        onClose={closeSettings}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        PaperProps={{
          sx: {
            mt: -1,
            minWidth: 220,
            boxShadow: theme.shadows[8],
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
          }
        }}
      >
        {/* <MenuItem 
          onClick={() => { dispatch(setMode()); closeSettings(); }}
          sx={{ 
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          {theme.palette.mode === "dark" ? (
            <LightModeOutlined sx={{ fontSize: "20px" }} />
          ) : (
            <DarkModeOutlined sx={{ fontSize: "20px" }} />
          )}
          <Box>
            <Typography variant="body2" fontWeight="medium">
              Switch to {theme.palette.mode === "dark" ? "Light" : "Dark"} Mode
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Change theme appearance
            </Typography>
          </Box>
        </MenuItem> */}
        
        <MenuItem 
          onClick={() => { setIsSidebarOpen(false); closeSettings(); }}
          sx={{ 
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <ChevronLeft sx={{ fontSize: "20px" }} />
          <Box>
            <Typography variant="body2" fontWeight="medium">
              Close Sidebar
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Hide navigation panel
            </Typography>
          </Box>
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            closeSettings();
            navigate('/admin');
          }}
          sx={{ 
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <AdminPanelSettingsOutlined sx={{ fontSize: "20px" }} />
          <Box>
            <Typography variant="body2" fontWeight="medium">
              Admin Management
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Manage admin users
            </Typography>
          </Box>
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            closeSettings();
            const ok = window.confirm('This will clear all local data and refresh the page. Continue?');
            if (!ok) return;
            try { localStorage.clear(); sessionStorage.clear(); } catch {}
            try { window.location.reload(); } catch {}
          }}
          sx={{ 
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            color: theme.palette.warning.main
          }}
        >
          <CloseIcon sx={{ fontSize: "20px" }} />
          <Box>
            <Typography variant="body2" fontWeight="medium">
              Clear Cache & Reload
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Reset local storage
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Sidebar;
