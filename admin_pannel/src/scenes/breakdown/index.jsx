import React, { useMemo, useRef } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
  useTheme,
  Skeleton,
  Alert,
  Divider,
  Paper,
  IconButton,
} from "@mui/material";
import { LightModeOutlined, DarkModeOutlined } from "@mui/icons-material";
import { useDispatch } from "react-redux";

import Header from "@components/Header";
import BreakdownChart from "@components/BreakdownChart";
import { useGetSalesQuery } from "@state/api";
import { setMode } from "@state";

const Breakdown = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { data, isLoading, isError, refetch } = useGetSalesQuery();
  const chartRef = useRef(null);

  const salesByCategory = data?.salesByCategory || {};

  const { total, categoriesCount, topCategory, topValue, avgPerCategory, topShare, momGrowth } = useMemo(() => {
    const entries = Object.entries(salesByCategory);
    const totalVal = entries.reduce((acc, [, v]) => acc + (Number(v) || 0), 0);
    const sorted = [...entries].sort((a, b) => (b[1] || 0) - (a[1] || 0));
    const [tc, tv] = sorted[0] || ["-", 0];

    // MoM growth using monthlyData (last vs previous)
    const m = Array.isArray(data?.monthlyData) ? data.monthlyData : [];
    // monthlyData is already sorted backend-side; still guard here
    const monthOrder = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const ms = [...m].sort((a,b)=> monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
    const last = ms[ms.length - 1]?.totalSales || 0;
    const prev = ms[ms.length - 2]?.totalSales || 0;
    const mom = prev ? ((last - prev) / prev) : 0;
    return {
      total: totalVal,
      categoriesCount: entries.length,
      topCategory: tc,
      topValue: tv || 0,
      avgPerCategory: entries.length ? totalVal / entries.length : 0,
      topShare: totalVal ? (Number(tv) || 0) / totalVal : 0,
      momGrowth: mom,
    };
  }, [salesByCategory, data?.monthlyData]);

  const handleExport = () => {
    try {
      const rows = [["Category", "Sales"], ...Object.entries(salesByCategory)];
      const csv = rows.map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sales_breakdown.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const handleDownloadPNG = async () => {
    try {
      const root = chartRef.current;
      if (!root) return;
      const svg = root.querySelector('svg');
      if (!svg) return;

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      const canvas = document.createElement('canvas');
      const rect = svg.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));
      const ctx = canvas.getContext('2d');

      await new Promise((resolve, reject) => {
        img.onload = () => { resolve(); };
        img.onerror = reject;
        img.src = url;
      });

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = 'sales_breakdown.png';
      a.click();
    } catch (e) {}
  };

  return (
    <Box m="1.5rem 2.5rem">
      <Header title="BREAKDOWN" subtitle="Breakdown of sales by category" />

      {/* Actions */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="flex-end" mt={2}>
        {/* <IconButton onClick={() => dispatch(setMode())} aria-label="Toggle theme">
          {theme.palette.mode === 'dark' ? (
            <DarkModeOutlined sx={{ fontSize: 22 }} />
          ) : (
            <LightModeOutlined sx={{ fontSize: 22 }} />
          )}
        </IconButton> */}
        <Button variant="outlined" color="primary" onClick={() => refetch()} sx={{ color: theme.palette.mode === "dark" ? "#fff" : "#000", backgroundColor: theme.mode === "dark" ? "#000" : "gray" }}>
          Refresh
        </Button>
        <Button variant="contained" color="secondary" onClick={handleExport} disabled={!data || isLoading}>
          Export CSV
        </Button>
        <Button variant="contained" color="primary" onClick={handleDownloadPNG} disabled={isLoading}>
          Download PNG
        </Button>
      </Stack>

      {isError && (
        <Box mt={2}>
          <Alert severity="error">Failed to load sales breakdown.</Alert>
        </Box>
      )}

      {/* Stats + Chart */}
      <Grid container spacing={2} mt={2} >
        {/* Stat cards */}
        <Grid item xs={12} md={4} >
          <Card sx={{ height: "100%", borderRadius: 2, bgcolor: theme.palette.background.paper}}>
            <CardContent >
              <Typography variant="overline" color="text.secondary">
                Total Sales
              </Typography>
              {isLoading ? (
                <Skeleton variant="text" height={40} />
              ) : (
                <Typography variant="h4" fontWeight={700} sx={{ color: theme.palette.mode === "dark" ? "#fff" : "#000" }}>
                  ₹{total?.toLocaleString?.() || 0}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: "100%", borderRadius: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Categories
              </Typography>
              {isLoading ? (
                <Skeleton variant="text" height={40} />
              ) : (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h4" fontWeight={700} sx={{ color: theme.palette.mode === "dark" ? "#fff" : "#000" }}>
                    {categoriesCount}
                  </Typography>
                  <Chip size="small" label="active" color="success" />
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: "100%", borderRadius: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Top Category
              </Typography>
              {isLoading ? (
                <Skeleton variant="text" height={40} />
              ) : (
                <>
                  <Typography variant="h6" fontWeight={600} sx={{ color: theme.palette.mode === "dark" ? "#fff" : "#000" }}>
                    {topCategory}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ color: theme.palette.mode === "dark" ? "#fff" : "#000" }}>
                    ₹{Number(topValue).toLocaleString?.() || 0}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Avg per category */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: "100%", borderRadius: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Avg per category
              </Typography>
              {isLoading ? (
                <Skeleton variant="text" height={40} />
              ) : (
                <Typography variant="h5" fontWeight={600} sx={{ color: theme.palette.mode === "dark" ? "#fff" : "#000" }} >
                  ₹{avgPerCategory.toLocaleString?.() || 0}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top share % */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: "100%", borderRadius: 2, bgcolor: theme.palette.background.paper }}>
            <CardContent sx={{ p: "1.25rem 1rem" }}>
              <Typography variant="overline" color="text.secondary">
                Top share
              </Typography>
              {isLoading ? (
                <Skeleton variant="text" height={40} />
              ) : (
                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography variant="h4" fontWeight={700} sx={{ color: theme.palette.mode === "dark" ? "#fff" : "#000" }}>
                    {(topShare * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ color: theme.palette.mode === "dark" ? "#fff" : "#000" }}>
                    of total
                  </Typography>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Chart */}
        <Grid item xs={12}>
          <Paper 
            elevation={12}
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: 3,
              height: { xs: 480, md: 650 },
              background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
              overflow: "hidden",
              border: `1px solid ${theme.palette.divider}`,
              color: theme.palette.mode === 'dark' ? 'white' : 'black',fontWeight: 'bold',
            }}
            ref={chartRef}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="h6" fontWeight={700} sx={{  color: theme.palette.mode === 'dark' ? 'white' : 'black',fontWeight: 'bold', }}>
                Sales Breakdown
              </Typography>
            </Stack>
            <Divider sx={{ mb: 1}} />
            {isLoading ? (
              <Skeleton variant="rounded" width="100%" height="100%" sx={{ borderRadius: 2, backgroundColor: theme.palette.mode === "dark" ? "#fff" : "black", borderColor: theme.palette.mode === "dark" ? "#fff" : "black", color: theme.palette.mode === "dark" ? "#fff" : "black" }} />
            ) : (
              <Box height="100%" sx={{ color: theme.palette.mode === "dark" ? "#fff" : "black" , bgcolorColor: theme.palette.mode === "dark" ? "#fff" : "black" }}>
                <BreakdownChart currencySymbol="₹" disableArcLinkLabels  />
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Breakdown;
