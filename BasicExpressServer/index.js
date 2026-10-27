const express = require("express");
const app = express(); // this calls the express function to create a server instance
const port = 3000;

app.get('/', (req, res) => {
    res.send("Welcome to the Home Page")
})

app.post("/", (req, res) => {
  res.send("Hello, World! , POST");
});

app.delete("/", (req, res) => {
  res.send("Hello, World! , DELETE");
});

app.put("/", (req, res) => {
  res.send("Hello, World! , PUT");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})


