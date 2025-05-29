
'use server';

import type { OrderItem } from '@/types';
import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

interface ConfirmOrderResult {
  success: boolean;
  message: string;
  orderId?: string;
}

async function appendToGoogleSheet(orderId: string, items: OrderItem[], totalPrice: number): Promise<void> {
  console.log('Attempting to append to Google Sheet...');
  console.log(`  GOOGLE_SHEETS_CLIENT_EMAIL is ${process.env.GOOGLE_SHEETS_CLIENT_EMAIL ? 'present' : 'MISSING'}`);
  console.log(`  GOOGLE_SHEETS_PRIVATE_KEY is ${process.env.GOOGLE_SHEETS_PRIVATE_KEY ? 'present' : 'MISSING'}`);
  console.log(`  GOOGLE_SHEET_ID is ${process.env.GOOGLE_SHEET_ID ? 'present' : 'MISSING'}`);
  console.log(`  GOOGLE_SHEET_RANGE is set to: ${process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A1 (default)'}`);

  try {
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Important for .env formatting
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheetRange = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A1'; // Default to Sheet1!A1

    if (!clientEmail || !privateKey || !sheetId) {
      console.warn('Google Sheets API credentials or Sheet ID not properly configured. One or more required variables (GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY, GOOGLE_SHEET_ID) are missing or empty in .env.local. Ensure the server was restarted after setting them.');
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
    console.error('Error in appendToGoogleSheet function:', error);
    // Re-throw the error so it's caught by the confirmOrder function's try/catch block
    // This ensures the user gets an appropriate message if the sheet append fails.
    throw error; 
  }
}

export async function confirmOrder(items: OrderItem[]): Promise<ConfirmOrderResult> {
  if (!items || items.length === 0) {
    return { success: false, message: 'Your order is empty.' };
  }

  const orderId = uuidv4();
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  console.log(`Processing Order ID: ${orderId}`);
  console.log('Order items:', JSON.stringify(items, null, 2));
  console.log(`Total Price: $${totalPrice.toFixed(2)}`);

  try {
    // Attempt to append to Google Sheet only if GOOGLE_SHEET_ID is configured
    if (process.env.GOOGLE_SHEET_ID) {
      console.log('GOOGLE_SHEET_ID is set, proceeding with Google Sheets integration.');
      await appendToGoogleSheet(orderId, items, totalPrice);
      return {
        success: true,
        message: 'Your order has been confirmed and saved to our records.',
        orderId: orderId,
      };
    } else {
      // If GOOGLE_SHEET_ID is not set, simulate success without Google Sheets
      console.log('GOOGLE_SHEET_ID not set in .env.local, skipping Google Sheets integration. Order confirmed locally.');
      return {
        success: true,
        message: 'Your order has been confirmed (Google Sheets logging is disabled).',
        orderId: orderId,
      };
    }
  } catch (error) {
    // This catch block will handle errors thrown from appendToGoogleSheet 
    // or any other errors during the process if GOOGLE_SHEET_ID was set.
    console.error('Error during order confirmation process (Google Sheets integration attempted):', error);
    return {
      success: false,
      message: `Your order was received (Order ID: ${orderId}) but there was an issue saving it to our records. Please contact support. Details: ${(error as Error).message}`,
      orderId: orderId,
    };
  }
}
