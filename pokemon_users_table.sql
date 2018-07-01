CREATE TABLE IF NOT EXISTS users_pokemon (
	id SERIAL PRIMARY KEY,
	pokemon_id INTEGER,
	user_id INTEGER
);