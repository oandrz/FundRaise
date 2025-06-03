import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import type { MenuItem } from '@/types';

// Initialize the Google Sheets API client
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || '';

// Robust private key processing
let GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_SHEETS_PRIVATE_KEY || '')
  .replace(/\\n/g, '\n')           // Replace escaped newlines
  .replace(/^["']|["']$/g, '')     // Remove surrounding quotes
  .replace(/\\\\/g, '\\')          // Fix double backslashes
  .trim();                         // Remove extra whitespace

// Fix private key formatting - add proper line breaks
if (GOOGLE_PRIVATE_KEY && !GOOGLE_PRIVATE_KEY.includes('\n')) {
  // Split the key into proper lines
  const keyWithoutHeaders = GOOGLE_PRIVATE_KEY
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, ''); // Remove all whitespace
  
  // Add line breaks every 64 characters
  const keyLines = [];
  for (let i = 0; i < keyWithoutHeaders.length; i += 64) {
    keyLines.push(keyWithoutHeaders.substring(i, i + 64));
  }
  
  // Reconstruct the key with proper formatting
  GOOGLE_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\n${keyLines.join('\n')}\n-----END PRIVATE KEY-----`;
}

const INVENTORY_SHEET_NAME = 'Inventory';

console.log('=== Google Sheets Credentials Debug ===');
console.log('SPREADSHEET_ID:', SPREADSHEET_ID ? '✓ Set' : '✗ Missing');
console.log('CLIENT_EMAIL:', GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✓ Set' : '✗ Missing');
console.log('PRIVATE_KEY length:', GOOGLE_PRIVATE_KEY.length);
console.log('PRIVATE_KEY first 50 chars:', GOOGLE_PRIVATE_KEY.substring(0, 50));
console.log('PRIVATE_KEY last 50 chars:', GOOGLE_PRIVATE_KEY.substring(GOOGLE_PRIVATE_KEY.length - 50));
console.log('PRIVATE_KEY has newlines:', GOOGLE_PRIVATE_KEY.includes('\n'));

if (!SPREADSHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
  console.warn('Google Sheets credentials are not fully configured. Google Sheets integration will not work.');
}

// Create a new auth client for Google Sheets with additional error handling
const getAuthClient = () => {
  try {
    // Try to create JWT with the formatted private key
    const auth = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });
    
    console.log('JWT client created successfully');
    return auth;
  } catch (error) {
    console.error('Error creating JWT client:', error);
    
    // Try alternative approach: use keyFile instead of key
    try {
      // Convert the key to a proper JSON format
      const serviceAccountKey = {
        type: "service_account",
        private_key: GOOGLE_PRIVATE_KEY,
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      };
      
      const authAlt = new JWT({
        email: serviceAccountKey.client_email,
        key: serviceAccountKey.private_key,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
        ],
      });
      
      console.log('Alternative JWT client created successfully');
      return authAlt;
    } catch (altError) {
      console.error('Alternative JWT creation also failed:', altError);
      throw new Error('Failed to create authentication client');
    }
  }
};

// Initialize the Google Sheets client
export async function getMenuItems(): Promise<MenuItem[]> {
  if (!SPREADSHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.error('Google Sheets credentials are not fully configured');
    return [];
  }

  try {
    const auth = getAuthClient();
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);
    
    await doc.loadInfo();
    
    // Use the sheet by name or index if name not found
    let sheet = doc.sheetsByTitle[INVENTORY_SHEET_NAME];
    if (!sheet) {
      // Fallback to first sheet if named sheet not found
      sheet = doc.sheetsByIndex[0];
    }
    
    if (!sheet) {
      throw new Error('No sheets found in the document');
    }
    
    const rows = await sheet.getRows();

    return rows.map((row, index) => ({
      id: String(index + 1),
      name: row.get('menu') || row.get('name') || `Item ${index + 1}`,
      description: row.get('description') || '',
      price: parseFloat(row.get('price') || '0'),
      category: row.get('category') || 'Food',
      imageUrl: row.get('imageUrl') || 'https://placehold.co/600x400.png',
      quantity: parseInt(row.get('quantity') || '0', 10),
    }));
  } catch (error) {
    console.error('Error fetching menu items from Google Sheets:', error);
    return [];
  }
}

// Update the quantity of an item in the Google Sheet
export async function updateItemQuantity(itemId: string, newQuantity: number): Promise<boolean> {
  if (!SPREADSHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.error('Google Sheets credentials are not fully configured');
    return false;
  }

  try {
    const auth = getAuthClient();
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);
    
    await doc.loadInfo();
    
    // Use the sheet by name or index if name not found
    let sheet = doc.sheetsByTitle[INVENTORY_SHEET_NAME];
    if (!sheet) {
      // Fallback to first sheet if named sheet not found
      sheet = doc.sheetsByIndex[0];
    }
    
    if (!sheet) {
      throw new Error('No sheets found in the document');
    }
    
    const rows = await sheet.getRows();
    
    // Find the row with the matching item ID
    const rowIndex = parseInt(itemId, 10) - 1; // Assuming ID is 1-based index
    if (rowIndex >= 0 && rowIndex < rows.length) {
      const row = rows[rowIndex];
      await row.set('quantity', Math.max(0, newQuantity).toString());
      await row.save();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating item quantity in Google Sheets:', error);
    return false;
  }
}
