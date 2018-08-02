module.exports = function(app, passport, webdir, gfs) {
  let serverParams = {
    threshold: 20000,
    borderColor: 'white',
    borderX: 70,
    borderY: 50
  }

  var stream = require('stream');
  var util = require('util');

  // normal routes ===============================================================
  //    app.use(express.static(webdir));
  var fs = require('fs')
  var gm = gm = require('gm').subClass({
    imageMagick: true
  });
  var stream = require('stream');
  var util = require('util');

  function BufferStream(source) {

    if (!Buffer.isBuffer(source)) {

      throw (new Error("Source must be a buffer."));

    }

    // Super constructor.
    stream.Readable.call(this);

    this._source = source;

    // I keep track of which portion of the source buffer is currently being pushed
    // onto the internal stream buffer during read actions.
    this._offset = 0;
    this._length = source.length;

    // When the stream has ended, try to clean up the memory references.
    this.on("end", this._destroy);

  }

  util.inherits(BufferStream, stream.Readable);


  // I attempt to clean up variable references once the stream has been ended.
  // --
  // NOTE: I am not sure this is necessary. But, I'm trying to be more cognizant of memory
  // usage since my Node.js apps will (eventually) never restart.
  BufferStream.prototype._destroy = function() {

    this._source = null;
    this._offset = null;
    this._length = null;

  };


  // I read chunks from the source buffer into the underlying stream buffer.
  // --
  // NOTE: We can assume the size value will always be available since we are not
  // altering the readable state options when initializing the Readable stream.
  BufferStream.prototype._read = function(size) {

    // If we haven't reached the end of the source buffer, push the next chunk onto
    // the internal stream buffer.
    if (this._offset < this._length) {

      this.push(this._source.slice(this._offset, (this._offset + size)));

      this._offset += size;

    }

    // If we've consumed the entire source buffer, close the readable stream.
    if (this._offset >= this._length) {

      this.push(null);

    }

  };


  app.get('/listImages', function(req, res) {
    gfs.files.find({
      'metadata.boxe': true
    }).toArray(function(err, files) {
      res.send(files);
    })
  });


  app.get('/file/:id', function(req, res) {

    gfs.findOne({
      _id: req.params.id
    }, function(err, file) {
      if (!file) {
        res.send({
          success: false
        });
        return;
      }

      var readstream = gfs.createReadStream({
        _id: req.params.id
      });
      res.set('Content-Type', file.contentType);
      res.set('Content-Length', file.length);

      req.on('error', function(err) {
        res.send(500, err);
      });
      readstream.on('error', function(err) {
        res.send(500, err);
      });
      readstream.pipe(res);
    })
  });


  app.post('/image', function(req, res) {
    if (req.body.serverParams) {
       serverParams = JSON.parse(req.body.serverParams)
    }
    console.log(serverParams)
    var file = req.files.file
    var ws = gfs.createWriteStream({
      filename: file.name,
      mode: 'w',
      content_type: file.mimetype,
    });
    ws.write(file.data);
    ws.end()
    ws.on('close', function(originalImage) {
      var readStream = new BufferStream(file.data);

      gm(readStream)
        .gravity('Center')
        .threshold(serverParams.threshold)
        .trim()
        .borderColor(serverParams.borderColor)
        .border(serverParams.borderX, serverParams.borderY)
        .stream('png', function(err, stdout, stderr) {
          var metadata = {
            'original': originalImage._id,
            'boxe': true
          }
          var writestream = gfs.createWriteStream({
            mode: 'w',
            content_type: 'image/png',
            metadata: metadata,
          });
          stdout.pipe(writestream);

          writestream.on('close', function(newFile) {
            res.send({
              success: true,
              original: originalImage._id,
              operation: 'CREATE',
              id: newFile._id,
            });


          });

        });

    })



  })

  app.delete('/file/:id', function(req, res) {
    var options = {
      _id: req.params.id
    };

    gfs.findOne(options, function(err, found) {
      if (found) {
        gfs.remove(options, function(err) {
          if (err) {
            res.send({
              success: false
            });
          } else {
            res.send({
              success: true,
              resource: found.metadata,
              operation: 'DELETE'
            });

          }

        });


      }
    });


  });









  // =============================================================================
  // AUTHORIZE (ALREADY LOGGED IN)
  // =============================================================================



};
