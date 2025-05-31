import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import type { MenuItem } from '@/types';

// Initialize the Google Sheets API client
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || '';
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_SHEETS_PRIVATE_KEY || '').replace(/\\\\n/g, '\\n');
const INVENTORY_SHEET_NAME = 'Inventory';

if (!SPREADSHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
  console.warn('Google Sheets credentials are not fully configured. Google Sheets integration will not work.');
}

// Create a new auth client for Google Sheets
const getAuthClient = () => {
  return new JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });
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
