import React, { useState, useMemo, useRef, useEffect } from "react";
import { Box, Typography, useTheme, Tooltip, IconButton, CircularProgress } from "@mui/material";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useGetSalesQuery } from "@state/api";
import { ResponsivePie } from "@nivo/pie";

const BreakdownChart = ({
  isDashboard = false,
  currencySymbol = "₹",
  currencyPosition = "prefix", // 'prefix' or 'suffix'
  disableArcLinkLabels = false,
}) => {
  // Prevent refetch on every mount so cached data can be used immediately and avoid showing the loading spinner.
  const { data, isLoading, isError } = useGetSalesQuery(undefined, { refetchOnMountOrArgChange: false });
  const theme = useTheme();

  const colors = [
    theme.palette.secondary[500],
    theme.palette.secondary[300],
    theme.palette.secondary[300],
    theme.palette.secondary[500],
  ];

  // State to track which legend items are hidden (toggled off)
  const [hiddenIds, setHiddenIds] = useState([]);

  const formattedData = useMemo(() => {
    const salesByCategory = (data && data.salesByCategory) || {};
    return Object.entries(salesByCategory).map(([category, sales], i) => ({
      id: category,
      label: category,
      value: sales,
      color: colors[i % colors.length],
    }));
  }, [data, colors]);

  const filteredData = useMemo(
    () => formattedData.filter((d) => !hiddenIds.includes(d.id)),
    [formattedData, hiddenIds]
  );

  // Refs + state for legend scrolling controls
  const legendRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    const el = legendRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    // show right if there's overflow on the right
    setCanScrollRight(el.scrollWidth > el.clientWidth + el.scrollLeft + 1);
  };

  useEffect(() => {
    updateScrollButtons();
    const el = legendRef.current;
    if (!el) return undefined;

    const onScroll = () => updateScrollButtons();
    el.addEventListener('scroll', onScroll, { passive: true });

    // Use ResizeObserver if available to detect content/size changes
    let ro;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(() => updateScrollButtons());
      ro.observe(el);
      // also observe children to detect label changes
      Array.from(el.children).forEach((c) => ro.observe(c));
    }

    const onWin = () => updateScrollButtons();
    window.addEventListener('resize', onWin);

    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onWin);
      if (ro) ro.disconnect();
    };
  }, [formattedData]);

  const scrollLegend = (delta) => {
    const el = legendRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const toggleId = (id) => {
    setHiddenIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const formattedCenter = useMemo(() => {
    const val = data && data.yearlySalesTotal;
    if (typeof val === "number") {
      // Use Indian numbering formatting for rupee, otherwise default to en-US.
      const locale = currencySymbol === "₹" ? "en-IN" : "en-US";
      try {
        const formattedNumber = val.toLocaleString(locale, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        // Place currency symbol according to currencyPosition prop.
        return currencyPosition === "suffix"
          ? `${formattedNumber}${currencySymbol}`
          : `${currencySymbol}${formattedNumber}`;
      } catch {
        return currencyPosition === "suffix"
          ? `${val}${currencySymbol}`
          : `${currencySymbol}${val}`;
      }
    }
    return val;
  }, [data, currencySymbol, currencyPosition]);

  const hasData = formattedData && formattedData.length > 0;

  // If we're loading but already have cached data, render the chart immediately and avoid the full-page spinner.
  if (isLoading && !hasData)
    return (
      <Box height={isDashboard ? "400px" : "100%"} display="flex" alignItems="center" justifyContent="center">
        <Box textAlign="center">
          <CircularProgress size={28} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Loading sales breakdown...
          </Typography>
        </Box>
      </Box>
    );

  // If there's an error and no data to show, render an error box.
  if (isError && !hasData)
    return (
      <Box height={isDashboard ? "400px" : "100%"} display="flex" alignItems="center" justifyContent="center">
        <Typography variant="body2">Error loading sales breakdown</Typography>
      </Box>
    );

  if (!formattedData || formattedData.length === 0) {
    return (
      <Box
        height={isDashboard ? "400px" : "100%"}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        No sales breakdown available
      </Box>
    );
  }

  return (
    <Box
      height={isDashboard ? "400px" : "100%"}
      width={undefined}
      minHeight={isDashboard ? "325px" : undefined}
      minWidth={isDashboard ? "325px" : undefined}
      position="relative"
    >
      <ResponsivePie
        data={filteredData}
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
        colors={{ datum: "data.color" }}
  // Increase bottom margin so the legend has space and doesn't overlap the donut
  margin={isDashboard ? { top: 10, right: 80, bottom: 80, left: 50 } : { top: 40, right: 80, bottom: 120, left: 80 }}
        sortByValue={true}
        innerRadius={0.45}
        activeOuterRadiusOffset={8}
        borderWidth={1}
        borderColor={{
          from: "color",
          modifiers: [["darker", 0.2]],
        }}
        enableArcLinkLabels={!isDashboard && !disableArcLinkLabels}
        arcLinkLabelsTextColor={theme.palette.secondary[200]}
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: "color" }}
        // Increase skip angle slightly on dashboard to reduce clutter on small cards
        arcLabelsSkipAngle={isDashboard ? 0 : 0}
        arcLabelsTextColor={{
          from: "color",
          modifiers: [["darker", 5]],
        }}
        // We use a custom legend below (for truncation + tooltip), so disable Nivo's built-in legend.
        legends={[]}
      />
      <Box
        position="absolute"
        top="50%"
        left="50%"
        color={theme.palette.secondary[400]}
        textAlign="center"
        pointerEvents="none"
        sx={{
          // Keep the total centered inside the donut regardless of card size
          transform: "translate(-55%,-180%)",
        }}
      >
        <Typography variant="h6">
          {!isDashboard && "Total: "}
          {formattedCenter}
        </Typography>
      </Box>

      {/* Custom legend (compact, scrollable, with tooltip) - used for both dashboard and full views */}
      {formattedData && formattedData.length > 0 && (
        // Nudge the legend a bit lower so chips don't sit on top of the donut
        <Box sx={{ position: 'absolute', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'auto' }}>
          {/* left button */}
          <IconButton
            size="small"
            onClick={() => scrollLegend(-160)}
            sx={{
              visibility: canScrollLeft ? 'visible' : 'hidden',
              ml: 1,
              bgcolor: 'background.paper',
              boxShadow: 1,
            }}
            aria-hidden={!canScrollLeft}
            aria-label="Scroll legend left"
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>

          <Box
            ref={legendRef}
            sx={
              isDashboard
                ? {
                    mx: 1,
                    display: 'flex',
                    gap: 1,
                    overflowX: 'auto',
                    overflowY: 'auto',
                    alignItems: 'center',
                    pb: 1,
                    flexDirection: { xs: 'column', sm: 'row' },
                    maxHeight: { xs: 160, sm: 'auto' },
                    px: 1,
                  }
                : {
                    mx: 1,
                    display: 'flex',
                    gap: 2,
                    flexWrap: 'wrap',
                    overflowX: 'auto',
                    alignItems: 'center',
                    pb: 1,
                    px: 1,
                  }
            }
          >
            {formattedData.map((d) => {
            const isHidden = hiddenIds.includes(d.id);
            return (
              <Tooltip key={d.id} title={d.label} placement="top">
                <Box
                  onClick={() => toggleId(d.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleId(d.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isHidden}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    transition: "opacity 150ms ease, transform 150ms ease",
                    opacity: isHidden ? 0.45 : 1,
                    transform: isHidden ? "scale(0.98)" : "scale(1)",
                    userSelect: "none",
                    outline: "none",
                    '&:focus': {
                      boxShadow: `0 0 0 3px ${theme.palette.primary[200] || '#cfe8ff'}`,
                      borderRadius: 1,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: d.color,
                      flex: "0 0 auto",
                      border: isHidden ? `1px solid ${theme.palette.grey[500]}` : "none",
                      boxShadow: isHidden ? "none" : `0 0 6px ${d.color}66`,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      maxWidth: isDashboard ? 120 : 180,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {d.label}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
          </Box>

          {/* right button */}
          <IconButton
            size="small"
            onClick={() => scrollLegend(160)}
            sx={{
              visibility: canScrollRight ? 'visible' : 'hidden',
              mr: 1,
              bgcolor: 'background.paper',
              boxShadow: 1,
            }}
            aria-hidden={!canScrollRight}
            aria-label="Scroll legend right"
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default BreakdownChart;
