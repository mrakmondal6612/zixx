import React from "react";
import { Box, Button, Chip, CircularProgress, Typography, TextField, Select, MenuItem, Pagination, IconButton, useTheme } from "@mui/material";
import { LightModeOutlined, DarkModeOutlined } from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { setMode } from "@state";
import {
  useGetAdminTestimonialsQuery,
  useApproveAdminTestimonialMutation,
  useUpdateAdminTestimonialMutation,
  useDeleteAdminTestimonialMutation,
} from "@state/api";

const Row = ({ t, onApprove, onDelete, onEdit }) => {
  const theme = useTheme();
  const mode = (theme && theme.palette && theme.palette.mode) ? theme.palette.mode : 'light';
  const displayName = t.user ? `${t.user.first_name} ${t.user.last_name}`.trim() : t.name || "Anonymous";
  const profilePic = t.user?.profile_pic;
  const [editing, setEditing] = React.useState(false);
  const [editData, setEditData] = React.useState({
    name: t.name || '',
    text: t.text || '',
    rating: t.rating || 5
  });

  const handleSave = () => {
    onEdit(t._id, editData);
    setEditing(false);
  };
  
  return (
    <Box 
      sx={{
        display: { xs: 'block', md: 'grid' },
        gridTemplateColumns: { md: '1fr 80px 1fr 160px 200px' },
        gap: 1,
        p: 2,
        borderBottom: '1px solid #333',
        '&:hover': { bgcolor: 'action.hover' }
      }}
    >
      <Box>
        <Box display="flex" alignItems="center" mb={1}>
          <Box 
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1,
              overflow: 'hidden'
            }}
          >
            {profilePic ? (
              <img 
                src={profilePic} 
                alt={displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 'bold', 
                color: '#666',
                display: profilePic ? 'none' : 'flex'
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Typography>
          </Box>
          <Box>
          <Typography variant="subtitle2" sx={{
            color: mode === 'dark' ? 'white' : 'black',
            fontWeight: 'bold',
          }}>{displayName}</Typography>
          {editing && (
            <TextField
              size="small"
              value={editData.name}
              onChange={(e) => setEditData({...editData, name: e.target.value})}
              placeholder="Display name"
              sx={{ mt: 0.5, width: '150px' }}
            />
          )}
        </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">{new Date(t.createdAt).toLocaleString()}</Typography>
        <Box mt={0.5}>
          {editing ? (
            <Select
              size="small"
              value={editData.rating}
              onChange={(e) => setEditData({...editData, rating: e.target.value})}
              sx={{ minWidth: 80 }}
            >
              {[1,2,3,4,5].map(r => <MenuItem key={r} value={r}>{r} ⭐</MenuItem>)}
            </Select>
          ) : (
            <Chip size="small" label={`Rating: ${t.rating}`} />
          )}
          {!t.approved && <Chip size="small" color="warning" label="Pending" sx={{ ml: 1 }} />}
          {t.approved && <Chip size="small" color="success" label="Approved" sx={{ ml: 1 }} />}
        </Box>
      </Box>
      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
        {Array.from({ length: t.rating }).map((_, i) => "⭐")}
      </Box>
      <Box sx={{ whiteSpace: 'pre-wrap', mt: { xs: 1, md: 0 } }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', md: 'none' } }}>
          Testimonial Text:
        </Typography>
        {editing ? (
          <TextField
            multiline
            rows={3}
            fullWidth
            value={editData.text}
            onChange={(e) => setEditData({...editData, text: e.target.value})}
            size="small"
          />
        ) : (
          <Typography variant="body2" sx={{ 
            mt: { xs: 0.5, md: 0 },
            color: mode === 'dark' ? 'white' : 'black',
            fontWeight: 'bold',
          }}>
            {t.text}
          </Typography>
        )}
      </Box>
      <Box sx={{ mt: { xs: 2, md: 0 }, display: { xs: 'none', md: 'block' } }}>
        <Typography variant="caption" color="text.secondary">Meta</Typography>
        <Typography variant="body2" sx={{
          color: mode === 'dark' ? 'white' : 'black',
          fontWeight: 'bold',
        }}>Device: {t.device || '-'}</Typography>
        <Typography variant="body2" sx={{
          color: mode === 'dark' ? 'white' : 'black',
          fontWeight: 'bold',
        }}>Locale: {t.locale || '-'}</Typography>
        <Typography variant="body2" sx={{
          color: mode === 'dark' ? 'white' : 'black',
          fontWeight: 'bold',
        }}>Path: {t.path || '-'}</Typography>
        <Typography variant="body2" sx={{
          color: mode === 'dark' ? 'white' : 'black',
          fontWeight: 'bold',
        }}>Referrer: {t.referrer || '-'}</Typography>
        <Typography variant="body2" sx={{
          color: mode === 'dark' ? 'white' : 'black',
          fontWeight: 'bold',
        }}>IP: {t.ip || '-'}</Typography>
      </Box>
      <Box sx={{ mt: { xs: 2, md: 0 } }}>
        <Box display="flex" gap={1} flexWrap="wrap" justifyContent={{ xs: 'flex-start', md: 'center' }}>
          {!t.approved && (
            <Button size="small" variant="contained" color="success" onClick={() => onApprove(t._id)}>
              Approve
            </Button>
          )}
          {editing ? (
            <>
              <Button size="small" variant="contained" color="primary" onClick={handleSave}>
                Save
              </Button>
              <Button size="small" variant="outlined" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button size="small" variant="outlined" color="info" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
          <Button size="small" variant="outlined" color="error" onClick={() => onDelete(t._id)}>
            Delete
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

const Testimonials = () => {
  const theme = useTheme();
  const mode = (theme && theme.palette && theme.palette.mode) ? theme.palette.mode : 'light';
  const dispatch = useDispatch();
  
  const [status, setStatus] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [sortBy, setSortBy] = React.useState('createdAt');
  const [sortDir, setSortDir] = React.useState('desc');
  const [page, setPage] = React.useState(1);
  const pageSize = 20;
  const { data, isFetching, refetch } = useGetAdminTestimonialsQuery({ status, page, pageSize, q, sortBy, sortDir });
  const [approve, { isLoading: approving }] = useApproveAdminTestimonialMutation();
  const [update, { isLoading: updating }] = useUpdateAdminTestimonialMutation();
  const [del, { isLoading: deleting }] = useDeleteAdminTestimonialMutation();

  const onApprove = async (id) => { await approve({ id }).unwrap().catch(()=>{}); refetch(); };
  const onEdit = async (id, data) => { await update({ id, ...data }).unwrap().catch(()=>{}); refetch(); };
  const onDelete = async (id) => { await del({ id }).unwrap().catch(()=>{}); refetch(); };

  const testimonials = (data && data.testimonials) || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Box sx={{ m: { xs: 1, md: 2 } }}>
      <Box 
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          mb: 2,
          gap: 2
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h4" sx={{
            color: mode === 'dark' ? 'white' : 'black',
            fontWeight: 'bold',
          }}>Testimonials Moderation</Typography>
        </Box>
        
        <Box 
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            alignItems: { xs: 'stretch', sm: 'center' },
            flexWrap: 'wrap'
          }}
        >
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button size="small" variant={status==='all'? 'contained':'outlined'} onClick={()=>{setStatus('all'); setPage(1);}}>All</Button>
            <Button size="small" variant={status==='pending'? 'contained':'outlined'} onClick={()=>{setStatus('pending'); setPage(1);}}>Pending</Button>
            <Button size="small" variant={status==='approved'? 'contained':'outlined'} onClick={()=>{setStatus('approved'); setPage(1);}}>Approved</Button>
          </Box>
          
          <Box display="flex" gap={1} flexWrap="wrap" sx={{ minWidth: { xs: '100%', sm: 'auto' } }}>
            <TextField 
              size="small" 
              placeholder="Search text/name" 
              value={q} 
              onChange={(e)=>{setQ(e.target.value); setPage(1);}}
              sx={{ minWidth: { xs: '100%', sm: '150px' } }}
            />
            <Select size="small" value={sortBy} onChange={(e)=>setSortBy(e.target.value)} sx={{ minWidth: '100px' }}>
              <MenuItem value="createdAt">Created</MenuItem>
              <MenuItem value="rating">Rating</MenuItem>
              <MenuItem value="name">Name</MenuItem>
            </Select>
            <Select size="small" value={sortDir} onChange={(e)=>setSortDir(e.target.value)} sx={{ minWidth: '80px' }}>
              <MenuItem value="desc">Desc</MenuItem>
              <MenuItem value="asc">Asc</MenuItem>
            </Select>
            <Button size="small" onClick={()=>refetch()}>Refresh</Button>
          </Box>
        </Box>
      </Box>

      {(isFetching || approving || deleting) && (
        <Box display="flex" alignItems="center" gap={1} mb={1}><CircularProgress size={18} /><Typography variant="body2">Loading...</Typography></Box>
      )}

      <Box border="1px solid" borderColor="divider" borderRadius={1}>
        <Box 
          sx={{
            display: { xs: 'none', md: 'grid' },
            gridTemplateColumns: '1fr 80px 1fr 160px 200px',
            gap: 1,
            p: 1,
            bgcolor: 'background.paper',
            borderBottom: `1px solid ${theme && theme.palette ? theme.palette.divider : '#e0e0e0'}`,
          }}
        >
          <Typography variant="subtitle2" sx={{
            color: mode === 'dark' ? 'white' : 'black',
            fontWeight: 'bold',
          }}>
            User
          </Typography>
          <Typography variant="subtitle2" sx={{
            color: mode === 'dark' ? 'white' : 'black',
            fontWeight: 'bold',
          }}>Stars</Typography>
          <Typography variant="subtitle2"
          sx={{
            color: mode === 'dark' ? 'white' : 'black',
            fontWeight: 'bold',
          }}
          >Text</Typography>
          <Typography variant="subtitle2"
          sx={{
            color: mode === 'dark' ? 'white' : 'black',
            fontWeight: 'bold',
          }}
          >Metadata</Typography>
          <Typography variant="subtitle2"
          sx={{
            color: mode === 'dark' ? 'white' : 'black',
            fontWeight: 'bold',
          }}
          >Actions</Typography>
        </Box>
        {testimonials.map((t) => (
          <Box key={t._id} sx={{ 
            display: { xs: 'block', md: 'contents' },
            border: { xs: '1px solid', md: 'none' },
            borderColor: { xs: 'divider', md: 'transparent' },
            borderRadius: { xs: 1, md: 0 },
            mb: { xs: 2, md: 0 },
            p: { xs: 2, md: 0 }
          }}>
            <Row t={t} onApprove={onApprove} onEdit={onEdit} onDelete={onDelete} />
          </Box>
        ))}
        {!testimonials.length && (
          <Box p={2}><Typography variant="body2" color="text.secondary">No testimonials</Typography></Box>
        )}
      </Box>

      <Box display="flex" justifyContent="center" mt={2}>
        <Pagination count={totalPages} page={page} onChange={(_, p)=>setPage(p)} color="primary" size="small" />
      </Box>
    </Box>
  );
};

export default Testimonials;
