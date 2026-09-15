const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

//USE PROXY SERVER TO REDIRECT THE INCOMMING REQUEST
const httpProxy = require('http-proxy')
const proxy = httpProxy.createProxyServer();
const serviceHost = process.env.SERVICE_HOST || 'localhost';
const jwtSecret = process.env.JWT_SECRET || 'local-development-secret';

function requireJwt(req, res, next) {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ')
        ? authorization.slice(7)
        : null;

    if (!token) {
        return res.status(401).json({ message: 'Bearer token is required' });
    }

    try {
        const user = jwt.verify(token, jwtSecret);
        req.authenticatedUser = user;
        req.headers['x-authenticated-user-email'] = user.email;
        req.headers['x-authenticated-user-id'] = user.sub;
        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

function requireAdmin(req, res, next) {
    return requireJwt(req, res, () => {
        if (req.authenticatedUser.role !== 'admin') {
            return res.status(403).json({ message: 'Admin role is required' });
        }

        return next();
    });
}

proxy.on('error', (error, req, res) => {
    if (!res.headersSent) {
        res.status(502).json({ message: 'Service unavailable' });
    }
});

//REDIRECT TO THE STUDENT MICROSERVICE
app.use('/login', (req, res) => {
    console.log("INSIDE API GATEWAY STUDENT ROUTE")
    proxy.web(req, res, { target: `http://${serviceHost}:5004` });
})

app.use('/reg', (req, res) => {
    console.log("INSIDE API GATEWAY REG ROUTE")
    proxy.web(req, res, { target: `http://${serviceHost}:5003` });
})
app.use(['/ad', '/admin'], requireAdmin);
app.use('/ad', (req, res) => {
    console.log("INSIDE API GATEWAY ADMIN ROUTE")
    proxy.web(req, res, { target: `http://${serviceHost}:5001` });
})
app.use('/admin', (req, res) => {
    console.log("INSIDE API GATEWAY ADMIN ROUTE")
    proxy.web(req, res, { target: `http://${serviceHost}:5001` });
})
app.use(['/user/viewprofile', '/user/updateprofile'], requireJwt);
app.use('/user', (req, res) => {
    console.log("INSIDE API GATEWAY USER ROUTE")
    proxy.web(req, res, { target: `http://${serviceHost}:5002` });
})

app.listen(5005, () => {
    console.log("API Gateway Service is running on PORT NO : ", 5005)
})