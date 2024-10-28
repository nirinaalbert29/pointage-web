let express = require('express')
let session = require('express-session')
let bodyParser = require('body-parser')
let cookieParser = require('cookie-parser')
var cors = require('cors')
let MemoryStore = require('memorystore')(session)

let app = express()
let http = require('http').Server(app)
let io = require('socket.io')(http,{
    path:"/api/ws",
    cors:{origin:'*',methods:['GET','POST','PUT','DELETE']}
})

const escape_html = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Configuration CORS détaillée
app.use(cors({
    origin: ['http://localhost:8080', 'http://localhost:8081'], // Ajoutez vos origines frontend
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use((req,res,next)=>{
    req.io = io
    req.escape_html = escape_html
    next()
})

io.on('connection',(socket)=>{
    console.log('Nouvelle connexion socket');
})

app.use('/api',require('./routes/api.route'))

const PORT = 4044;
http.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});