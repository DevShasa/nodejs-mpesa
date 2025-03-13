
const CALLBACKENDPOINT="https://c851-196-216-70-170.ngrok-free.app"
const STKCALLBACK = `${CALLBACKENDPOINT}/grid/v1/safpayment/callback`
const C2BPAYBILLCALBACK = `${CALLBACKENDPOINT}/grid/v1/safpayment/paybillcallback`

/**
 * @async
 * @function generateStkPush
 * @description Initiates an STK (Safaricom Till/Paybill) push request to a customer's phone.
 * @param {Object} req - The Express request object.
 * @param {Object} req.body - The request body containing payment details.
 * @param {number} req.body.ammount - The amount to be paid.
 * @param {string} req.body.phone - The customer's phone number (in international format, e.g., 2547XXXXXXXX).
 * @param {string} req.shortCode - The business short code.
 * @param {string} req.password - The Safaricom API password.
 * @param {string} req.timestamp - The timestamp for the request.
 * @param {string} req.token - The authorization token for the Safaricom API.
 * @param {Object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the request is processed.
 * @throws {Error} - Throws an error if the STK push request fails.
 */
const generateStkPush = async(req, res, next)=>{

    const saf_stk = process.env.SAFARICOM_STK_ENDPOINT
    const { ammount, phone } = req.body;

    try {
        const payload = {
            BusinessShortCode: req.shortCode,
            Password: req.password,
            Timestamp: req.timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: ammount,
            PartyA: phone,
            PartyB: req.shortCode,
            PhoneNumber: phone,
            CallBackURL: STKCALLBACK,
            AccountReference: "Shasa Test",
            TransactionDesc: "Payment for goods n stuff",
        }

        const fetchResponse = await fetch(saf_stk, {
            method: "POST",
            headers: { "Authorization": `Bearer ${req.token}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload) 
        })

        if(!fetchResponse.ok){
            console.log("\n ERROR", fetchResponse.status)
            const faildata = await fetchResponse.json()
            console.log("\n FAILURE REASON", faildata)
            throw new Error("Could not send stk push request")
        } 
        
        const data = await fetchResponse.json()

        res.status(201).json({
            status: "Request sent",
            details: data
        });

    } catch (error) {
        next(error)
    }
}
/**
 * @async
 * @function stkCallBack
 * @description Handles the callback from Safaricom after an STK push transaction.
 * @param {Object} req - The Express request object.
 * @param {Object} req.body - The request body containing the callback data from Safaricom.
 * @param {Object} req.body.Body - The main body of the callback data.
 * @param {Object} req.body.Body.stkCallback - The STK callback details.
 * @param {string} req.body.Body.stkCallback.ResultDesc - The description of the result of the STK transaction.
 * @param {number} req.body.Body.stkCallback.ResultCode - The result code of the STK transaction (0 for success).
 * @param {Object} req.body.Body.stkCallback.CallbackMetadata - Metadata about the transaction.
 * @param {Array<Object>} req.body.Body.stkCallback.CallbackMetadata.Item - Array of items containing transaction details.
 * @param {Object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the callback is processed.
 * @throws {Error} - Throws an error if there is an issue processing the callback.
 * @description
 * This function parses the STK Push callback data from Safaricom.
 * If the transaction is successful, it extracts details such as the amount, phone number, MPesa receipt number, and transaction date.
 * It logs the success or failure of the payment to the console.
 * Finally, it sends a success status response to Safaricom.
 * */
const stkCallBack = async(req, res, next)=>{
    try {
        const callbackData = req.body
        if(callbackData?.Body?.stkCallback?.ResultDesc === "The service request is processed successfully." && callbackData?.Body?.stkCallback?.ResultCode === 0){
            const items = callbackData?.Body?.stkCallback?.CallbackMetadata?.Item
            const amount = items.find(item => item.Name === "Amount")?.Value;
            const phoneNumber = items.find(item => item.Name === "PhoneNumber")?.Value;
            const mpesacode = items.find(item => item.Name === "MpesaReceiptNumber")?.Value;
            const timestamp = String(items.find(item => item.Name === "TransactionDate")?.Value);
            const year = timestamp.substring(0, 4);
            const month = timestamp.substring(4, 6) - 1; // JS months are 0-based
            const day = timestamp.substring(6, 8);
            const hours = timestamp.substring(8, 10);
            const minutes = timestamp.substring(10, 12);
            const seconds = timestamp.substring(12, 14);
            const dateObject = new Date(year, month, day, hours, minutes, seconds);

            console.log({
                paymentstatus:"Payment processed sucessfully", 
                amount,
                phoneNumber,
                mpesacode,
                date: dateObject,
            })
        }else{
            console.log({
                paymentstatus:"Payment failed", 
                details:callbackData?.Body?.stkCallback
            })
        }
        res.json({ status: 'success' }) 
    } catch (error) {
        next(error)
    }
}



/**
 * @async
 * @function registerPaybillUrl
 * @description Registers the confirmation and validation URLs for a Safaricom Paybill.
 * @param {Object} req - The Express request object.
 * @param {Object} req.body - The request body.
 * @param {string} req.body.confirmation_url - The URL to receive confirmation and validation callbacks from Safaricom.
 * @param {string} req.token - The authorization token for the Safaricom API.
 * @param {Object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the registration is complete.
 * @throws {Error} - Throws an error if the confirmation URL is not provided or if the registration fails.
 * @description
 * This function registers the provided URL with Safaricom to receive callbacks for C2B (Customer to Business) transactions on the specified Paybill.
 * It sends a POST request to the Safaricom API with the short code, response type, confirmation URL, and validation URL.
 * If the registration is successful, it returns a success response with the details from Safaricom.
 * If the registration fails, it returns an error response with the details from Safaricom.
 */
const registerPaybillUrl = async (req, res, next) => {

    const {confirmation_url} = req.body
    if(!confirmation_url) throw new Error("No url provided in register paybill endpoint")

    try {
        const safRegisterUrl = process.env.SAFARICOM_REGISTER_PAYBILL;
        const paybillNumber = Number(process.env.SAFARICOM_PAYBILL); 

        const requestBody = {
            ShortCode: paybillNumber,
            ResponseType: "Completed",
            ConfirmationURL:confirmation_url,
            ValidationURL: confirmation_url
        };


        const response = await fetch(safRegisterUrl, {
            method: "POST",
            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer ${req.token}` 
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (data.ResponseDescription === "Success") {
            return res.json({ status: "success", details: data });
        } else {
            console.log("Failed:", data);
            return res.status(400).json({ status: "error", details: data });
        }

    } catch (error) {
        next(error);
    }
};


/**
 * @async
 * @function paybillCallback
 * @description Handles the callback from Safaricom after a C2B (Customer to Business) Paybill transaction.
 * @param {Object} req - The Express request object.
 * @param {Object} req.body - The request body containing the callback data from Safaricom.
 * @param {string} req.body.TransTime - The transaction time in the format YYYYMMDDHHMMSS.
 * @param {string} req.body.TransID - The transaction ID.
 * @param {string} req.body.BillRefNumber - The bill reference number (e.g., customer account number).
 * @param {string} req.body.FirstName - The customer's first name.
 * @param {string} req.body.LastName - The customer's last name.
 * @param {number} req.body.TransAmount - The transaction amount.
 * @param {string} req.body.MSISDN - The customer's  hashed phone number.
 * @param {Object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the callback is processed.
 * @throws {Error} - Throws an error if there is an issue processing the callback.
 * @description
 * This function parses the C2B Paybill callback data from Safaricom.
 * It extracts details such as the transaction ID, date, customer information, and amount.
 * It then creates a `paymentData` object containing the payment details and logs it to the console.
 * Finally, it sends the payment data back as a JSON response.
 * The function assumes the payment was successful.
 */
const paybillCallback = async(req, res, next)=>{
    try {
        const callbackData = req.body

        const timestamp = callbackData?.TransTime;
        const year = timestamp.substring(0, 4);
        const month = timestamp.substring(4, 6) - 1; // JS months are 0-based
        const day = timestamp.substring(6, 8);
        const hours = timestamp.substring(8, 10);
        const minutes = timestamp.substring(10, 12);
        const seconds = timestamp.substring(12, 14);

        const dateObject = new Date(year, month, day, hours, minutes, seconds);


        const paymentData = {
            payment_id: callbackData?.TransID, 
            date: dateObject,
            service_provider:"SAFARICOMC2B",
            service_provider_ref: callbackData?.TransID,
            customer_id: callbackData?.BillRefNumber?.replace(/\D/g, ''),
            customer_name: callbackData?.FirstName + " " + callbackData?.LastName,
            amount: Number(callbackData?.TransAmount),
            service_provided:"GRIDPAYMENT",
            description:"Customer payment for grid bundles", 
            payment_status:"success",
            hashedPhoneNumber:callbackData?.MSISDN
        }

        // save payment data to the database or activate logic to assign coins or do some other thing 

        console.log({
            paymentData
            
        })

        res.json({
            paymentData, 
        }) 

    } catch (error) {
        next(error)
    }
}


module.exports = {generateStkPush, stkCallBack, paybillCallback, registerPaybillUrl}