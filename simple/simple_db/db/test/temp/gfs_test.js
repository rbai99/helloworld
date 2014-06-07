var mongoose = require('mongoose');
var Grid = require('gridfs-stream');
var fs = require('fs');
Grid.mongo = mongoose.mongo;

var conn = mongoose.createConnection('mongodb://localhost/test');
conn.once('open', function () {
	console.log('conn open');
	var gfs = Grid(conn.db);

	// streaming to gridfs
	var writestream = gfs.createWriteStream({
	    filename: 'my_file.txt'
	});
	fs.createReadStream('/home/xfxu/Video/a.rar').pipe(writestream);
	
	writestream.on('close', function (file) {
		console.log(file.filename);
	});

/*
	// streaming from gridfs
	var readstream = gfs.createReadStream({
	  filename: 'my_file.txt'
	});

	//error handling, e.g. file does not exist
	readstream.on('error', function (err) {
	  console.log('An error occurred!', err);
	  throw err;
	});

	var response = fs.createWriteStream('/home/xfxu/Video/b.rar');

	response.on('close', function(err) {
		console.log('end');
	});

	readstream.pipe(response);
*/
  // all set!
})
