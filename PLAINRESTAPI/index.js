//http module can help you to create http server 
const http = require('http');

// firstly we would setup a http server 

const PORT = 3000; // we defined a variable to store the value of the port

// we would like to create a server 

const server = http.createServer(async (req, res) => {
    console.log("Request received");
    if (req.method == "GET") {
        res.end("Get request");
    } else if (req.method == "POST") {
        res.end("POST request");
    } else if (req.method == "PUT") {
        res.end("PUT request");
    } else if (req.method == "DELETE") {
        res.end("DELETE request");
    } else {
        res.end("Method not allowed");
    }
});//creating a new server instance, but it is not running

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
}); //finally running server on the port that we have defined

// the server we created will send responses to the requests that are sent to the server 
