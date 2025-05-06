import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useDisclosure
} from '@chakra-ui/react';
import { FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

/**
 * زر حذف مباشر للمسؤولين
 * يتيح للمسؤول حذف أي سجل مباشرة مع تأكيد بسيط
 * 
 * @param {Object} props - خصائص المكون
 * @param {Function} props.onDelete - دالة تنفذ عند تأكيد الحذف
 * @param {String} props.itemId - معرف العنصر المراد حذفه
 * @param {String} props.itemName - اسم العنصر (اختياري)
 * @param {String} props.itemType - نوع العنصر (اختياري)
 * @param {Boolean} props.isLoading - حالة التحميل
 * @param {Boolean} props.isDisabled - تعطيل الزر
 * @param {String} props.tooltipText - نص التلميح (اختياري)
 * @param {String} props.colorScheme - لون الزر (اختياري)
 */
const DirectDeleteButton = ({
  onDelete,
  itemId,
  itemName = '',
  itemType = 'العنصر',
  isLoading = false,
  isDisabled = false,
  tooltipText = 'حذف مباشر',
  colorScheme = 'red'
}) => {
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();
  const [isDeleting, setIsDeleting] = useState(false);

  // التحقق من صلاحيات المستخدم
  const canDirectDelete = user && (
    user.isAdmin || 
    user.isSuperAdmin || 
    user.role === 'admin' || 
    user.role === 'superadmin' || 
    (user.permissions && (
      user.permissions.includes('all') || 
      user.permissions.includes('delete_records')
    ))
  );

  if (!canDirectDelete) {
    return null;
  }

  const handleDelete = async () => {
    if (!itemId) return;
    
    try {
      setIsDeleting(true);
      await onDelete(itemId);
    } catch (error) {
      console.error('خطأ في حذف العنصر:', error);
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <>
      <Tooltip label={tooltipText} hasArrow>
        <IconButton
          icon={<FiTrash2 />}
          colorScheme={colorScheme}
          variant="ghost"
          size="sm"
          aria-label="حذف مباشر"
          onClick={onOpen}
          isLoading={isLoading}
          isDisabled={isDisabled}
        />
      </Tooltip>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
        size="sm"
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              تأكيد الحذف
            </AlertDialogHeader>

            <AlertDialogBody>
              {itemName 
                ? `هل أنت متأكد من حذف ${itemType} "${itemName}"؟`
                : `هل أنت متأكد من حذف هذا ${itemType}؟`
              }
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                إلغاء
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                isLoading={isDeleting}
                mr={3}
              >
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default DirectDeleteButton;
