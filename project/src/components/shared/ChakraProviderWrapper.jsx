import React from 'react';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import alsaadTheme from '../../theme/alsaadTheme';

// تكوين الثيم
const theme = extendTheme({
  direction: 'rtl',
  fonts: {
    body: 'Tajawal, system-ui, sans-serif',
    heading: 'Tajawal, system-ui, sans-serif',
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800'
      }
    }
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'normal'
      },
      defaultProps: {
        colorScheme: 'blue'
      }
    },
    Alert: {
      baseStyle: {
        container: {
          borderRadius: 'md'
        }
      },
      defaultProps: {
        variant: 'subtle'
      }
    },
    Text: {
      baseStyle: {
        fontSize: 'md'
      }
    },
    Heading: {
      baseStyle: {
        fontWeight: 'bold'
      },
      defaultProps: {
        size: 'lg'
      }
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'lg',
          boxShadow: 'sm'
        }
      }
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'blue.400'
      }
    },
    Select: {
      defaultProps: {
        focusBorderColor: 'blue.400'
      }
    }
  }
});

// مكون غلاف لـ ChakraProvider
const ChakraProviderWrapper = ({ children }) => {
  return (
    <ChakraProvider theme={alsaadTheme} resetCSS>
      {children}
    </ChakraProvider>
  );
};

export default ChakraProviderWrapper;
