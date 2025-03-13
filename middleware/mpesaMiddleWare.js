/**
 * @file mpesaMiddleWare.js
 * @description Middleware functions for handling M-Pesa API interactions, including token generation, timestamp creation, password generation, and request validation.
 */

const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;
const auth_link = process.env.SAFARICOM_AUTH_URL;
const passKey = process.env.SAFARICOM_PASSKEY;
const shortCode = process.env.SAFARICOM_SHORTCODE;

/**
 * @function checkAmmountPhone
 * @description Middleware to check if the amount and phone number are present in the request body.
 * @param {Object} req - The Express request object.
 * @param {Object} req.body - The request body.
 * @param {number} req.body.ammount - The amount to be paid.
 * @param {string} req.body.phone - The customer's phone number.
 * @param {Object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 * @throws {Error} - Throws an error with a 400 status if the amount or phone number is missing.
 * @returns {void}
 */
const checkAmmountPhone = (req, res, next) => {
	const { ammount, phone } = req.body;
	if (!ammount || !phone) {
		const error = new Error("Amount and phone number are required.");
		error.status = 400;
		return next(error);
	}
	next();
};

/**
 * @async
 * @function generateToken
 * @description Middleware to generate an access token for Safaricom API authentication.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 * @throws {Error} - Throws an error with a 400 status if there's an issue generating the token.
 * @returns {Promise<void>}
 * @description Fetches an access token from the Safaricom API using the provided consumer key and secret.
 */
const generateToken = async (req, res, next) => {
	console.log("GETTING AUTH");

	const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
		"base64"
	);

	try {
		const response = await fetch(auth_link, {
			method: "GET",
			headers: {
				Authorization: `Basic ${auth}`,
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) throw new Error(response);
		const data = await response.json();
		req.token = data.access_token;
		next();
	} catch (err) {
		const error = new Error("Error generating auth token-->", err);
		error.status = 400;
		return next(error);
	}
};

/**
 * @function generateTimestamp
 * @description Middleware to generate a timestamp in the format YYYYMMDDHHMMSS.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 * @returns {void}
 * @description Creates a timestamp in the format YYYYMMDDHHMMSS and attaches it to the request object.
 */
const generateTimestamp = (req, res, next) => {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are zero-based
	const date = String(now.getDate()).padStart(2, "0");
	const hour = String(now.getHours()).padStart(2, "0");
	const minute = String(now.getMinutes()).padStart(2, "0");
	const seconds = String(now.getSeconds()).padStart(2, "0");

	const timestamp = year + month + date + hour + minute + seconds;
	req.timestamp = timestamp;
	next();
};

/**
 * @function generatePassword
 * @description Middleware to generate an encoded password for Safaricom API requests.
 * @param {Object} req - The Express request object.
 * @param {string} req.timestamp - The timestamp for the request.
 * @param {Object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 * @returns {void}
 * @description Creates an encoded password using the short code, passkey, and timestamp, and attaches it, together with shortcode, to the request object.
 */
const generatePassword = (req, res, next) => {
	const dataToEncode = shortCode + passKey + req.timestamp;
	const password = Buffer.from(dataToEncode).toString("base64");
	req.password = password;
	req.shortCode = shortCode;
	next();
};

module.exports = {
	generateToken,
	generateTimestamp,
	generatePassword,
	checkAmmountPhone,
};
