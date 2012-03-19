define(['jquery', 'backbone'], function($, Backbone){

    var User = Backbone.Model.extend({
        schema : {
            name: {}
        }
    });

    return User;
});