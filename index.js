const PORT = process.env.PORT || 5000;
const COMMUNITY_URL = process.env.COMMUNITY_URL;
const APP_ID = process.env.APP_ID;
const APP_SECRET = process.env.APP_SECRET;
const OAUTH_CALLBACK_URL = process.env.OAUTH_CALLBACK_URL;
const HOSTED_APP_URL = process.env.HOSTED_APP_URL;
const BG_FAKE = process.env.BG_FAKE;
const STATIC_ASSET_URL = process.env.STATIC_ASSET_URL;

var express = require('express');
var path = require('path');
var app = express();
var cookieParser = require('cookie-parser');
var request = require('request-promise');
var jsforce = require('jsforce');

//App vars
var refreshToken = "";

//Set up App
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());

//Routes
app.get('/', function(req, res){ 
    res.render('index', {
        community_url: COMMUNITY_URL,
        app_id: APP_ID,
        callback_url: OAUTH_CALLBACK_URL,
        background: BG_FAKE,
        static_asset_url: STATIC_ASSET_URL
    }) 
}); 

app.get('/profile', function(req, res){ 

    /* 
    var conn = new jsforce.Connection({
        instanceUrl : COMMUNITY_URL,
        accessToken : decodeURI(req.query.code)
    });

    var records = [];
    conn.query("SELECT Id, Name FROM Contact WHERE Id = '" + req.query.id + "'", function(err, result) {
        if (err) { return console.error(err); }
        console.log("Contact result : " + result.totalSize);
        console.log("Number of contacts found : " + result.records.length);
    });
    */

    res.render('profile', {
        community_url: COMMUNITY_URL,
        app_id: APP_ID,
        callback_url: OAUTH_CALLBACK_URL,
        background: BG_FAKE,
        static_asset_url: STATIC_ASSET_URL
    }) 
}); 

app.get('/_callback', function(req, res){ 
    res.render('callback', {
        community_url: COMMUNITY_URL,
        app_id: APP_ID,
        callback_url: OAUTH_CALLBACK_URL,
        hosted_app_url: HOSTED_APP_URL,
        static_asset_url: STATIC_ASSET_URL
    }) 
}); 

app.get('/server_callback', function(req, res){ 

    console.log("Server Callback: Requesting the access token...");

    const body = {
        "code": decodeURI(req.query.code),
        "grant_type": "authorization_code",
        "client_id": APP_ID,
        "client_secret": APP_SECRET,
        "redirect_uri": OAUTH_CALLBACK_URL
    }

    const startURL = decodeURI(req.state);
    
    //Set up Callback
    const options = {
        method: 'POST',
        uri: COMMUNITY_URL + '/services/oauth2/token',
        form: body,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }

    request(options).then(function (response){

        console.log("Server Callback: Retrieved the access token successfully.");

        //Parse response
        responseJSON = JSON.parse(response);

        console.log(JSON.stringify(responseJSON));

        var accessToken = responseJSON.access_token;
        var idToken = responseJSON.id_token;
        var identity = responseJSON.id;

        //Update refresh token
        refreshToken = responseJSON.refresh_token;

        console.log("Server Callback: Requesting the identity data...");
        
        //Set up Callback
        const options = {
            method: 'GET',
            uri: identity + '?version=latest',
            body: body,
            json: true,
            followAllRedirects: true,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            }
        }

        request(options).then(function (response){
            
            console.log("Server Callback: Retrieved identity data successfully.");
            console.log("Server Callback: Creating redirect page.");

            JSONresponse = JSON.stringify(response);

            console.log("Server Callback Identity Response: " + JSONResponse);

            res.render('server_callback', {
                community_url: COMMUNITY_URL,
                app_id: APP_ID,
                callback_url: OAUTH_CALLBACK_URL,
                hosted_app_url: HOSTED_APP_URL,
                static_asset_url: STATIC_ASSET_URL,
                identity_response: Buffer.from(JSONresponse).toString("base64")
            }) 

        })

        .catch(function (err) {
            console.log(err);
        })

    })
    .catch(function (err) {
        console.log(err);
    })

}); 

//Run
app.listen(PORT, function () {
  console.log('We\'re live on the magic listening action of port ' + PORT + '!');
});