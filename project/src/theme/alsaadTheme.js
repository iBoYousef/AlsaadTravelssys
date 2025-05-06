import { extendTheme } from '@chakra-ui/react';

// ألوان الثيم الجديد
const colors = {
  alsaad: {
    50: '#e6f7ff',
    100: '#b3e0ff',
    200: '#80caff',
    300: '#4db3ff',
    400: '#1a9dff',
    500: '#0099e5', // اللون الرئيسي
    600: '#007bb8',
    700: '#005c8a',
    800: '#003e5c',
    900: '#001f2e',
  },
  secondary: {
    50: '#f2f2f2',
    100: '#d9d9d9',
    200: '#bfbfbf',
    300: '#a6a6a6',
    400: '#8c8c8c',
    500: '#737373',
    600: '#595959',
    700: '#404040',
    800: '#262626',
    900: '#0d0d0d',
  },
};

// أنماط المكونات
const components = {
  Button: {
    baseStyle: {
      fontWeight: '600',
      borderRadius: 'md',
      transition: 'all 0.2s',
    },
    variants: {
      primary: {
        bg: 'alsaad.500',
        color: 'white',
        _hover: { bg: 'alsaad.600', transform: 'translateY(-2px)', boxShadow: 'lg' },
        _active: { bg: 'alsaad.700', transform: 'translateY(0)' },
      },
      secondary: {
        bg: 'secondary.800',
        color: 'white',
        _hover: { bg: 'secondary.700', transform: 'translateY(-2px)', boxShadow: 'lg' },
        _active: { bg: 'secondary.900', transform: 'translateY(0)' },
      },
      outline: {
        bg: 'transparent',
        color: 'alsaad.500',
        border: '2px solid',
        borderColor: 'alsaad.500',
        _hover: { bg: 'alsaad.50', transform: 'translateY(-2px)', boxShadow: 'lg' },
        _active: { bg: 'alsaad.100', transform: 'translateY(0)' },
      },
      ghost: {
        bg: 'transparent',
        color: 'gray.800',
        _hover: { bg: 'gray.100', transform: 'translateY(-2px)' },
        _active: { bg: 'gray.200', transform: 'translateY(0)' },
        _dark: {
          color: 'white',
          _hover: { bg: 'whiteAlpha.200' },
          _active: { bg: 'whiteAlpha.300' },
        },
      },
    },
    sizes: {
      sm: { px: 3, py: 1, fontSize: 'sm', h: '32px' },
      md: { px: 4, py: 2, fontSize: 'md', h: '40px' },
      lg: { px: 6, py: 3, fontSize: 'lg', h: '48px' },
    },
    defaultProps: {
      variant: 'primary',
      size: 'md',
    },
  },
  Heading: {
    baseStyle: {
      fontFamily: 'Noto Kufi Arabic, sans-serif',
      fontWeight: '700',
    },
  },
  Text: {
    baseStyle: {
      fontFamily: 'Noto Sans Arabic, sans-serif',
    },
  },
};

// إعدادات الثيم
const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// إنشاء الثيم
const alsaadTheme = extendTheme({
  colors,
  components,
  config,
  direction: 'rtl',
  fonts: {
    heading: 'Noto Kufi Arabic, sans-serif',
    body: 'Noto Sans Arabic, sans-serif',
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
});

export default alsaadTheme;
