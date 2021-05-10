const uri = "mongodb+srv://himanish_setia:hsetia94@cluster0.hxina.mongodb.net/cowin?retryWrites=true&w=majority";
const express = require("express");
var bodyParser = require('body-parser');
const cron = require("node-cron");
const nodemailer = require("nodemailer");
var mongodb = require("mongodb");
const req = require('request');
var ObjectID = mongodb.ObjectID;
var database;
var collection = "vaccination_center";
const app = express();

var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use(bodyParser.json());

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "hsetia0694@gmail.com",
        pass: "#Ilovemyparents2912040#"
    }
})


app.get('/api/status', (request, response) => {
    response.status(200).json({ status: 'Up and running.' });
})

cron.schedule("*/20 * * * * *", () => {
    console.log("----------------------- Looking for scheduled entries ------------------------------");
    database.collection(collection).find({}).toArray(function (error, data) {
        data.forEach(e => {
            try {
                const cowin_server = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode=${e.pinCode}&date=${e.date}`;
                let option = {
                    method: 'GET',
                    url: `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode=${e.pinCode}&date=${e.date}`,
                    json: true,
                    headers: {
                        'User-Agent': 'Mozilla',
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Cookie': 'troute=t1;'
                    }
                }
                console.log(`-----------------------URL---------------- `, cowin_server);
                req(option, (err, res, body) => {
                    if (err) { return console.log(err); }
                    console.log('------------------------- Body ---------------------------- ', ((body || {})['sessions'] || [])['length']);
                    if (((body || {})['sessions'] || [])['length']) {
                        console.log(`Found for ${e.name} with mobile number as ${e.mobile}`);
                        sendingMail(e, body.sessions);
                    }
                });
            } catch (exception) {
                console.error('Exception occured while finding slot.');
            }
        })
    });
})

app.post('/schedule', urlencodedParser, function (request, response) {
    try {
        database.collection(collection).find({}).toArray(function (error, data) {
            if (error) {
                manageError(response, error.message, "Failed to schedule.");
            } else {
                const filteredData = data.filter(e => request.body.mobile == e.mobile);
                if (!data.length || !filteredData.length) {
                    try {
                        database.collection(collection).insertOne(request.body, (error, data) => {
                            if (error) {
                                manageError(response, error.message, "Failed to schedule.");
                            } else {
                                console.log("Scheduled successfully");
                                response.status(200).json({ "message": "Scheduled successfully" });
                            }
                        })
                    } catch (exception) {
                        console.error('Exception occured while scheduling ', exception)
                        manageError(response, "Something went wrong.", "Something went wrong.");
                    }

                } else {
                    manageError(response, "Job already in queue with this mobile number.", "Job already in queue with this mobile number.");
                }
            }
        });
    } catch (exception) {
        console.error('Exception occured while fetching before scheduling ', exception)
        manageError(response, "Something went wrong.", "Something went wrong.");
    }

})

sendingMail = (userData, centerDetails) => {
    let mailOptions = {
        from: "Cowin Realtime",
        to: userData.email,
        subject: "Vaccination Center Found!",
        html: `<h1>Vaccination center found: ${centerDetails.map(e => e.name).toString()}</h1>`
    }

    try {
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log("error occurred", err)
            } else {
                console.log(`-----------------------Mail sent to ${userData.name}------------------------`);
                removeFromDatabase(userData);
            }
        })
    } catch (exception) {
        console.error('Exception occured while sending mail.', exception);
    }
}

removeFromDatabase = (userData) => {
    try {
        database.collection(collection).deleteOne({ mobile: userData.mobile });
    } catch (exception) {
        console.error('Exception occured while removing from DB.', exception);
    }
}

manageError = (res, reason, message, code) => {
    console.log("Error: " + reason);
    res.status(code || 500).json({ "error": message });
}


mongodb.MongoClient.connect(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
}, (error, client) => {
    if (error) {
        console.log('Error ', error);
        process.exit(1);
    }

    database = client.db();
    console.log('Database connection done.');


    app.listen(process.env.PORT || 3000, () => {
        console.log('Server up and running at port 3000');
    })

})