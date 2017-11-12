const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cookieSession= require('cookie-session');

app.use(cookieSession({
    secret: 'whatever',
}));//ENTER MISSING


function checkForUser(req,res,next){
    if (req.session.user){
        next();
    }
    else {
        res.redirect('/register');
    }
}

app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(__dirname + '/public'));

app.get('/', (req,res)=>{
    if(req.session.user){
        res.redirect('/feature');
    }
    else{
        res.redirect('/register');
    }
});

app.get('/register', (req,res)=>{
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/login', (req,res)=>{
    res.sendFile(__dirname + '/public/login.html');
});

app.post('/loginUser', (req,res)=>{
    console.log('inside Post login user ', req.body);

    var bcrypt = require('bcryptjs');


    //HERE YOU WOULD DO A SELECET STATEMENT TO RETRIEVE HASH FROM DB
    checkPassword(req.body.password, result.rows[0].hashedPssword).then((doesMatch)=>{
        console.log('does match', doesMatch);
        if(doesMatch){
            res.redirect('/features');
        }
        else {
            console.log('that password does not match');
        }
    });


    function checkPassword(textEnteredInLoginForm, hashedPasswordFromDatabase) {
        return new Promise(function(resolve, reject) {
            bcrypt.compare(textEnteredInLoginForm, hashedPasswordFromDatabase, function(err, doesMatch) {
                if (err) {
                    reject(err);
                } else {
                    resolve(doesMatch);
                }
            });
        });
    }
});


app.get('/features', checkForUser, (req, res)=>{
    res.sendFile( __dirname + '/public/features.html');
});

app.post('/submitRegistration', (req,res)=>{
    console.log('inside POST/submitRegistration', req.body);

    hashPassword(req.body.password)
        .then((hashedPassword)=>{
            console.log('our hash: ', hashedPassword);

            req.session.user = {
                username: req.body.username,
            };
        });

    // THIS IS WHERE YOU WOULD INSERT INTO YOUR DB

    function hashPassword(plainTextPassword) {
        return new Promise(function(resolve, reject) {
            bcrypt.genSalt(function(err, salt) {
                if (err) {
                    return reject(err);
                }
                bcrypt.hash(plainTextPassword, salt, function(err, hash) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(hash);
                });
            });
        });
    }
});

app.listen(8080, ()=>{
    console.log('listening on 8080');
});
