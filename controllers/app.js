var controllerAdmin = require('./admin');
var controllerManager = require('./manager');
var controllerBigBoss = require('./bigboss');
var controllerBuhManager = require('./buhmanager');
var controllerBuff;
var multipart = require('multipart');
var sys = require('sys');
var http = require('http');

module.exports = {
 
  index: function(req, res){
	controllerBuff = roleController(req.session.user.role);
	controllerBuff.index(req, res);
  },
  
  menu: function(req, res){
	controllerBuff = roleController(req.session.user.role);
	controllerBuff.menu(req, res);
  },
  
  id: function(req, res){
	req = checkID(req);
	controllerBuff = roleController(req.session.user.role);
	controllerBuff.id(req, res);
  },
  
  edit: function(req, res){
	req = checkID(req);
	controllerBuff = roleController(req.session.user.role);
	controllerBuff.edit(req, res);
  },
  
   upload: function(req, res){
	controllerBuff = roleController(req.session.user.role);
	controllerBuff.upload(req, res);
  },
	
  print: function(req, res){
	req = checkID(req);
	controllerBuff = roleController(req.session.user.role);
	controllerBuff.print(req, res);
	},
	
  date: function(req, res){
	req =  checkDate(req);
	req =  checkID (req);
	controllerBuff = roleController(req.session.user.role);
	controllerBuff.date(req, res);
	}
  
};

function checkID (req){
		req.params.id = parseInt(req.params.id, 10);
		if(isNaN(req.params.id) === true) req.params.id = '0';
		if(req.params.id2){
			req.params.id2 = parseInt(req.params.id2, 10);
			if(isNaN(req.params.id2) === true) req.params.id2 = '0';
		}
		return (req);
	}
	
function checkDate (req){
		req.params.date1 = parseInt(req.params.date1, 10);
		req.params.date2 = parseInt(req.params.date2, 10);
		if(isNaN(req.params.date1) === true) req.params.date1 = '0';
		if(isNaN(req.params.date2) === true) req.params.date2 = '0';
		return (req);
	}

function roleController (role){
	var controllerName;
	switch(role) {
	case 'admin': 
		controllerName = controllerAdmin;
		break;
	case 'manager': 
		controllerName = controllerManager;
		break;
	case 'bigboss': 
		controllerName = controllerBigBoss;
		break;
	case 'buhmanager': 
		controllerName = controllerBuhManager;
	}
	return (controllerName);
}