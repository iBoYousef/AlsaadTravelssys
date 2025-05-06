import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Heading,
  Icon,
  useColorModeValue,
  Image,
  HStack,
  VStack,
  Circle
} from '@chakra-ui/react';

/**
 * مكون بطاقة القسم في القائمة الرئيسية
 * @param {Object} props خصائص المكون
 * @param {string} props.to رابط القسم
 * @param {React.ComponentType} props.icon أيقونة القسم
 * @param {string} props.title عنوان القسم
 * @param {string} props.description وصف القسم
 * @param {string} props.colorScheme نظام الألوان (alsaad, blue, green, purple, orange, teal)
 * @returns {JSX.Element}
 */
const AlsaadMenuCard = ({
  to,
  icon,
  title,
  description,
  colorScheme = 'alsaad'
}) => {
  // تحديد ألوان البطاقة بناءً على نظام الألوان
  const colorMap = {
    alsaad: { light: 'alsaad.500', dark: 'alsaad.600', hover: 'alsaad.700', text: 'white', accent: 'alsaad.200' },
    blue: { light: 'blue.500', dark: 'blue.600', hover: 'blue.700', text: 'white', accent: 'blue.200' },
    green: { light: 'green.500', dark: 'green.600', hover: 'green.700', text: 'white', accent: 'green.200' },
    purple: { light: 'purple.500', dark: 'purple.600', hover: 'purple.700', text: 'white', accent: 'purple.200' },
    orange: { light: 'orange.500', dark: 'orange.600', hover: 'orange.700', text: 'white', accent: 'orange.200' },
    teal: { light: 'teal.500', dark: 'teal.600', hover: 'teal.700', text: 'white', accent: 'teal.200' },
  };

  const colors = colorMap[colorScheme] || colorMap.alsaad;
  const bgGradient = `linear(to-r, ${colors.light}, ${colors.dark})`;
  const hoverBgGradient = `linear(to-r, ${colors.dark}, ${colors.hover})`;
  
  // تحديد مسار شعار الشركة
  const logoSrc = '/assets/logo-white.svg'; // شعار الشركة باللون الأبيض

  return (
    <Link to={to} style={{ display: 'block', width: '100%' }}>
      <Box
        p={6}
        borderRadius="xl"
        boxShadow="md"
        bgGradient={bgGradient}
        _hover={{
          boxShadow: 'xl',
          transform: 'translateY(-4px)',
          bgGradient: hoverBgGradient,
          transition: 'all 0.3s ease'
        }}
        transition="all 0.2s ease"
        position="relative"
        overflow="hidden"
        height="100%"
      >
        {/* زخرفة خلفية */}
        <Box
          position="absolute"
          top="0"
          right="0"
          width="150px"
          height="150px"
          opacity="0.1"
          bgGradient={`radial(${colors.light} 1px, transparent 6px)`}
          backgroundSize="15px 15px"
          pointerEvents="none"
        />

        {/* شعار الشركة في الخلفية */}
        <Box
          position="absolute"
          bottom="-15px"
          left="-15px"
          opacity="0.15"
          pointerEvents="none"
          width="100px"
          height="100px"
        >
          <Image src={'/logo.png'} alt="شعار السعد" width="100%" height="100%" />
        </Box>

        {/* محتوى البطاقة */}
        <Flex direction="column" height="100%" position="relative" zIndex="1">
          <HStack spacing={4} mb={4} align="center">
            <Circle size="40px" bg={colors.accent} color={colors.dark}>
              <Icon as={icon} boxSize="5" />
            </Circle>
            <Heading as="h3" size="md" color={colors.text} fontWeight="bold">
              {title}
            </Heading>
          </HStack>
          
          <Text color={`${colors.text}`} opacity="0.9" fontSize="sm">
            {description}
          </Text>

          {/* شعار الشركة في الزاوية */}
          <Box
            position="absolute"
            top="6px"
            left="6px"
            width="24px"
            height="24px"
          >
            <Image src={'/logo.png'} alt="شعار السعد" width="100%" height="100%" />
          </Box>
        </Flex>
      </Box>
    </Link>
  );
};

export default AlsaadMenuCard;
