define(['jquery', 'backbone'], function($, Backbone){

    var Website = Backbone.Model.extend({
        urlRoot : 'email/api/path',
        schema : {
            type: { validators: ['required'] },
            url: { validators: ['required', 'url'] }
        }
    });

    return Website;
});