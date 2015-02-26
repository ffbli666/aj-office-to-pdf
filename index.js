var spawn      = require('child_process').spawn;
global.async   = require('async');
module.exports = OfficeToPDF;

function OfficeToPDF (appConfig) {
    this.officeToPDF = './node_modules/aj-office-to-pdf/bin/OfficeToPDF.exe';
    this.wget = appConfig.wget;
    this.publicPath = appConfig.publicPath;
    this.tmpPath = appConfig.tmpPath;
}

OfficeToPDF.prototype.run = function (config, job, progress, myCallback) {
    var that = this;
    if (!config.srcFile) {
        myCallback('no srcFile');
        return;
    }
    var fileName = job.uuid;
    var fileExt  = '.' + config.srcFile.split('.').pop();
    var log = '';
    async.waterfall([
        //wget
        function(callback) {
            log += '========= wget start =========\n\n';
            var output = that.tmpPath + '/' + fileName + fileExt;

            wget = spawn(that.wget, ['--no-check-certificate', config.srcFile ,'-O', output]);
            
            // wget.stdout.on('data', function (data) {
            //     console.log('wget stdout: ' + data);
            // });

            wget.stderr.on('data', function (data) {
                //console.log('wget stderr: ' + data);
                log += data;
            });

            wget.on('close', function (code) {
                log += '\n\n========= wget end =========\n\n';
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
            log += '========= officeToPDF start =========\n\n';
            var src = that.tmpPath + '/' + fileName + fileExt;
            var output = that.publicPath + '/' + fileName + '.pdf';

            officeToPDF = spawn(that.officeToPDF, [src, output]);
            
            // officeToPDF.stdout.on('data', function (data) {
            //     console.log('officeToPDF stdout: ' + data);
            // });

            officeToPDF.stderr.on('data', function (data) {
                //console.log('officeToPDF stderr: ' + data);
                log += data;
            });

            officeToPDF.on('close', function (code) {
                log += '\n\n========= officeToPDF end =========\n\n';
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
            callback(null);
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