import React from 'react';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Chip,
} from '@mui/material';
import {
  Home as HomeIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useHome } from '../../contexts/HomeContext';
import { SelectChangeEvent } from '@mui/material/Select';

const HomeSelector: React.FC = () => {
  const { selectedHome, homes, loading, setSelectedHome } = useHome();

  const handleHomeChange = (event: SelectChangeEvent<string>) => {
    const homeId = event.target.value;
    const home = homes.find(h => h.id === homeId);
    setSelectedHome(home || null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <HomeIcon color="action" />
        <Typography variant="body2" color="text.secondary">
          Loading homes...
        </Typography>
      </Box>
    );
  }

  if (homes.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <HomeIcon color="error" />
        <Typography variant="body2" color="error">
          No homes available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <BusinessIcon color="primary" />
      
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <Select
          value={selectedHome?.id || ''}
          onChange={handleHomeChange}
          displayEmpty
          sx={{
            '& .MuiSelect-select': {
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            },
          }}
        >
          {homes.map((home) => (
            <MenuItem key={home.id} value={home.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <HomeIcon fontSize="small" color="primary" />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {home.name}
                  </Typography>
                  {home.address && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {home.address}
                    </Typography>
                  )}
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedHome && (
        <Chip
          label={selectedHome.name}
          size="small"
          color="primary"
          variant="outlined"
          icon={<HomeIcon />}
        />
      )}
    </Box>
  );
};

export default HomeSelector; 