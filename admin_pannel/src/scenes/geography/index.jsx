import React from "react";
import { Box, useTheme, Typography, CircularProgress } from "@mui/material";
import { useGetGeographyQuery } from "@state/api";
import Header from "@components/Header";
import { ResponsiveChoropleth } from "@nivo/geo";
import { geoData } from "@state/geoData";

const Geography = () => {
  const theme = useTheme();
  const { data: apiData, error, isLoading, isError, refetch } = useGetGeographyQuery();
  
  // State for markers and geocoding progress
  const [markers, setMarkers] = React.useState([]);
  const [geoProgress, setGeoProgress] = React.useState({ done: 0, total: 0 });

  // simple sessionStorage-backed cache for geocoding results to avoid rate limits
  const geoCacheKey = "geo_cache_v1";

  const geocodeAddress = async (q) => {
    if (!q) return null;
    try {
      const cache = JSON.parse(sessionStorage.getItem(geoCacheKey) || "{}");
      if (cache[q]) return cache[q];
      // Nominatim free geocoding
      // include optional email param to be a good citizen; set VITE_GEOCODER_EMAIL if available
      const email = import.meta.env.VITE_GEOCODER_EMAIL || '';
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1${email ? `&email=${encodeURIComponent(email)}` : ''}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return null;
      const arr = await res.json();
      if (!Array.isArray(arr) || arr.length === 0) return null;
      const { lat, lon } = arr[0];
      const coords = { lat: Number(lat), lon: Number(lon) };
      cache[q] = coords;
      try { sessionStorage.setItem(geoCacheKey, JSON.stringify(cache)); } catch (e) {}
      return coords;
    } catch (e) {
      return null;
    }
  };

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!apiData || !Array.isArray(apiData)) return;
      const results = [];
      const batch = apiData; // already aggregated with count
      setGeoProgress({ done: 0, total: batch.length });
      for (let i = 0; i < batch.length; i++) {
        const loc = batch[i];
        try {
          const parts = [];
          if (loc.city) parts.push(loc.city);
          if (loc.state) parts.push(loc.state);
          if (loc.zip) parts.push(loc.zip);
          if (loc.country) parts.push(loc.country); // ISO3; Nominatim generally accepts
          const q = parts.filter(Boolean).join(", ");
          const geo = await geocodeAddress(q);
          if (geo) {
            results.push({
              id: `${loc.country}|${loc.state||''}|${loc.city||''}|${loc.zip||''}`,
              coords: [geo.lon, geo.lat], // [lon, lat]
              label: q,
              count: Number(loc.count) || 0,
              users: loc.users || [],
            });
          }
        } catch (e) {
          // continue on error
        }
        // throttling to be gentle with geocoder (300ms between requests)
        try { await new Promise((r) => setTimeout(r, 300)); } catch (e) {}
        setGeoProgress((p) => ({ ...p, done: Math.min(p.total, p.done + 1) }));
      }
      if (mounted) setMarkers(results);
      setGeoProgress((p) => ({ ...p, done: p.total }));
    })();
    return () => { mounted = false; };
  }, [apiData]);

  // normalize and validate API response to an array of { id: string, value: number }
  const chartData = React.useMemo(() => {
    if (!apiData) return null;
    if (!Array.isArray(apiData)) {
      console.warn('Geography: unexpected API response, expected array but got', apiData);
      return null;
    }
    // If items are in new shape, aggregate per country
    const hasCountryShape = apiData.some((d) => d && d.country != null && d.count != null);
    if (hasCountryShape) {
      const agg = apiData.reduce((acc, d) => {
        if (!d || d.country == null) return acc;
        const key = String(d.country);
        acc[key] = (acc[key] || 0) + (Number(d.count) || 0);
        return acc;
      }, {});
      return Object.entries(agg).map(([id, value]) => ({ id, value }));
    }
    // fallback legacy mapping
    return apiData
      .map((d) => (d && d.id != null && d.value != null ? { id: String(d.id), value: Number(d.value) || 0 } : null))
      .filter(Boolean);
  }, [apiData]);

  // compute domain dynamically so color scale fits data
  const domain = React.useMemo(() => {
    if (!chartData || chartData.length === 0) return [0, 1];
    const max = Math.max(...chartData.map((d) => d.value || 0));
    return [0, Math.max(1, max)];
  }, [chartData]);

  // filter geoData.features to remove malformed features that can cause Nivo to produce
  // invalid SVG paths (e.g. missing geometry or empty coordinates)
  const filteredFeatures = React.useMemo(() => {
    try {
      if (!geoData || !Array.isArray(geoData.features)) return [];
      return geoData.features.filter((f) => {
        if (!f || !f.geometry) return false;
        const { geometry } = f;
        if (!geometry.type || !geometry.coordinates) return false;
        // expect Polygon or MultiPolygon with non-empty coordinates
        if (geometry.type === 'Polygon') {
          return Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0;
        }
        if (geometry.type === 'MultiPolygon') {
          return Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0 && geometry.coordinates.some((p) => Array.isArray(p) && p.length > 0);
        }
        return false;
      });
    } catch (e) {
      return [];
    }
  }, [geoData]);

  return (
    <Box m="1.5rem 2.5rem">
      <Header title="Geography" subtitle="Find where your users are located." />

      <Box
        mt="24px"
        sx={{
          position: 'relative',
          backgroundColor: theme.palette.background.alt,
          borderRadius: '12px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Top meta bar with progress */}
        {(geoProgress?.total > 0) && (
          <Box sx={{
            px: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          }}>
            <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>
              Geocoding users: {geoProgress.done}/{geoProgress.total}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {(geoProgress.done < geoProgress.total) && <CircularProgress size={16} />}
            </Box>
          </Box>
        )}

        <Box sx={{ height: '70vh' }}>
        {isLoading ? (
          <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CircularProgress size={20} />
              <Typography sx={{ color: theme.palette.text.secondary }}>Loading geography...</Typography>
            </Box>
          </Box>
        ) : isError ? (
          <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', p: 3 }}>
            <Typography color="error">Error loading geography data</Typography>
          </Box>
        ) : chartData && chartData.length > 0 && filteredFeatures && filteredFeatures.length > 0 ? (
          <ResponsiveChoropleth
            data={chartData}
            theme={{
              axis: {
                domain: {
                  line: {
                    stroke: theme.palette.divider,
                  },
                },
                legend: {
                  text: {
                    fill: theme.palette.text.secondary,
                  },
                },
                ticks: {
                  line: {
                    stroke: theme.palette.divider,
                    strokeWidth: 1,
                  },
                  text: {
                    fill: theme.palette.text.secondary,
                  },
                },
              },
              legends: {
                text: {
                  fill: theme.palette.text.secondary,
                },
              },
              tooltip: {
                container: {
                  color: theme.palette.text.primary,
                  background: theme.palette.background.alt,
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                },
              },
            }}
            features={filteredFeatures}
            margin={{ top: 0, right: 0, bottom: 0, left: -50 }}
            domain={domain}
            unknownColor="#666666"
            label="properties.name"
            valueFormat=".2s"
            projectionScale={150}
            projectionTranslation={[0.45, 0.6]}
            projectionRotation={[0, 0, 0]}
            enableGraticule={true}
            borderWidth={1.3}
            borderColor="#ffffff"
            // custom layer to draw user markers on top of the choropleth
            layers={[
              "features",
              "graticule",
              // custom markers layer (guarded) - avoid projection errors or invalid coords
              function UserMarkers({ features, projection }) {
                try {
                  if (!projection || !markers || markers.length === 0) return null;
                  // cluster markers by screen proximity (simple O(n^2) since markers limited)
                  const clusters = [];
                  const used = new Array(markers.length).fill(false);
                  const pxThreshold = 20; // pixels
                  for (let i = 0; i < markers.length; i++) {
                    if (used[i]) continue;
                    const m = markers[i];
                    if (!m || !Array.isArray(m.coords) || m.coords.length < 2) continue;
                    let pt;
                    try { pt = projection(m.coords); } catch (e) { continue; }
                    if (!pt || !isFinite(pt[0]) || !isFinite(pt[1])) continue;
                    const cluster = { x: pt[0], y: pt[1], total: m.count || 1, labels: [m.label], id: m.id, users: m.users || [] };
                    used[i] = true;
                    for (let j = i + 1; j < markers.length; j++) {
                      if (used[j]) continue;
                      const m2 = markers[j];
                      if (!m2 || !Array.isArray(m2.coords) || m2.coords.length < 2) continue;
                      let pt2;
                      try { pt2 = projection(m2.coords); } catch (e) { continue; }
                      if (!pt2 || !isFinite(pt2[0]) || !isFinite(pt2[1])) continue;
                      const dx = pt2[0] - pt[0];
                      const dy = pt2[1] - pt[1];
                      if (Math.hypot(dx, dy) <= pxThreshold) {
                        used[j] = true;
                        cluster.labels.push(m2.label);
                        cluster.total += (m2.count || 1);
                        // merge users from both markers
                        if (m2.users) cluster.users = [...(cluster.users || []), ...m2.users];
                        // recompute cluster centroid (weighted by count)
                        const w1 = cluster.total;
                        const w2 = (m2.count || 1);
                        cluster.x = (cluster.x * (w1 - w2) + pt2[0] * w2) / w1;
                        cluster.y = (cluster.y * (w1 - w2) + pt2[1] * w2) / w1;
                      }
                    }
                    clusters.push(cluster);
                  }

                  return (
                    <g>
                      {clusters.map((c, idx) => {
                        if (!c || !c.total) return null;
                        const key = `cluster-${idx}-${c.id}`;
                        const r = 4 + Math.min(14, Math.sqrt(c.total) * 2);
                        return (
                          <g key={key} transform={`translate(${c.x}, ${c.y})`}>
                            <circle r={r} fill="#ff7043" stroke="#fff" strokeWidth={1.2} />
                            <text x={0} y={4} textAnchor="middle" fontSize={10} fill="#fff">{c.total}</text>
                            <title>
                              {c.labels.slice(0,3).join('; ')}
                              {c.users && c.users.length > 0 && (
                                '\nCustomers: ' + c.users.slice(0,10).map(u => u.name).join(', ') + 
                                (c.users.length > 10 ? ` and ${c.users.length - 10} more...` : '')
                              )}
                            </title>
                          </g>
                        );
                      })}
                    </g>
                  );
                } catch (e) {
                  // fail safe: do not render markers if anything goes wrong
                  return null;
                }
              },
              "legends",
            ]}
            legends={[
              {
                anchor: "bottom-right",
                direction: "column",
                justify: true,
                translateX: 0,
                translateY: -125,
                itemsSpacing: 0,
                itemWidth: 94,
                itemHeight: 18,
                itemDirection: "left-to-right",
                itemTextColor: theme.palette.text.secondary,
                itemOpacity: 0.85,
                symbolSize: 18,
                effects: [
                  {
                    on: "hover",
                    style: {
                      itemTextColor: theme.palette.text.primary,
                      itemOpacity: 1,
                    },
                  },
                ],
              },
            ]}
          />
        ) : (
          <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
            <Typography sx={{ color: theme.palette.text.secondary }}>No geography data available</Typography>
          </Box>
        )}
        </Box>
      </Box>
    </Box>
  );
};

export default Geography;
