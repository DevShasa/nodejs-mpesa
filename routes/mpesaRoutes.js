const express = require("express");
const router = express.Router();
const {
	stkCallBack,
	generateStkPush,
	paybillCallback,
	registerPaybillUrl,
} = require("../controllers/darajaApis");
const {
	generateToken,
	generateTimestamp,
	generatePassword,
	checkAmmountPhone,
} = require("../middleware/mpesaMiddleWare");

const basePath = "/safpayment";

/**
 * @route POST /safpayment/stkpush
 * @description Initiates an STK (Safaricom Till/Paybill) push request to a customer's phone.
 * @middleware checkAmmountPhone - Validates that the request body contains 'amount' and 'phone'.
 * @middleware generateToken - Generates an access token for Safaricom API authentication.
 * @middleware generateTimestamp - Generates a timestamp for the Safaricom API request.
 * @middleware generatePassword - Generates an encoded password for the Safaricom API request.
 * @middleware generateStkPush - Sends the STK Push request to the Safaricom API.
 * @access Public
 */
router.post(
	`${basePath}/stkpush`,
	checkAmmountPhone,
	generateToken,
	generateTimestamp,
	generatePassword,
	generateStkPush
);

/**
 * @route POST /safpayment/callback
 * @description Handles the callback from Safaricom after an STK Push transaction.
 * @middleware stkCallBack - Processes the STK Push callback data.
 * @access Public
 */
router.post(`${basePath}/callback`, stkCallBack);

/**
 * @route POST /safpayment/paybillcallback
 * @description Handles the callback from Safaricom after a C2B Paybill transaction.
 * @middleware paybillCallback - Processes the C2B Paybill callback data.
 * @access Public
 */
router.post(`${basePath}/paybillcallback`, paybillCallback);

/**
 * @route POST /safpayment/registerpaybill
 * @description Registers the confirmation and validation URLs for a Safaricom Paybill.
 * @middleware generateToken - Generates an access token for Safaricom API authentication.
 * @middleware registerPaybillUrl - Sends the Paybill registration request to the Safaricom API.
 * @access Public
 */
router.post(`${basePath}/registerpaybill`, generateToken, registerPaybillUrl);

module.exports = router;
