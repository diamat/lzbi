$(document).ready(function() {	
			function urldel(str) {
				var pos = str.indexOf('>');
				res = str.substring(pos+1, str.length-4);
				return res;
			}
			
			jQuery.fn.dataTableExt.oSort['numeric-url-asc']  = function(av,bv) {
				var a = urldel(av);
				var b = urldel(bv);
				var x = (a=="-" || a==="") ? 0 : a*1;
				var y = (b=="-" || b==="") ? 0 : b*1;
				return x - y;
			};
			 
			jQuery.fn.dataTableExt.oSort['numeric-url-desc'] = function(av,bv) {
				var a = urldel(av);
				var b = urldel(bv);
				var x = (a=="-" || a==="") ? 0 : a*1;
				var y = (b=="-" || b==="") ? 0 : b*1;
				return y - x;
			};
});