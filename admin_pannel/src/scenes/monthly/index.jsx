import React, { useMemo } from "react";
import { Box, useTheme } from "@mui/material";
import Header from "@components/Header";
import { ResponsiveLine } from "@nivo/line";
import { useGetSalesQuery } from "@state/api";

const Monthly = () => {
  const { data, isLoading, isError } = useGetSalesQuery();
  const theme = useTheme();

  const formattedData = useMemo(() => {
    if (!data) return [];

    // backend may return several shapes; try common keys
    const monthlyData = data.monthlyData || data.monthly || data.sales || data.salesStats || data.data?.monthlyData || data.data?.sales;

    if (!monthlyData) return [];

    const totalSalesLine = {
      id: "totalSales",
      color: theme.palette.secondary.main,
      data: [],
    };
    const totalUnitsLine = {
      id: "totalUnits",
      color: theme.palette.secondary[600],
      data: [],
    };

    // monthlyData might be an object keyed by month or an array of entries
    const entries = Array.isArray(monthlyData) ? monthlyData : Object.values(monthlyData || {});
    entries.forEach((entry) => {
      if (!entry) return;
      const month = entry.month || entry._id || entry.label || String(entry.date || '') || '';
      const totalSales = Number(entry.totalSales ?? entry.total ?? entry.sales ?? 0) || 0;
      const totalUnits = Number(entry.totalUnits ?? entry.units ?? entry.count ?? 0) || 0;
      totalSalesLine.data.push({ x: month, y: totalSales });
      totalUnitsLine.data.push({ x: month, y: totalUnits });
    });

    return [totalSalesLine, totalUnitsLine];
  }, [data, theme.palette.secondary]);

  return (
    <Box m="1.5rem 2.5rem">
      <Header title="MONTHLY SALES" subtitle="Chart of Monthly sales" />

      <Box height="75vh">
        {isLoading ? (
          <> Loading... </>
        ) : isError ? (
          <> Error loading monthly sales </>
        ) : formattedData && formattedData.length > 0 ? (
          <ResponsiveLine
            data={formattedData}
            theme={{
              axis: {
                domain: {
                  line: {
                    stroke: theme.palette.secondary[200],
                  },
                },
                legend: {
                  text: {
                    fill: theme.palette.secondary[200],
                  },
                },
                ticks: {
                  line: {
                    stroke: theme.palette.secondary[200],
                    strokeWidth: 1,
                  },
                  text: {
                    fill: theme.palette.secondary[200],
                  },
                },
              },
              legends: {
                text: {
                  fill: theme.palette.secondary[200],
                },
              },
              tooltip: {
                container: {
                  color: theme.palette.primary.main,
                },
              },
            }}
            colors={{ datum: "color" }}
            margin={{ top: 50, right: 50, bottom: 70, left: 60 }}
            xScale={{ type: "point" }}
            yScale={{
              type: "linear",
              min: "auto",
              max: "auto",
              stacked: false,
              reverse: false,
            }}
            yFormat=" >-.2f"
            // curve="catmullRom"
            axisTop={null}
            axisRight={null}
            axisBottom={{
              orient: "bottom",
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 90,
              legend: "Month",
              legendOffset: 60,
              legendPosition: "middle",
            }}
            axisLeft={{
              orient: "left",
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: "Total",
              legendOffset: -50,
              legendPosition: "middle",
            }}
            enableGridX={false}
            enableGridY={false}
            pointSize={10}
            pointColor={{ theme: "background" }}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            pointLabelYOffset={-12}
            useMesh={true}
            legends={[
              {
                anchor: "top-right",
                direction: "column",
                justify: false,
                translateX: 50,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: "left-to-right",
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: "circle",
                symbolBorderColor: "rgba(0, 0, 0, .5)",
                effects: [
                  {
                    on: "hover",
                    style: {
                      itemBackground: "rgba(0, 0, 0, .03)",
                      itemOpacity: 1,
                    },
                  },
                ],
              },
            ]}
          />
        ) : (
          <> No monthly sales data available </>
        )}
      </Box>
    </Box>
  );
};

export default Monthly;
