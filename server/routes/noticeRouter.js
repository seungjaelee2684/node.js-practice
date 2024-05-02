const express = require('express');
const router = express.Router();
const imageUploader = require('../database/S3storage');
const connection = require('../database/MySQL');
const jwt = require('jsonwebtoken');
const secretKey = require('../config/jwt');
const AWS = require('aws-sdk');

// 공지사항 목록 조회 api
router.get('/', async function (req, res) {
    const token = req?.headers["authorization"];
    const page = parseInt(req.query.page);
    const size = parseInt(req.query.size);
    const noticestatus = req.query.noticestatus;
    const startIndex = parseInt(size * (page - 1));
    const newDate = new Date();

    try {
        const noticeInfo = await new Promise((resolve, reject) => {
            connection.query(
                `${(noticestatus === "All")
                    ? `SELECT n.title, n.englishTitle, n.japaneseTitle, n.thumbnail, n.writer, n.state, n.createdAt, n.updatedAt
                        FROM notice AS n
                        ORDER BY n.noticeId DESC
                        LIMIT ?, ?;`
                    : `SELECT n.title, n.englishTitle, n.japaneseTitle, n.thumbnail, n.writer, n.state, n.createdAt, n.updatedAt
                        FROM notice AS n
                        WHERE n.state = ?
                        ORDER BY n.noticeId DESC
                        LIMIT ?, ?;`}`,
                (noticestatus === "All") ? [startIndex, size] : [noticestatus, startIndex, size],
                async function (error, results, fields) {
                    if (error) throw error;
                    resolve(results);
                }
            )
        });

        const total = await new Promise((resolve, reject) => {
            connection.query(
                `${(noticestatus === "All")
                    ? `SELECT COUNT(*) AS total_rows FROM notice;`
                    : `SELECT COUNT(*) AS total_rows FROM notice
                        WHERE state = ?;`}`,
                (noticestatus !== "All") && [noticestatus],
                async function (error, results, fields) {
                    if (error) throw error;
                    resolve(results);
                }
            );
        });

        const noticeListData = { noticeListData: noticeInfo, totalCount: total.total_rows };

        if (!token) {
            res.status(201).json({
                message: "공지목록 조회 완료!",
                status: 201,
                isOperator: false,
                totalNumber: total[0].total_rows,
                ...noticeListData
            });
            return;
        };

        async function verifyToken(token, secret) {
            try {
                const decoded = await jwt.verify(token, secret);
                return true;
            } catch (error) {
                return false;
            };
        };

        verifyToken(token, secretKey)
            .then((isTokenValid) => {
                if (!isTokenValid) {
                    res.status(201).json({
                        message: "공지목록 조회 완료!",
                        status: 201,
                        isOperator: false,
                        totalNumber: total[0].total_rows,
                        ...noticeListData
                    });
                    return;
                };
                res.status(200).json({
                    message: "공지목록 조회 완료!",
                    status: 200,
                    isOperator: true,
                    totalNumber: total[0].total_rows,
                    ...noticeListData
                });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({
                    message: "서버 오류...!",
                    status: 500
                });
            });
    } catch (error) {
        console.error(error);
        res.status(403).json({
            message: "Set the page and filter settings correctly and try again.",
            status: 403
        });
    };
});

// 공지사항 상세 조회 api
router.get('/:noticeId', async function (req, res) {
    const token = req?.headers["authorization"];
    const noticeId = req.params.noticeId;

    try {
        const noticeENG = await new Promise((resolve, reject) => {
            connection.query(
                `SELECT notice_image_ENG.imageUrl, notice_content_ENG.content
                FROM notice_image_ENG
                INNER JOIN notice_content_ENG ON notice.noticeId = notice_content_ENG.noticeId
                WHERE notice_image_ENG.noticeId = ?;`,
                [noticeId],
                async function (error, results, fields) {
                    if (error) throw error;
                    resolve(results);
                }
            );
        });

        const noticeJPN = await new Promise((resolve, reject) => {
            connection.query(
                `SELECT notice_image_JPN.imageUrl, notice_content_JPN.content
                FROM notice_image_JPN
                INNER JOIN notice_content_JPN ON notice.noticeId = notice_content_JPN.noticeId
                WHERE notice_image_JPN.noticeId = ?;`,
                [noticeId],
                async function (error, results, fields) {
                    if (error) throw error;
                    resolve(results);
                }
            );
        });

        const noticeKOR = await new Promise((resolve, reject) => {
            connection.query(
                `SELECT notice_image_KOR.imageUrl, notice_content_KOR.content
                FROM notice_image_KOR
                INNER JOIN notice_content_KOR ON notice.noticeId = notice_content_KOR.noticeId
                WHERE notice_image_KOR.noticeId = ?;`,
                [noticeId],
                async function (error, results, fields) {
                    if (error) throw error;
                    resolve(results);
                }
            );
        });

        const noticeDetailData = {
            noticeId: noticeId,
            noticeDetailData: {
                noticeENG,
                noticeJPN,
                noticeKOR
            }
        };

        if (token) {
            async function verifyToken(token, secret) {
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
                            message: "공지 조회 완료!",
                            status: 200,
                            isOperator: true,
                            ...noticeDetailData
                        });
                    } else {
                        res.status(201).json({
                            message: "공지 조회 완료!",
                            status: 201,
                            isOperator: false,
                            ...noticeDetailData
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
                message: "공지 조회 완료!",
                status: 201,
                isOperator: false,
                ...noticeDetailData
            });
        };
    } catch (error) {
        console.error(error);
        res.status(403).json({
            message: "강사 조회 실패...!",
            status: 403
        });
    };
});

module.exports = router;