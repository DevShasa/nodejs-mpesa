const express = require("express");
const morgan = require("morgan");
const chalk = require("chalk");
const errorHandler = require("./middleware/errorhandling");

const mpesaRoutes = require("./routes/mpesaRoutes")

const app = express();
morgan.format("colored", (tokens, req, res) => {
	return [
		chalk.green.bold(tokens.method(req, res)),
		chalk.blue(tokens.url(req, res)),
		chalk.yellow(tokens.status(req, res)),
		chalk.red(tokens["response-time"](req, res) + " ms"),
	].join(" ");
});

app.use(morgan("colored"));
const port = process.env.PORT || 3001;

app.use(express.json({limit:'2000kb'}));

// Set cors
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, x-access-token, Origin, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

const apiVersion = '/payment';

app.use(`${apiVersion}/`, mpesaRoutes)


// nonexistent endpoints
app.use((req, res, next) => {
	res.status(404).json({
		message: "The route you requested was not found on this server",
		status: 404,
		method: req.method,
		url: req.originalUrl,
		query: req.query,
	});
});

// errors passed into next
app.use(errorHandler);

app.listen(port, () => {
	console.log(`The server is up and listening on port ${port}`);
});

process.on("SIGINT", async () => {
	console.log("Received SIGINT. Shutting down gracefully...");
	process.exit(0);
});

process.on("SIGTERM", async () => {
	console.log("Received SIGTERM. Shutting down gracefully...");
	process.exit(0);
});
