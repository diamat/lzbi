//my_sys.js
var crypto = require('crypto');
var sanitize = require('validator').sanitize;
var sprav = require('./sprav');

exports.dateSave = function  () {
	var date_update = new Date();
	return(date_update.valueOf());
}

exports.dateNorm = function  (str) {
	var month = str.substring(3,5);
	month = parseInt(month, 10);
	month = month-1;
	var date_update = new Date(str.substring(6,10), month, str.substring(0,2));
	return(date_update.valueOf());
}

exports.formatDateMonth = function  (time) {
	var date_update = new Date(parseInt(time, 10));
	var Year = date_update.getFullYear();
	var Month = date_update.getMonth()+1;
	var date = date_update.getDate();
	var MonthStr;
	switch(Month){
		case 1: MonthStr = 'января'; break;
		case 2: MonthStr = 'февраля'; break;
		case 3: MonthStr = 'марта'; break;
		case 4: MonthStr = 'апреля'; break;
		case 5: MonthStr = 'мая'; break;
		case 6: MonthStr = 'июня'; break;
		case 7: MonthStr = 'июля'; break;
		case 8: MonthStr = 'августа'; break;
		case 9: MonthStr = 'сентября'; break;
		case 10: MonthStr = 'октября'; break;
		case 11: MonthStr = 'ноября'; break;
		case 12: MonthStr = 'декабря'; break;
		}
	if(date<10) date = '0'+date;
	var format_date = date+' '+MonthStr+' '+Year+' г.';
	return(format_date);
}

exports.formatTime = function (time) {
	var date_update = new Date(parseInt(time, 10));
	var hours = date_update.getHours();
	var minutes = date_update.getMinutes();
	var seconds = date_update.getSeconds();
	if(hours<10) hours = '0'+hours;
	if(minutes<10) minutes = '0'+minutes;
	if(seconds<10) seconds = '0'+seconds;
	var format_date = hours+':'+minutes+':'+seconds;
	return(format_date);
}

exports.formatDate = function (time) {
	var date_update = new Date(parseInt(time, 10));
	var Year = date_update.getFullYear();
	var Month = date_update.getMonth()+1;
	var date = date_update.getDate();
	if(Month<10) Month = '0'+Month;
	if(date<10) date = '0'+date;
	var format_date = date+'.'+Month+'.'+Year;
	return(format_date);
}

exports.sortFunct = function (arr, name) {
	var buffarr = [];
	var buffarr2 = [];
	for(var i=0;i<arr.length;i++)
	buffarr.push(arr[i][name]);
	buffarr = buffarr.sort();
	for(var i=0;i < buffarr.length;i++)
	for(var v=0;v < arr.length;v++)
	if(arr[v][name] === buffarr[i]) {buffarr2.push(arr[v]);break;}
	return(buffarr2);
}
/*
exports.formatCustomerName = function (str) {
	var flag = 0
	for (var i = 0; i<sprav.formaSob.length;i++){
		console.log(str.indexOf('ООО'));
		if(str.indexOf(sprav.formaSob[i]) + 1 > 0){
			flag = 1;
			console.log('Нашёл форму собственности - '+sprav.formaSob[i]); break;
		}
	}
	if(flag === 1) console.log('нашёл');
	else console.log('не нашёл');
	
}*/
/*
exports.addsLashes = function (str) {
	return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

function AddsLashes (str) {
	return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}*/

function replaceQM (str) {
	return (str + '').replace(/[\']/g, '\"');
}

exports.replaceOOO  = function (str) {
	str = (str + '').replace(/ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ/, '');
	str = str.replace('ООО', '');
	str = str.replace(/&quot;/g, '');
	str = str.replace('ЗАО', '');
	return (str);
}

exports.replaceQM = function (str) {
	return (str + '').replace(/[\']/g, '\"');
}

exports.getHash = function (msg, key) {
	return crypto.createHmac('sha256', key).update(msg).digest('hex');
};

exports.strSanitize = function (str) {
	str = replaceQM(str); 
	str = sanitize(str).entityEncode(); 
	str = sanitize(str).xss();
	return str;
};

exports.returnObj = function (data) {
	var obj = new Object();
	for(var i=0;i<data.length;i++){
		if(data[i].value){
				data[i].value = replaceQM(data[i].value); 
				data[i].value = sanitize(data[i].value).entityEncode(); 
				data[i].value = sanitize(data[i].value).xss();
				obj[data[i].name] = data[i].value;
			}			
		}
	console.log(obj);
	return obj;
};

exports.returnNull = function (data) {
	for(var key in data){
		if(data[key] === null) data[key] = '';	
		}
	return data;
};

exports.trim = function (str, charlist) {	
    charlist = !charlist ? ' \\s\xA0' : charlist.replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '\$1');
    var re = new RegExp('^[' + charlist + ']+|[' + charlist + ']+$', 'g');
    return str.replace(re, '');
}


exports.StrToFl = function (_number,_decimal,_separator)
// сокращение переводится как Float To String
// sd_ - понятно и так почему :) 
// _number - число любое, целое или дробное не важно
// _decimal - число знаков после запятой
// _separator - разделитель разрядов
{
// определяем, количество знаков после точки, по умолчанию выставляется 2 знака
var decimal=(typeof(_decimal)!='undefined')?_decimal:2;

// определяем, какой будет сепаратор [он же разделитель] между разрядами
var separator=(typeof(_separator)!='undefined')?_separator:'';

// преобразовываем входящий параметр к дробному числу, на всяк случай, если вдруг
// входящий параметр будет не корректным
var r=parseFloat(_number)

// так как в javascript нет функции для фиксации дробной части после точки
// то выполняем своеобразный fix
var exp10=Math.pow(10,decimal);// приводим к правильному множителю
r=Math.round(r*exp10)/exp10;// округляем до необходимого числа знаков после запятой

// преобразуем к строгому, фиксированному формату, так как в случае вывода целого числа
// нули отбрасываются не корректно, то есть целое число должно 
// отображаться 1.00, а не 1
rr=Number(r).toFixed(decimal).toString().split('.');

// разделяем разряды в больших числах, если это необходимо
// то есть, 1000 превращаем 1 000
b=rr[0].replace(/(\d{1,3}(?=(\d{3})+(?:\.\d|\b)))/g,"\$1"+separator);
r=b+'.'+rr[1];

return r;// возвращаем результат
}

exports.strToIn = function(_number,_separator)
{
// определяем, какой будет сепаратор [он же разделитель] между разрядами
var separator=(typeof(_separator)!='undefined')?_separator:'';

var b = parseInt(_number);

var bb = b.toString();

var r = bb.replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, "\$1"+separator);

return r;// возвращаем результат
}

// Перевод цифр в строки
function wIMV(ar,v) { for(var i=0;i<ar.length;i++) if(ar[i]>=v) return i; return i-1;}

exports.wDigitsInWords = function (dgt)
{
	var a	="надцать;";var b="надцать";var c="ьдесят;";
	var a1		="ноль;один;два;три;четыре;пять;шесть;семь;восемь;девять".split(";");
	var a10		=("один"+a+"две"+a+"три"+a+"четыр"+a+"пят"+a+"шест"+a+"сем"+a+"восем"+a+"девят"+b).split(";");
	var a11		=("десять;двадцать;тридцать;сорок;пят"+c+"шест"+c+"сем"+c+"восем"+c+"девяносто").split(";");
	var a100		="сто;двести;триста;четыреста;пятьсот;шестьсот;семьсот;восемьсот;девятьсот".split(";");
	var aT		="тысяча;тысячи;тысяч".split(";");
	var iT		= new Array(1,4,5);
	var aM		="миллион;миллиона;миллионов".split(";");
	var iM		= new Array(1,4,5);
	var aB		="миллиард;миллиарда;миллиардов".split(";");
	var iB		= new Array(1,4,5);
	var aQ		="триллион;триллиона;триллионов".split(";");
	var iQ		= new Array(1,4,5);
	var str=dgt.toString().split(".")[0];var res="";var z=str.length;var j=0;var i1=0;var i2=0;var i3=0;var i4=0;var nxt="";var rst="";s=" ";
	if(z==0) return "ноль";
	for(var i=0;i<z;i=i+3)
	{
		nxt=((z<i+3)?"":str.charAt(z-i-3))+((z<i+2)?"":str.charAt(z-i-2))+((z<i+1)?"ошибка":str.charAt(z-i-1));
		j=nxt.length;
		if(j==1) { rst=a1[parseInt(nxt)];i4=parseInt(nxt); } else
		{	
			i2=parseInt(nxt.charAt(j-2));i1=parseInt(nxt.charAt(j-1));
			if(i2==	0) if(i1!=		0) rst=a1[i1];
			if(i2==	1) if(i1==	0) rst=a11[i2-1];else rst=a10[i1-1];
			if(i2>		1){if(i1==	0) rst=a11[i2-1];else rst=a11[i2-1]+s+a1[i1];}
			if(j>2)
			{
				i3=parseInt(nxt.charAt(j-3));
				if(i3!=0) rst=a100[i3-1]+s+rst;
			}
			if(i2==1 && i1!=0) i4=parseInt(i2.toString()+i1.toString());else i4=i1;
		}
		res=	rst+s+	((i==12	)?aQ	[wIMV(iQ	,i4)]:
							((i==9	)?aB	[wIMV(iB	,i4)]:
							((i==6	)?aM	[wIMV(iM	,i4)]:
							((i==3	)?aT	[wIMV(iT	,i4)]:""))))+((i<3)?"":s)+res;
	}
	//**********
	a1=res.split("один тысяча");
	if(a1.length==2) res=a1[0]+"одна тысяча"+a1[1];
	//**********
	return res;
}
