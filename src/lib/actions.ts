
'use server';

import type { OrderItem } from '@/types';
import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

interface ConfirmOrderResult {
  success: boolean;
  message: string;
  orderId?: string;
}

async function appendToGoogleSheet(orderId: string, items: OrderItem[], totalPrice: number, customerName: string, customerPhone: string): Promise<void> {
  try {
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    
    // Robust private key processing (same as in google-sheets.ts)
    let privateKey = (process.env.GOOGLE_SHEETS_PRIVATE_KEY || '')
      .replace(/\\n/g, '\n')           // Replace escaped newlines
      .replace(/^["']|["']$/g, '')     // Remove surrounding quotes
      .replace(/\\\\/g, '\\')          // Fix double backslashes
      .trim();                         // Remove extra whitespace

    // Fix private key formatting - add proper line breaks
    if (privateKey && !privateKey.includes('\n')) {
      // Split the key into proper lines
      const keyWithoutHeaders = privateKey
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\s+/g, ''); // Remove all whitespace
      
      // Add line breaks every 64 characters
      const keyLines = [];
      for (let i = 0; i < keyWithoutHeaders.length; i += 64) {
        keyLines.push(keyWithoutHeaders.substring(i, i + 64));
      }
      
      // Reconstruct the key with proper formatting
      privateKey = `-----BEGIN PRIVATE KEY-----\n${keyLines.join('\n')}\n-----END PRIVATE KEY-----`;
    }
    
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheetRange = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A1'; // Default to Sheet1!A1

    console.log('=== Order Sheet Integration Debug ===');
    console.log('CLIENT_EMAIL:', clientEmail ? '✓ Set' : '✗ Missing');
    console.log('PRIVATE_KEY length:', privateKey.length);
    console.log('PRIVATE_KEY has newlines:', privateKey.includes('\n'));
    console.log('SHEET_ID:', sheetId ? '✓ Set' : '✗ Missing');

    if (!clientEmail || !privateKey || !sheetId) {
      console.warn('Google Sheets API credentials or Sheet ID not properly configured. One or more required variables (GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY, GOOGLE_SHEET_ID) are missing or empty in .env.local. Ensure the server was restarted after setting them.');
      throw new Error('Google Sheets API credentials or Sheet ID not configured.');
    }

    let auth;
    try {
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      console.log('GoogleAuth created successfully for order submission');
    } catch (authError) {
      console.error('Error creating GoogleAuth:', authError);
      throw new Error(`Failed to create Google authentication: ${authError.message}`);
    }

    const sheets = google.sheets({ version: 'v4', auth });

    const timestamp = new Date().toISOString();
    
    // Create a flat array of all items' details
    const itemDetails: (string | number)[] = [];
    items.forEach(item => {
      itemDetails.push(item.name, item.quantity, item.price, item.price * item.quantity);
    });
    
    // Combine all data in the desired order: Order ID, Timestamp, Customer Name, Customer Phone, [Item Details], Total
    const rowData: (string | number)[] = [
      orderId, 
      timestamp,
      customerName,
      customerPhone,
      ...itemDetails,
      totalPrice
    ];

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

export async function confirmOrder(items: OrderItem[], customerName: string, customerPhone: string): Promise<ConfirmOrderResult> {
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
      await appendToGoogleSheet(orderId, items, totalPrice, customerName, customerPhone);
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
