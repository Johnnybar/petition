var spicedPg = require('spiced-pg');
var bcrypt = require('bcryptjs');
var dbUrl;

if (process.env.DATABASE_URL) {
  dbUrl = process.env.DATABASE_URL;
} else {
  var userInfo = require('./secrets.json');
  var user = userInfo.username;
  var pass = userInfo.password;
  dbUrl = `postgres:${user}:${pass}psql@localhost:5432/petition`;
}
var db = spicedPg(dbUrl);

exports.signPetition = function(first, last, signature, userId) {
  return db.query('INSERT INTO signatures (first, last, signature, user_id) VALUES ($1, $2, $3, $4) RETURNING id', [first, last, signature, userId]).then((results) => {
    return results.rows[0].id;
  }).catch((err) => {
    console.log(err);
  });
};

exports.getSigners = function() {
  return db.query('SELECT first, last FROM signatures').then((results) => {
    return results.rows;
  }).catch((err) => {
    console.log(err);
  });
};

exports.getSign = function(userId) {
  return db.query('SELECT signature FROM signatures WHERE user_id =($1)', [userId]).then((results) => {
    return results.rows[0].signature;
  }).catch((err) => {
    console.log(err);
  });
};

exports.hashPassword = function(plainTextPassword) {
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

exports.registerUser = function(first, last, username, hashPass) {
  return db.query('INSERT INTO users (first, last, username, hash_pass) VALUES ($1, $2, $3, $4) RETURNING id', [first, last, username, hashPass]).then((results) => {
    return results.rows[0].id;
  });
};

exports.getHash = function(username) {
  return db.query('SELECT hash_pass FROM users WHERE username =($1)', [username]).then((results) => {
    return results.rows[0].hash_pass;
  }).catch((err) => {
    console.log(err);
  });
};

exports.getUserInp = function(username) {
  return db.query('SELECT first, last, id FROM users WHERE username =($1)', [username]).then((results) => {
    return results.rows[0];
  }).catch((err) => {
    console.log(err);
  });
};

exports.checkForSig = function(username) {
  return db.query('SELECT id FROM signatures WHERE user_id =($1)', [username]).then((results) => {
    return results.rows[0];
  }).catch((err) => {
    console.log(err);
  });
};

exports.addAgeCityUrl = function(age, city, url, userId) {
  db.query('INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4)', [
    age || null,
    city,
    url,
    userId
  ]).then((results) => {
    return results;
  }).catch((err) => {
    console.log(err);
  });
};

exports.getNames = function() {
  return new Promise(function(resolve, reject) {
    return db.query(`SELECT users.first, users.last, users.id, user_profiles.id as user_id,
    user_profiles.age as user_age, user_profiles.city as user_city, user_profiles.url as user_url
    FROM users
    LEFT JOIN user_profiles
    ON users.id = user_profiles.user_id;`).then(function(results) {
      resolve(results.rows);
    }).catch(function(err) {
      reject(err);
    });
  });
};

exports.getCity = function(city) {
  return new Promise(function(resolve, reject) {
    return db.query(`SELECT users.first, users.last, users.id, user_profiles.id as user_id,
    user_profiles.age as user_age, user_profiles.city as user_city, user_profiles.url as user_url
    FROM users
    LEFT JOIN user_profiles
    ON users.id = user_profiles.user_id
    WHERE LOWER(user_profiles.city) = LOWER($1)`, [city]).then(function(results) {
      resolve(results.rows);
    }).catch(function(err) {
      reject(err);
    });
  });
};

exports.getDetails = function(user) {
  return new Promise(function(resolve, reject) {
    return db.query(`SELECT users.first, users.last, users.id, users.username, user_profiles.id AS user_id,
        user_profiles.age AS user_age, user_profiles.city AS user_city, user_profiles.url AS user_url
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE user_profiles.user_id = ($1)`, [user]).then(function(results) {
      resolve(results.rows[0]);
    }).catch(function(err) {
      reject(err);
    });
  });
};

exports.removeSig = function(user) {
  return db.query('DELETE from signatures WHERE user_id = $1', [user]).then((results) => {
    return results.rows[0];
  }).catch((err) => {
    console.log(err);
  });
};

exports.updateDetails = function(first, last, username, user_id, age, city, url) {
  return new Promise(function(resolve, reject) {
    db.query(`
        UPDATE users
        SET first = $1,
        last = $2,
        username = $3
        WHERE users.id = $4`, [first, last, username, user_id]).then(function(results) {
      db.query(`
                UPDATE user_profiles
                SET age = $1,
                city = $2,
                url = $3
                WHERE user_profiles.user_id = $4`, [age, city, url, user_id]).then(function(results) {});

    }).catch(function(err) {
      console.log('there was an error in updateDetails', err);
      reject(err);
    });
  });
};

exports.updatePassword = function(password, userId) {
  return new Promise(function(resolve, reject) {
    bcrypt.genSalt(function(err, salt) {
      if (err) {
        return reject(err);
      }
      bcrypt.hash(password, salt, function(err, hash) {
        if (err) {
          return reject(err);
        }
        resolve(hash);
      });
    });
  }).then(function(hash) {
    return db.query(`
        UPDATE users
        SET hash_pass= $1
        WHERE id = $2`, [hash, userId]);
  });
};
