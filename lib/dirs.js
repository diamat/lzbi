// Сквозной перебор директории
var fs = require('fs');

exports.subReaddir = function subReaddir(dir, dir_files, direct_name){
	var buff_files = [];
	buff_files = dir_files.files;
	var files = fs.readdirSync(dir);
	files.forEach(function(file){
	var js_str = file.substring(file.length - 3, file.length);
	if(js_str === '.js'){
		if(direct_name === '')
			buff_files.push(file);
		else buff_files.push(direct_name+'/'+file);
		}
		else {
			dir_files.files = buff_files;
			subReaddir (dir+'/'+file, dir_files, file);
		}
	});
	var obj_f = new Object();
	obj_f.files = buff_files
	return obj_f;	
}