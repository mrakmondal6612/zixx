import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import FlexBetween from "./FlexBetween";

const StatBox = ({ title, value, increase, icon, description }) => {
  const theme = useTheme();
  return (
    <Box
      gridColumn="span 2"
      gridRow="span 1"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      p="0.875rem"
      flex="1 1 100%"
      minWidth={0}
      backgroundColor={theme.palette.background.alt}
      borderRadius="12px"
      boxShadow="0 4px 14px rgba(0,0,0,0.15)"
      sx={{
        transition: "transform 180ms ease, box-shadow 180ms ease",
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 10px 24px rgba(0,0,0,0.2)'
        }
      }}
    >
      <FlexBetween>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.primary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '70%',
            fontWeight: 600,
          }}
        >
          {title}
        </Typography>
        <Box
          sx={{
            width: 28,
            height: 28,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '10px',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))'
              : 'linear-gradient(135deg, rgba(0,0,0,0.04), rgba(0,0,0,0.02))',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          }}
        >
          {icon}
        </Box>
      </FlexBetween>

      <Typography
        variant="h5"
        fontWeight="600"
        sx={{
          color: theme.palette.secondary[200],
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' },
        }}
      >
        {value}
      </Typography>
      <FlexBetween gap="1rem">
        <Typography
          variant="body2"
          fontStyle="italic"
          sx={{
            color: theme.palette.secondary.light,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: { xs: '0.7rem', sm: '0.8rem' },
            fontWeight: 600,
          }}
        >
          {increase}
        </Typography>
        <Typography
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: theme.palette.text.secondary,
            fontSize: { xs: '0.65rem', sm: '0.75rem' },
          }}
        >
          {description}
        </Typography>
      </FlexBetween>
    </Box>
  );
};

export default StatBox;
