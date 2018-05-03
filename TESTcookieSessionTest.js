const express = require('express');
const cookieSession = require('cookie-session');
const app = express();

app.use(cookieSession({
    secret: 'this is my secret page',
    maxAge: 100*60*60*24*24
}));

function checkForMessage(req,res,next){
    if(req.session.message){
        res.redirect('/thanks');
    }
    else{
        next();
    }
}

app.get('/', checkForMessage, (req, res) => {
    req.session.message = 'No one has the power to shatter your dreams';
    res.send(`<h1>
        Hey you. Just set a cookie for you</h1>
        <h2><a href="/message">Click here to see it!</a></h2>
        `);
});

app.get('/thanks', (req, res) => {
    res.send(`<h1>' ${req.session.message} + '</h1>
                <h2><a href="/logout">Logout</a></h2>`);
});

app.get('/logout', (req,res)=>{
    req.session= null;
    res.send(`<h1>now our session is >${req.session}</h1>`);

});

app.listen(8080, () => console.log('listening on server'));
