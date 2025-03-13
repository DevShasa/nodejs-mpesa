const chalk = require("chalk")

const errorHandler = (err, req, res, next)=>{
    console.log(chalk.red(" 👺 an error has occured 👉 ",err.stack))
    console.error(err)
    res.status(err.status || 500).json({
        success: false,
        message: err.errors || err.message || "Internal server Error"
    })
}

module.exports = errorHandler