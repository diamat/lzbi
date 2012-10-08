var sessionsave = require('../lib/sessionsave');
var routes = require('../controllers/app');
var controllerLogin = require('../controllers/login');
// Routers setting

function Restrict (req, res, next) {
  if (req.session.user) {
	var user = {};
	user.hash = req.session.user.hash;
	user.username = req.session.user.username;
	req.session.lastAccess = Date.now ();
	user.lastaccess = req.session.lastAccess;
	var newsocketio = new sessionsave();
	newsocketio.sessionSave(user);
	newsocketio.on('SessionSave_Ok', function(){ next();});
	newsocketio.on('SessionSaveError_Ok', function() { res.render ('error/500.html');});
  } else {
    req.session.error = 'Отказ в доступе.';
    res.redirect('/login');
  }
}


exports.bootRouters = function (app) {
	//Login
	app.post('/login', controllerLogin.login);
	app.get('/login',  controllerLogin.index);
	app.get('/login/logout', controllerLogin.logout);
	
	//Остальное
	app.post('/:menu/upload', Restrict, routes.upload);
	//app.post('/:menu/period/:form/:date1/:date1', Restrict, routes.period);
	app.get('/', Restrict, routes.index);
	app.get('/:menu', Restrict, routes.menu);
	app.get('/:menu/view/:form/:id', Restrict, routes.id);
	app.get('/:menu/new/:form/:id/:id2', Restrict, routes.id);
	app.get('/:menu/edit/:form/:id', Restrict, routes.edit);
	app.get('/:menu/print/:form/:id', Restrict, routes.print);
	app.get('/:menu/date/:form/:date1/:date2/:id', Restrict, routes.date);
}