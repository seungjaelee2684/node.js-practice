const express = require('express');
const router = express.Router();
const imageUploader = require('../database/S3storage');
const connection = require('../database/MySQL');
const jwt = require('jsonwebtoken');
const secretKey = require('../config/jwt');
const AWS = require('aws-sdk');

// 강사 추가 api
router.post('/mentors/upload', imageUploader.fields([
    { name: "images", maxCount: 30 },
    { name: "mentorInfoData" },
    { name: "SNS" }
]), async function (req, res) {
    const token = req?.headers["authorization"];
    const newDate = new Date();
    const year = newDate.getFullYear();
    const month = newDate.getMonth() + 1;
    const day = newDate.getDate();
    const date = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;

    if (!token) {
        res.status(401).json({
            message: "토큰 인증 실패...!",
            status: 401
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
                res.status(401).json({
                    message: "토큰 인증 실패...!",
                    status: 401
                });
                return;
            };

            try {
                const images = req.files['images'] ? req.files['images']?.map((file) => file.location) : [null];
                const { englishname, japanesename, nickname, nation, opendate } = JSON.parse(req.body["mentorInfoData"]);
                const { home, youtube, twitter, instagram, artstation, pixiv } = JSON.parse(req.body["SNS"]);

                const bannerImage = images[0] ? images?.filter((image) => image.includes("banner")) : [null];
                const nicknameImage = images[0] ? images?.filter((image) => image.includes("nickname")) : [null];
                const thumbnailImage = images[0] ? images?.filter((image) => image.includes("thumbnail")) : [null];
                const curriculum = images[0] ? images?.filter((image) => image.includes("curriculum")) : [null];
                const portfolio = images[0] ? images?.filter((image) => image.includes("portfolio")) : [null];

                connection.query(
                    `INSERT INTO mentors (englishname, japanesename, nickname, bannerImage, nicknameImage, thumbnailImage, nation, opendate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                    [englishname, japanesename, nickname, bannerImage, nicknameImage, thumbnailImage, nation, opendate, date, date],
                    async function (error, results, fields) {
                        if (error) throw error;
                        console.log("Inserted successfully");

                        const mentorsId = results.insertId;

                        connection.query(
                            `INSERT INTO links (mentorsId, home, youtube, twitter, instagram, artstation, pixiv) VALUES (?, ?, ?, ?, ?, ?, ?);`,
                            [mentorsId, home, youtube, twitter, instagram, artstation, pixiv],
                            function (error, results, fields) {
                                if (error) throw error;
                                console.log("Inserted successfully");
                            }
                        );

                        curriculum.forEach((imageUrl) => {
                            if (imageUrl.includes("ENG")) {
                                connection.query(
                                    `INSERT INTO curriculum_image (mentorsId, imageUrl, languageData) VALUES (?, ?, ?);`,
                                    [mentorsId, imageUrl, "ENG"],
                                    function (error, results, fields) {
                                        if (error) throw error;
                                        console.log("Inserted successfully");
                                    }
                                );
                            } else if (imageUrl.includes("JPN")) {
                                connection.query(
                                    `INSERT INTO curriculum_image (mentorsId, imageUrl, languageData) VALUES (?, ?, ?);`,
                                    [mentorsId, imageUrl, "JPN"],
                                    function (error, results, fields) {
                                        if (error) throw error;
                                        console.log("Inserted successfully");
                                    }
                                );
                            } else if (imageUrl.includes("KOR")) {
                                connection.query(
                                    `INSERT INTO curriculum_image (mentorsId, imageUrl, languageData) VALUES (?, ?, ?);`,
                                    [mentorsId, imageUrl, "KOR"],
                                    function (error, results, fields) {
                                        if (error) throw error;
                                        console.log("Inserted successfully");
                                    }
                                );
                            };
                            
                        });

                        portfolio.forEach((imageUrl) => {
                            connection.query(
                                `INSERT INTO portfolio_image (mentorsId, imageUrl) VALUES (?, ?);`,
                                [mentorsId, imageUrl],
                                function (error, results, fields) {
                                    if (error) throw error;
                                    console.log("Inserted successfully");
                                }
                            );
                        });
                    }
                );

                res.status(200).json({
                    message: "업로드 성공!",
                    status: 200
                });
            } catch (error) {
                console.error(error);
                res.status(403).json({
                    message: "업로드 실패...!",
                    status: 403
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
});

// 강사 정보 수정 api
// router.patch('/mentors/update/:mentorsId', imageUploader.fields([
//     { name: "banner_image", maxCount: 1 },
//     { name: "nickname_image", maxCount: 1 },
//     { name: "thumbnail_image", maxCount: 1 },
//     { name: "curriculum_image", maxCount: 12 },
//     { name: "portfolio_image", maxCount: 15 },
//     { name: "mentorInfoData" },
//     { name: "SNS" }
// ]), async function (req, res) {
//     const token = req?.headers["authorization"];
//     const mentorsId = req.params.mentorsId;

//     if (token) {
//         async function verifyToken(token, secret) {
//             try {
//                 const decoded = await jwt.verify(token, secret);
//                 return true;
//             } catch (error) {
//                 return false;
//             };
//         };

//         verifyToken(token, secretKey)
//             .then((isTokenValid) => {
//                 if (isTokenValid) {
//                     try {
//                         const bannerImage = req.files['banner_image'] ? req.files['banner_image'][0]?.location : null;
//                         const nicknameImage = req.files['nickname_image'] ? req.files['nickname_image'][0]?.location : null;
//                         const thumbnailImage = req.files['thumbnail_image'] ? req.files['thumbnail_image'][0]?.location : null;
//                         const curriculumImages = req.files['curriculum_image'] ? req.files['curriculum_image']?.map(file => file.location) : [null];
//                         const portfolioImages = req.files['portfolio_image'] ? req.files['portfolio_image']?.map(file => file.location) : [null];

//                         const { englishname, japanesename, nickname, nation, opendate } = JSON.parse(req.body["mentorInfoData"]);
//                         const { home, youtube, twitter, instagram, artstation, pixiv } = JSON.parse(req.body["SNS"]);

//                         const newDate = new Date();
//                         const year = newDate.getFullYear();
//                         const month = newDate.getMonth() + 1;
//                         const day = newDate.getDate();
//                         const date = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;

//                         const curriculumENG = curriculumImages[0] ? curriculumImages.filter((image) => image.includes("ENG")) : null;
//                         const curriculumJPN = curriculumImages[0] ? curriculumImages.filter((image) => image.includes("JPN")) : null;
//                         const curriculumKOR = curriculumImages[0] ? curriculumImages.filter((image) => image.includes("KOR")) : null;

//                         console.log(curriculumENG, curriculumJPN, curriculumKOR);

//                         connection.query(
//                             `UPDATE mentors
//                             SET englishname = ?, japanesename = ?, nickname = ?, nation = ?, opendate = ?, updatedAt = ?
//                             WHERE mentorsId = ?;`,
//                             [englishname, japanesename, nickname, nation, opendate, date, mentorsId],
//                             async function (error, results, fields) {
//                                 if (error) throw error;
//                                 console.log("Inserted successfully");
//                             }
//                         );

//                         connection.query(
//                             `UPDATE links
//                             SET home = ?, youtube = ?, twitter = ?, instagram = ?, artstation = ?, pixiv = ?
//                             WHERE mentorsId = ?;`,
//                             [home, youtube, twitter, instagram, artstation, pixiv, mentorsId],
//                             function (error, results, fields) {
//                                 if (error) throw error;
//                                 console.log("Inserted successfully");
//                             }
//                         );

//                         if (bannerImage) {
//                             connection.query(
//                                 `UPDATE banner_image
//                                 SET imageUrl = ?
//                                 WHERE mentorsId = ?;`,
//                                 [bannerImage, mentorsId],
//                                 function (error, results, fields) {
//                                     if (error) throw error;
//                                     console.log("Inserted successfully");
//                                 }
//                             );
//                         } else {
//                             console.log("bannerImage 값이 없습니다.");
//                         };

//                         if (nicknameImage) {
//                             connection.query(
//                                 `UPDATE nickname_image
//                                 SET imageUrl = ?
//                                 WHERE mentorsId?;`,
//                                 [nicknameImage, mentorsId],
//                                 function (error, results, fields) {
//                                     if (error) throw error;
//                                     console.log("Inserted successfully");
//                                 }
//                             );
//                         } else {
//                             console.log("nicknameImage 값이 없습니다.");
//                         };

//                         if (thumbnailImage) {
//                             connection.query(
//                                 `UPDATE thumbnail_image
//                                 SET imageUrl = ?
//                                 WHERE mentorsId = ?;`,
//                                 [thumbnailImage, mentorsId],
//                                 function (error, results, fields) {
//                                     if (error) throw error;
//                                     console.log("Inserted successfully");
//                                 }
//                             );
//                         } else {
//                             console.log("thumbnailImage 값이 없습니다.");
//                         };

//                         if (curriculumENG) {
//                             connection.query(
//                                 `DELETE curriculum_image_ENG WHERE mentorsId = ?;`,
//                                 [mentorsId],
//                                 function (error, results, fields) {
//                                     if (error) throw error;
//                                 }
//                             );
//                             curriculumENG.forEach((url) => {
//                                 connection.query(
//                                     `INSERT INTO curriculum_image_ENG (mentorsId, imageUrl) VALUES (?, ?);`,
//                                     [mentorsId, url],
//                                     function (error, results, fields) {
//                                         if (error) throw error;
//                                     }
//                                 );
//                             });

//                         } else {
//                             console.log("curriculumENG 값이 없습니다.");
//                         };

//                         if (curriculumJPN) {
//                             connection.query(
//                                 `DELETE curriculum_image_JPN WHERE mentorsId = ?;`,
//                                 [mentorsId],
//                                 function (error, results, fields) {
//                                     if (error) throw error;
//                                 }
//                             );

//                             curriculumJPN.forEach((url) => {
//                                 connection.query(
//                                     `INSERT INTO curriculum_image_JPN (mentorsId, imageUrl) VALUES (?, ?);`,
//                                     [mentorsId, url],
//                                     function (error, results, fields) {
//                                         if (error) throw error;
//                                     }
//                                 );
//                             });
//                         } else {
//                             console.log("curriculumJPN 값이 없습니다.");
//                         };

//                         if (curriculumKOR) {
//                             connection.query(
//                                 `DELETE curriculum_image_KOR WHERE mentorsId = ?;`,
//                                 [mentorsId],
//                                 function (error, results, fields) {
//                                     if (error) throw error;
//                                 }
//                             );

//                             curriculumKOR.forEach((url) => {
//                                 connection.query(
//                                     `INSERT INTO curriculum_image_KOR (mentorsId, imageUrl) VALUES (?, ?)`,
//                                     [mentorsId, url],
//                                     function (error, results, fields) {
//                                         if (error) throw error;
//                                         console.log("Inserted successfully");
//                                     }
//                                 );
//                             });

//                         } else {
//                             console.log("curriculumKOR 값이 없습니다.");
//                         };

//                         if (portfolioImages[0]) {
//                             connection.query(
//                                 `DELETE portfolio_image WHERE mentorsId = ?;`,
//                                 [mentorsId],
//                                 function (error, results, fields) {
//                                     if (error) throw error;
//                                 }
//                             );

//                             portfolioImages.forEach((url) => {
//                                 connection.query(
//                                     `INSERT INTO portfolio_image (mentorsId, imageUrl) VALUES (?, ?);`,
//                                     [mentorsId, url],
//                                     function (error, results, fields) {
//                                         if (error) throw error;
//                                     }
//                                 );
//                             });

//                         } else {
//                             console.log("portfolioImages 값이 없습니다.");
//                         };

//                         res.status(200).json({
//                             message: "업로드 성공!",
//                             status: 200
//                         });
//                     } catch (error) {
//                         res.status(403).json({
//                             message: "업로드 실패...!",
//                             status: 403
//                         });
//                     }
//                 } else {
//                     res.status(401).json({
//                         message: "토큰 인증 실패...!",
//                         status: 401
//                     });
//                 };
//             })
//             .catch((error) => {
//                 console.error(error);
//                 res.status(500).json({
//                     message: "서버 오류...!",
//                     status: 500
//                 });
//             });
//     } else {
//         res.status(401).json({
//             message: "토큰 인증 실패...!",
//             status: 401
//         });
//     };
// });

// 공지사항 업로드 api
// router.post('/notice/upload', imageUploader.fields([
//     { name: "notice_image", maxCount: 15 },
//     { name: "noticeInfoData" },
//     { name: "content" }
// ]), async function (req, res) {
//     const token = req?.headers["authorization"];

//     if (token) {
//         async function verifyToken(token, secret) {
//             try {
//                 const decoded = await jwt.verify(token, secret);
//                 return true;
//             } catch (error) {
//                 return false;
//             };
//         };

//         verifyToken(token, secretKey)
//             .then((isTokenValid) => {
//                 if (isTokenValid) {
//                     try {
//                         const noticeImages = req.files['notice_image'] ? req.files['notice_image']?.map(file => file.location) : [null];
//                         const { englishcontent, japanesecontent, content } = JSON.parse(req.body["content"]);
//                         const { writer, englishtitle, japanesetitle, title, state } = JSON.parse(req.body["noticeInfoData"]);

//                         const newDate = new Date();
//                         const year = newDate.getFullYear();
//                         const month = newDate.getMonth() + 1;
//                         const day = newDate.getDate();
//                         const date = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;

//                         const noticeENG = noticeImages[0] ? noticeImages.filter((image) => image.includes("ENG")) : [null];
//                         const noticeJPN = noticeImages[0] ? noticeImages.filter((image) => image.includes("JPN")) : [null];
//                         const noticeKOR = noticeImages[0] ? noticeImages.filter((image) => image.includes("KOR")) : [null];

//                         console.log(noticeENG, noticeJPN, noticeKOR);

//                         connection.query(
//                             `INSERT INTO notice (writer, englishtitle, japanesetitle, title, state, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?);`,
//                             [writer, englishtitle, japanesetitle, title, state, date, date],
//                             async function (error, results, fields) {
//                                 if (error) throw error;
//                                 console.log("Inserted successfully");

//                                 const noticeId = results.insertId;

//                                 noticeENG.forEach((imageUrl) => {
//                                     connection.query(
//                                         `INSERT INTO notice_image_ENG (noticeId, imageUrl) VALUES (?, ?);`,
//                                         [noticeId, imageUrl],
//                                         function (error, results, fields) {
//                                             if (error) throw error;
//                                             console.log("Inserted successfully");
//                                         }
//                                     );
//                                 });

//                                 noticeJPN.forEach((imageUrl) => {
//                                     connection.query(
//                                         `INSERT INTO notice_image_JPN (noticeId, imageUrl) VALUES (?, ?);`,
//                                         [noticeId, imageUrl],
//                                         function (error, results, fields) {
//                                             if (error) throw error;
//                                             console.log("Inserted successfully");
//                                         }
//                                     );
//                                 });

//                                 noticeKOR.forEach((imageUrl) => {
//                                     connection.query(
//                                         `INSERT INTO notice_image_KOR (noticeId, imageUrl) VALUES (?, ?);`,
//                                         [noticeId, imageUrl],
//                                         function (error, results, fields) {
//                                             if (error) throw error;
//                                             console.log("Inserted successfully");
//                                         }
//                                     );
//                                 });

//                                 englishcontent.forEach((content) => {
//                                     connection.query(
//                                         `INSERT INTO notice_content_ENG (noticeId, content) VALUES (?, ?);`,
//                                         [noticeId, content],
//                                         function (error, results, fields) {
//                                             if (error) throw error;
//                                             console.log("Inserted successfully");
//                                         }
//                                     );
//                                 });

//                                 japanesecontent.forEach((content) => {
//                                     connection.query(
//                                         `INSERT INTO notice_content_JPN (noticeId, content) VALUES (?, ?);`,
//                                         [noticeId, content],
//                                         function (error, results, fields) {
//                                             if (error) throw error;
//                                             console.log("Inserted successfully");
//                                         }
//                                     );
//                                 });

//                                 content.forEach((content) => {
//                                     connection.query(
//                                         `INSERT INTO notice_content_KOR (noticeId, content) VALUES (?, ?);`,
//                                         [noticeId, content],
//                                         function (error, results, fields) {
//                                             if (error) throw error;
//                                             console.log("Inserted successfully");
//                                         }
//                                     );
//                                 });
//                             }
//                         );

//                         res.status(200).json({
//                             message: "업로드 성공!",
//                             status: 200
//                         });
//                     } catch (error) {
//                         console.error(error);
//                         res.status(403).json({
//                             message: "업로드 실패...!",
//                             status: 403
//                         });
//                     };
//                 } else {
//                     res.status(401).json({
//                         message: "토큰 인증 실패...!",
//                         status: 401
//                     });
//                 };
//             })
//             .catch((error) => {
//                 console.error(error);
//                 res.status(500).json({
//                     message: "서버 오류...!",
//                     status: 500
//                 });
//             });
//     } else {
//         res.status(401).json({
//             message: "토큰 인증 실패...!",
//             status: 401
//         });
//     };
// });

module.exports = router;