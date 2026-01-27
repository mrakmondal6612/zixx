import FlexBetween from "@components/FlexBetween";
import Header from "@components/Header";
import { getApiBase } from "@utils/apiBase";

import {
  DownloadOutlined,
  Email,
  PointOfSale,
  PersonAdd,
  Traffic,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import BreakdownChart from "@components/BreakdownChart";
import OverviewChart from "@components/OverviewChart";
import StatBox from "@components/StatBox";
import { useGetDashboardQuery } from "@state/api";

const Dashboard = () => {
  const theme = useTheme();
  const isNonMediumScreens = useMediaQuery("(min-width:1200px)");

  const { data, isLoading } = useGetDashboardQuery();
  
  const ellipsisCell = (value) => (
    <Box sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
      {String(value ?? '')}
    </Box>
  );

  const columns = [
    {
      field: "_id",
      headerName: "ID",
      flex: 1,
      renderCell: (params) => ellipsisCell(params.value),
    },
    {
      field: "userId",
      headerName: "User ID",
      flex: 1,
      renderCell: (params) => ellipsisCell(params.value),
    },

    {
      field: "createdAt",
      headerName: "Created",
      flex: 1,
      renderCell: (params) => ellipsisCell(params.value),
    },

    {
      field: "products",
      headerName: "# Products",
      flex: 0.6,
      sortable: false,
      renderCell: (params) => ellipsisCell(params.value?.length ?? 0),
    },
    {
      field: "cost",
      headerName: "Cost",
      flex: 0.8,
      renderCell: (params) => ellipsisCell(`₹${Number(params.value).toFixed(2)}`),
    },
  ];
  return (
    <Box m="1.5rem 2.5rem">
      <FlexBetween>
        <Header title="DASHBOARD" subtitle="Welcome to your dashboard" />

        <Box>
          <Button
            sx={{
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(255,209,102,0.35), rgba(255,209,102,0.15))'
                : 'linear-gradient(135deg, rgba(255,209,102,0.9), rgba(255,209,102,0.65))',
              color: theme.palette.mode === 'dark' ? theme.palette.secondary[50] : theme.palette.grey[600],
              fontSize: "14px",
              fontWeight: 700,
              padding: "10px 20px",
              borderRadius: "10px",
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
              transition: 'transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 10px 22px rgba(0,0,0,0.2)',
                opacity: 0.95,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(255,209,102,0.45), rgba(255,209,102,0.2))'
                  : 'linear-gradient(135deg, rgb(243, 220, 166), rgba(206, 198, 178, 0.75))',
              }
            }}
          >
            <DownloadOutlined sx={{ mr: "10px" }} />
            Download Reports
          </Button>
        </Box>
      </FlexBetween>
      

      <Box
        mt="20px"
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="160px"
        gap="20px"
        sx={{
          "& > div": { gridColumn: isNonMediumScreens ? undefined : "span 12", minWidth: 0 },
          gridAutoRows: { xs: '120px', sm: '140px', md: '160px' },
        }}
      >
        {/* ROW 1 */}
        <StatBox
          sx={{}}
          title="Total Customers"
          value={data?.totalCustomers ?? 0}
          increase="+14%"
          description="Since last month"
          icon={
            <Email
              sx={{ color: theme.palette.secondary[300], fontSize: "20px" }}
            />
          }
        />
        
        <StatBox
          title="Sales Today"
          value={data?.todayStats?.totalSales ?? 0}
          increase="+21%"
          description="Since last month"
          icon={
            <PointOfSale
              sx={{ color: theme.palette.secondary[300], fontSize: "20px" }}
            />
          }
        />
        <Box
          gridColumn="span 8"
          gridRow="span 3"
          backgroundColor={theme.palette.background.alt}
          p="1.5rem"
          borderRadius="12px"
          boxShadow="0 4px 14px rgba(0,0,0,0.15)"
        >
          <Typography variant="h6" sx={{ color: theme.palette.secondary[100] }}>
            Sales By Category
          </Typography>
          <BreakdownChart isDashboard={true} />
          <Typography
            p="0 0.6rem"
            fontSize="0.8rem"
            sx={{ color: theme.palette.secondary[200] }}
          >
            Breakdown of real states and information via category for revenue
            made for this year and total sales.
          </Typography>
        </Box>

        
        <StatBox
          title="Monthly Sales"
          value={data?.thisMonthStats?.totalSales ?? 0}
          increase="+5%"
          description="Since last month"
          icon={
            <PersonAdd
              sx={{ color: theme.palette.secondary[300], fontSize: "20px" }}
            />
          }
        />
        
        <StatBox
          title="Yearly Sales"
          value={data?.yearlySalesTotal ?? 0}
          increase="+43%"
          description="Since last month"
          icon={
            <Traffic
              sx={{ color: theme.palette.secondary[300], fontSize: "20px" }}
            />
          }
        />

        <StatBox
            title="Daily Units Sold"
            value={data?.dailyTotalSoldUnits ?? 0}
            increase="+17%"
            description="Since last year"
            icon={
              <PointOfSale
                sx={{ color: theme.palette.secondary[300], fontSize: "20px" }}
              />
            }
          />

        <StatBox
          title="Yearly Units Sold"
          value={data?.yearlyTotalSoldUnits ?? 0}
          increase="+17%"
          description="Since last year"
          icon={
            <PointOfSale
              sx={{ color: theme.palette.secondary[300], fontSize: "20px" }}
            />
          }
        />


        {/* ROW 2 */}
        <Box
          gridColumn="span 6"
          gridRow="span 3"
          backgroundColor={theme.palette.background.alt}
          p="0.01rem"
          borderRadius="12px"
          boxShadow="0 4px 14px rgba(0,0,0,0.15)"
        >
          <OverviewChart view="sales" isDashboard={true} />
        </Box>
        <Box
          gridColumn="span 6"
          gridRow="span 3"
          sx={{
            "& .MuiDataGrid-root": {
              border: "none",
              borderRadius: "12px",
              minWidth: 0,
              minHeight: 0,
              height: 520,
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              color: theme.palette.text.primary,
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: theme.palette.background.alt,
              color: theme.palette.secondary[100],
              borderBottom: "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              borderTopLeftRadius: "12px",
              borderTopRightRadius: "12px",
            },
            "& .MuiDataGrid-virtualScroller": {
              backgroundColor: theme.palette.background.alt,
            },
            "& .MuiDataGrid-footerContainer": {
              backgroundColor: theme.palette.background.alt,
              color: theme.palette.secondary[100],
              borderTop: "none",
              borderBottomLeftRadius: "12px",
              borderBottomRightRadius: "12px",
            },
            "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
              color: `${theme.palette.secondary[200]} !important`,
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          <DataGrid
            loading={isLoading || !data}
            getRowId={(row) => row._id}
            rows={(data && data.transactions) || []}
            columns={columns}
            disableRowSelectionOnClick
            sx={{
              height: 400, // fixed height
              overflowY: "auto", // vertical scroll
            }}
          />
        </Box>


      </Box>
    </Box>
  );
};

export default Dashboard;
