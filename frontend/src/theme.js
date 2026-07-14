import { createTheme } from '@mui/material/styles';

/**
 * Creates the MUI theme for the She-Na Admin Dashboard.
 * Supports both LTR and RTL directions.
 *
 * @param {'ltr' | 'rtl'} direction
 * @returns {import('@mui/material').Theme}
 */
export function createAppTheme(direction = 'rtl') {
  return createTheme({
    direction,
    palette: {
      mode: 'light',
      primary: {
        main: '#DF327B', // Bright Pink from She-Na branding
        light: '#ED7AAB',
        dark: '#B0195A',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#6B3F97', // Dark Purple from She-Na logo
        light: '#936ABF',
        dark: '#452566',
        contrastText: '#ffffff',
      },
      error: {
        main: '#ef4444',
      },
      warning: {
        main: '#f59e0b',
      },
      info: {
        main: '#3b82f6',
      },
      success: {
        main: '#10b981',
      },
      background: {
        default: '#F9FAFB', // Light gray background
        paper: '#FFFFFF',   // White cards
      },
      text: {
        primary: '#111827',
        secondary: '#4B5563',
        disabled: '#9CA3AF',
      },
      divider: 'rgba(0, 0, 0, 0.08)',
    },
    typography: {
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      h1: { fontWeight: 800, letterSpacing: 0, color: '#151126' },
      h2: { fontWeight: 800, letterSpacing: 0, color: '#151126' },
      h3: { fontWeight: 700, letterSpacing: 0, color: '#151126' },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      body1: { fontWeight: 400, color: '#374151' },
      body2: { fontWeight: 400, color: '#4B5563' },
      subtitle1: { fontWeight: 600, color: '#4B5563' },
      subtitle2: { fontWeight: 500, color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0 },
      caption: { fontWeight: 300, color: '#6B7280' },
      button: { fontWeight: 700, textTransform: 'none', letterSpacing: 0 },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0,0,0,0.1) transparent',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.1)', borderRadius: 3 },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 18px',
            fontWeight: 700,
          },
          containedPrimary: {
            '&:hover': {
              boxShadow: '0 0 15px rgba(223, 50, 123, 0.3)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: 'rgba(0, 0, 0, 0.15)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid rgba(0, 0, 0, 0.08)',
            borderLeft: '1px solid rgba(0, 0, 0, 0.08)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: 'none',
            color: '#111827', // Dark text for app bar
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small',
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontWeight: 500,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: '#FFFFFF',
            fontWeight: 400,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(0, 0, 0, 0.2)',
            },
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#F9FAFB',
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            fontSize: '0.72rem',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            marginBottom: 2,
            '&.Mui-selected': {
              backgroundColor: 'rgba(223, 50, 123, 0.08)',
              color: '#DF327B',
              fontWeight: 700,
              '& .MuiListItemIcon-root': {
                color: '#DF327B',
              },
              '&:hover': {
                backgroundColor: 'rgba(223, 50, 123, 0.12)',
              },
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            color: '#6B7280',
          },
        },
      },
    },
  });
}
