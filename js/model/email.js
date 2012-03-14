define(['jquery', 'backbone'], function($, Backbone){

    var Email = Backbone.Model.extend({
        urlRoot : 'email/api/path',
        schema : {
            type: { validators: ['required'] },
            email: { validators: ['required', 'email'], help : 'email help text' }
        }
    });

    return Email;
});