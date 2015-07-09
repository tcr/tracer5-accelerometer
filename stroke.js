function offset(o, dx, dy, width) {
	return [o[0] - dx*width, o[1] + dy*width]
}

function stroke (a, b, width) {
	a = a.slice()
	b = b.slice()

	// console.log(a, b);
	var dx = (b[1] - a[1])
	var dy = (b[0] - a[0])
	var len = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2))
	dx /= len;
	dy /= len;

	a[0] -= dy/2*width;
	a[1] -= dx/2*width;
	b[0] += dy/2*width;
	b[1] += dx/2*width;

	var A = offset(a, dx, dy, width);
	var B = offset(a, dx, dy, -width);
	var C = offset(b, dx, dy, -width);
	var D = offset(b, dx, dy, width);

	return [A, B, C, D];

	// console.log(
	// 	'M', A.join(' '),
	// 	'L', B.join(' '),
	// 	'L', C.join(' '),
	// 	'L', D.join(' '),
	// 	'L', A.join(' '));
}

// var a = [2,2];
// var b = [5,0];
// console.log('<svg xmlns="http://www.w3.org/2000/svg" version="1.1" height="1000" width="1000"  viewBox="0 0 10 10">')
// console.log('<path d="')
// stroke(a, b);
// console.log('" />')
// console.log('<path d="M ' + a.join(' ') + ' L' + b.join(' ') + '" strokeWidth=".5" stroke="red" />')
// console.log('</svg>')

module.exports = stroke;
