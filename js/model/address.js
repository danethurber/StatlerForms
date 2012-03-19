define(['jquery', 'backbone'], function($, Backbone){

    var Address = Backbone.Model.extend({
        schema : {
            address1 : {},
            address2 : {},
            city : {},
            state : {},
            postal : {},
            country : {
                type: 'Select',
                options: [
                    {
                        val: 'us',
                        label: 'United States'
                    },
                    {
                        val: 'cananda',
                        label : 'Canada'
                    }
                ],
                editorClass : 'chosen'
            }
        },
        defaults : {
            country : 'us'
        }
    });

    return Address;
});