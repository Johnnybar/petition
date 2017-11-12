const express = require('express');
const app = express();
const hb = require ('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
var spicedPg = require('spiced-pg');
const modules = require('./modules.js');
const cookieSession = require('cookie-session');

////MAKE A LOGOUT PAGE AND REMOVE INPUT ON PETITION SIGN PAGE!!!

app.use(cookieSession({
    secret: 'a really hard to guess secret',
    maxAge: 1000 * 60 * 60 * 24 * 14
}));

app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
    extended: false
}));

//FIRST PAGE WHEN OPENING LOCAL HOST
app.get('/', (req,res) => {
    if(req.session.loggedIn) {
        res.redirect('/thanks');
    } else {
        res.redirect('/register');
    }
});

app.get('/register', (req, res)=>{
    if(req.session.loggedIn){
        res.redirect('/petition');
    }
    else{
        res.render('register', {
            layout: 'main',
        });
    }
});
//AFTER USERS CLICKED REGISTER
app.post('/register', (req,res) => {
    modules.hashPassword(req.body.password)
        .then((hashedPassword) => {
            console.log("USER'S HASH is ", hashedPassword);
            modules.registerUser(req.body.firstName, req.body.lastName, req.body.username, hashedPassword)
                .then((id)=>{
                    console.log(id);
                });
            req.session.user = { username: req.body.username, first:req.body.firstName, last: req.body.firstName  };
            if(req.session.signatureId){
                req.session.user = {signatureId: req.session.user.singatureId};
            }
            req.session.loggedIn = 'true';
            res.redirect('/petition');
        });
});

app.get('/login', (req,res)=>{
    if(req.session.loggedIn){
        res.redirect('/petition');
    }
    else{
        res.render('login', {
            layout:'main',
        });
    }
});

app.post('/login', (req, res)=>{
    if(req.body.username && req.body.password){
        modules.getHash(req.body.username)
            .then((hashPass)=>{
                modules.checkPassword(req.body.password, hashPass)
                    .then((doesMatch) => {
                        console.log("doesMatch", doesMatch);
                        if(doesMatch){
                            req.session.loggedIn = 'true';
                            
                            //ADD QUERY TO GET SIGNATURE ID
                            res.redirect('/petition');
                        } else {
                            console.log("that password did not match");
                        }
                    }).catch((err) => {
                        console.log(err);
                        res.render('loginError', {
                            layout: 'main',
                        });
                    });
            });
    }
    else{
        res.render('LogDetailsMissing', {
            layout:'main',
        });
    }
});

app.get('/petition', function(req,res){


    if(req.session.signatureId && req.session.loggedIn){

        //add module that takes the signature ID and matches it
        console.log('yep, logged in and got a signature');
        modules.getSign(req.session.signatureId).then((signImg)=>{
            res.redirect('/petition/thanks');//NOT WORKING!!!
        });
    }
    else{
        if(req.session.loggedIn){
            res.render('index',{
                layout: 'mainWithLogOut',
                dropBear:'/dropbearlogofinal.svg',
            });
        }
        else{
            res.redirect('/register');
        }
    }
});

app.post('/petition', function(req,res){
    let firstName = req.body.first;
    let lastName = req.body.last;
    let signature = req.body.signature;
    modules.signPetition(firstName, lastName, signature).then((id)=>{
        if(firstName && lastName && signature){
            req.session.signatureId = id;
            res.redirect('/petition/thanks');
        }
        else{
            res.render('index', {
                layout: 'mainWithLogOut',
                dropBear:'/dropbearlogofinal.svg',
                errorMessage:`There seems to be an issue. Did you remember to fill in all 3 fields?`,
            });
        }
    });
});


app.get('/petition/thanks', function(req, res){
    if(req.session.signatureId){
        modules.getSign(req.session.signatureId).then((signImg)=>{
            res.render('thanksPage',{
                layout: 'mainWithLogOut',
                thanksMessage: 'All done.',
                thanksImage: '/thanksbear.png',
                toSignersBtn: 'Check out who else signed!',
                linkToSigners: "/petition/signers",
                signatureImg: signImg
            });
        });
    }
    else{
        res.render('thanksPage',{
            layout: 'mainWithLogOut',
            thanksMessage: 'All done.',
            thanksImage: '/thanksbear.png',
            toSignersBtn: 'Check out who else signed!',
            linkToSigners: "/petition/signers",
        });
    }
});

app.get('/petition/signers', function(req,res){
    var records = modules.getSigners();
    records.then((value)=>{
        res.render('signers',{
            layout:'mainWithLogOut',
            headlineSigners:'These people have already signed: ',
            names: value
        });
    });
});

app.get('/logout', function(req,res){
    req.session = null;
    res.redirect('/register');
});

app.listen(8080, ()=> (console.log('listening on port 8080')));
