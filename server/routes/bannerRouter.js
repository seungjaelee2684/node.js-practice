const express = require('express');
const router = express.Router();
const imageUploader = require('../database/S3storage');
const connection = require('../database/MySQL');
const jwt = require('jsonwebtoken');
const secretKey = require('../config/jwt');

// 강사 슬라이드 배너 api
router.get('/mentors', async function (req, res) {
    const token = req?.headers["authorization"];
    const newDate = new Date();

    try {
        const banner = await new Promise((resolve, reject) => {
            connection.query(
                `SELECT mentors.mentorsId, mentors.nickname, mentors.opendate, banner_image.imageUrl AS bannerImageUrl, nickname_image.imageUrl AS nicknameImageUrl
                FROM mentors
                INNER JOIN banner_image ON mentors.mentorsId = banner_image.mentorsId
                INNER JOIN nickname_image ON mentors.mentorsId = nickname_image.mentorsId
                ORDER BY mentors.mentorsId DESC
                LIMIT 5;`,
                async function (error, results, fields) {
                    if (error) throw error;
                    resolve(results);
                }
            );
        });

        const isOpenMentor = banner.filter((item) => {
            const targetDate = new Date(item.opendate);
            return newDate >= targetDate;
        });

        const bannerData = { bannerData: isOpenMentor }

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
                            message: "정보 조회 성공",
                            status: 200,
                            isOperator: true,
                            ...bannerData
                        });
                    } else {
                        res.status(201).json({
                            message: "정보 조회 성공",
                            status: 201,
                            isOperator: false,
                            ...bannerData
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
            res.status(201).json({
                message: "정보 조회 성공",
                status: 201,
                isOperator: false,
                ...bannerData
            });
        };

    } catch (error) {
        console.error(error);
        res.status(403).json({
            message: "정보 조회 실패...!",
            status: 403
        })
    };
});

module.exports = router;