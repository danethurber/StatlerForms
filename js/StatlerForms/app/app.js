define([
    'jquery',
    'backbone',

    // MODELS
    'model/client',
    'model/email',
    'model/website',

    // VIEWS
    'view/statler-form',

    // PLUGINS
    'chosen'
], function(
    $,
    Backbone,

    // MODELS
    Client,
    Email,
    Website,

    // VIEWS
    StatlerForm
){

    var App = {

        init: function() {
            // var clientEmail = new Email({
            //     type : 'asdf',
            //     email : 'something@gmail.com'
            // });
            this.client = new Client({
                name : 'Scott Jensen Design',
                alias : ['scooter'],
                website : [
                    {
                        type : 'Corporate',
                        url : 'http://google.com'
                    },
                    {
                        type : 'Personal',
                        url : 'http://scottjensendesign.com'
                    }
                ]
            });

            this.clientForm = new StatlerForm({
                model: this.client,
                fieldsets: [
                    {
                        legend: 'Client Information',
                        fields: ['name', 'slug', 'twitter', 'status', 'alias', 'yesNo']
                    },
                    {
                        legend: 'Additional Information',
                        fields: ['website']
                    }
                ]
            });

            $('#form-here').html( this.clientForm.render().el );

            $('.chosen').chosen();
        }

    };

    return App;
    
});