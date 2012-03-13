define([], function(){

    var Helpers = {

        camelToTitleCase : function(str) {
            // add in spaces
            str = str.replace(/([A-Z])/g, ' $1');

            // uppercase first letter
            str = str.replace(/^./, function(str) { return str.toUpperCase(); });

            return str;
        }
    };

    return Helpers;
});