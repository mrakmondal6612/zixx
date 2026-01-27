import React from "react";
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Box, Typography, Button, Stack, Grid, Card, CardContent, CardActions, Divider, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Tooltip, IconButton, Snackbar, Alert, MenuItem, Select, InputLabel, FormControl, FormControlLabel, Checkbox, Icon, Chip, InputAdornment } from "@mui/material";
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineDot, TimelineContent } from "@mui/lab";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import PaymentsIcon from '@mui/icons-material/Payments';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import UndoIcon from '@mui/icons-material/Undo';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import HistoryIcon from '@mui/icons-material/History';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import Header from "@components/Header";
import { useGetAdminOrdersQuery, useVerifyAdminOrderMutation, useConfirmAdminOrderMutation, useDeliverAdminOrderMutation, useRefundAdminOrderMutation, useDeleteAdminOrderMutation, usePackAdminOrderMutation, useUpdateAdminOrderCourierMutation, useUploadAdminOrderCourierLogoMutation, useCollectAdminCODPaymentMutation, useOutForDeliveryAdminOrderMutation } from "@state/api";

const Orders = () => {
  const theme = useTheme();
  const { data, isLoading, isError, refetch } = useGetAdminOrdersQuery(undefined, { refetchOnMountOrArgChange: true });
  const [verifyAdminOrder, { isLoading: isVerifying }] = useVerifyAdminOrderMutation();
  const [confirmAdminOrder, { isLoading: isConfirming }] = useConfirmAdminOrderMutation();
  const [deliverAdminOrder, { isLoading: isDelivering }] = useDeliverAdminOrderMutation();
  const [refundAdminOrder, { isLoading: isRefunding }] = useRefundAdminOrderMutation();
  const [deleteAdminOrder, { isLoading: isDeleting }] = useDeleteAdminOrderMutation();
  
  // New state for bulk actions
  const [selectedOrders, setSelectedOrders] = React.useState(new Set());
  const [timelineOpen, setTimelineOpen] = React.useState(false);
  const [selectedOrderTimeline, setSelectedOrderTimeline] = React.useState(null);
  const [contactDialogOpen, setContactDialogOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState(null);
  const [refundOpen, setRefundOpen] = React.useState(false);
  const [refundOrderRow, setRefundOrderRow] = React.useState(null);
  const [refundAmount, setRefundAmount] = React.useState("");
  const [refundError, setRefundError] = React.useState("");
  const [toast, setToast] = React.useState({ open: false, message: '', severity: 'info' });
  const [courierOpen, setCourierOpen] = React.useState(false);
  const [courierRow, setCourierRow] = React.useState(null);
  const [carrier, setCarrier] = React.useState("");
  const [carrierUrl, setCarrierUrl] = React.useState("");
  const [courierPhone, setCourierPhone] = React.useState("");
  const [courierLogoUrl, setCourierLogoUrl] = React.useState("");
  const [courierErr, setCourierErr] = React.useState("");
  const [preset, setPreset] = React.useState("");
  const [logoFile, setLogoFile] = React.useState(null);
  // COD collection dialog state
  const [codOpen, setCodOpen] = React.useState(false);
  const [codRow, setCodRow] = React.useState(null);
  const [codAmount, setCodAmount] = React.useState("");
  const [codCollector, setCodCollector] = React.useState("");
  const [codCollectorId, setCodCollectorId] = React.useState("");
  const [codNotes, setCodNotes] = React.useState("");
  const [codWhen, setCodWhen] = React.useState(""); // datetime-local string
  const [codAmountErr, setCodAmountErr] = React.useState("");
  // Per-row state to avoid global side-effects when packing
  const [packingIds, setPackingIds] = React.useState(new Set());
  const [packedOverride, setPackedOverride] = React.useState({}); // { [orderId]: isoDate }
  const showToast = (message, severity = 'info') => setToast({ open: true, message, severity });
  const closeToast = (_, reason) => { if (reason === 'clickaway') return; setToast((t) => ({ ...t, open: false })); };

  // Confirm & Ship dialog state
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmRow, setConfirmRow] = React.useState(null);
  const [trackingNumber, setTrackingNumber] = React.useState("");
  const [courierName, setCourierName] = React.useState("");
  // deliveryDate will be a Date object or null for react-datepicker
  const [deliveryDate, setDeliveryDate] = React.useState(null);
  const [carrierUrlInput, setCarrierUrlInput] = React.useState("");
  const [courierPhoneInput, setCourierPhoneInput] = React.useState("");
  const [courierLogoUrlInput, setCourierLogoUrlInput] = React.useState("");
  const [logoFileConfirm, setLogoFileConfirm] = React.useState(null);
  const [confirmPreset, setConfirmPreset] = React.useState("");
  const [confirmNotes, setConfirmNotes] = React.useState("");
  const [confirmErr, setConfirmErr] = React.useState("");
  // Editable presets persisted in localStorage
  const PRESETS_KEY = 'admin_courier_presets_v1';
  const [editablePresets, setEditablePresets] = React.useState(() => {
    try {
      const raw = window.localStorage.getItem(PRESETS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  });
  const saveEditablePresets = (next) => {
    setEditablePresets(next);
    try { window.localStorage.setItem(PRESETS_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
  };

  // COD collection handlers
  const openCollectCOD = (row) => {
    if (!row || !row._id) return;
    setCodRow(row);
    const total = Number(row.totalAmount || 0);
    const already = Number(row?.paymentDetails?.paymentAmount || 0);
    const due = Math.max(0, total - already);
    setCodAmount(Number.isFinite(due) ? String(due.toFixed(2)) : "");
    setCodCollector("");
    setCodCollectorId("");
    setCodNotes("");
    setCodAmountErr("");
    // Default to now in local datetime-local format
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const local = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setCodWhen(local);
    setCodOpen(true);
  };

  const submitCollectCOD = async () => {
    try {
      const raw = (codAmount || "").trim();
      const amount = raw === "" ? undefined : Number(raw);
      if (amount !== undefined) {
        if (Number.isNaN(amount) || amount <= 0) {
          setCodAmountErr('Amount must be a positive number');
          showToast('Amount must be a positive number', 'warning');
          return;
        }
        const total = Number(codRow?.totalAmount || 0);
        const already = Number(codRow?.paymentDetails?.paymentAmount || 0);
        const due = Math.max(0, total - already);
        if (due > 0 && amount + 0.005 < due) {
          setCodAmountErr('Amount cannot be less than due');
          showToast(`Amount cannot be less than due (₹${due.toFixed(2)})`, 'warning');
          return;
        }
        if (due > 0 && amount > due + 0.005) {
          const proceed = window.confirm(`Entered amount (₹${amount.toFixed(2)}) exceeds due (₹${due.toFixed(2)}). Continue?`);
          if (!proceed) return;
        }
      }
      await collectCOD({
        id: codRow._id,
        amount,
        collectedByName: codCollector || undefined,
        collectedById: codCollectorId || undefined,
        notes: codNotes || undefined,
        collectedAt: codWhen ? new Date(codWhen).toISOString() : undefined,
      }).unwrap();
      setCodOpen(false);
      setCodRow(null);
      showToast('COD payment recorded', 'success');
      refetch();
    } catch (e) {
      console.error('Failed to record COD', e);
      showToast(e?.data?.msg || e?.message || 'Failed to record COD payment', 'error');
    }
  };
  const [lastApplied, setLastApplied] = React.useState(null); // { type, carrier, carrierUrl }
  const [presetEditorOpen, setPresetEditorOpen] = React.useState(false);
  const [editedPresets, setEditedPresets] = React.useState([]);
  const [newPresetName, setNewPresetName] = React.useState('');
  const [newPresetUrl, setNewPresetUrl] = React.useState('');

  const rows = Array.isArray(data?.orders) ? data.orders : [];

  // Helpers
  const maskPhone = (p) => {
    if (!p) return '';
    const digits = String(p).replace(/\D/g, '');
    if (digits.length <= 4) return '*'.repeat(Math.max(0, digits.length - 2)) + digits.slice(-2);
    return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
  };

  const isHttpUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);

  const getUserText = (row) => {
    const u = row?.userId;
    if (!u) return "-";
    const first = u.first_name || u.firstName || "";
    const last = u.last_name || u.lastName || "";
    const email = u.email || "";
    return (first || last) ? `${first} ${last}`.trim() : email || u._id || "-";
  };

  const getOrderQuantity = (row) => {
    try {
      const items = Array.isArray(row?.orderItems) ? row.orderItems : [];
      return items.reduce((sum, it) => sum + (Number(it?.quantity) || 0), 0);
    } catch (e) {
      return 0;
    }
  };

  const [packAdminOrder, { isLoading: isPacking }] = usePackAdminOrderMutation();
  const [updateCourier, { isLoading: isUpdatingCourier }] = useUpdateAdminOrderCourierMutation();
  const [uploadLogo, { isLoading: isUploadingLogo }] = useUploadAdminOrderCourierLogoMutation();
  const [collectCOD, { isLoading: isCollectingCOD }] = useCollectAdminCODPaymentMutation();
  const [outForDeliveryAdminOrder, { isLoading: isOutForDelivering }] = useOutForDeliveryAdminOrderMutation();

  const handlePack = async (row) => {
    try {
      if (!row.isVerified) return showToast('Verify order before packing', 'warning');
      if (row.packedAt || packedOverride[row._id]) return showToast('Order already packed', 'info');
      const notes = window.prompt('Add packing notes (optional):', '');
      // optimistic: mark only this row as packed locally
      const nowIso = new Date().toISOString();
      setPackedOverride((prev) => ({ ...prev, [row._id]: nowIso }));
      setPackingIds((prev) => {
        const next = new Set(prev);
        next.add(row._id);
        return next;
      });
      await packAdminOrder({ id: row._id, adminNotes: notes || undefined }).unwrap();
      showToast('Order marked as packed', 'success');
      refetch();
    } catch (e) {
      console.error('Failed to mark packed', e);
      showToast(e?.data?.msg || e?.message || 'Failed to mark packed', 'error');
      // rollback optimistic state for this row
      setPackedOverride((prev) => {
        const { [row._id]: _omit, ...rest } = prev || {};
        return rest;
      });
    } finally {
      setPackingIds((prev) => {
        const next = new Set(prev);
        next.delete(row._id);
        return next;
      });
    }
  };

  const openCourier = (row) => {
    setCourierRow(row);
    setCarrier(row?.carrier || '');
    setCarrierUrl(row?.carrierUrl || '');
    setCourierPhone(row?.courierPhone || '');
    setCourierLogoUrl(row?.courierLogoUrl || '');
    setCourierErr('');
    setPreset('');
    setLogoFile(null);
    setCourierOpen(true);
  };

  const submitCourier = async () => {
    try {
      setCourierErr('');
      if (carrierUrl && !isHttpUrl(carrierUrl)) return setCourierErr('Carrier URL must start with http or https');
      if (courierLogoUrl && !isHttpUrl(courierLogoUrl)) return setCourierErr('Logo URL must start with http or https');
      await updateCourier({ id: courierRow._id, carrier: carrier || undefined, carrierUrl: carrierUrl || undefined, courierPhone: courierPhone || undefined, courierLogoUrl: courierLogoUrl || undefined }).unwrap();
      setCourierOpen(false);
      showToast('Courier info updated', 'success');
      refetch();
    } catch (e) {
      console.error('Failed to update courier', e);
      setCourierErr(e?.data?.msg || e?.message || 'Failed to update courier');
      showToast(e?.data?.msg || e?.message || 'Failed to update courier', 'error');
    }
  };

  const presets = [
    { name: 'Select preset', url: '' },
    { name: 'Delhivery', url: 'https://www.delhivery.com/' },
    { name: 'Bluedart', url: 'https://www.bluedart.com/' },
    { name: 'DTDC', url: 'https://www.dtdc.in/' },
    { name: 'XpressBees', url: 'https://www.xpressbees.com/' },
    { name: 'Ecom Express', url: 'https://www.ecomexpress.in/' },
    { name: 'India Post', url: 'https://www.indiapost.gov.in/' },
  ];

  const onPresetChange = (val) => {
    setPreset(val);
    const list = editablePresets || presets;
    const p = list.find(p => p.name === val);
    if (!p) return;
    // Save previous state for undo
    setLastApplied({ type: 'courier', carrier: carrier || '', carrierUrl: carrierUrl || '' });
    if (p.name === 'Select preset') {
      setCarrier('');
      setCarrierUrl('');
    } else {
      setCarrier(p.name);
      setCarrierUrl(p.url);
    }
  };

  const onSelectLogoFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    if (!courierRow || !courierRow._id) return;
    try {
      const res = await uploadLogo({ id: courierRow._id, file }).unwrap();
      if (res && res.url) {
        setCourierLogoUrl(res.url);
        showToast('Logo uploaded', 'success');
        // reflect ASAP in list
        refetch();
      } else {
        showToast('Logo uploaded but no URL returned', 'warning');
      }
    } catch (err) {
      console.error('Upload failed', err);
      showToast(err?.data?.msg || err?.message || 'Failed to upload logo', 'error');
    }
  };

  const onSelectLogoFileConfirm = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setLogoFileConfirm(file);
    if (!confirmRow || !confirmRow._id) return;
    try {
      const res = await uploadLogo({ id: confirmRow._id, file }).unwrap();
      if (res && res.url) {
        setCourierLogoUrlInput(res.url);
        showToast('Logo uploaded', 'success');
        refetch();
      } else {
        showToast('Logo uploaded but no URL returned', 'warning');
      }
    } catch (err) {
      console.error('Upload failed', err);
      showToast(err?.data?.msg || err?.message || 'Failed to upload logo', 'error');
    }
  };

  const handleDeliver = async (row) => {
    try {
      if (row.status === 'cancelled') return showToast('Cannot deliver a cancelled order', 'warning');
      if (row.deliveryStatus === 'delivered' || row.status === 'completed') {
        return showToast('Order already delivered', 'info');
      }
      const st = String(row.deliveryStatus).toLowerCase();
      if (!['shipped', 'out_for_delivery'].includes(st)) {
        return showToast('Confirm (ship) the order before marking delivered', 'warning');
      }
      const notes = window.prompt("Add delivery notes (optional):", "");
      await deliverAdminOrder({ id: row._id, adminNotes: notes || undefined }).unwrap();
      showToast('Order marked as delivered', 'success');
      refetch();
    } catch (e) {
      console.error("Failed to mark delivered", e);
      showToast(e?.data?.msg || e?.message || 'Failed to mark delivered', 'error');
    }
  };

  const handleOutForDelivery = async (row) => {
    try {
      if (row.status === 'cancelled') return showToast('Cannot move a cancelled order', 'warning');
      if (row.deliveryStatus === 'delivered' || row.status === 'completed') {
        return showToast('Order already delivered', 'info');
      }
      if (String(row.deliveryStatus).toLowerCase() !== 'shipped') {
        return showToast('Order must be shipped before marking Out for Delivery', 'warning');
      }
      const notes = window.prompt('Add notes (optional):', '');
      await outForDeliveryAdminOrder({ id: row._id, adminNotes: notes || undefined }).unwrap();
      showToast('Order marked as out for delivery', 'success');
      refetch();
    } catch (e) {
      console.error('Failed to mark out for delivery', e);
      showToast(e?.data?.msg || e?.message || 'Failed to mark out for delivery', 'error');
    }
  };

  // New handlers for additional features
  const handleBulkActions = async (selectedIds) => {
    try {
      const action = await new Promise((resolve) => {
        const dialog = document.createElement('dialog');
        dialog.innerHTML = `
          <div style="padding: 20px;">
            <h3>Bulk Actions</h3>
            <button onclick="this.closest('dialog').returnValue='verify'">Verify Selected</button>
            <button onclick="this.closest('dialog').returnValue='pack'">Mark Packed</button>
            <button onclick="this.closest('dialog').returnValue='export'">Export to CSV</button>
            <button onclick="this.closest('dialog').returnValue='print'">Print All</button>
            <button onclick="this.closest('dialog').returnValue='cancel'">Cancel</button>
          </div>
        `;
        dialog.onclose = () => resolve(dialog.returnValue);
        document.body.appendChild(dialog);
        dialog.showModal();
      });

      if (!action || action === 'cancel') return;

      const selectedOrdersList = Array.from(selectedIds);
      switch(action) {
        case 'verify':
          for (const id of selectedOrdersList) {
            await verifyAdminOrder({ id }).unwrap();
          }
          showToast('Bulk verify completed', 'success');
          break;
        case 'pack':
          for (const id of selectedOrdersList) {
            await packAdminOrder({ id }).unwrap();
          }
          showToast('Bulk pack completed', 'success');
          break;
        case 'export':
          // Export to CSV logic
          const ordersToExport = rows.filter(row => selectedIds.has(row._id));
          const csv = generateOrdersCSV(ordersToExport);
          downloadCSV(csv, 'orders-export.csv');
          break;
        case 'print':
          // Print multiple invoices
          const ordersToPrint = rows.filter(row => selectedIds.has(row._id));
          printMultipleInvoices(ordersToPrint);
          break;
      }
      refetch();
    } catch (e) {
      console.error('Bulk action failed', e);
      showToast('Bulk action failed: ' + (e?.message || 'Unknown error'), 'error');
    }
  };

  // Print functions
  const handlePrintInvoice = (row) => {
    const invoiceContent = generateInvoiceHTML(row);
    const win = window.open('', 'Print Invoice', 'height=650,width=900');
    win.document.write(`<html><head><title>Invoice #${row._id}</title>`);
    win.document.write('<link rel="stylesheet" href="/invoice-print.css" type="text/css" />');
    win.document.write('</head><body>');
    win.document.write(invoiceContent);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  const handlePrintLabel = (row) => {
    // Generate shipping label HTML
    const labelContent = generateShippingLabelHTML(row);
    const win = window.open('', 'Print Shipping Label', 'height=450,width=500');
    win.document.write(`<html><head><title>Shipping Label #${row._id}</title>`);
    win.document.write('<link rel="stylesheet" href="/label-print.css" type="text/css" />');
    win.document.write('</head><body>');
    win.document.write(labelContent);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  const handlePrintSlip = (row) => {
    // Generate packing slip HTML
    const slipContent = generatePackingSlipHTML(row);
    const win = window.open('', 'Print Packing Slip', 'height=550,width=700');
    win.document.write(`<html><head><title>Packing Slip #${row._id}</title>`);
    win.document.write('<link rel="stylesheet" href="/slip-print.css" type="text/css" />');
    win.document.write('</head><body>');
    win.document.write(slipContent);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  const handlePrintTimeline = (row) => {
    // Generate timeline HTML
    const timelineContent = generateTimelineHTML(row);
    const win = window.open('', 'Print Timeline', 'height=800,width=600');
    if (!win) {
      showToast('Unable to open print window. Please allow popups for this site.', 'error');
      return;
    }
    try {
      win.document.write(`<html><head><title>Order Timeline #${row._id}</title>`);
      win.document.write('<link rel="stylesheet" href="/timeline-print.css" type="text/css" />');
      win.document.write('</head><body>');
      win.document.write(timelineContent);
      win.document.write('</body></html>');
      win.document.close();
      // Focus and allow some time for rendering before printing
      try { win.focus(); } catch (e) {}
      setTimeout(() => {
        try { win.print(); } catch (e) { console.warn('Print failed', e); }
      }, 250);
    } catch (e) {
      console.error('Failed to open print window', e);
      showToast('Failed to open print window', 'error');
      try { win.close(); } catch (er) {}
    }
  };

  // Cancel order function
  const handleCancel = async (row) => {
    try {
      const reason = window.prompt("Enter cancellation reason (required):");
      if (!reason) {
        showToast('Cancellation reason is required', 'warning');
        return;
      }
      const notes = window.prompt("Add admin notes (optional):", "");
      
      // Use the existing admin cancel order endpoint
      await cancelOrder({ 
        id: row._id, 
        cancelReason: reason,
        adminNotes: notes || undefined 
      }).unwrap();
      
      showToast('Order cancelled successfully', 'success');
      refetch();
    } catch (e) {
      console.error('Failed to cancel order', e);
      showToast(e?.data?.msg || e?.message || 'Failed to cancel order', 'error');
    }
  };

  // Track shipment function
  const handleTrackShipment = (row) => {
    if (!row.carrier || !row.trackingNumber) {
      showToast('No tracking information available', 'warning');
      return;
    }
    
    // Try to construct tracking URL based on carrier
    let trackingUrl = row.carrierUrl;
    if (!trackingUrl) {
      const carrierUrls = {
        'Delhivery': 'https://www.delhivery.com/track/package/',
        'Bluedart': 'https://www.bluedart.com/tracking/',
        'DTDC': 'https://tracking.dtdc.com/ctbs-tracking/customerInterface.tr?submitName=showCITrackingDetails&cType=Consignment&cnNo=',
        'XpressBees': 'https://www.xpressbees.com/track?trackingId=',
        'Ecom Express': 'https://ecomexpress.in/tracking/?awb_field=',
        'India Post': 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?consignmentno='
      };
      trackingUrl = carrierUrls[row.carrier];
      if (trackingUrl) trackingUrl += row.trackingNumber;
    }

    if (trackingUrl) {
      window.open(trackingUrl, '_blank');
    } else {
      showToast(`No tracking URL found for carrier: ${row.carrier}`, 'info');
    }
  };

  // HTML Generators
  const generateShippingLabelHTML = (order) => {
    // Get footer data for company information
    const getFooterData = () => {
      try {
        // Try to get footer data from localStorage (if cached) or fetch it
        const cached = localStorage.getItem('admin_footer_data');
        if (cached) {
          const parsed = JSON.parse(cached);
          return {
            companyName: parsed.companyName || 'ZIXX',
            address: parsed.contactInfo?.address || '429/1, R.B AVENUE, Bhadreswar\nHooghly - 712124\nWest Bengal, India',
            phone: parsed.contactInfo?.phone || '+91 89622 31295',
            email: parsed.contactInfo?.email || 'contact@zixxapp.com'
          };
        }
        return {
          companyName: 'ZIXX',
          address: '429/1, R.B AVENUE, Bhadreswar\nHooghly - 712124\nWest Bengal, India',
          phone: '+91 89622 31295',
          email: 'contact@zixxapp.com'
        };
      } catch (e) {
        return {
          companyName: 'ZIXX',
          address: '429/1, R.B AVENUE, Bhadreswar\nHooghly - 712124\nWest Bengal, India',
          phone: '+91 89622 31295',
          email: 'contact@zixxapp.com'
        };
      }
    };

    const footerData = getFooterData();

    return `
      <div class="shipping-label" style="
        font-family: 'Inter', sans-serif;
        max-width: 420px;
        margin: 20px auto;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        background: #fff;
        color: #111;
      ">

        <!-- Header -->
        <div style="
          background: linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%);
          padding: 16px;
          color: white;
          text-align: center;
        ">
          <h2 style="margin: 0; font-size: 22px; font-weight: 700;">🚚 Shipping Label</h2>
          <div style="font-size: 14px; opacity: 0.9;">Order #${order._id}</div>
        </div>

        <!-- Addresses -->
        <div style="display: flex; justify-content: space-between; padding: 16px; gap: 12px;">
          <div style="flex: 1; background: #F9FAFB; border-radius: 12px; padding: 12px;">
            <h3 style="margin: 0 0 8px; font-size: 14px; color: #374151;">📦 From</h3>
            <p style="margin: 0; font-size: 13px; line-height: 1.4; color: #111827;">
              <strong>${footerData.companyName}</strong><br/>
              ${footerData.address.replace(/\n/g, '<br/>')}
              <br/>📞 ${footerData.phone}
            </p>
          </div>

          <div style="flex: 1; background: #F9FAFB; border-radius: 12px; padding: 12px;">
            <h3 style="margin: 0 0 8px; font-size: 14px; color: #374151;">📍 To</h3>
            <p style="margin: 0; font-size: 13px; line-height: 1.4; color: #111827;">
              ${order.formattedAddress || order.shippingAddress}
            </p>
          </div>
        </div>

        <!-- Shipping Info -->
        <div style="padding: 16px; border-top: 1px dashed #E5E7EB; border-bottom: 1px dashed #E5E7EB; background: #F3F4F6;">
          <div style="font-size: 14px; margin-bottom: 6px;">🚀 Carrier: <strong>${order.carrier || 'N/A'}</strong></div>
          <div style="font-size: 14px; margin-bottom: 6px;">🔗 Tracking: <strong>${order.trackingNumber || 'N/A'}</strong></div>
          ${order.courierPhone ? `<div style="font-size: 14px;">☎️ Courier Phone: <strong>${order.courierPhone}</strong></div>` : ''}
        </div>

        <!-- Barcode / QR -->
        <div style="text-align: center; padding: 20px;">
          <div style="
            background: #111827;
            color: white;
            font-size: 16px;
            font-weight: 600;
            letter-spacing: 2px;
            padding: 10px 20px;
            border-radius: 12px;
            display: inline-block;
          ">
            ${order.trackingNumber || order._id}
          </div>
          <div style="margin-top: 10px; font-size: 12px; color: #6B7280;">Scan QR / Barcode for live tracking</div>
        </div>
      </div>
    `;
  };
  

  const generatePackingSlipHTML = (order) => {
    return `
      <div class="packing-slip">
        <div class="header">
          <h2>Packing Slip</h2>
          <div class="order-info">
            <div>Order #${order._id}</div>
            <div>Date: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div class="customer-info">
          <h3>Customer Information</h3>
          <p>${getUserText(order)}<br />
          ${order.formattedAddress || order.shippingAddress}</p>
        </div>

        <div class="items">
          <h3>Order Items</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>SKU</th>
              </tr>
            </thead>
            <tbody>
              ${(order.orderItems || []).map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>${item.productId}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Thank you for your order!</p>
          ${order.adminNotes ? `<p>Notes: ${order.adminNotes}</p>` : ''}
        </div>
      </div>
    `;
  };

  const generateTimelineHTML = (order) => {
    const events = [
      { date: order.createdAt, title: 'Order Placed', details: `Total Amount: ₹${order.totalAmount}` },
      order.verifiedAt && { date: order.verifiedAt, title: 'Order Verified', details: 'Verification complete' },
      order.packedAt && { date: order.packedAt, title: 'Order Packed', details: 'Ready for shipping' },
      order.shippedAt && { 
        date: order.shippedAt, 
        title: 'Order Shipped',
        details: `Carrier: ${order.carrier || 'N/A'}\nTracking: ${order.trackingNumber || 'N/A'}` 
      },
      order.deliveredAt && { date: order.deliveredAt, title: 'Order Delivered', details: 'Delivery complete' }
    ].filter(Boolean);

    return `
  <div class="timeline-print" style="
    font-family: 'Inter', sans-serif;
    max-width: 700px;
    margin: 20px auto;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.15);
    padding: 24px;
    color: #111;
  ">

    <!-- Header -->
    <div style="
      background: linear-gradient(135deg, #F59E0B, #EF4444);
      padding: 16px;
      border-radius: 12px;
      text-align: center;
      color: white;
      margin-bottom: 20px;
    ">
      <h2 style="margin: 0; font-size: 22px; font-weight: 800;">📜 Order Timeline</h2>
      <div style="font-size: 14px; opacity: 0.9;">Order #${order._id}</div>
    </div>

    <!-- Events -->
    <div class="events" style="position: relative; margin-left: 20px; padding-left: 20px; border-left: 3px solid #E5E7EB;">
      ${events.map(event => `
        <div class="event" style="margin-bottom: 20px; position: relative;">
          <div style="
            position: absolute; 
            left: -31px; 
            top: 0; 
            width: 18px; 
            height: 18px; 
            background: linear-gradient(135deg, #3B82F6, #9333EA); 
            border-radius: 50%; 
            box-shadow: 0 0 0 4px #fff;
          "></div>
          <div class="date" style="font-size: 12px; color: #6B7280; margin-bottom: 4px;">
            ${new Date(event.date).toLocaleString()}
          </div>
          <div class="title" style="font-weight: 600; font-size: 15px; margin-bottom: 2px;">
            ${event.title}
          </div>
          <div class="details" style="font-size: 13px; color: #374151;">
            ${event.details}
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Summary -->
    <div class="summary" style="
      margin-top: 24px;
      background: #F9FAFB;
      border-radius: 12px;
      padding: 16px;
      border: 1px solid #E5E7EB;
    ">
      <h3 style="margin: 0 0 10px; font-size: 18px; font-weight: 700; color: #111827;">📦 Order Summary</h3>
      <div style="font-size: 14px; margin-bottom: 6px;">🔖 Status: <strong>${order.status}</strong></div>
      <div style="font-size: 14px; margin-bottom: 6px;">💳 Payment: <strong>${order.paymentStatus}</strong></div>
      ${order.adminNotes ? `<div style="font-size: 14px; margin-bottom: 6px;">📝 Notes: ${order.adminNotes}</div>` : ''}
    </div>

  </div>
`;

  };

  
  const generateInvoiceHTML = (order) => {
    // Get footer data for company information
    const getFooterData = () => {
      try {
        // Try to get footer data from localStorage (if cached) or fetch it
        const cached = localStorage.getItem('admin_footer_data');
        if (cached) {
          const parsed = JSON.parse(cached);
          return {
            companyName: parsed.companyName || 'ZIXX',
            address: parsed.contactInfo?.address || '429/1, R.B AVENUE, Bhadreswar\nHooghly - 712124\nWest Bengal, India',
            phone: parsed.contactInfo?.phone || '+91 89622 31295',
            email: parsed.contactInfo?.email || 'contact@zixxapp.com'
          };
        }
        return {
          companyName: 'ZIXX',
          address: '429/1, R.B AVENUE, Bhadreswar\nHooghly - 712124\nWest Bengal, India',
          phone: '+91 89622 31295',
          email: 'contact@zixxapp.com'
        };
      } catch (e) {
        return {
          companyName: 'ZIXX',
          address: '429/1, R.B AVENUE, Bhadreswar\nHooghly - 712124\nWest Bengal, India',
          phone: '+91 89622 31295',
          email: 'contact@zixxapp.com'
        };
      }
    };

    const footerData = getFooterData();

    return `
      <div class="invoice" style="
        font-family: 'Inter', sans-serif;
        max-width: 700px;
        margin: 20px auto;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        padding: 24px;
        color: #111;
      ">

        <!-- Header -->
        <div style="text-align: center; padding-bottom: 16px; border-bottom: 2px solid #E5E7EB;">
          <h1 style="
            font-size: 28px;
            font-weight: 800;
            margin: 0;
            background: linear-gradient(135deg, #3B82F6, #9333EA);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          ">
            🧾 Invoice
          </h1>
          <p style="margin: 4px 0; font-size: 14px; color: #6B7280;">
            Thank you for shopping with us 💜
          </p>
        </div>

        <!-- Order Info -->
        <div style="margin-top: 16px; display: flex; justify-content: space-between; flex-wrap: wrap;">
          <div style="font-size: 14px; line-height: 1.6;">
            <p><strong>Order ID:</strong> #${order._id}</p>
            <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Customer:</strong> ${getUserText(order)}</p>
          </div>
          <div style="text-align: right; font-size: 14px; color: #374151;">
            <p><strong>From:</strong></p>
            <p><strong>${footerData.companyName}</strong></p>
            <p>${footerData.address.replace(/\n/g, '<br/>')}</p>
            <p>📞 Support: ${footerData.phone}</p>
            <p>✉️ Email: ${footerData.email}</p>
          </div>
        </div>

        <!-- Table -->
        <table style="
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 14px;
        ">
          <thead>
            <tr style="background: #F3F4F6; text-align: left;">
              <th style="padding: 12px; border-bottom: 2px solid #E5E7EB;">Item</th>
              <th style="padding: 12px; border-bottom: 2px solid #E5E7EB;">Qty</th>
              <th style="padding: 12px; border-bottom: 2px solid #E5E7EB;">Price</th>
              <th style="padding: 12px; border-bottom: 2px solid #E5E7EB;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(order.orderItems || []).map(item => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">${item.productName}</td>
                <td style="padding: 10px; border-bottom: 1px solid #E5E7EB; text-align:center;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">₹${item.price.toFixed(2)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">₹${item.totalPrice.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background: #F9FAFB;">
              <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600;">💰 Total Amount</td>
              <td style="padding: 12px; font-weight: 700; color: #111827;">₹${order.totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Footer -->
        <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #6B7280;">
          <p>🚀 This is a computer-generated invoice, no signature required.</p>
          <p>✨ Need help? Contact us at ${footerData.email}</p>
        </div>

      </div>
    `;
  };
  
  const showOrderTimeline = (row) => {
    setSelectedOrderTimeline(row);
    setTimelineOpen(true);
  };

  const contactCustomer = (row) => {
    setSelectedCustomer(row.userId);
    setContactDialogOpen(true);
  };

  const openRefundModal = (row) => {
    if (!row || !row._id) return;
    const isRefunded = String(row.paymentStatus) === 'refunded' || (String(row.status) === 'cancelled' && String(row.adminNotes || '').toLowerCase().includes('refund'));
    if (isRefunded) return showToast('Order already refunded.', 'info');
    if (row.status === 'cancelled') {
      return showToast('Order already cancelled.', 'info');
    }
    if (row.paymentStatus !== 'paid') {
      const proceed = window.confirm('This order is not marked as paid. Proceed to attempt refund anyway?');
      if (!proceed) return;
    }
    setRefundOrderRow(row);
    setRefundAmount("");
    setRefundError("");
    setRefundOpen(true);
  };

  const submitRefund = async () => {
    try {
      setRefundError("");
      const raw = (refundAmount || "").trim();
      const amount = raw === "" ? undefined : Number(raw);
      if (amount !== undefined) {
        if (Number.isNaN(amount)) {
          setRefundError('Amount must be a number.');
          return;
        }
        if (amount <= 0) {
          setRefundError('Amount must be greater than 0.');
          return;
        }
      }
      await refundAdminOrder({ id: refundOrderRow._id, amount }).unwrap();
      setRefundOpen(false);
      setRefundOrderRow(null);
      setRefundAmount("");
      setRefundError("");
      showToast('Refund processed successfully', 'success');
      refetch();
    } catch (e) {
      console.error('Refund failed', e);
      const msg = e?.data?.msg || e?.error || e?.message || 'Refund failed';
      setRefundError(String(msg));
      showToast(String(msg), 'error');
    }
  };

  const handleVerify = async (row) => {
    try {
      const notes = window.prompt("Add admin notes (optional):", "");
      await verifyAdminOrder({ id: row._id, adminNotes: notes || undefined }).unwrap();
      showToast('Order verified', 'success');
      refetch();
    } catch (e) {
      console.error("Failed to verify order", e);
      showToast('Failed to verify order', 'error');
    }
  };

  const openConfirm = (row) => {
    if (!row || !row._id) return;
    if (!row.isVerified) return showToast('Verify order before confirming for delivery', 'warning');
    setConfirmRow(row);
    setTrackingNumber(row.trackingNumber || "");
    setCourierName(row.carrier || "");
    // Prefill expected delivery date if available, else empty. Format to YYYY-MM-DD for input[type=date]
    const existing = row.expectedDeliveryDate || row.deliveryDate || row.expectedDelivery || null;
    if (existing) {
      const d = new Date(existing);
      if (!isNaN(d)) setDeliveryDate(d);
      else setDeliveryDate(null);
    } else {
      setDeliveryDate(null);
    }
  setCarrierUrlInput(row?.carrierUrl || '');
    setCourierPhoneInput(row?.courierPhone || '');
    setCourierLogoUrlInput(row?.courierLogoUrl || '');
  setConfirmPreset('');
    setLogoFileConfirm(null);
    setConfirmNotes("");
    setConfirmErr("");
    setConfirmOpen(true);
  };

  const onConfirmPresetChange = (val) => {
    setConfirmPreset(val);
    const list = editablePresets || presets;
    const p = list.find(p => p.name === val);
    if (!p) return;
    setLastApplied({ type: 'confirm', carrier: courierName || '', carrierUrl: carrierUrlInput || '' });
    if (p.name === 'Select preset') {
      setCourierName('');
      setCarrierUrlInput('');
    } else {
      setCourierName(p.name);
      setCarrierUrlInput(p.url);
    }
  };

  const undoLast = (type) => {
    if (!lastApplied || lastApplied.type !== type) return;
    if (type === 'courier') {
      setCarrier(lastApplied.carrier || '');
      setCarrierUrl(lastApplied.carrierUrl || '');
    } else if (type === 'confirm') {
      setCourierName(lastApplied.carrier || '');
      setCarrierUrlInput(lastApplied.carrierUrl || '');
    }
    setLastApplied(null);
  };

  const submitConfirm = async () => {
    try {
      setConfirmErr("");
      if (!confirmRow) return;
      const tracking = (trackingNumber || "").trim();
      const courier = (courierName || "").trim();
      if (!tracking) {
        setConfirmErr('Tracking number is required');
        return;
      }
      if (!courier) {
        setConfirmErr('Courier name is required');
        return;
      }
      // Normalize deliveryDate: if it's a Date, convert to YYYY-MM-DD
      let date;
      if (!deliveryDate) date = undefined;
      else if (deliveryDate instanceof Date) date = deliveryDate.toISOString().slice(0,10);
      else date = String(deliveryDate || '').trim();
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        setConfirmErr('Delivery date must be YYYY-MM-DD');
        return;
      }
      await confirmAdminOrder({
  id: confirmRow._id,
        trackingNumber: tracking,
        carrier: courier,
        carrierUrl: carrierUrlInput || undefined,
        courierPhone: courierPhoneInput || undefined,
        courierLogoUrl: courierLogoUrlInput || undefined,
        deliveryDate: date || undefined,
        adminNotes: (confirmNotes || undefined),
      }).unwrap();
      setConfirmOpen(false);
      showToast('Order confirmed for delivery', 'success');
      refetch();
    } catch (e) {
      console.error('Failed to confirm order for delivery', e);
      const msg = e?.data?.msg || e?.message || 'Failed to confirm order for delivery';
      setConfirmErr(String(msg));
      showToast(String(msg), 'error');
    }
  };

  //

  return (
    <Box m="1.5rem 2.5rem">
      <Header title="ORDERS" subtitle="All product orders" count={rows.length} />
      {isError ? (
        <Typography color="error" mt={2}>Failed to load orders.</Typography>
      ) : (
        <Box>
          {isLoading ? (
            <Typography mt={2}>Loading orders...</Typography>
          ) : rows.length === 0 ? (
            <Typography mt={2}>No orders found.</Typography>
          ) : (
            <Grid container spacing={3} mt={2}>
              {rows.map((row) => {
                const packedAtVal = row.packedAt || packedOverride[row._id];
                const orderDate = row.orderDate || row.createdAt;
                const isRefunded = String(row.paymentStatus) === 'refunded' || (String(row.status) === 'cancelled' && String(row.adminNotes || '').toLowerCase().includes('refund'));

                const isCancelled = String(row.status) === 'cancelled';
                const deliveryState = String(row.deliveryStatus || '').toLowerCase();
                const isDelivered = Boolean(row.deliveredAt) || ['delivered', 'completed'].includes(String(row.status).toLowerCase()) || deliveryState === 'delivered';
                const isOutForDelivery = deliveryState === 'out_for_delivery';
                const isShipped = deliveryState === 'shipped' || isOutForDelivery; // treat out_for_delivery as shipped state for gating
                const isPacked = Boolean(packedAtVal);
                const isVerified = Boolean(row.isVerified);
                let nextAction = null;
                if (!isCancelled) {
                  if (!isVerified) nextAction = 'verify';
                  else if (!isPacked) nextAction = 'pack';
                  else if (!isDelivered && !isShipped) nextAction = 'confirm';
                  else if (!isDelivered && !isOutForDelivery) nextAction = 'out_for_delivery';
                  else if (!isDelivered) nextAction = 'deliver';
                }

                const isCOD = String(row.paymentMethod || '').toLowerCase() === 'cod';
                const payState = String(row.paymentStatus || row?.paymentDetails?.paymentStatus || '').toLowerCase();
                const isPaid = payState === 'paid' || payState === 'completed' || payState === 'success';
                const canCollectCODNow = isCOD && !isPaid && isDelivered && !isCancelled;
                const codTotal = Number(row.totalAmount || 0);
                const codAlready = Number(row?.paymentDetails?.paymentAmount || 0);
                const codDue = Math.max(0, codTotal - codAlready);
                const codButtonText = `COLLECT COD${codDue > 0 ? ` \u20B9${codDue.toFixed(2)}` : ''}`;
                const rawItems = Array.isArray(row?.orderItems) ? row.orderItems : [];
                const thumbs = rawItems
                  .map((it) => {
                    const imgs = Array.isArray(it?.images)
                      ? it.images
                      : (Array.isArray(it?.image) ? it.image : (it?.image ? [it.image] : []));
                    return imgs && imgs.length ? imgs[0] : null;
                  })
                  .filter(Boolean);
                const maxThumbs = 5;
                const thumbsToShow = thumbs.slice(0, maxThumbs);
                const extraThumbs = Math.max(0, thumbs.length - thumbsToShow.length);
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={row._id}>
                    <Card
                      sx={{
                        position: 'relative',
                        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.alt : "#87A6A8",
                        color: theme.palette.mode === 'dark' ? theme.palette.text.primary : "#D9DEDD",
                        border: theme.palette.mode === 'dark' ? '1px solid transparent' : `1px solid ${theme.palette.neutral[200]}`,
                        borderRadius: "1rem",
                        boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        height: '100%',
                        // width: '18rem',
                        display: 'flex',
                        flexDirection: 'column',
                        "&:hover": {
                          transform: "translateY(-6px)",
                          boxShadow: "0 12px 24px rgba(0,0,0,0.18)",
                        },
                        ...(isRefunded ? {
                          opacity: 0.8,
                          filter: 'grayscale(0.15)',
                          borderStyle: 'dashed',
                        } : {}),
                      }}
                    >
                      {/* Delete icon (top-right) */}
                      <Box sx={{ position: 'absolute', top: 6, right: 6, zIndex: 2 }}>
                        <Tooltip title="Delete order" arrow>
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={async () => {
                                const ok = window.confirm('Delete this order? This action cannot be undone.');
                                if (!ok) return;
                                try {
                                  await deleteAdminOrder({ id: row._id }).unwrap();
                                  showToast('Order deleted', 'success');
                                  refetch();
                                } catch (e) {
                                  showToast(e?.data?.msg || e?.message || 'Failed to delete order', 'error');
                                }
                              }}
                              disabled={isDeleting}
                              sx={{
                                bgcolor: 'rgba(244, 67, 54, 0.08)',
                                '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.18)' },
                                borderRadius: '8px',
                              }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography
                          variant="body2" 
                          sx={{ 
                            wordBreak: 'break-all',
                            color: theme.palette.mode === "dark" ? theme.palette.grey[100] : theme.palette.grey[900]
                          }}
                        >
                          {row._id}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        {thumbsToShow.length > 0 && (
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 1,
                              overflowX: 'auto',
                              pb: 0.5,
                              mb: 1,
                              '&::-webkit-scrollbar': { height: 6 },
                              '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 3 },
                            }}
                          >
                            {thumbsToShow.map((src, idx) => {
                              const showOverlay = (idx === thumbsToShow.length - 1) && extraThumbs > 0;
                              return (
                                <Box
                                  key={`${row._id}-thumb-${idx}`}
                                  sx={{
                                    position: 'relative',
                                    width: { xs: 44, sm: 52 },
                                    height: { xs: 44, sm: 52 },
                                    border: '1px solid rgba(0,0,0,0.08)',
                                    borderRadius: 1,
                                    bgcolor: 'background.paper',
                                    flex: '0 0 auto',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <Box
                                    component="img"
                                    src={src}
                                    alt="item"
                                    loading="lazy"
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                                  />
                                  {showOverlay && (
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        bgcolor: 'rgba(0,0,0,0.45)',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        fontSize: 14,
                                      }}
                                    >
                                      {`+${extraThumbs}`}
                                    </Box>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                        )}
                        <Stack spacing={0.75} sx={{ color: theme.palette.mode === "dark" ? theme.palette.grey[200] : theme.palette.grey[800], fontWeight: 600  }}>
                          <Typography variant="body2">
                            <Box component="span" sx={{ color: theme.palette.mode === "dark" ? theme.palette.secondary[300] : '#032944' , fontWeight: 600 }}>User: </Box>
                            {getUserText(row)}
                          </Typography>
                          <Typography variant="body2">
                            <Box component="span" sx={{ color: theme.palette.mode === "dark" ? theme.palette.secondary[300] : '#032944', fontWeight: 600 }}>Quantity: </Box>
                            {getOrderQuantity(row)}
                          </Typography>
                          <Typography variant="body2">
                            <Box component="span" sx={{ color: theme.palette.mode === "dark" ? theme.palette.secondary[300] : '#032944', fontWeight: 600 }}>Total: </Box>
                            <Box component="span" sx={{ color: theme.palette.mode === "dark" ? theme.palette.secondary[300] : '#032944', fontWeight: 600 }}>{Number(row.totalAmount || 0).toFixed(2)}</Box>
                          </Typography>
                          <Typography variant="body2">
                            <Box component="span" sx={{ color: theme.palette.mode === "dark" ? theme.palette.secondary[300] : '#032944', fontWeight: 600 }}>Payment Method: </Box>
                            <Box component="span" sx={{ color: theme.palette.mode === "dark" ? theme.palette.secondary[300] : '#032944', fontWeight: 600 }}>{String(row.paymentMethod || '-').toUpperCase()}</Box>
                          </Typography>
                          <Typography variant="body2">
                            <Box component="span" sx={{ color: theme.palette.mode === "dark" ? theme.palette.secondary[300] : '#032944', fontWeight: 600 }}>Address: </Box>
                            <Box component="span" sx={{ color: theme.palette.mode === "dark" ? theme.palette.secondary[300] : '#032944', fontWeight: 600 }}>{row.shippingAddress || '-'}</Box>
                          </Typography>
                          <Typography variant="body2">
                            <Box component="span" sx={{ color: theme.palette.mode === "dark" ? theme.palette.secondary[300] : '#032944', fontWeight: 600 }}>Date: </Box>
                            <Box component="span" sx={{ color: theme.palette.mode === "dark" ? theme.palette.secondary[300] : '#032944', fontWeight: 600 }}>{orderDate ? new Date(orderDate).toLocaleString() : '-'}</Box>
                          </Typography>
                          {row.trackingNumber ? (
                            <Typography variant="body2">
                              <Box component="span" sx={{ color: theme.palette.mode === "dark" ? theme.palette.secondary[300] : '#032944', fontWeight: 600 }}>Tracking: </Box>
                              <Box component="span" sx={{ color: theme.palette.mode === "dark" ? theme.palette.secondary[300] : '#032944', fontWeight: 600 }}>{row.trackingNumber}</Box>
                            </Typography>
                          ) : null}
                          {packedAtVal ? (
                            <Typography variant="body2">
                              <Box component="span" sx={{ color: theme.palette.mode === "dark" ? theme.palette.secondary[300] : '#032944', fontWeight: 600 }}>Packed At: </Box>
                              <Box component="span" sx={{ color: theme.palette.mode === "dark" ? theme.palette.secondary[300] : '#032944', fontWeight: 600 }}>{new Date(packedAtVal).toLocaleString()}</Box>
                            </Typography>
                          ) : null}
                          {(row.carrier || row.courierPhone || row.courierLogoUrl) ? (
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box component="span" sx={{ color: theme.palette.mode === "dark" ? theme.palette.secondary[300] : '#032944', fontWeight: 600 }}>Courier:</Box>
                                {row.courierLogoUrl ? (
                                  <Box component="img" src={row.courierLogoUrl} alt="courier logo" sx={{ width: 20, height: 20, objectFit: 'contain', borderRadius: 0.5, border: '1px solid rgba(0,0,0,0.06)' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                ) : null}
                                {row.carrierUrl ? (
                                  <a href={row.carrierUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                                    {row.carrier || row.carrierUrl}
                                  </a>
                                ) : (
                                  <span>{row.carrier || '-'}</span>
                                )}
                              </Typography>
                              {row.courierPhone ? (
                                <Typography variant="body2">
                                  <Box component="span" sx={{ color: theme.palette.mode === "dark" ? theme.palette.secondary[300] : '#032944', fontWeight: 600 }}>Phone: </Box>
                                  {maskPhone(row.courierPhone)}
                                </Typography>
                              ) : null}
                            </Box>
                          ) : null}
                          {row.adminNotes ? (
                            <Typography variant="body2">
                              <Box component="span" sx={{ color: theme.palette.mode === "dark" ? theme.palette.secondary[300] : '#032944', fontWeight: 600 }}>Notes: </Box>
                              <span style={{ whiteSpace: 'pre-wrap' }}>{row.adminNotes}</span>
                            </Typography>
                          ) : null}
                        </Stack>
                        <Box sx={{ mt: 1 }}>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Chip
                              size="small"
                              variant="outlined"
                              color={row.isVerified ? 'success' : 'default'}
                              label={row.isVerified ? 'Verified' : 'Unverified'}
                            />
                            <Chip
                              size="small"
                              variant="outlined"
                              color={String(row.paymentStatus || '').toLowerCase() === 'paid' ? 'success'
                                : (String(row.paymentStatus || '').toLowerCase() === 'refunded' ? 'info'
                                : (String(row.paymentStatus || '').toLowerCase() === 'pending' ? 'warning' : 'default'))}
                              label={`Payment: ${String(row.paymentStatus || 'unpaid')}`}
                            />
                            <Chip
                              size="small"
                              variant="outlined"
                              color={(() => {
                                const s = String(row.status || '').toLowerCase();
                                if (s === 'completed') return 'success';
                                if (s === 'cancelled') return 'error';
                                if (s === 'in_transit' || s === 'verified') return 'info';
                                if (s === 'packed') return 'warning';
                                return 'default';
                              })()}
                              label={`Status: ${String(row.status || 'pending')}`}
                            />
                            <Chip
                              size="small"
                              variant="outlined"
                              color={(() => {
                                const d = String(row.deliveryStatus || '').toLowerCase();
                                if (d === 'delivered') return 'success';
                                if (d === 'cancelled') return 'error';
                                if (d === 'out_for_delivery') return 'secondary';
                                if (d === 'shipped') return 'info';
                                if (d === 'packing_complete') return 'warning';
                                return 'default';
                              })()}
                              label={`Delivery: ${String(row.deliveryStatus || 'pending')}`}
                            />
                          </Stack>
                        </Box>
                      </CardContent>
                      <CardActions sx={{ px: 2, pb: 2 }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', rowGap: 1, width: '100%', alignItems: 'start', minWidth: 0 }}>
                          {/* Action buttons based on order status */}
                          <Stack direction="column" spacing={1} width="100%" sx={{ minWidth: 0 }}>
                            {/* Primary Actions (gated sequence) */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1, minWidth: 0 }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                fullWidth
                                sx={{ fontSize: 12, minWidth: 0 }}
                                disabled={nextAction !== 'verify' || isVerifying}
                                onClick={() => handleVerify(row)}
                                startIcon={<CheckCircleOutlineIcon fontSize="small" />}
                              >
                                VERIFY ORDER
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="warning"
                                fullWidth
                                sx={{ fontSize: 12, minWidth: 0 }}
                                disabled={nextAction !== 'pack' || isPacking || packingIds.has(row._id)}
                                onClick={() => handlePack(row)}
                                startIcon={<Inventory2OutlinedIcon fontSize="small" />}
                              >
                                {packingIds.has(row._id) ? 'PACKING...' : 'PACK ORDER'}
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                fullWidth
                                sx={{ fontSize: 12, minWidth: 0 }}
                                disabled={nextAction !== 'confirm' || isConfirming}
                                onClick={() => openConfirm(row)}
                                startIcon={<LocalShippingIcon fontSize="small" />}
                              >
                                CONFIRM & SHIP
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="info"
                                fullWidth
                                sx={{ fontSize: 12, minWidth: 0 }}
                                disabled={nextAction !== 'out_for_delivery' || isOutForDelivering}
                                onClick={() => handleOutForDelivery(row)}
                                startIcon={<LocalShippingOutlinedIcon fontSize="small" />}
                              >
                                OUT FOR DELIVERY
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                fullWidth
                                sx={{ fontSize: 12, minWidth: 0 }}
                                disabled={nextAction !== 'deliver' || isDelivering}
                                onClick={() => handleDeliver(row)}
                                startIcon={<TaskAltIcon fontSize="small" />}
                              >
                                MARK DELIVERED
                              </Button>
                            </Box>

                            {/* Secondary Actions */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1, minWidth: 0 }}>
                              {row.isVerified && !isDelivered && row.status !== 'cancelled' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="info"
                                  fullWidth
                                  sx={{ fontSize: 12, minWidth: 0 }}
                                  onClick={() => openCourier(row)}
                                  startIcon={<LocalShippingOutlinedIcon fontSize="small" />}
                                >
                                  {row.carrier ? 'UPDATE COURIER' : 'ADD COURIER'}
                                </Button>
                              )}
                              {row.isVerified && row.carrier && !isDelivered && row.status !== 'cancelled' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="info"
                                  fullWidth
                                  sx={{ fontSize: 12, minWidth: 0 }}
                                  onClick={() => handlePrintLabel(row)}
                                  startIcon={<PrintIcon fontSize="small" />}
                                >
                                  SHIPPING LABEL
                                </Button>
                              )}
                              {(['shipped','out_for_delivery'].includes(String(row.deliveryStatus || '').toLowerCase())) && row.trackingNumber && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  fullWidth
                                  sx={{ fontSize: 12, minWidth: 0 }}
                                  onClick={() => handleTrackShipment(row)}
                                  startIcon={<TravelExploreOutlinedIcon fontSize="small" />}
                                >
                                  TRACK ORDER
                                </Button>
                              )}
                              {isCOD && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  fullWidth
                                  sx={{ fontSize: 12, minWidth: 0 }}
                                  disabled={!canCollectCODNow || isCollectingCOD}
                                  onClick={() => openCollectCOD(row)}
                                  startIcon={<PaymentsIcon fontSize="small" />}
                                >
                                  {codButtonText}
                                </Button>
                              )}
                            </Box>

                            {/* Utility Actions */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1, minWidth: 0 }}>
                              {!row.deliveredAt && row.status !== 'cancelled' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  fullWidth
                                  sx={{ fontSize: 12, minWidth: 0 }}
                                  onClick={() => handleCancel(row)}
                                  startIcon={<CancelOutlinedIcon fontSize="small" />}
                                >
                                  CANCEL ORDER
                                </Button>
                              )}
                              {(row.deliveredAt || row.status === 'cancelled') && !isRefunded && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                  fullWidth
                                  sx={{ fontSize: 12, minWidth: 0 }}
                                  disabled={isRefunding}
                                  onClick={() => openRefundModal(row)}
                                  startIcon={<UndoIcon fontSize="small" />}
                                >
                                  REFUND ORDER
                                </Button>
                              )}
                              <Button
                                size="small"
                                variant="outlined"
                                color="inherit"
                                fullWidth
                                sx={{ fontSize: 12, minWidth: 0 }}
                                onClick={() => handlePrintInvoice(row)}
                                startIcon={<ReceiptLongIcon fontSize="small" />}
                              >
                                INVOICE
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="inherit"
                                fullWidth
                                sx={{ fontSize: 12, minWidth: 0 }}
                                onClick={() => showOrderTimeline(row)}
                                startIcon={<HistoryIcon fontSize="small" />}
                              >
                                HISTORY
                              </Button>
                            </Box>

                            {/* Contact button - separate row */}
                            <Button
                              size="small"
                              variant="text"
                              color="primary"
                              fullWidth
                              sx={{ fontSize: 12 }}
                              onClick={() => contactCustomer(row)}
                              startIcon={<EmailOutlinedIcon fontSize="small" />}
                            >
                              CONTACT BUYER
                            </Button>
                          </Stack>

                        </Box>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
              </Grid>
          )}
        </Box>
      )}

      {/* Timeline Dialog */}
      <Dialog 
        open={timelineOpen} 
        onClose={() => setTimelineOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Order Timeline</Typography>
            <Typography variant="body2" color="textSecondary">Order #{selectedOrderTimeline?._id}</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedOrderTimeline && (
            <Box sx={{ position: 'relative', pt: 1 }}>
              <Timeline>
                {/* Creation */}
                <TimelineItem>
                  <TimelineSeparator>
                    <TimelineDot color="primary" />
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="subtitle1" fontWeight="bold">Order Placed</Typography>
                    <Typography variant="body2">
                      {new Date(selectedOrderTimeline.createdAt).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Amount: ₹{selectedOrderTimeline.totalAmount}
                    </Typography>
                    {selectedOrderTimeline.paymentStatus && (
                      <Typography variant="body2" color="textSecondary">
                        Payment: {selectedOrderTimeline.paymentStatus.toUpperCase()}
                      </Typography>
                    )}
                  </TimelineContent>
                </TimelineItem>
                
                {/* Verification */}
                {selectedOrderTimeline.verifiedAt && (
                  <TimelineItem>
                    <TimelineSeparator>
                      <TimelineDot color="success" />
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle1" fontWeight="bold">Order Verified</Typography>
                      <Typography variant="body2">
                        {new Date(selectedOrderTimeline.verifiedAt).toLocaleString()}
                      </Typography>
                      {selectedOrderTimeline.verifiedBy && (
                        <Typography variant="body2" color="textSecondary">
                          By: {selectedOrderTimeline.verifiedBy.name || selectedOrderTimeline.verifiedBy.email}
                        </Typography>
                      )}
                    </TimelineContent>
                  </TimelineItem>
                )}

                {/* Packing */}
                {selectedOrderTimeline.packedAt && (
                  <TimelineItem>
                    <TimelineSeparator>
                      <TimelineDot color="info" />
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle1" fontWeight="bold">Order Packed</Typography>
                      <Typography variant="body2">
                        {new Date(selectedOrderTimeline.packedAt).toLocaleString()}
                      </Typography>
                      {selectedOrderTimeline.adminNotes && (
                        <Typography variant="body2" color="textSecondary">
                          Notes: {selectedOrderTimeline.adminNotes}
                        </Typography>
                      )}
                    </TimelineContent>
                  </TimelineItem>
                )}

                {/* Shipping */}
                {selectedOrderTimeline.shippedAt && (
                  <TimelineItem>
                    <TimelineSeparator>
                      <TimelineDot color="warning" />
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle1" fontWeight="bold">Order Shipped</Typography>
                      <Typography variant="body2">
                        {new Date(selectedOrderTimeline.shippedAt).toLocaleString()}
                      </Typography>
                      {selectedOrderTimeline.carrier && (
                        <Typography variant="body2" color="textSecondary">
                          Carrier: {selectedOrderTimeline.carrier}
                        </Typography>
                      )}
                      {selectedOrderTimeline.trackingNumber && (
                        <Typography variant="body2" color="textSecondary">
                          Tracking: {selectedOrderTimeline.trackingNumber}
                        </Typography>
                      )}
                      {selectedOrderTimeline.expectedDeliveryDate && (
                        <Typography variant="body2" color="textSecondary">
                          Expected Delivery: {new Date(selectedOrderTimeline.expectedDeliveryDate).toLocaleDateString()}
                        </Typography>
                      )}
                    </TimelineContent>
                  </TimelineItem>
                )}

                {/* Out for Delivery */}
                {selectedOrderTimeline.outForDeliveryAt && (
                  <TimelineItem>
                    <TimelineSeparator>
                      <TimelineDot color="info" />
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle1" fontWeight="bold">Out for Delivery</Typography>
                      <Typography variant="body2">
                        {new Date(selectedOrderTimeline.outForDeliveryAt).toLocaleString()}
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                )}

                {/* Delivery */}
                {selectedOrderTimeline.deliveredAt && (
                  <TimelineItem>
                    <TimelineSeparator>
                      <TimelineDot color="success" />
                      {selectedOrderTimeline.returnedAt && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle1" fontWeight="bold">Order Delivered</Typography>
                      <Typography variant="body2">
                        {new Date(selectedOrderTimeline.deliveredAt).toLocaleString()}
                      </Typography>
                      {selectedOrderTimeline.deliveryProof && (
                        <Typography variant="body2" color="textSecondary">
                          Proof: {selectedOrderTimeline.deliveryProof}
                        </Typography>
                      )}
                    </TimelineContent>
                  </TimelineItem>
                )}

                {/* Returns/Refunds */}
                {(selectedOrderTimeline.returnedAt || selectedOrderTimeline.paymentStatus === 'refunded') && (
                  <TimelineItem>
                    <TimelineSeparator>
                      <TimelineDot color="error" />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {selectedOrderTimeline.returnedAt ? 'Order Returned' : 'Order Refunded'}
                      </Typography>
                      <Typography variant="body2">
                        {new Date(selectedOrderTimeline.returnedAt || selectedOrderTimeline.refundedAt || Date.now()).toLocaleString()}
                      </Typography>
                      {selectedOrderTimeline.refundAmount && (
                        <Typography variant="body2" color="textSecondary">
                          Refund Amount: ₹{selectedOrderTimeline.refundAmount}
                        </Typography>
                      )}
                    </TimelineContent>
                  </TimelineItem>
                )}
              </Timeline>

              {/* Additional Order Details */}
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Additional Details</Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Payment Method:</strong> {selectedOrderTimeline.paymentMethod || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Shipping Address:</strong><br />
                    {selectedOrderTimeline.formattedAddress || selectedOrderTimeline.shippingAddress || 'N/A'}
                  </Typography>
                  {selectedOrderTimeline.adminNotes && (
                    <Typography variant="body2">
                      <strong>Admin Notes:</strong><br />
                      {selectedOrderTimeline.adminNotes}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimelineOpen(false)}>Close</Button>
          <Button 
            variant="outlined" 
            startIcon={<Icon>print</Icon>}
            onClick={() => handlePrintTimeline(selectedOrderTimeline)}
          >
            Print Timeline
          </Button>
        </DialogActions>
      </Dialog>

      {/* Collect COD Modal */}
      <Dialog open={codOpen} onClose={() => (!isCollectingCOD && setCodOpen(false))} fullWidth maxWidth="xs">
        <DialogTitle>Collect COD Payment</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <TextField
              label={`Amount${codRow ? ` (Due: \u20B9${(Math.max(0, Number(codRow?.totalAmount || 0) - Number(codRow?.paymentDetails?.paymentAmount || 0))).toFixed(2)})` : ''}`}
              type="number"
              inputProps={{ step: "0.01", min: "0" }}
              fullWidth
              value={codAmount}
              onChange={(e) => {
                const v = e.target.value;
                setCodAmount(v);
                if (v === "") { setCodAmountErr(""); return; }
                const n = Number(v);
                if (!Number.isFinite(n) || n <= 0) setCodAmountErr('Enter a valid amount'); else setCodAmountErr("");
              }}
              onBlur={() => {
                if (!codAmount) return;
                const n = Number(codAmount);
                if (Number.isFinite(n)) setCodAmount(String(n.toFixed(2)));
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <Button size="small" onClick={() => {
                      const due = Math.max(0, Number(codRow?.totalAmount || 0) - Number(codRow?.paymentDetails?.paymentAmount || 0));
                      setCodAmount(String(due.toFixed(2)));
                      setCodAmountErr("");
                    }} disabled={isCollectingCOD}>MAX</Button>
                  </InputAdornment>
                )
              }}
              error={Boolean(codAmountErr)}
              helperText={codAmountErr || ''}
              disabled={isCollectingCOD}
            />
            <TextField
              label="Collected By (Delivery Agent)"
              fullWidth
              value={codCollector}
              onChange={(e) => setCodCollector(e.target.value)}
              placeholder="Name or ID"
              disabled={isCollectingCOD}
            />
            <TextField
              label="Collector ID (optional)"
              fullWidth
              value={codCollectorId}
              onChange={(e) => setCodCollectorId(e.target.value)}
              placeholder="Employee ID / Phone"
              disabled={isCollectingCOD}
            />
            <TextField
              label="Collected At"
              type="datetime-local"
              fullWidth
              value={codWhen}
              onChange={(e) => setCodWhen(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={isCollectingCOD}
            />
            <TextField
              label="Notes"
              fullWidth
              multiline
              rows={3}
              value={codNotes}
              onChange={(e) => setCodNotes(e.target.value)}
              disabled={isCollectingCOD}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCodOpen(false)} disabled={isCollectingCOD}>Cancel</Button>
          <Button onClick={submitCollectCOD} variant="contained" disabled={isCollectingCOD}>
            {isCollectingCOD ? <><CircularProgress size={16} style={{ marginRight: 8 }} /> Saving...</> : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contact Customer Dialog */}
      <Dialog
        open={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Contact Customer</DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Subject"
                fullWidth
                defaultValue={`Regarding your order ${selectedOrderTimeline?._id}`}
              />
              <TextField
                label="Message"
                multiline
                rows={4}
                fullWidth
              />
              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label="Send copy to my email"
              />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Message will be sent to: {selectedCustomer.email}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              // Here you would implement the email sending logic
              showToast('Message sent to customer', 'success');
              setContactDialogOpen(false);
            }}
          >
            Send Message
          </Button>
        </DialogActions>
      </Dialog>

      {/* Refund Modal */}
      <Dialog open={refundOpen} onClose={() => (!isRefunding && setRefundOpen(false))} fullWidth maxWidth="xs">
        <DialogTitle>Refund Order</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Enter refund amount in INR (leave blank for full refund)
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Amount (INR)"
            type="number"
            fullWidth
            inputProps={{ step: "0.01", min: "0" }}
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            error={Boolean(refundError)}
            helperText={refundError || ""}
            disabled={isRefunding}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundOpen(false)} disabled={isRefunding}>Cancel</Button>
          <Button onClick={submitRefund} variant="contained" disabled={isRefunding}>
            {isRefunding ? <><CircularProgress size={16} style={{ marginRight: 8 }} /> Processing...</> : 'Refund'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Courier Modal */}
      <Dialog open={courierOpen} onClose={() => (!isUpdatingCourier && setCourierOpen(false))} fullWidth maxWidth="xs">
        <DialogTitle>Update Courier</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel id="preset-label">Carrier Preset</InputLabel>
                <Select
                  labelId="preset-label"
                  label="Carrier Preset"
                  value={preset}
                  onChange={(e) => onPresetChange(e.target.value)}
                >
                  {(editablePresets || presets).map(p => (
                    <MenuItem key={p.name} value={p.name}>{p.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button size="small" variant="outlined" onClick={() => undoLast('courier')} disabled={!lastApplied || lastApplied.type !== 'courier'}>Undo</Button>
              <Button size="small" variant="text" onClick={() => { setEditedPresets(editablePresets || presets); setPresetEditorOpen(true); }}>Edit presets</Button>
            </Box>
            <TextField label="Courier Name" value={carrier} onChange={(e) => setCarrier(e.target.value)} fullWidth />
            <TextField label="Tracking/Carrier URL" value={carrierUrl} onChange={(e) => setCarrierUrl(e.target.value)} fullWidth placeholder="https://..." />
            <TextField label="Courier Phone" value={courierPhone} onChange={(e) => setCourierPhone(e.target.value)} fullWidth placeholder="+91 98-7654-3210" />
            <TextField label="Courier Logo URL" value={courierLogoUrl} onChange={(e) => setCourierLogoUrl(e.target.value)} fullWidth placeholder="https://cdn.example.com/logo.png" />
            <Box>
              <Button component="label" variant="outlined" size="small" disabled={isUploadingLogo || !courierRow}>
                {isUploadingLogo ? <><CircularProgress size={14} style={{ marginRight: 8 }} /> Uploading...</> : 'Upload Logo File'}
                <input type="file" accept="image/*" hidden onChange={onSelectLogoFile} />
              </Button>
              {logoFile ? (
                <Typography variant="caption" sx={{ ml: 1 }}>{logoFile.name}</Typography>
              ) : null}
            </Box>
            {courierErr ? <Alert severity="error">{courierErr}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCourierOpen(false)} disabled={isUpdatingCourier}>Cancel</Button>
          <Button onClick={submitCourier} variant="contained" disabled={isUpdatingCourier}>
            {isUpdatingCourier ? <><CircularProgress size={16} style={{ marginRight: 8 }} /> Saving...</> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm & Ship Modal */}
      <Dialog open={confirmOpen} onClose={() => (!isConfirming && setConfirmOpen(false))} fullWidth maxWidth="xs">
        <DialogTitle>Confirm & Ship</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 0.5 }}>
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tracking Number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  fullWidth
                  autoFocus
                  disabled={isConfirming}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel id="confirm-preset-label">Carrier Preset</InputLabel>
                    <Select
                      labelId="confirm-preset-label"
                      label="Carrier Preset"
                      value={confirmPreset}
                      onChange={(e) => onConfirmPresetChange(e.target.value)}
                    >
                      {(editablePresets || presets).map(p => (
                        <MenuItem key={p.name} value={p.name}>{p.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button size="small" variant="outlined" onClick={() => undoLast('confirm')} disabled={!lastApplied || lastApplied.type !== 'confirm'}>Undo</Button>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Carrier (Courier Name)" value={courierName} onChange={e => setCourierName(e.target.value)} fullWidth required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Carrier URL" value={carrierUrlInput} onChange={(e) => setCarrierUrlInput(e.target.value)} fullWidth placeholder="https://..." />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField label="Courier Phone" value={courierPhoneInput} onChange={(e) => setCourierPhoneInput(e.target.value)} fullWidth placeholder="+91 98-7654-3210" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Courier Logo URL" value={courierLogoUrlInput} onChange={(e) => setCourierLogoUrlInput(e.target.value)} fullWidth placeholder="https://cdn.example.com/logo.png" />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button component="label" variant="outlined" size="small" disabled={isUploadingLogo || !confirmRow}>
                    {isUploadingLogo ? <><CircularProgress size={14} style={{ marginRight: 8 }} /> Uploading...</> : 'Upload Logo File'}
                    <input type="file" accept="image/*" hidden onChange={onSelectLogoFileConfirm} />
                  </Button>
                  {logoFileConfirm ? <Typography variant="caption">{logoFileConfirm.name}</Typography> : null}
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <ReactDatePicker
                  selected={deliveryDate}
                  onChange={(date) => setDeliveryDate(date)}
                  dateFormat="yyyy-MM-dd"
                  customInput={<TextField label="Expected Delivery" fullWidth InputLabelProps={{ shrink: true }} />}
                  disabled={isConfirming}
                  placeholderText="Select date"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Admin Notes"
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  disabled={isConfirming}
                />
              </Grid>

              {confirmErr ? (
                <Grid item xs={12}>
                  <Alert severity="error">{confirmErr}</Alert>
                </Grid>
              ) : null}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={isConfirming}>Cancel</Button>
          <Button onClick={submitConfirm} variant="contained" disabled={isConfirming}>
            {isConfirming ? <><CircularProgress size={16} style={{ marginRight: 8 }} /> Confirming...</> : 'Confirm & Ship'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={toast.open} autoHideDuration={3000} onClose={closeToast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={closeToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>

      {/* Preset Editor Dialog */}
      <Dialog open={presetEditorOpen} onClose={() => setPresetEditorOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Carrier Presets</DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {(editedPresets || []).map((p, idx) => (
              <Box key={p.name || idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField label="Name" value={p.name} onChange={(e) => {
                  const next = [...editedPresets]; next[idx] = { ...next[idx], name: e.target.value }; setEditedPresets(next);
                }} sx={{ flex: 1 }} />
                <TextField label="URL" value={p.url} onChange={(e) => {
                  const next = [...editedPresets]; next[idx] = { ...next[idx], url: e.target.value }; setEditedPresets(next);
                }} sx={{ flex: 2 }} />
                <Button variant="outlined" color="error" onClick={() => { const next = editedPresets.filter((_, i) => i !== idx); setEditedPresets(next); }}>Remove</Button>
              </Box>
            ))}

            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <TextField label="New name" value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} sx={{ flex: 1 }} />
              <TextField label="New URL" value={newPresetUrl} onChange={(e) => setNewPresetUrl(e.target.value)} sx={{ flex: 2 }} />
              <Button onClick={() => {
                if (!newPresetName) return;
                const next = [...(editedPresets || []) , { name: newPresetName, url: newPresetUrl }];
                setEditedPresets(next);
                setNewPresetName(''); setNewPresetUrl('');
              }}>Add</Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPresetEditorOpen(false)}>Cancel</Button>
          <Button onClick={() => { saveEditablePresets(editedPresets); setPresetEditorOpen(false); }} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
