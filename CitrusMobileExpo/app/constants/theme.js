/**
 * Theme constants for the application
 * Defines colors, typography, spacing, and other visual properties
 * 
 * @module theme
 */

/**
 * Color palette for the application
 * @type {Object}
 */
export const colors = {
  // Colors
  primary: '#F6B460', // Main background color
  secondary: '#FFFFFF', // Secondary background color
  tertiary: '#F8F8F8', // Tertiary background color
  accent: '#273469',     // delft-blue - contrast/accent
  
  // Status Colors
  error: '#ff6b6c',      // light-red - errors, validation, warnings

  // Primary app colors
  primary: {
    main: '#F6B460', // Primary background color
    light: '#F8C27D', // Lighter shade for button background
    dark: '#D89A4F', // Darker shade for shadows
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF', // White text
    secondary: 'rgba(255, 255, 255, 0.7)', // Slightly transparent white
    hover: '#1E3A8A', // Dark blue for hover states
    primaryDark: '#273469', // Accent blue for text
  },
  
  // UI elements
  button: {
    background: '#F8C27D', // Lighter shade of primary for button background
    text: '#FFFFFF', // White text
    hover: '#1E3A8A', // Dark blue for hover
    shadow: '#D89A4F', // Darker shade of primary for shadows
  },
  
  // Background colors
  background: {
    primary: '#F6B460', // Main background
    secondary: '#FFFFFF', // Secondary background
    tertiary: '#F8F8F8', // Tertiary background
  },
  
  // Border colors
  border: {
    error: '#ff6b6c',    // light-red - error states
    light: 'rgba(0, 0, 0, 0.1)',
  },
};

/**
 * Typography settings for the application
 * @type {Object}
 */
export const typography = {
  /**
   * Font families
   */
  fontFamily: {
    primary: 'Calibri',
  },
  /**
   * Font sizes
   */
  fontSize: {
    small: 14,
    medium: 16,
    large: 20,
    xlarge: 24,
    xxlarge: 40,
  },
  /**
   * Font weights
   */
  fontWeight: {
    regular: '400',
    bold: 'bold',
  },
};

/**
 * Spacing constants for consistent layout
 * @type {Object}
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const layout = {
  navBarHeight: '20%',
  contentPadding: 16,
};

export default {
  colors,
  typography,
  spacing,
  layout,
}; 