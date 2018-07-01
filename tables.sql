-- create Pokemon table in database
DROP TABLE IF EXISTS pokemon;

CREATE TABLE IF NOT EXISTS pokemon (
  id SERIAL PRIMARY KEY,
  num varchar(255),
  name varchar(255),
  img varchar(255),
  weight varchar(255),
  height varchar(255),
  user_id INTEGER
);
