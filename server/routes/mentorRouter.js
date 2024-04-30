const express = require('express');
const router = express.Router();
const imageUploader = require('../database/S3storage');
const connection = require('../database/MySQL');
const jwt = require('jsonwebtoken');
const secretKey = require('../config/jwt');

// 강사 전체목록 조회 api
router.get('/', async function (req, res) {
    const token = req?.headers["authorization"];
    const page = parseInt(req?.query.page);
    const size = parseInt(req?.query.size);
    const nationstatus = req?.query.nationstatus;
    const search = req?.query.search;
    const startIndex = parseInt(size * (page - 1));
    const newDate = new Date();

    try {
        const mentorInfo = await new Promise((resolve, reject) => {
            connection.query(
                `${(nationstatus === "All")
                    ? `SELECT m.mentorsId, m.nickname, m.englishname, m.japanesename, m.thumbnailImage, m.nation, m.opendate, m.createdAt, m.updatedAt, links.twitter
                        FROM mentors AS m
                        INNER JOIN links ON m.mentorsId = links.mentorsId
                        ORDER BY m.mentorsId DESC
                        LIMIT ?, ?;`
                    : `SELECT m.mentorsId, m.nickname, m.englishname, m.japanesename, m.thumbnailImage, m.nation, m.opendate, m.createdAt, m.updatedAt, links.twitter
                        FROM mentors AS m
                        INNER JOIN links ON m.mentorsId = links.mentorsId
                        WHERE m.nation = ?
                        ORDER BY m.mentorsId DESC
                        LIMIT ?, ?;`}`,
                (nationstatus === "All") ? [startIndex, size] : [nationstatus, startIndex, size],
                async function (error, results, fields) {
                    if (error) throw error;
                    resolve(results);
                }
            )
        });

        const total = await new Promise((resolve, reject) => {
            connection.query(
                `SELECT COUNT(*) AS total_rows FROM mentors;`,
                async function (error, results, fields) {
                    if (error) throw error;
                    resolve(results);
                }
            );
        });

        const mentorData = mentorInfo.map((item) => {
            const targetDate = new Date(item?.opendate);
            if (newDate >= targetDate) {
                return { ...item, isopen: true };
            } else {
                return { ...item, isopen: false };
            };
        });

        const mentorsDto = mentorData?.filter((item) => {
            if (!search) {
                return true;
            } else {
                return (
                    item.englishname.includes(search) ||
                    item.japanesename.includes(search) ||
                    item.nickname.includes(search)
                );
            };
        });

        const mentorListData = { mentorListData: mentorsDto };

        if (!token) {
            res.status(201).json({
                message: "강사목록 조회 완료!",
                status: 201,
                isOperator: false,
                totalNumber: total[0].total_rows,
                ...mentorListData
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
                        message: "강사목록 조회 완료!",
                        status: 201,
                        isOperator: false,
                        totalNumber: total[0].total_rows,
                        ...mentorListData
                    });
                    return;
                };
                res.status(200).json({
                    message: "강사목록 조회 완료!",
                    status: 200,
                    isOperator: true,
                    totalNumber: total[0].total_rows,
                    ...mentorListData
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

// 강사 상세조회 api
router.get('/:mentorsId', async function (req, res) {
    const token = req?.headers["authorization"];
    const mentorsId = req.params.mentorsId;

    try {
        const curriculum = await new Promise((resolve, reject) => {
            connection.query(
                `SELECT imageUrl, languageData
                FROM curriculum_image
                WHERE mentorsId = ?;`,
                [mentorsId],
                async function (error, results, fields) {
                    if (error) throw error;
                    resolve(results);
                }
            );
        });

        const link = await new Promise((resolve, reject) => {
            connection.query(
                `SELECT home, youtube, twitter, instagram, artstation, pixiv
                FROM links
                WHERE mentorsId = ?;`,
                [mentorsId],
                async function (error, results, fields) {
                    if (error) throw error;
                    resolve(results);
                }
            );
        });

        const portfolio = await new Promise((resolve, reject) => {
            connection.query(
                `SELECT imageUrl FROM portfolio_image
                WHERE mentorsId = ?;`,
                [mentorsId],
                async function (error, results, fields) {
                    if (error) throw error;
                    resolve(results);
                }
            );
        });

        const linkData = Object.keys(link[0]).map((key) => ({ link: link[0][key] }));
        const portfolioImages = portfolio.map((img) => img.imageUrl);
        const curriculumENG = curriculum.filter((image) => image.languageData === "ENG").map((item) => item.imageUrl);
        const curriculumJPN = curriculum.filter((image) => image.languageData === "JPN").map((item) => item.imageUrl);
        const curriculumKOR = curriculum.filter((image) => image.languageData === "KOR").map((item) => item.imageUrl);

        const mentorDetailData = {
            mentorsId: mentorsId,
            mentorDetailData: {
                mentorCurriculum: {
                    ENG: curriculumENG,
                    JPN: curriculumJPN,
                    KOR: curriculumKOR
                },
                links: linkData,
                mentorPortfolio: portfolioImages
            }
        };

        if (!token) {
            res.status(201).json({
                message: "강사 조회 완료!",
                status: 201,
                isOperator: false,
                ...mentorDetailData
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
                        message: "강사 조회 완료!",
                        status: 201,
                        isOperator: false,
                        ...mentorDetailData
                    });
                    return;  
                };

                res.status(200).json({
                    message: "강사 조회 완료!",
                    status: 200,
                    isOperator: true,
                    ...mentorDetailData
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
            message: "강사 조회 실패...!",
            status: 403
        });
    };
});

module.exports = router;