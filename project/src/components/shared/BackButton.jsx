import React from 'react';
import { Button, Icon, Tooltip } from '@chakra-ui/react';
import { FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

/**
 * زر الرجوع للخلف
 * يستخدم في جميع الصفحات للعودة إلى الصفحة السابقة
 */
const BackButton = ({ label = 'رجوع', tooltipText = 'العودة للصفحة السابقة', ...props }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Tooltip label={tooltipText} hasArrow placement="top">
      <Button
        leftIcon={<Icon as={FiArrowRight} />}
        onClick={handleBack}
        variant="outline"
        colorScheme="blue"
        size="sm"
        mb="2"
        borderRadius="md"
        fontWeight="medium"
        _hover={{ bg: 'blue.50' }}
        {...props}
      >
        {label}
      </Button>
    </Tooltip>
  );
};

export default BackButton;
