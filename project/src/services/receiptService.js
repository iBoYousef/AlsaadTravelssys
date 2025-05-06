import fetch from 'cross-fetch';
import { db } from '../firebase';
import { doc, collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';

export const getReceipts = async () => {
  try {
    const receiptsRef = collection(db, 'receipts');
    const q = query(receiptsRef, orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const receipts = [];
    querySnapshot.forEach((doc) => {
      receipts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      data: receipts
    };
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return { success: false, error: error.message };
  }
};

export const deleteReceipt = async (receiptId) => {
  try {
    const receiptRef = doc(db, 'receipts', receiptId);
    await deleteDoc(receiptRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return { success: false, error: error.message };
  }
};

export const getNextReceiptCode = async () => {
  try {
    const receiptsRef = collection(db, 'receipts');
    const q = query(receiptsRef, orderBy('receiptNumber', 'desc'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return 'R0001';
    }
    
    const lastReceipt = querySnapshot.docs[0].data();
    const lastNumber = lastReceipt.receiptNumber || 'R0000';
    const numericPart = parseInt(lastNumber.substring(1), 10);
    const nextNumber = numericPart + 1;
    
    return `R${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error getting next receipt code:', error);
    return 'R0001';
  }
};
