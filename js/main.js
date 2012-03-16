require.config({
    urlArgs: 'cachebust=' +  (new Date()).getTime(), // cache bust
    paths: {
        domReady:           'libs/require/domReady',
        jquery:             'libs/jquery/jquery',
        underscore:         'libs/underscore/underscore-1.3.1-amd',
        backbone:           'libs/backbone/backbone-0.9.1-amd',
        text:               'libs/require/text',
        chosen:             'libs/jquery/chosen.jquery.min',
        sForm:              'StatlerForms/statler-form',
        sFormTemplate:      'StatlerForms/template' // path to the template files
    }
});

require([], function(){

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

    Array.prototype.remove = function(from, to) {
        var rest = this.slice((to || from) + 1 || this.length);
        this.length = from < 0 ? this.length + from : from;
        return this.push.apply(this, rest);
    };

});