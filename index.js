/**
 * To-do for homework on 28 Jun 2018
 * =================================
 * 1. Create the relevant tables.sql file
 * 2. New routes for user-creation
 * 3. Change the pokemon form to add an input for user id such that the pokemon belongs to the user with that id
 * 4. (FURTHER) Add a drop-down menu of all users on the pokemon form
 * 5. (FURTHER) Add a types table and a pokemon-types table in your database, and create a seed.sql file inserting relevant data for these 2 tables. Note that a pokemon can have many types, and a type can have many pokemons.
 */

const express = require('express');
const methodOverride = require('method-override');
const pg = require('pg');
const sha256 = require('js-sha256');
const cookieParser = require('cookie-parser');

// Initialise postgres client
const config = {
  user: 'delontoh89',
  host: '127.0.0.1',
  database: 'pokemon_users',
  port: 5432,
};

// if (config.user === 'ck') {
// 	throw new Error("====== UPDATE YOUR DATABASE CONFIGURATION =======");
// };

const pool = new pg.Pool(config);

pool.on('error', function (err) {
  console.log('Idle client error', err.message, err.stack);
});

/**
 * ===================================
 * Configurations and set up
 * ===================================
 */

// Init express app
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());

// Set react-views to be the default view engine
const reactEngine = require('express-react-views').createEngine();
app.set('views', __dirname + '/views');
app.set('view engine', 'jsx');
app.engine('jsx', reactEngine);

/**
 * ===================================
 * Route Handler Functions
 * ===================================
 */

 const getRoot = (request, response) => {
  // query database for all pokemon ; respond with HTML page displaying all pokemon
  const queryString = 'SELECT * from pokemon;';

  pool.query(queryString, (err, result) => {
    if (err) {
      console.error('Query error:', err.stack);
    } else {
      console.log('Query result:', result);

      // redirect to home page
      response.render('Home', {pokemon: result.rows} );
    }
  });
};

const getPokemon = (request, response) => {
  let id = request.params['id'];
  const queryString = 'SELECT * FROM pokemon WHERE id = ' + id + ';';
  pool.query(queryString, (err, result) => {
    if (err) {
      console.error('Query error:', err.stack);
    } else {
      console.log('Query result:', result);

      // response with pokemon page
      response.render('Pokemon', {pokemon: result.rows[0]} );
    }
  });
};


const getNew = (request, response) => {
  response.render('New');
};

const postPokemon = (request, response) => {
  let body = request.body;
  let userId = parseInt(request.cookies['user_id']);
  
  const queryString = 'INSERT INTO pokemon(id, num, name, img, height, weight, user_id) VALUES($1, $2, $3, $4, $5, $6, $7);';
  const values = [body.id, body.num, body.name, body.img, body.height, body.weight, userId];

  pool.query(queryString, values, (err, result) => {
    if (err) {
      console.log('query error:', err.stack);
    } else {
      console.log('query result:', result);

      // redirect to home page
      response.redirect('/users/list');
    }
  });
};

const editPokemonForm = (request, response) => {
  let id = request.params['id'];

  const queryString = 'SELECT * FROM pokemon WHERE id = ' + id + ';';
  pool.query(queryString, (err, result) => {
    if (err) {
      console.error('Query error:', err.stack);
    } else {
      console.log('Query result:', result);

      // redirect to home page
      response.render('Edit', {pokemon: result.rows[0]} );
    }
  });
};

const updatePokemon = (request, response) => {
  let id = request.params['id'];
  let body = request.body;

  const queryString = 'UPDATE "pokemon" SET "num"=($1), "name"=($2), "img"=($3), "height"=($4), "weight"=($5) WHERE "id"=($6)';
  const values = [body.num, body.name, body.img, body.height, body.weight, id];
  console.log(queryString);

  pool.query(queryString, values, (err, result) => {
    if (err) {
      console.error('Query error:', err.stack);
    } else {
      console.log('Query result:', result);

      // redirect to home page
      response.redirect('/');
    }
  });
};

const deletePokemonForm = (request, response) => {
  let id  = request.params['id'];

  const queryString = 'SELECT * FROM pokemon WHERE id = ' + id + ';';

  pool.query(queryString, (err, result) => {
    if (err) {
      console.error('Query error:', err.stack);
    } else {
      console.log('Query result:', result);

      response.render('Delete', {pokemon: result.rows[0]} );
    }
  });
};

const deletePokemon = (request, response) => {
  let id = request.params['id'];

  const queryString = 'DELETE FROM pokemon WHERE id = ' + id + ';';

  pool.query(queryString, (err, result) => {
    if (err) {
      console.log('query error:', err.stack);
    } 
    else {
      response.redirect('/');
    }
  });
};



// ** Generate Unique User's Pokemon List **

const getUserList = (request, response) => {

  let userId = parseInt(request.cookies['user_id']);

  const queryString = 'SELECT * FROM pokemon WHERE user_id = $1;';
  const values = [userId];

   pool.query(queryString, values, (err, result) => {
    if (err) {
      console.log('query error:', err.stack);
    } 
    else {
      response.render('user_list', {pokemon: result.rows});
    };
  });
};


// ** Create New Users **

const getUserForm = (request, response) => {
  response.render('Register');
};

const postUser = (request, response) => {
  let body = request.body;
  let password_hash = sha256(body.password);
  let queryString = 'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *';

  const values = [body.email, password_hash];

  pool.query(queryString, values, (err, result) => {
    if(err) {
      response.send('db query error: ' + err.message);
    }
    else {
      let user_id = result.rows[0].id;

      // Tag cookie to logged in user
      response.cookie('logged_in', 'true');
      response.cookie('user_id', user_id);

      /*response.send("Created user with ID: " + user_id);*/
      response.redirect('/users/list');
    }
  });
}


// ** Login and Logout **

const userLogin = (request, response) => {
  response.render('Login');
}

const verifyUser = (request, response) => {
  let body= request.body;
  let queryString = 'SELECT * FROM users WHERE email = $1';

  const values = [body.email];

  pool.query(queryString, values, (err, result) => {
    if(err) {
      response.send('db query error: ' + err.message); // error check for query from db
    }
    else {
      const queryRows = result.rows;
      console.log(queryRows);  // console.log to check

      if(queryRows.length == 0){
        response.send(401);   // error check for email match
      }
      else {
        let db_password = queryRows[0].password_hash;

        let request_password = sha256(body['password'])

        if(db_password === request_password) {

          // Tag cookie to logged in user
          response.cookie('logged_in', 'true');  
          response.cookie('user_id', queryRows[0].id);

          // response.send('Welcome ' + queryRows[0].email);
          response.redirect('/users/list');
        }
        else {
          response.send(401);
        };
      };
    };
  });
};


const userLogout = (request, response) => {
  response.clearCookie('user_id');
  response.clearCookie('logged_in');
  response.send('You are logged out');
};


/**
 * ===================================
 * Routes
 * ===================================
 */


// **Pokemon Routes**
app.get('/', getRoot);
app.get('/pokemon/:id/edit', editPokemonForm);
app.get('/pokemon/new', getNew);
app.get('/pokemon/:id', getPokemon);
app.get('/pokemon/:id/delete', deletePokemonForm);

app.post('/pokemon', postPokemon);

app.put('/pokemon/:id', updatePokemon);

app.delete('/pokemon/:id', deletePokemon);


// ** User Routes **
app.get('/users/new', getUserForm);
app.get('/users/login', userLogin);
app.get('/users/list', getUserList);

app.post('/users/new', postUser);
app.post('/users/login', verifyUser);

app.delete('/users/logout', userLogout);



/**
 * ===================================
 * Listen to requests on port 3000
 * ===================================
 */
const server = app.listen(3000, () => console.log('~~~ Ahoy we go from the port of 3000!!!'));



// Handles CTRL-C shutdown
function shutDown() {
  console.log('Recalling all ships to harbour...');
  server.close(() => {
    console.log('... all ships returned...');
    pool.end(() => {
      console.log('... all loot turned in!');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);


