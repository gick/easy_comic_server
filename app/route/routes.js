module.exports = function(app, passport, webdir, gfs) {
    var stream = require('stream');
    var util = require('util');

    // normal routes ===============================================================
    var express = require('express');
    var User = require('../models/user');
    app.use(express.static(webdir));
    var fs = require('fs')
    var gm = gm = require('gm').subClass({ imageMagick: true });
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
            'metadata.boxe':true
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
                .threshold(20000)
                .trim()
                .borderColor('white')
                .border(50, 50)
                .stream('png', function(err, stdout, stderr) {
                    var metadata = { 'original': originalImage._id,'boxe':true }
                    var writestream = gfs.createWriteStream({
                        mode: 'w',
                        content_type: 'image/png',
                        metadata: metadata,
                    });
                    stdout.pipe(writestream);

                    writestream.on('close', function(newFile) {
                        console.log('sending back')
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

    app.get('/export',function(req,res){
        
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
                        res.send({ success: true, resource: found.metadata, operation: 'DELETE' });

                    }

                });


            }
        });


    });


    // PROFILE SECTION =========================
    // it is a way to know if user is currently authenticated (after reload for example)
    app.get('/profile', function(req, res) {
        if (req.isAuthenticated()) {
            res.json({ success: true, user: req.user })
        } else {
            res.json({ success: false })
        }
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // =============================================================================
    // AUTHENTICATE 
    // =============================================================================

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile', // if authentification succeeds, /profile will return user info
        failureRedirect: '/profile', // if authentification fails, /profile will return {success:false}
        failureFlash: true // allow flash messages
    }));



    // SIGNUP =================================
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/profile', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));




    app.get('/listUser', function(req, res) {
        User.find({}, function(err, doc) {
            res.set({ 'Content-Type': 'application/json; charset=utf-8' })
            res.send(JSON.stringify(doc, undefined, 5))
        })

    });

    // =============================================================================
    // AUTHORIZE (ALREADY LOGGED IN)
    // =============================================================================

    app.post('/connect/local', passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/connect/local', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));


};



function convertAndSave(file, req, res) {

}















// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}