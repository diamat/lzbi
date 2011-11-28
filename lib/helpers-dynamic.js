var path = require('path');
var path_dirname = path.dirname(__dirname); 
var dir = require('./dirs');

var express = require('express');

var obj_helper = new Object();
var buf_helper = new Object();
 
exports.bootDynamicHelpers = function (app) {
  var full_files = new Object();
  full_files.files = [];
  var v = dir.subReaddir (path_dirname + '/helpers/dynamic/', full_files,'');
  v.files.forEach(function(file){
      bootHelper(app, file);
    });
}
 
function bootHelper(app, file) {
  
	var name = file.replace('.js', '');
	path.exists(path_dirname + '/helpers/dynamic/' + file, function (exists) {
		if(exists == true){
		
		 var actions = require('../helpers/dynamic/' + name);
		
			var obj_name = Object.keys(actions);
			var buff_obj_name = Object.keys(obj_helper);
			
			for (var i=0; i < obj_name.length; i++){
				for (var z=0; z < buff_obj_name.length; z++)
				if(obj_name[i] === buff_obj_name[z])
				console.log('Error: double helper - ' + obj_name[i] + ' in /helpers/dynamyc/'+file + ' and /helpers/dynamic/'+buf_helper[obj_name[i]]);
			    obj_helper[obj_name[i]]=actions[obj_name[i]];
				buf_helper[obj_name[i]]=file;
				
			}
		app.dynamicHelpers(obj_helper);
		}
	});
}
 