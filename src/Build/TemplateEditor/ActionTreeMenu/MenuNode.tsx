import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import React from 'react';

import type { Position } from './types';

export interface MenuNodeProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  color?: string;
  position: Position;
  size: number;
  isExpanded?: boolean;
  isDimmed?: boolean;
}

export function MenuNode({
  label,
  onClick,
  disabled = false,
  color = '#3b82f6',
  position,
  size,
  isExpanded = false,
  isDimmed = false,
}: MenuNodeProps): React.ReactElement {
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 2,
      }}
      animate={{
        scale: isExpanded ? 1.1 : 1,
        opacity: isDimmed ? 0.3 : 1,
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <ButtonBase
        onClick={onClick}
        disabled={disabled}
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: disabled ? '#4b5563' : color,
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
          '&:hover': {
            transform: disabled ? 'none' : 'scale(1.05)',
            backgroundColor: disabled ? '#4b5563' : color,
            filter: disabled ? 'none' : 'brightness(1.1) drop-shadow(0 0 10px rgba(59, 130, 246, 0.4))',
          },
          '&:active': {
            transform: disabled ? 'none' : 'scale(0.95)',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem',
              textAlign: 'center',
            }}
          >
            {label}
          </Typography>
        </Box>
      </ButtonBase>
    </motion.div>
  );
}
