require.config({
    urlArgs: 'cachebust=' +  (new Date()).getTime(), // cache bust
    paths: {
        domReady:           '../libs/require/domReady',
        jquery:             '../libs/jquery/jquery',
        underscore:         '../libs/underscore/underscore-1.3.1-amd',
        backbone:           '../libs/backbone/backbone-0.9.1-amd',
        text:               '../libs/require/text',
        chosen:             '../libs/jquery/chosen.jquery.min',
        template:           'template' // path to the template files
    }
});

require(['jquery', 'domReady', 'app/app'], function($, domReady, App){

    // ---------------------
    // Better Log Function
    // ---------------------
    window.log = function() {
        log.history = log.history || [];
        log.history.push(arguments);
        
        if (this.console) {
            if (arguments.length == 1) console.debug(arguments[0]);
            else console.log( Array.prototype.slice.call(arguments) );
        }
    };


    domReady(function () {

        var app = new App.init();

    });


});