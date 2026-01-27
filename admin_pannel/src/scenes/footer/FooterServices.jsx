import React, { useRef, useState } from 'react';
import { Box, Typography, TextField, IconButton, Button, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import getApiBase from '@utils/apiBase';

// FooterServices is a controlled subform. It expects props: services, setServices
export default function FooterServices({ services = [], setServices }) {
	const apiBase = getApiBase();
	const [uploadingIndex, setUploadingIndex] = useState(null);
	const fileInputs = useRef({});
	const updateService = (index, field, value) => {
			const next = (services || []).map((s, i) => i === index ? { ...s, [field]: value } : s);
			setServices(next);
	};

		const addService = () => {
				const next = [...(services || []), { icon: '', title: '', description: '' }];
				setServices(next);
		};

		const removeService = (index) => {
			const next = (services || []).filter((_, i) => i !== index);
			setServices(next);
		};

			const uploadImageFor = async (index, file) => {
				if (!file) return;
				try {
					setUploadingIndex(index);
					const form = new FormData();
					form.append('image', file);
					const token = (function(){ try { const t = localStorage.getItem('token')||''; return t.startsWith('Bearer')? t: `Bearer ${t}` } catch { return '' } })();
					const res = await axios.post(`${apiBase}/admin/footer/services/upload`, form, { headers: { 'Content-Type': 'multipart/form-data', ...(token?{ Authorization: token }:{}) }, withCredentials: true });
					if (res && res.data && res.data.ok && res.data.url) {
						// store url into icon field for frontend to use as image
						updateService(index, 'icon', res.data.url);
					}
				} catch (e) {
					console.error('Upload failed', e?.response?.data || e.message || e);
				} finally {
					setUploadingIndex(null);
				}
			};

			const triggerFileSelect = (index) => {
				const input = fileInputs.current[index];
				if (input) input.click();
			};

			const handleDrop = (e, index) => {
				e.preventDefault();
				e.stopPropagation();
				const file = e.dataTransfer?.files?.[0];
				if (file) uploadImageFor(index, file);
			};

			const handleDragOver = (e) => {
				e.preventDefault();
			};

		return (
			<Box>
				<Box display="flex" alignItems="center" justifyContent="space-between">
					<Typography variant="h5">Footer Services</Typography>
					<Button startIcon={<AddIcon />} onClick={addService} color="primary" variant="contained" size="small">Add Service</Button>
				</Box>

				{(services || []).map((s, idx) => (
					<Box key={idx} display="flex" alignItems="center" gap={1} mt={2}>
						<Box
							onDrop={(e) => handleDrop(e, idx)}
							onDragOver={handleDragOver}
							sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
						>
							<input
								ref={(el) => (fileInputs.current[idx] = el)}
								type="file"
								accept="image/*"
								style={{ display: 'none' }}
								onChange={(e) => uploadImageFor(idx, e.target.files && e.target.files[0])}
							/>
							<Box sx={{ width: 80, height: 56, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => triggerFileSelect(idx)}>
								{uploadingIndex === idx ? (
									<CircularProgress size={20} />
								) : s.icon && s.icon.startsWith('http') ? (
									<img src={s.icon} alt="icon" style={{ maxWidth: '100%', maxHeight: '100%' }} />
								) : (
									<Typography variant="caption">Drop / Click</Typography>
								)}
							</Box>
						</Box>

						<TextField label="Title" size="small" sx={{ width: 260 }} value={s.title || ''} onChange={(e) => updateService(idx, 'title', e.target.value)} />
						<TextField label="Description" size="small" sx={{ flex: 1 }} value={s.description || ''} onChange={(e) => updateService(idx, 'description', e.target.value)} />
						<IconButton onClick={() => removeService(idx)} color="error"><DeleteIcon /></IconButton>
					</Box>
				))}
			</Box>
		);
}
