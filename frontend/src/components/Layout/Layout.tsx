import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  Task as TaskIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Report as ReportIcon,
  TrendingUp as TrendingUpIcon,
  AccountCircle,
  Logout,
} from '@mui/icons-material';
import HomeSelector from '../HomeSelector/HomeSelector';
import { useAuth } from '../../contexts/AuthContext';


const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Inspections', icon: <AssessmentIcon />, path: '/inspections' },
  { text: 'Tasks', icon: <TaskIcon />, path: '/tasks' },
  { text: 'Homes', icon: <BusinessIcon />, path: '/homes' },
  { text: 'Users', icon: <PeopleIcon />, path: '/users' },
  { text: 'Reports', icon: <ReportIcon />, path: '/reports' },
  { text: 'Remediation Reports', icon: <TrendingUpIcon />, path: '/remediation-reports' },
];

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [titleWidth, setTitleWidth] = useState(220); // Default width for logo
  console.log('🔍 Current titleWidth state:', titleWidth);
  const titleRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  // Measure title width and apply to logo
  useEffect(() => {
    if (titleRef.current) {
      const width = titleRef.current.getBoundingClientRect().width;
      console.log('🎯 Title width measured:', width, 'px');
      setTitleWidth(width);
    }
  }, []);

  // Re-measure on window resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (titleRef.current) {
        const width = titleRef.current.getBoundingClientRect().width;
        setTitleWidth(width);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: 3, 
          flexDirection: 'column', 
          py: 3, 
          px: 0,
          width: '100%'
        }}>
          <img 
            src="/logotreeonly.svg" 
            alt="FigTree Tree Logo" 
            style={{ 
              height: '120px', 
              width: `${titleWidth}px`,
              filter: 'brightness(0) saturate(100%) invert(67%) sepia(12%) saturate(1237%) hue-rotate(89deg) brightness(95%) contrast(87%)'
            }}
            onLoad={() => console.log('🖼️ Tree logo loaded with width:', titleWidth, 'px')}
            onError={(e) => {
              // Fallback to text if image fails to load
              e.currentTarget.style.display = 'none';
              const nextSibling = e.currentTarget.nextSibling as HTMLElement;
              if (nextSibling) {
                nextSibling.style.display = 'block';
              }
            }}
          />
          <Typography 
            ref={titleRef}
            variant="h5" 
            noWrap 
            component="div" 
            sx={{ 
              color: 'primary.main', 
              fontWeight: 700,
              display: 'block',
              textAlign: 'center',
              width: '100%',
              px: 0,
              wordBreak: 'break-word',
              lineHeight: 1.2,
            }}
          >
            FigTree DoorCheck
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => {
          // Hide Users and Homes menu for non-admins
          if ((item.text === 'Users' || item.text === 'Homes') && !isAdmin) {
            return null;
          }
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <img 
              src="/logotreeonly.svg" 
              alt="FigTree Tree Logo" 
              style={{ 
                height: '48px', 
                width: 'auto',
                filter: 'brightness(0) saturate(100%) invert(100%)' // White filter for app bar
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <Typography variant="h6" noWrap component="div">
              {menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <HomeSelector />
            <IconButton
              size="medium"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
          </Box>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem disabled>
              <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                {user?.name.charAt(0)}
              </Avatar>
              {user?.name}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
      

    </Box>
  );
};

export default Layout; 
