/**
 * Search bar with library deduplication toggle
 */

import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React from 'react';

import { useBuildStore } from '../store';

import { VariableViewToggle } from './VariableViewToggle';

interface SearchBarProps {
  templateCount: number;
  uniqueCount?: number;
}

export function SearchBar({ templateCount, uniqueCount }: SearchBarProps): React.ReactElement {
  const searchQuery = useBuildStore((state) => state.searchQuery);
  const deduplicateLibraries = useBuildStore((state) => state.deduplicateLibraries);
  const setSearchQuery = useBuildStore((state) => state.setSearchQuery);
  const setDeduplicateLibraries = useBuildStore((state) => state.setDeduplicateLibraries);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(event.target.value);
  };

  const handleDeduplicateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setDeduplicateLibraries(event.target.checked);
  };

  const countText = deduplicateLibraries && uniqueCount !== undefined
    ? `${templateCount} templates (${uniqueCount} unique)`
    : `${templateCount} template${templateCount !== 1 ? 's' : ''}`;

  return (
    <Box sx={{ marginBottom: 2 }}>
      <TextField
        fullWidth
        placeholder="Search templates..."
        value={searchQuery}
        onChange={handleSearchChange}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ marginBottom: 1 }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Tooltip
          title={
            deduplicateLibraries
              ? 'Showing each template once, even if it appears in multiple libraries'
              : 'Showing templates in each library context where they appear'
          }
        >
          <FormControlLabel
            control={(
              <Checkbox
                checked={deduplicateLibraries}
                onChange={handleDeduplicateChange}
                size="small"
              />
            )}
            label="De-duplicate across libraries"
          />
        </Tooltip>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <VariableViewToggle />
          <Typography variant="caption" color="text.secondary">
            {countText}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
