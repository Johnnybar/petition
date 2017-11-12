var userInfo = require('./secrets.json');
var user = userInfo.username;
var pass = userInfo.password;
var spicedPg = require('spiced-pg');
var bcrypt = require('bcryptjs');

var db = spicedPg(`postgres:${user}:${pass}psql@localhost:5432/petition`);


exports.signPetition =function(first, last, signature) {
    return db.query(
        'INSERT INTO signatures (first, last, signature) VALUES ($1, $2, $3) RETURNING id',
        [first, last, signature]
    ).then((results) => {
        return results.rows[0].id;
    }).catch((err) => {
        console.log(err);
    });
};


exports.getSigners = function(){
    return db.query(
        'SELECT first, last FROM signatures'
    ).then((results)=>{
        return results.rows;
    }).catch((err)=>{
        console.log(err);
    });
};


exports.getSign = function(id) {
    return db.query(
        'SELECT signature FROM signatures WHERE id =($1)',
        [id]
    ).then((results) => {
        return results.rows[0].signature;
    }).catch((err) => {
        console.log(err);
    });
};


exports.hashPassword = function(plainTextPassword) {
    return new Promise(function(resolve, reject) {
        bcrypt.genSalt(function(err, salt) {
            if (err) { return reject(err); }
            bcrypt.hash(plainTextPassword, salt, function(err, hash) {
                if (err) { return reject(err); }
                resolve(hash);
            });
        });
    });
};


exports.checkPassword = function(textEnteredInLoginForm, hashedPasswordFromDatabase) {
    return new Promise(function(resolve, reject) {
        bcrypt.compare(textEnteredInLoginForm, hashedPasswordFromDatabase, function(err, doesMatch) {
            if (err) {
                reject(err);
            } else {
                resolve(doesMatch);
            }
        });
    });
};


exports.registerUser =function(first, last, username, hashPass) {
    return new Promise(function(resolve, reject){
        db.query(
            'INSERT INTO users (first, last, username, hash_pass) VALUES ($1, $2, $3, $4) RETURNING id',
            [first, last, username, hashPass]
        ).then((results) => {
            resolve(results.rows);
        }).catch((err) => {
            console.log(err);
        });
    });

};


exports.getHash = function(username) {
    return db.query(
        'SELECT hash_pass FROM users WHERE username =($1)',
        [username]
    ).then((results) => {
        return results.rows[0].hash_pass;
    }).catch((err) => {
        console.log(err);
    });
};

exports.getUserInp = function(id){
    return db.query(
        'SELECT first, last FROM users WHERE id =($1)',
        [id]
    ).then((results) => {
        return results.rows[0];
    }).catch((err) => {
        console.log(err);
    });
};
