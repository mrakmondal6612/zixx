// admin_client/src/scenes/performance/index.jsx
import React, { useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import Header from "@components/Header";
import { useGetSalesQuery } from "@state/api";

const Performance = () => {
  const theme = useTheme();
  const { data, isLoading, error } = useGetSalesQuery();

  // Map backend dailyData -> grid rows
  const rows = useMemo(() => {
    const daily = data?.dailyData || [];
    return daily.map((d, idx) => ({
      id: `${d.date || idx}`,
      date: d.date,
      totalSales: d.totalSales,
      totalUnits: d.totalUnits,
    }));
  }, [data]);

  const columns = [
    { field: "date", headerName: "Date", flex: 1 },
    { field: "totalSales", headerName: "Total Sales", flex: 1 },
    { field: "totalUnits", headerName: "Total Units", flex: 1 },
  ];

  return (
    <Box m="1.5rem 2.5rem">
      <Header title="PERFORMANCE" subtitle="Daily sales performance" />
      <Box
        height="80vh"
        sx={{
          "& .MuiDataGrid-root": {
            border: "none",
          },

          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: theme.palette.background.alt,

            color: theme.palette.secondary[100],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: theme.palette.primary.light,
          },

          "& .MuiDataGrid-footerContainer": {
            backgroundColor: theme.palette.background.alt,

            color: theme.palette.secondary[100],
            borderTop: "none",
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${theme.palette.secondary[200]} !important`,
          },
        }}
      >
        <DataGrid
          loading={isLoading}
          getRowId={(row) => row.id}
          rows={rows}
          columns={columns}
          rowsPerPageOptions={[25, 50, 100]}
          autoHeight={false}
          disableColumnMenu
        />
        {!isLoading && !error && rows.length === 0 && (
          <Box display="flex" alignItems="center" justifyContent="center" height="100%">
            <Typography variant="body2" color="text.secondary">No performance data.</Typography>
          </Box>
        )}
        {error && (
          <Box display="flex" alignItems="center" justifyContent="center" height="100%">
            <Typography variant="body2" color="error.main">Failed to load performance data.</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Performance;