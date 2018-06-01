require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const moment = require("moment");
const ObjectId = require("mongoose").Types.ObjectId;

const { mongoose } = require("./db/mongoose");
const { User } = require("./models/User");
const { Exercise } = require("./models/Exercise");


const port = process.env.PORT;
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("/public"));


const isValidDate = dateString => {
    const regEx = /^\d{4}-\d{2}-\d{2}$/;
    return dateString.match(regEx) !== null;
}

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/api/exercise/log", async (req, res) => {
    const queries = _.pick(req.query, ["userId", "from", "to", "limit"]);

    if (!queries.hasOwnProperty("userId")) { 
        return res.json({
            "error": "Must provide userId"
        });
     }

     if (!ObjectId.isValid(queries.userId)) {
         return res.json({
             "error": "Must provide a valid userId"
         });
     }


    let query =  { user: queries.userId };
    let date = {};
    if (queries.hasOwnProperty("from")) {
        if (isValidDate(queries.from)) {
            date["$gt"] = new Date(Date.parse(queries.from)).getTime();            
        }
    }

    if (queries.hasOwnProperty("to")) {
        if (isValidDate(queries.to)) {
            date["$lt"] = new Date(Date.parse(queries.to)).getTime();               
        }
    }

    if (Object.keys(date).length > 0) {
        query.date = date;
    }

    try {
        let logs;
        const user = await User.findById(queries.userId);
        
        if (!user) throw "Invalid userId";

        if (queries.hasOwnProperty("limit")) {
            logs = await Exercise.find(query).select("description duration date").limit(queries.limit);
        } else {
            logs = await Exercise.find(query).select("description duration date");    
        }
        res.json({
            id: user._id,
            username: user.username,
            count: logs.length,
            log: logs.map(log => {
                return {
                    id: log._id,
                    description: log.description,
                    duration: log.duration,
                    date: moment(log.date).format("ddd MMM DD YYYY")
                }
            })

        });
    } catch (e) {
        if (e === "Invalid userId") {
            res.json({
                "error": e
            });
        } else {
            res.json({
                "error": "Server Error"
            });
        }
    }
   
});

app.post("/api/exercise/add", async (req, res) => {
    const formData = _.pick(req.body, ["user", "description", "date", "duration"]);
    if (!ObjectId.isValid(formData.user)) {
        return res.json({
            "error": "Invalid userId"
        });
    }

    if (!isValidDate(formData.date)) {
        res.json({
            "error": "Invalid Date format"
        });
    }

    try {
        const user = await User.findById(formData.user);
        if (!user) throw "Invalid userId";
        formData.date = new Date(Date.parse(formData.date)).getTime();
        const newExercise = new Exercise(formData);
        const exercise = await newExercise.save();
        
        res.json({
            "id": exercise._id,
            "username": user.username,
            "description": exercise.description,
            "duration": exercise.duration,
            "date": moment(exercise.date).format("ddd MMM DD YYYY")
        })
    } catch (e) {
        if (e === "Invalid userId") {
            res.json({
                "error": "Invalid userId"
            });
        } else {
            res.json({
                "error": "server error"
            });
        }
    }
});

app.post("/api/exercise/new-user", async (req, res) => {
    try {
        const username = req.body.username;

        const newUser = new User({ username });
        const user = await newUser.save();
        res.json(_.pick(user, ["username", "_id"]));        
    } catch (e) {
        if (e.code && e.code === 11000) {
            res.json({
                "error": "Already a user"
            });
        } else {
            res.json({
                "error": "server Error"                
            });
        }
    }
});

app.listen(port, () => {
    console.log(`Now listening at port ${port}`);
});
