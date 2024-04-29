const express = require('express');
const router = express.Router();
const imageUploader = require('../database/S3storage');
const connection = require('../database/MySQL');
const jwt = require('jsonwebtoken');
const secretKey = require('../config/jwt');

// 강사 정보조회 api
router.get('/mentor/:mentorsId', async function (req, res) {
    const token = req?.headers["authorization"];
    const mentorsId = req?.params.mentorsId;

    try {
        const mentorInformation = await new Promise((resolve, reject) => {
            connection.query(
                `SELECT * FROM mentors
                WHERE mentorsId = ?;`,
                [mentorsId],
                async function (error, results, fields) {
                    if (error) throw error;
                    resolve(results);
                }
            );
        });

        const socialLink = await new Promise((resolve, reject) => {
            connection.query(
                `SELECT home, youtube, twitter, instagram, artstation, pixiv
                FROM links
                WHERE mentorsId = ?`,
                [mentorsId],
                async function (error, results, fields) {
                    if (error) throw error;
                    resolve(results);
                }
            );
        });

        const mentorInfoData = {
            mentorInfomation: mentorInformation[0],
            snsLinks: socialLink[0]
        };

        if (token) {
            async function verifyToken (token, secret) {
                try {
                    const decoded = await jwt.verify(token, secret);
                    return true;
                } catch (error) {
                    return false;
                };
            };

            verifyToken(token, secretKey)
                .then((isTokenValid) => {
                    if (isTokenValid) {
                        res.status(200).json({
                            message: "강사 정보 조회 성공!",
                            status: 200,
                            isOperator: true,
                            mentorInfoDto: mentorInfoData
                        });
                    } else {
                        res.status(401).json({
                            message: "토큰 만료...! 재인증 필요",
                            status: 401,
                        });
                    };
                })
                .catch((error) => {
                    console.error(error);
                    res.status(500).json({
                        message: "서버 오류...!",
                        status: 500
                    });
                });
        } else {
            res.status(401).json({
                message: "허가 되지 않은 요청...! 인증 필요",
                status: 401,
            });
        };
    } catch (error) {
        console.error(error);
        res.status(403).json({
            message: "강사 정보 조회 실패...!",
            status: 403
        });
    };
});

module.exports = router;