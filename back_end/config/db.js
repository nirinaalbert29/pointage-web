require('dotenv').config(); // Ajoutez cette ligne au début
const mysql = require('mysql');

const connection = mysql.createConnection({
  host     : 'localhost',
  user     : (process.env.NODE_ENV == 'production')?'root':'root',
  password : (process.env.NODE_ENV == 'production')?'':'',
  database : (process.env.NODE_ENV == 'production')?'memory_base':'memory_base',
  multipleStatements: true
});

connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion:', err);
    return;
  }
  console.log('Connecté à MySQL');
});

module.exports = connection;