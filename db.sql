DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS user_profiles;

CREATE TABLE signatures(
    id SERIAL PRIMARY KEY,
    first VARCHAR(300) NOT NULL,
    last VARCHAR(300) NOT NULL,
    user_id INTEGER,
    signature text NOT NULL
);


CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    first VARCHAR(300) NOT NULL,
    last VARCHAR(300) NOT NULL,
    username VARCHAR(300) NOT NULL,
    hash_pass text NOT NULL,
    UNIQUE(username)
);


CREATE TABLE user_profiles(
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    age INTEGER,
    city VARCHAR(200),
    url text
);
