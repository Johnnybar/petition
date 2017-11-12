DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS users;

CREATE TABLE signatures(
    id SERIAL PRIMARY KEY,
    first VARCHAR(300) NOT NULL,
    last VARCHAR(300) NOT NULL,
    signature text NOT NULL,
    user_id INTEGER
);


CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    first VARCHAR(300) NOT NULL,
    last VARCHAR(300) NOT NULL,
    username VARCHAR(300) NOT NULL,
    hash_pass text NOT NULL,
    UNIQUE(username)
);
