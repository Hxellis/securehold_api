export default function errorMessage(error, res) {
    console.log("error: " + error)
    res.status(400).json({
        status: 400,
        msg: "API error",
        error: error
    })
}