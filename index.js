const express = require('express');
const app = express();
const hb = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
var spicedPg = require('spiced-pg');
const modules = require('./modules.js');
const redisModules = require('./redisModules.js');
const cookieSession = require('cookie-session');
var csrf = require('csurf');
const csrfSecurity = csrf();
const redis = require('redis');
var session = require('express-session');
var Store = require('connect-redis')(session);

app.use(cookieParser());

app.engine('handlebars', hb());
app.set('view engine', 'handlebars');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

const client = redis.createClient(process.env.REDIS_URL || {
  host: 'localhost',
  port: 6379
});

var store = {};
if (process.env.REDIS_URL) {
  store = {
    url: process.env.REDIS_URL
  };
} else {
  store = {
    ttl: 3600,
    host: 'localhost',
    port: 6379
  };
}
app.use(session({store: new Store(store), resave: true, saveUninitialized: true, secret: 'mysecret'}));

client.on('error', function(err) {
  console.log(err);
});

app.get('/', (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/petition');
  } else {
    res.redirect('/register');
  }
});

app.get('/register', csrfSecurity, (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/petition');
  } else {
    res.render('register', {
      layout: 'main',
      csrfToken: req.csrfToken()
    });
  }
});

//After user clicked register

app.post('/register', csrfSecurity, (req, res) => {
  if (req.body.password && req.body.firstName && req.body.lastName, req.body.username) {
    modules.hashPassword(req.body.password).then((hashedPassword) => {

      modules.registerUser(req.body.firstName, req.body.lastName, req.body.username, hashedPassword).then((id) => {
        req.session.user = {
          id: id,
          username: req.body.username,
          first: req.body.firstName,
          last: req.body.lastName
        };
        req.session.loggedIn = 'true';
        redisModules.delCache('signers');
        res.redirect('/profile');
      }).catch(function() {
        console.log('WE ARE DIFFERENTLY HERE');
        res.render('registerError', {layout: 'main'});
      });
    });
  } else {
    res.render('registerError', {layout: 'main'});
  }
});

app.get('/profile', csrfSecurity, (req, res) => {
  res.render('profile', {
    layout: 'main',
    csrfToken: req.csrfToken()
  });
});

app.post('/profile', csrfSecurity, (req, res) => {
  modules.addAgeCityUrl(req.body.age, req.body.city, req.body.homepage, req.session.user.id);
  redisModules.delCache('signers');
  res.redirect('/petition');
});

app.get('/login', csrfSecurity, (req, res) => {
  if (req.session.loggedIn) {
    res.redirect('/petition');
  } else {
    res.render('login', {
      layout: 'mainLogin',
      csrfToken: req.csrfToken()
    });
  }
});

app.post('/login', csrfSecurity, (req, res) => {
  if (req.body.username && req.body.password) {
    modules.getHash(req.body.username).then((hashPass) => {
      modules.checkPassword(req.body.password, hashPass).then((doesMatch) => {
        console.log("does match ", doesMatch);
        if (doesMatch) {
          modules.getUserInp(req.body.username).then((result) => {
            req.session.user = {
              first: result.first,
              last: result.last,
              id: result.id
            };
            modules.checkForSig(req.session.user.id).then((result) => {
              req.session.user.signature = result;
              req.session.user.signatureId = result.id;
              req.session.loggedIn = 'true';
              res.redirect('/petition');
            });

          });
        } else {
          console.log("that password did not match");
          res.render('loginError', {layout: 'mainLogin'});
        }
      }).catch((err) => {
        console.log(err);
        res.render('loginError', {layout: 'mainLogin'});
      });
    });
  } else {
    res.render('LogDetailsMissing', {layout: 'mainLogin'});
  }
});

app.get('/petition', csrfSecurity, function(req, res) {

  if (req.session.loggedIn) {
    if (req.session.user.signatureId) {

      res.redirect('/petition/thanks');
    } else {
      res.render('index', {
        layout: 'mainWithLogOut',
        dropBear: '/dropbearlogofinal.svg',
        first: req.session.user.first,
        last: req.session.user.last,
        csrfToken: req.csrfToken()
      });
    }
  } else {
    res.redirect('/register');
  }

});

app.post('/petition', csrfSecurity, function(req, res) {
  let firstName = req.session.user.first;
  let lastName = req.session.user.last;
  let signature = req.body.signature;
  let userId = req.session.user.id;

  modules.signPetition(firstName, lastName, signature, userId).then((signatureId) => {
    if (signatureId) {
      req.session.user.signatureId = signatureId;
      redisModules.delCache('signers');
      res.redirect('/petition/thanks');
    } else {
      res.render('index', {
        layout: 'mainWithLogOut',
        dropBear: '/dropbearlogofinal.svg',
        errorMessage: `There seems to be an issue.`
      });
    }
  });
});

app.get('/petition/thanks', csrfSecurity, function(req, res) {
  if (req.session.user) {
    if (req.session.user.signatureId) {
      modules.getSign(req.session.user.id).then((signImg) => {
        res.render('thanksPage', {
          layout: 'mainWithLogOut',
          thanksMessage: 'All done.',
          thanksImage: '/thanksbear.png',
          toSignersBtn: 'Check out who else signed!',
          linkToSigners: "/petition/signers",
          signatureImg: signImg,
          csrfToken: req.csrfToken()

        });
      });
    } else {
      res.redirect('/petition');
    }
  } else {
    res.redirect('/register');
  }
});

app.post('/petition/removeSig', function(req, res) {
  modules.removeSig(req.session.user.id);
  req.session.user.signatureId = null;
  redisModules.delCache('signers');
  res.redirect('/petition');
});

app.get('/petition/signers', function(req, res) {
  redisModules.chkIfCached('signers').then(function(signers) {
    if (!signers) {
      modules.getNames().then(function(resultSigners) {
        redisModules.setCache('signers', JSON.stringify(resultSigners));
        signers = resultSigners;
        res.render('signers', {
          layout: 'mainWithLogOut',
          headlineSigners: 'These people have already signed: ',
          names: signers
        });
      });
    } else {
      signers = JSON.parse(signers);
      res.render('signers', {
        layout: 'mainWithLogOut',
        headlineSigners: 'These people have already signed: ',
        names: signers
      });
    }
  });
});

app.get('/signers/:signerCity', function(req, res) {
  const signerCity = req.params.signerCity;
  modules.getCity(signerCity).then((value) => {
    res.render('city', {
      layout: 'mainWithLogOut',
      headline: `Other people who joined our cause in ${signerCity}`,
      names: value
    });
  });
});

app.get('/profile/edit', csrfSecurity, function(req, res) {
  if (req.session.loggedIn) {
    modules.getDetails(req.session.user.id).then((value) => {

      res.render('editProfile', {
        layout: 'mainWithLogOut',
        first: value.first,
        last: value.last,
        email: value.username,
        age: value.user_age,
        city: value.user_city,
        homepage: value.user_url,
        csrfToken: req.csrfToken()
      });
    });
  } else {
    res.redirect('/register');
  }
});

app.post('/profile/edit', csrfSecurity, function(req, res) {
  if (req.body.password != '') {

    modules.updatePassword(req.body.password, req.session.user.id);
  }
  modules.updateDetails(req.body.first, req.body.last, req.body.email, req.session.user.id, req.body.age, req.body.city, req.body.homepage);
  redisModules.delCache('signers');
  res.redirect('/profile/edit');
});

app.get('/logout', function(req, res) {
  req.session.destroy();
  res.redirect('/register');
});

app.get('/about', (req, res) => {
  res.render('aboutDropBear', {layout: 'mainAbout'});
});

app.listen(process.env.PORT || 8080, () => (console.log('listening on port 8080')));
