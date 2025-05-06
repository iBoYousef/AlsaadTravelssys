import React from 'react';
import { Button, Image, Flex, Text, Box, useColorModeValue } from '@chakra-ui/react';

/**
 * مكون زر مخصص مع شعار السعد
 * @param {Object} props - خصائص الزر
 * @param {string} props.variant - نوع الزر (primary, secondary, outline)
 * @param {string} props.size - حجم الزر (sm, md, lg)
 * @param {boolean} props.showLogo - إظهار شعار السعد على الزر
 * @param {string} props.logoPosition - موقع الشعار (left, right)
 * @param {React.ReactNode} props.leftIcon - أيقونة يسار النص
 * @param {React.ReactNode} props.rightIcon - أيقونة يمين النص
 */
const AlsaadButton = ({
  children,
  variant = 'primary',
  size = 'md',
  showLogo = false,
  logoPosition = 'left',
  leftIcon,
  rightIcon,
  ...props
}) => {
  // ألوان الثيم الجديد
  const primaryColor = useColorModeValue('#0099e5', '#0099e5');
  const secondaryColor = useColorModeValue('#333333', '#333333');
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  
  // تكوين الزر حسب النوع
  const buttonStyles = {
    primary: {
      bg: primaryColor,
      color: 'white',
      _hover: { bg: '#007bb8', transform: 'translateY(-2px)', boxShadow: 'lg' },
      _active: { bg: '#006699', transform: 'translateY(0)' },
    },
    secondary: {
      bg: secondaryColor,
      color: 'white',
      _hover: { bg: '#555555', transform: 'translateY(-2px)', boxShadow: 'lg' },
      _active: { bg: '#222222', transform: 'translateY(0)' },
    },
    outline: {
      bg: 'transparent',
      color: primaryColor,
      border: '2px solid',
      borderColor: primaryColor,
      _hover: { bg: 'rgba(0, 153, 229, 0.1)', transform: 'translateY(-2px)', boxShadow: 'lg' },
      _active: { bg: 'rgba(0, 153, 229, 0.2)', transform: 'translateY(0)' },
    },
    ghost: {
      bg: 'transparent',
      color: textColor,
      _hover: { bg: 'rgba(0, 0, 0, 0.05)', transform: 'translateY(-2px)' },
      _active: { bg: 'rgba(0, 0, 0, 0.1)', transform: 'translateY(0)' },
    }
  };
  
  // تكوين الزر حسب الحجم
  const sizeStyles = {
    sm: { px: 3, py: 1, fontSize: 'sm', h: '32px', borderRadius: 'md' },
    md: { px: 4, py: 2, fontSize: 'md', h: '40px', borderRadius: 'md' },
    lg: { px: 6, py: 3, fontSize: 'lg', h: '48px', borderRadius: 'md' }
  };
  
  // حجم الشعار حسب حجم الزر
  const logoSizes = {
    sm: '16px',
    md: '20px',
    lg: '24px'
  };
  
  // مسار الشعار
  const logoPath = variant === 'primary' || variant === 'secondary' 
    ? '/images/favicon.svg' 
    : '/images/favicon.svg';
  
  return (
    <Button
      transition="all 0.2s"
      fontWeight="600"
      {...buttonStyles[variant]}
      {...sizeStyles[size]}
      {...props}
    >
      <Flex align="center" justify="center">
        {showLogo && logoPosition === 'right' && (
          <>
            {children}
            <Image 
              src={logoPath} 
              alt="السعد للسياحة والسفر" 
              h={logoSizes[size]} 
              w={logoSizes[size]} 
              mr={2} 
            />
          </>
        )}
        
        {showLogo && logoPosition === 'left' && (
          <>
            <Image 
              src={logoPath} 
              alt="السعد للسياحة والسفر" 
              h={logoSizes[size]} 
              w={logoSizes[size]} 
              ml={2} 
            />
            {children}
          </>
        )}
        
        {!showLogo && leftIcon && (
          <>
            <Box mr={2}>{leftIcon}</Box>
            {children}
          </>
        )}
        
        {!showLogo && rightIcon && (
          <>
            {children}
            <Box ml={2}>{rightIcon}</Box>
          </>
        )}
        
        {!showLogo && !leftIcon && !rightIcon && children}
      </Flex>
    </Button>
  );
};

export default AlsaadButton;
