var spawn       = require('child_process').spawn;
var async       = require('async');
var http        = require('http'); 
var url         = require('url') ;
//var querystring = require('querystring');
module.exports  = OfficeToPDF;

function OfficeToPDF (appConfig) {
    this.officeToPDF = appConfig.officeToPDF;
    this.wget = appConfig.wget;
    this.publicPath = appConfig.publicPath;
    this.tmpPath = appConfig.tmpPath;
}

OfficeToPDF.prototype.run = function (config, progress, myCallback) {
    var that = this;
    if (!config.srcFile) {
        myCallback('no srcFile');
        return;
    }
    var fileName = config.uuid;
    var fileExt  = '.' + config.srcFile.split('.').pop();
    var log = '';
    async.waterfall([
        //wget
        function(callback) {
            log += '========= wget start =========\n';
            var output = that.tmpPath + '/' + fileName + fileExt;

            wget = spawn(that.wget, ['--no-check-certificate', config.srcFile ,'-O', output]);
            
            // wget.stdout.on('data', function (data) {
            //     console.log('wget stdout: ' + data);
            // });

            wget.stderr.on('data', function (data) {                
                log += data;
            });

            wget.on('close', function (code) {
                log += '\n\n========= wget end =========\n';
                if (code !== 0) {
                    callback('wget error code: ' + code);
                    return;
                } 
                progress.set(30, function(){
                    callback(null);
                });                
            });
        },
        //office to pdf
        function(callback) {
            log += '========= officeToPDF start =========\n';
            var src = that.tmpPath + '/' + fileName + fileExt;
            var output = that.publicPath + '/' + fileName + '.pdf';

            officeToPDF = spawn(that.officeToPDF, [src, output]);
            
            // officeToPDF.stdout.on('data', function (data) {
            //     console.log('officeToPDF stdout: ' + data);
            // });

            officeToPDF.stderr.on('data', function (data) {                
                log += data;
            });

            officeToPDF.on('close', function (code) {
                log += '\n\n========= officeToPDF end =========\n';
                if (code !== 0) {
                    callback('officeToPDF error code: ' + code);
                    return;
                }                
                progress.set(60, function(){
                    callback(null);
                });
            });
        },        
        function(callback) {
            log += '========= http request start =========\n';
            var output = ((that.publicPath.indexOf('./') === 0) ? that.publicPath.slice(2) : that.publicPath) + '/' + fileName + '.pdf';
            var postData = JSON.stringify({
                file: 'http://' + config.hostname + ':' + config.port + '/' + output
            });
            var reqURL = url.parse(config.doneURL);

            var options = {
                hostname:  reqURL.hostname,
                port: (reqURL.port) ? reqURL.port : 80,
                path: reqURL.pathname,
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                    'Content-Length': postData.length
                }
            };

            var req = http.request(options, function(res) {
                console.log('STATUS: ' + res.statusCode);
                console.log('HEADERS: ' + JSON.stringify(res.headers));
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    log += '========= http request start =========\n';
                    console.log('BODY: ' + chunk);
                    callback(null);
                });
            });

            req.on('error', function(e) {
                callback('problem with http request: ' + e.message);
            });

            // write data to request body
            req.write(postData);
            req.end();            
        },
    ], function (err, result) {
        if (err) {
            myCallback(err);
            return;
        }        
        myCallback(null, log);
    });
    
};


OfficeToPDF.prototype.validateConfig = function (config) {

};