var sessionsave = require('../lib/sessionsave');
// Routers setting

function Restrict (req, res, next) {
  if (req.session.user) {
	var user = {};
	user.hash = req.session.user.hash;
	user.username = req.session.user.username;
	user.lastaccess = req.session.lastAccess;
	var newsocketio = new sessionsave();
	newsocketio.SessionSave(user);
	newsocketio.on('SessionSave_Ok', function(){ next();});
	newsocketio.on('SessionSaveError_Ok', function() { res.render ('error/500.html');});
  } else {
    req.session.error = 'Отказ в доступе.';
    res.redirect('/login');
  }
}


exports.scriptRouting = function scriptRouting (app, prefix, action , script , fn){
switch(script){
	  case 'standart':
			switch(action) {
			  case 'index':
				app.get(prefix, Restrict, fn);
				break;
			  case 'menu':
				app.get(prefix + '/:menu', Restrict, fn);
				break;
			  case 'id':
				app.get(prefix + '/:menu/view/:form/:id', Restrict, fn);
				break;
			  case 'edit':
				app.get(prefix + '/:menu/edit/:form/:id', Restrict,  fn);
				break;
			  /*case 'menu':
				app.get(prefix + '/:menu', Restrict, fn);
				break;
			  case 'edit':
				app.get(prefix + '/:id/edit', fn);
				break;
			  case 'update':
				app.put(prefix + '/:id', fn);
				break;
			  case 'destroy':
				app.del(prefix + '/:id', fn);
				break;*/
			};
		break;
	  case 'login':
		    switch(action) {
			  case 'index':
				app.get(prefix, fn);
				break;
			  case 'login':
				app.post(prefix, fn);
				break;
			  case 'logout':
				app.get(prefix+ '/logout', fn);
				break;
			};
		break;
	}
}