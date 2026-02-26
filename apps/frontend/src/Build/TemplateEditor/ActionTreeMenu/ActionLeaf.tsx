import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import React from 'react';

import type { Position } from './types';

export interface ActionLeafProps {
  label: string;
  description?: string;
  onClick: () => void;
  disabled?: boolean;
  disabledTooltip?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  position: Position;
  color?: string;
}

export function ActionLeaf({
  label,
  description,
  onClick,
  disabled = false,
  disabledTooltip,
  variant = 'primary',
  position,
  color,
}: ActionLeafProps): React.ReactElement {
  const getColor = (): string => {
    if (color) {
      return color;
    }
    if (disabled) {
      return '#4b5563';
    }
    switch (variant) {
      case 'primary':
        return '#3b82f6';
      case 'secondary':
        return '#10b981';
      case 'danger':
        return '#ef4444';
      default:
        return '#3b82f6';
    }
  };

  const button = (
    <motion.div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 2,
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, delay: 0.1 }}
    >
      <Button
        onClick={onClick}
        disabled={disabled}
        sx={{
          width: '140px',
          height: '50px',
          padding: 1,
          borderRadius: '16px',
          backgroundColor: getColor(),
          color: 'white',
          textAlign: 'center',
          justifyContent: 'center',
          textTransform: 'none',
          transition: 'all 0.15s',
          '&:hover': {
            backgroundColor: getColor(),
            filter: disabled ? 'none' : 'brightness(1.1) drop-shadow(0 0 10px rgba(59, 130, 246, 0.4))',
            transform: disabled ? 'none' : 'scale(1.05)',
          },
          '&:active': {
            transform: disabled ? 'none' : 'scale(0.95)',
          },
          '&.Mui-disabled': {
            backgroundColor: '#4b5563',
            color: '#9ca3af',
          },
        }}
      >
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            {label}
          </Typography>
          {description && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                marginTop: 0.25,
                opacity: 0.9,
                fontSize: '0.65rem',
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      </Button>
    </motion.div>
  );

  if (disabled && disabledTooltip) {
    return (
      <Tooltip title={disabledTooltip} placement="top">
        <span>{button}</span>
      </Tooltip>
    );
  }

  return button;
}
