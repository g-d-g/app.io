
module.exports = function(app) {

    var _log = app.system.logger;
    var _env = app.get('env');

    try {
        return true;

        var target = ['local', 's3', 'cloudinary'];
        var conf   = app.config[_env].app.config.upload;

        if( ! conf ) {
            _log.info('upload conf not found');
            return;
        }

        var type = conf.type;

        if( target.indexOf(type) == -1) {
            _log.info('upload type not found');
            return;
        }

        process.env['DEFAULT_SOURCE']     = type;
        process.env['CACHE_DEV_REQUESTS'] = true;

        if(type == 'local')
            process.env['LOCAL_FILE_PATH'] = app.get('basedir')+'/public';

        if(type == 's3') {
            process.env['AWS_ACCESS_KEY_ID']     = conf.account.key;
            process.env['AWS_SECRET_ACCESS_KEY'] = conf.account.secret;
            process.env['S3_BUCKET']             = conf.bucket;
        }

        var ir      = require('image-resizer');
        var env     = ir.env;
        var Img     = ir.img;
        var streams = ir.streams;

        function forwards(req, res, next) {
            if(req.url.substr(0, 3) == '/i/')
                req.url = req.url.substr(2);

            next('route');
        }

        app.get('*', forwards);
        app.get('/*?', function(req, res, next) {
            var image = new Img(req);

            image.getFile()
                .pipe(new streams.identify())
                .pipe(new streams.resize())
                .pipe(new streams.filter())
                .pipe(new streams.optimize())
                .pipe(streams.response(req, res));
        });

        return true;
    }
    catch(e) {
        _log.error(e.stack);
        return false;
    }

};



