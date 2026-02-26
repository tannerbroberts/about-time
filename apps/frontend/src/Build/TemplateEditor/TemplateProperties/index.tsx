import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import React from 'react';

import { useBuildStore } from '../../store';
import { formatDuration } from '../../utils/durationFormatters';

export function TemplateProperties(): React.ReactElement {
  const focusedLineage = useBuildStore((state) => state.focusedLineage);
  const templates = useBuildStore((state) => state.templates);

  const [expanded, setExpanded] = React.useState(false);

  if (focusedLineage.length === 0) {
    return <></>;
  }

  const focusedItem = focusedLineage[focusedLineage.length - 1];
  const template = templates[focusedItem.templateId];

  if (!template) {
    return <></>;
  }

  const isSegment = focusedItem.offset !== undefined;

  return (
    <Accordion
      expanded={expanded}
      onChange={(): void => setExpanded(!expanded)}
      sx={{
        marginBottom: 2,
        '&:before': {
          display: 'none',
        },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Template Properties
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Name
            </Typography>
            <Typography variant="body2">{template.intent || 'Untitled'}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Type
            </Typography>
            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
              {template.templateType}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Duration
            </Typography>
            <Typography variant="body2">{formatDuration(template.estimatedDuration)}</Typography>
          </Box>

          {isSegment && (
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Offset
              </Typography>
              <Typography variant="body2">{formatDuration(focusedItem.offset!)}</Typography>
            </Box>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
