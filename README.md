# Firebase Studio - FundRaising Mission Trip Batam App

This is a NextJS starter for the FundRaising Mission Trip Batam food ordering application in Firebase Studio.

To get started, take a look at `src/app/page.tsx`.

## Features

- Browse menu items by category.
- Add items to an order.
- View and modify the current order.
- Confirm the order.
- Order data is (optionally) sent to a Google Sheet.

## Getting Started Locally

1.  **Clone the repository (if applicable) or ensure you have the project files.**
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up Environment Variables:**
    Create a `.env.local` file in the `src` directory by copying `src/.env.example`.
    ```
    cp src/.env.example src/.env.local
    ```
    Fill in the necessary values in `src/.env.local`, especially if you plan to use the Google Sheets integration.

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application will be available at `http://localhost:9002`.

## Google Sheets Integration (Optional)

This application can integrate with Google Sheets to log confirmed orders. To enable this:

1.  **Google Cloud Project & Sheets API Setup:**
    *   Ensure you have a Google Cloud Project.
    *   In the Google Cloud Console, enable the "Google Sheets API" for your project.
    *   Create a Service Account:
        *   Navigate to "IAM & Admin" > "Service Accounts".
        *   Click "+ CREATE SERVICE ACCOUNT".
        *   Provide a name (e.g., "food-order-sheet-writer") and description.
        *   Click "CREATE AND CONTINUE".
        *   For roles, you can grant "Editor" to the project if this service account will manage other resources, or proceed without granting project-level roles for now. You will share the specific Google Sheet with this service account later. Click "CONTINUE".
        *   Skip granting users access to this service account (unless needed for other purposes) and click "DONE".
    *   Create a Key for the Service Account:
        *   Find your newly created service account in the list.
        *   Click on the three dots (Actions) next to it and select "Manage keys".
        *   Click "ADD KEY" > "Create new key".
        *   Choose "JSON" as the key type and click "CREATE". A JSON file will be downloaded. Keep this file secure.

2.  **Google Sheet Setup:**
    *   Create a new Google Sheet (or use an existing one).
    *   Open the sheet and note its ID from the URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit`.
    *   Share this Google Sheet with the `client_email` found in the downloaded JSON key file. Grant "Editor" permissions to this service account email.

3.  **Configure Environment Variables:**
    *   Open your `src/.env.local` file (or create it from `src/.env.example`).
    *   Set the following variables using the information from your downloaded JSON key and your Google Sheet:
        *   `GOOGLE_SHEETS_CLIENT_EMAIL`: The `client_email` from the JSON key file.
        *   `GOOGLE_SHEETS_PRIVATE_KEY`: The `private_key` from the JSON key file.
            *   **Important:** The private key is a multi-line string. When adding it to your `.env.local` file, ensure it's correctly formatted. It should look like:
                ```env
                GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR ACTUAL KEY LINES HERE...\n-----END PRIVATE KEY-----\n"
                ```
                Make sure to replace `\n` with actual newline characters within the double quotes if your environment requires it, or ensure your .env parser handles escaped newlines correctly. The example format with `\n` within quotes is common.
        *   `GOOGLE_SHEET_ID`: The ID of your Google Sheet.
        *   `GOOGLE_SHEET_RANGE` (Optional): The sheet name and starting cell for appending data (e.g., `Orders!A1` or `Sheet1!A1`). If not set, it defaults to `Sheet1!A1`. The header row should be: `Order ID, Timestamp, Customer Name (Optional), Item Name, Quantity, Price, Subtotal, Item Name 2, Quantity 2, Price 2, Subtotal 2, ... , Total Order Price`.

4.  **Restart your development server** if it was running while you made `.env.local` changes.

Now, when an order is confirmed, the application will attempt to append the order details to the specified Google Sheet.

## Project Structure

*   `src/app/`: Next.js App Router pages.
*   `src/components/`: Reusable React components.
    *   `src/components/ui/`: ShadCN UI components.
*   `src/data/`: Static data like menu items.
*   `src/hooks/`: Custom React hooks.
*   `src/lib/`: Utility functions and server actions.
*   `src/ai/`: Genkit related AI flows and configurations.
*   `public/`: Static assets.
```