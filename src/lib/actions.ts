
'use server';

import type { OrderItem } from '@/types';
import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

interface ConfirmOrderResult {
  success: boolean;
  message: string;
  orderId?: string;
}

// Ensure environment variables are loaded. This is usually handled by Next.js,
// but for server actions, direct access is common.
// No need to explicitly call dotenv.config() in Next.js App Router server components/actions.

async function appendToGoogleSheet(orderId: string, items: OrderItem[], totalPrice: number): Promise<void> {
  try {
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Important for .env formatting
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheetRange = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A1'; // Default to Sheet1!A1

    if (!clientEmail || !privateKey || !sheetId) {
      console.warn('Google Sheets API credentials or Sheet ID not configured. Skipping sheet append.');
      throw new Error('Google Sheets API credentials or Sheet ID not configured.');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const timestamp = new Date().toISOString();
    
    // Prepare header row if it's a new sheet or needs to be standardized
    // For simplicity, we assume the header exists. A more robust solution would check and create it.
    // Header: Order ID, Timestamp, Customer Name (Optional), Item Name, Quantity, Price, Subtotal, Item Name 2, Quantity 2, Price 2, Subtotal 2, ... , Total Order Price
    
    const rowData: (string | number)[] = [orderId, timestamp];
    items.forEach(item => {
      rowData.push(item.name, item.quantity, item.price, item.price * item.quantity);
    });
    rowData.push(totalPrice);

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: sheetRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });
    console.log('Order successfully appended to Google Sheet.');
  } catch (error) {
    console.error('Error appending to Google Sheet:', error);
    // Decide if this error should propagate and fail the whole order confirmation
    // For now, we'll log it but not necessarily fail the user-facing confirmation
    throw new Error(`Failed to update Google Sheet: ${(error as Error).message}`);
  }
}

export async function confirmOrder(items: OrderItem[]): Promise<ConfirmOrderResult> {
  if (!items || items.length === 0) {
    return { success: false, message: 'Your order is empty.' };
  }

  const orderId = uuidv4();
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  console.log(`Order ID: ${orderId}`);
  console.log('Order items:', items);
  console.log(`Total Price: $${totalPrice.toFixed(2)}`);

  try {
    // Attempt to append to Google Sheet
    // Check if GOOGLE_SHEET_ID is set to decide if we should try to append
    if (process.env.GOOGLE_SHEET_ID) {
      await appendToGoogleSheet(orderId, items, totalPrice);
      return {
        success: true,
        message: 'Your order has been confirmed and saved to our records.',
        orderId: orderId,
      };
    } else {
      // If GOOGLE_SHEET_ID is not set, simulate success without Google Sheets
      console.log('GOOGLE_SHEET_ID not set, skipping Google Sheets integration.');
      return {
        success: true,
        message: 'Your order has been confirmed (Google Sheets logging is disabled).',
        orderId: orderId,
      };
    }
  } catch (error) {
    console.error('Error during order confirmation process:', error);
    // If appendToGoogleSheet throws an error, it will be caught here.
    // We return a failure to the client but still include the orderId
    // so they know what to reference if they contact support.
    return {
      success: false,
      message: `Your order was received (Order ID: ${orderId}) but there was an issue saving it to our records. Please contact support. Error: ${(error as Error).message}`,
      orderId: orderId,
    };
  }
}
