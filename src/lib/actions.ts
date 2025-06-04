'use server';

import type { OrderItem } from '@/types';
import { google } from 'googleapis';
import { DateTime } from 'luxon';

interface ConfirmOrderResult {
  success: boolean;
  message: string;
  orderId?: string;
}

// In-memory store for daily order sequence (reset on server restart)
const orderSeqStore: { [date: string]: number } = {};

function makeOrderIdNode() {
  // Use Asia/Singapore timezone
  const now = DateTime.now().setZone('Asia/Singapore');
  const today = now.toFormat('yyyyMMdd');
  if (!orderSeqStore[today]) orderSeqStore[today] = 0;
  orderSeqStore[today] += 1;
  const seq = orderSeqStore[today];
  return `ORD-${today}-${('000' + seq).slice(-3)}`;
}

async function appendToGoogleSheet(orderId: string, items: OrderItem[], customerName: string, customerPhone: string, paymentMethod: string, isPaid: boolean): Promise<void> {
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
    } catch (authError: any) {
      console.error('Error creating GoogleAuth:', authError);
      throw new Error(`Failed to create Google authentication: ${authError.message}`);
    }

    const sheets = google.sheets({ version: 'v4', auth });
    const now = DateTime.now().setZone('Asia/Singapore');
    const timestamp = now.toFormat('yyyy-MM-dd HH:mm:ss');
    // Read all of column A from row 2 downward to find first empty row
    const sheetName = (process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A1').split('!')[0];
    const colARes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId!,
      range: `${sheetName}!A2:A`,
    });
    const colA = colARes.data.values || [];
    let firstEmptyRow = null;
    for (let i = 0; i < colA.length; i++) {
      if (!colA[i][0]) {
        firstEmptyRow = i + 2; // 1-based, row 2 is index 0
        break;
      }
    }
    // Prepare all rows to write
    const safePhone = customerPhone.startsWith("'") ? customerPhone : "'" + customerPhone;
    const rows: (string | number | boolean)[][] = items.map(item => [
      orderId,
      timestamp,
      customerName,
      safePhone,
      item.name,
      item.quantity,
      item.price,
      item.price * item.quantity,
      paymentMethod,
      true, // isPaid always true
      '' // notes
    ]);
    // Write each row: if firstEmptyRow is found, write there, else append
    for (let i = 0; i < rows.length; i++) {
      let targetRow = null;
      if (firstEmptyRow !== null) {
        targetRow = firstEmptyRow + i;
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId!,
          range: `${sheetName}!A${targetRow}:K${targetRow}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [rows[i]] },
        });
      } else {
        await sheets.spreadsheets.values.append({
          spreadsheetId: sheetId!,
          range: `${sheetName}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [rows[i]] },
        });
      }
    }
  } catch (error) {
    console.error('Error in appendToGoogleSheet function:', error);
    throw error;
  }
}

export async function confirmOrder(items: OrderItem[], customerName: string, customerPhone: string, paymentMethod: string, isPaid: boolean): Promise<ConfirmOrderResult> {
  if (!items || items.length === 0) {
    return { success: false, message: 'Your order is empty.' };
  }
  const orderId = makeOrderIdNode();
  try {
    if (process.env.GOOGLE_SHEET_ID) {
      await appendToGoogleSheet(orderId, items, customerName, customerPhone, paymentMethod, isPaid);
      return {
        success: true,
        message: 'Your order has been confirmed and saved to our records.',
        orderId: orderId,
      };
    } else {
      return {
        success: true,
        message: 'Your order has been confirmed (Google Sheets logging is disabled).',
        orderId: orderId,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Your order was received (Order ID: ${orderId}) but there was an issue saving it to our records. Please contact support. Details: ${(error as Error).message}`,
      orderId: orderId,
    };
  }
}
