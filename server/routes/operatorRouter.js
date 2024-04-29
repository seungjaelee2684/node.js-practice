const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const PERMISSION = require('../config/permission');

router.post('/', async function (req, res) {
    const authenticationKey = process.env.AUTHENTICATION_KEY;
    const permissionId = PERMISSION?.PERMISSION_ID;
    const secretKey = process.env.SECRET_KEY;
    const { operateId, password } = req?.body;
    try {
        if ((password === authenticationKey) && permissionId.includes(operateId)) {
            const jwtToken = jwt.sign({
                type: "JWT",
                state: "Operator"
            }, secretKey, {
                expiresIn: "1h",
                issuer: "op"
            });

            res.setHeader('Authorization', jwtToken);
            res.status(200).json({
                message: "토큰이 발급되었습니다.",
                status: 200
            });

        } else {
            res.status(403).json({
                message: "인증 실패...!!",
                status: 403
            });
        };
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "No authentication",
            status: 500
        });
    };
});

module.exports = router;