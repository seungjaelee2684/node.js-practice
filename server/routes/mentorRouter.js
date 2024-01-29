const express = require('express');
const router = express.Router();
const Mentor = require('../Schemas/MentorsNameSchema');

// 강사 추가 api
router.post('/', async function (req, res) {
    try {
        const mentor_name = await Mentor.find();
        let result = mentor_name;
        const id_data = Number(mentor_name[result.length - 1].mentorsId) + 1;
        const nextId = String(id_data);
        const createdAt = new Date();

        const {
            englishname,
            chinesename,
            japanesename,
            nickname,
            nation
        } = req.body;

        const mentorsData = {
            mentorsId: nextId,
            englishname: englishname,
            chinesename: chinesename,
            japanesename: japanesename,
            nickname: nickname,
            nation: nation,
            createdAt: createdAt,
            updatedaAt: createdAt
        };

        const createdMentor = await Mentor.create(mentorsData);

        result.push(mentorsData);

        const mentor = { mentorList: result }
        res.json(mentor);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    };
});

// 강사 전체목록 조회 api
router.get('/', async function (req, res) {

    const requestCookie = req.headers.cookie;
    const token = requestCookie.substring(4);
    console.log(token);

    try {
        const mentor_name = await Mentor.find();
        const mentorOfDates = mentor_name.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const page = req.query.page;
        const size = req.query.size;
        const nationstatus = req.query.nationstatus;

        const filterMentor = mentorOfDates?.filter((item) => {
            if (nationstatus === "All") {
                return item
            } else {
                return item?.nation === nationstatus
            }
        });

        const startIndex = size * (page - 1);
        const endIndex = (size * page) - 1;
        // const filterPageMentor = filterMentor.slice(startIndex, endIndex)
        const pageMentor = filterMentor.slice(startIndex, endIndex);

        const mentorListData = { mentorListData: pageMentor };
        // const filterMentorListData = { mentorListData: filterPageMentor };

        if (token) {
            res.status(200).json({
                message: "강사목록 조회 완료!",
                status: 200,
                isOperator: true,
                ...mentorListData
            });
        } else {
            res.status(200).json({
                message: "강사목록 조회 완료!",
                status: 200,
                isOperator: false,
                ...mentorListData
            });
        };  
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
    const requestCookie = req.headers.cookie;
    const token = requestCookie.substring(4);
    console.log(token);
    
    try {
        const mentor_name = await Mentor.find();
        let mentorsId = req.params.mentorsId;
        const mentorFilterList = mentor_name?.filter((item) => item.mentorsId === mentorsId);

        if (token) {
            res.status(200).json({
                message: "강사 조회 완료!",
                status: 200,
                isOperator: true,
                mentorOneData: mentorFilterList[0]
            });
        } else {
            res.status(200).json({
                message: "강사 조회 완료!",
                status: 200,
                isOperator: false,
                mentorOneData: mentorFilterList[0]
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