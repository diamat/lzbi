// пользовательские библиотеки валидации

// validNumber валидация целочисленных значений
// str - проверяемое выражение
// length - длина числового выражения
// flag - условия сравнения:
// 		0 или отсутствие flag'а – строгое равенство с длиной строки;
//		иное – допустимо значение меньше заданной длины строки.
exports.validNumber = function (str, length, flag) {
	var result = {
		err: false, 
		msg: 'Ошибка валидации.'
	};
	
	var reg = new RegExp('[^0-9]', 'i');
	
	if(str && length) {
		if(flag){
			if(str.length != length){
				result.err = true;
				return result;
			}
		}
		else {
			if(str.length > length){
				result.err = true;
				return result;
			}
		}
	}
	
	if (str) {
		var myArray = reg.exec(str);
		if (myArray != null) result.err = true;
		}
	else result.err = true;
	return result;
}