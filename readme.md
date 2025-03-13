# Grid Payment APIs - README

This document outlines the structure and functionality of the Mpesa Payment APIs, which handle payment processing via Safaricom's M-Pesa service.

## Overview

The Grid Payment APIs provide endpoints for:

*   Initiating STK (Safaricom Till/Paybill) push requests to customers.
*   Handling STK push transaction callbacks.
*   Handling C2B (Customer to Business) Paybill transaction callbacks.
*   Registering callback URLs with Safaricom.

These APIs integrate with Safaricom's Daraja API to facilitate secure and seamless payment processing.

## API Endpoints

### 1. Initiate STK Push (`POST /safpayment/stkpush`)

*   **Description:** This endpoint initiates an STK push request to a customer's phone. It triggers a prompt on the customer's phone, asking them to enter their M-Pesa PIN to complete the payment.
*   **Request Body:**
    ```json
    {
        "ammount": 100, // The amount to be paid
        "phone": "2547XXXXXXXX" // The customer's phone number (in international format, e.g., 2547XXXXXXXX)
    }
    ```
*   **Middleware:**
    *   `checkAmmountPhone`: Validates that the request body contains the `amount` and `phone` fields.
    *   `generateToken`: Generates an access token for authenticating with the Safaricom API.
    *   `generateTimestamp`: Creates a timestamp in the format `YYYYMMDDHHMMSS` required by the Safaricom API.
    *   `generatePassword`: Generates an encoded password required by the Safaricom API using the shortcode, passkey, and timestamp.
    *   `generateStkPush`: Sends the STK push request to the Safaricom API with the generated payload.
* **Controller:**
  *  `generateStkPush`
*   **Access:** Public

### 2. STK Push Callback Handler (`POST /safpayment/callback`)

*   **Description:** This endpoint receives the callback from Safaricom after an STK push transaction. It processes the callback data to determine the status of the transaction (success or failure).
*   **Request Body:** This is defined by the Safaricom STK Push callback structure. See the `stkCallBack` JSDoc for an example of a successful callback.
*   **Middleware:**
    *   `stkCallBack`: Processes the STK push callback data, logs the transaction details, and sends a success response to Safaricom.
* **Controller:**
  *  `stkCallBack`
*   **Access:** Public

### 3. C2B Paybill Callback Handler (`POST /safpayment/paybillcallback`)

*   **Description:** This endpoint handles callbacks from Safaricom after a C2B (Customer to Business) Paybill transaction. It extracts payment details and logs them.
*   **Request Body:** This is defined by the Safaricom C2B Paybill callback structure. See the `paybillCallback` JSDoc for an example.
*   **Middleware:**
    *   `paybillCallback`: Parses the C2B Paybill callback data, extracts relevant details (transaction ID, amount, customer, etc.), logs the payment data, and sends the data back as a JSON response.
* **Controller:**
  *  `paybillCallback`
*   **Access:** Public

### 4. Register Paybill URL (`POST /safpayment/registerpaybill`)

*   **Description:** This endpoint registers the confirmation and validation URLs with Safaricom to receive transaction callbacks for a specified Paybill.
*   **Request Body:**
    ```json
    {
        "confirmation_url": "https://yourdomain.com/api/v1/safpayment/paybillcallback" // Your callback URL
    }
    ```
*   **Middleware:**
    *   `generateToken`: Generates an access token for authenticating with the Safaricom API.
    *   `registerPaybillUrl`: Sends the Paybill registration request to the Safaricom API.
* **Controller:**
  *  `registerPaybillUrl`
*   **Access:** Public

## Middleware Functions

The following middleware functions are used in the API routes:

*   **`checkAmmountPhone`:**
    *   Verifies that the request body includes the `ammount` and `phone` fields.
    *   Throws an error if either field is missing.
    *   Used in the `/safpayment/stkpush` route.
*   **`generateToken`:**
    *   Authenticates with the Safaricom API using the consumer key and secret.
    *   Retrieves and attaches an access token to the request object (`req.token`).
    *   Used in the `/safpayment/stkpush` and `/safpayment/registerpaybill` routes.
*   **`generateTimestamp`:**
    *   Generates a timestamp string in `YYYYMMDDHHMMSS` format.
    *   Attaches the timestamp to the request object (`req.timestamp`).
    *   Used in the `/safpayment/stkpush` route.
*   **`generatePassword`:**
    *   Generates an encoded password required by the Safaricom API using the shortcode, passkey, and timestamp.
    *   Attaches the encoded password (`req.password`) and short code (`req.shortCode`) to the request object.
    *   Used in the `/safpayment/stkpush` route.
*   **`generateStkPush`:**
    *   Constructs the payload for the STK push request.
    *   Sends the request to the Safaricom API.
    *   Handles success and error responses.
    * Used in the `/safpayment/stkpush` route
* **`stkCallBack`**
  * Processes the data sent back from safaricom on the success or failure of a stk push transaction
  * Used in the `/safpayment/callback` route
* **`paybillCallback`**
  * Processes the data sent back from safaricom on the success of a C2B payment transaction
  * Used in the `/safpayment/paybillcallback` route
* **`registerPaybillUrl`**
  * Registers the paybill url with safaricom to receive transaction data
  * used in `/safpayment/registerpaybill` route

## Controllers

The controllers are in the `../controllers/darajaApis` file

*   `generateStkPush`
    *   The function that sends the actual stk push request to safaricom
* `stkCallBack`
  *  handles the callback from safaricom for stk push transactions
* `paybillCallback`
  * handles the callback from safaricom for paybill transactions
* `registerPaybillUrl`
  * handles the requests to register the paybill url with safaricom

## API Workflow

The general flow for an STK push payment is:

1.  **Client Request:** A client application sends a POST request to `/safpayment/stkpush` with the `ammount` and `phone` details.
2.  **Middleware Validation:** The `checkAmmountPhone` middleware verifies the request body.
3.  **Token Generation:** The `generateToken` middleware gets an access token from Safaricom.
4.  **Timestamp and Password:** The `generateTimestamp` and `generatePassword` middleware create the required timestamp and encoded password.
5. **Send request**: The `generateStkPush` middleware builds the request and sends it to safaricom.
6. **Safaricom prompts User** Safaricom sends a prompt to the customer
7.  **STK Push Request:** The `generateStkPush` middleware sends the STK push request to Safaricom.
8.  **Customer Confirmation:** The customer receives a prompt on their phone and enters their M-Pesa PIN.
9.  **Safaricom Callback:** Safaricom sends a callback to `/safpayment/callback` with the transaction status.
10. **Callback Processing:** The `stkCallBack` middleware processes the callback.
11. **Payment Success/Failure:** payment status is logged

The general flow for a C2B transaction is:
1. **Customer payment**: The customer pays using the paybill number
2. **Safaricom callback**: Safaricom sends a callback to `/safpayment/paybillcallback` with the transaction details.
3. **Callback Processing**: The `paybillCallback` middleware processes the callback
4. **Payment status:** payment data is logged

## Error Handling

* Errors that happen in middleware are handled and passed to the next error middleware with a error status.
* Errors that happen in controllers are handled and passed to the next middleware with a error status
* Errors are logged to the console for debugging

## Environment Variables

*   `SAFARICOM_CONSUMER_KEY`: Your Safaricom API consumer key.
*   `SAFARICOM_CONSUMER_SECRET`: Your Safaricom API consumer secret.
*   `SAFARICOM_AUTH_URL`: The URL for Safaricom API authentication.
*   `SAFARICOM_PASSKEY`: Your Safaricom API passkey.
*   `SAFARICOM_SHORTCODE`: Your Safaricom short code.
* `SAFARICOM_STK_ENDPOINT`: The url for sending stk push requests
* `SAFARICOM_REGISTER_PAYBILL`: The url for register paybill

## Packages

The application uses the following essential packages:

*   `cors`: For enabling Cross-Origin Resource Sharing.
*   `dotenv`: To load environment variables from a `.env` file.
*   `express`: The web application framework.
*   `morgan`: HTTP request logger middleware.


