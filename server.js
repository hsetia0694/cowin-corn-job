const uri = "mongodb+srv://himanish_setia:hsetia94@cluster0.hxina.mongodb.net/sample_training?retryWrites=true&w=majority";


var express = require('express');
var bodyParser = require('body-parser');
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var database;
var collection = "routes";

var app = express();

app.use(bodyParser.json());

app.get('/api/status', (request, response) => {
    response.status(200).json({ status: 'Up and running.' });
})

app.get('/getData', (request, response) => {
    console.log('ENTERED')
    database.collection(collection).find({ "airline": { id: 470, name: 'Air Burkina', alias: '2J', iata: 'VBW' } }).toArray(function (error, data) {
        if (error) {
            console.log('Error on fetching ', error)
        } else {
            response.status(200).json(data);
        }
    });
})

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