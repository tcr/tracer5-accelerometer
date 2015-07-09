var fs = require('fs')
var gerberToSvg = require('gerber-to-svg');
var stroke = require('./stroke')
var _ = require('underscore')

var gerberString = fs.readFileSync(__dirname + '/../accel-mma84/render/accel-mma84-F_Cu.gbr', 'utf-8')

var svgObj = gerberToSvg(gerberString, { object: true } )

var paths = (svgObj.svg._[1].g._.filter(function (a) {
	return 'path' in a
}))

var newpaths = []

var regions = paths.map(function (p) {
	var q = null;
	for (var i = 0; i < p.path.d.length; i++) {
		if (p.path.d[i] == 'M') {
			if (q) {
				newpaths.push(q);
			}
			q = JSON.parse(JSON.stringify(p));
			q.path.d = ['M'];
		} else {
			q.path.d.push(p.path.d[i]);
		}
	}
	if (q) {
		newpaths.push(q);
	}
	return p;
})

var vertices = []
var regions = [];

var polygons = [];

var clipper = require('clipper')

svgObj.svg._[1].g._ = [].concat(newpaths, svgObj.svg._[1].g._.filter(function (a) {
	return !('path' in a)
}).map(function (u) {
	u.use.fill = 'rgba(0, 0, 0, 0.5)'
	return u;
}));

newpaths.filter(function (p) {
	var poly = stroke([p.path.d[1], p.path.d[2]], [p.path.d[4], p.path.d[5]], p.path['stroke-width'] / 2)
	
	regions.push([[vertices.length, vertices.length+1, vertices.length+2, vertices.length+3]])
	vertices = vertices.concat(poly);

	polygons.push(_.flatten(poly))

	// p.path.d = 'M ' + poly[0].join(' ') + ' ' +
	// 	'L ' + poly[1].join(' ') + ' ' +
	// 	'L ' + poly[2].join(' ') + ' ' +
	// 	'L ' + poly[3].join(' ') + ' ';
	// 	'L ' + poly[0].join(' ') + ' ';

	// delete p.path['stroke-width'];
	// p.path.fill = 'green'

	p.path['stroke'] = 'red';

	return p;
})

var pir = require('point-in-region');
var classifyPoint = pir(vertices, regions)

svgObj.svg.width = '100%'
svgObj.svg.height = '100%'

function spread (res, l) {
	function alive (p) {
		p.path['stroke'] = 'green'
		p.path['data-title'] = l.name + ' / ' + l.net;
	}
	alive(newpaths[res]);

	polygons.forEach(function (polymatch, i) {
		var clip = clipper.begin();
		clip.setFillTypes(clipper.PolyFillType.POSITIVE, clipper.PolyFillType.POSITIVE);
		clip.addSubjectPath(polygons[res], true);
		clip.addClipPath(polymatch);
		var output = clip.intersection()[0];
		if (output.length) {
			// console.log('reviving', output);
			if (newpaths[i].path.stroke != 'green') {
				alive(newpaths[i])
				spread(i, l);
			}
		}
	})

}

var d356 = fs.readFileSync(__dirname + '/../accel-mma84/accel-mma84.d356', 'utf-8')
d356.split(/\n/).filter(function (l) {
	return l[0] == '3';
}).map(function (l) {
// 327SDA              IC1   -3          A01X+053667Y-039174X0417Y0256R000S2
	return {
		net: l.slice(3, 20).replace(/\s+$/, ''),
		name: l.slice(20, 26).replace(/\s+$/, ''),
		x: parseInt(l.slice(42, 42 + 7))*2.54,
		y: parseInt(l.slice(50, 50 + 7))*2.54,
		full: l,
	}
}).filter(function (l) {
	var res = classifyPoint([l.x, l.y])
	if (res != -1) {
		spread(res, l);

		// fix each point
		// [
		// 	[newpaths[res].path.d[1], newpaths[res].path.d[2]],
		// 	[newpaths[res].path.d[4], newpaths[res].path.d[5]]
		// ].forEach(function (v) {
		// 	var o = -1;
		// 	var r2 = regions.slice();
		// 	do {
		// 		var classif = pir(vertices, r2)
		// 		o = classif(v);
		// 		if (o != -1) {
		// 			console.log('revived');
		// 			alive(newpaths[o])
		// 			r2[o] = [[0]]
		// 		}
		// 	} while (o != -1);
		// 	console.log('done');
		// })
	} else {
		// console.log(l)
	}
})

// console.log(vertices)
// console.log(classifyPoint([135882.5, -105000]))

var builder = require('gerber-to-svg/lib/obj-to-xml');

var out = builder(svgObj, {
	pretty: true
})

fs.writeFileSync(__dirname + '/f_cu.svg', out, 'utf-8');
