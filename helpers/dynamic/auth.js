var express = require('express');

module.exports = {
	
    message_login_param: function(req){
	  if (req.session.success) return 'success';
	  else return 'error';
	},	
	
	message_login: function(req){
	  var err = req.session.error;
 	  var msg = req.session.success;
	  delete req.session.error;
	  delete req.session.success;
	  if (err) return err;
	  if (msg) return msg;
	}
	
};