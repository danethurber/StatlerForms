define(['jquery', 'backbone', 'model/email', 'model/website'], function($, Backbone, Email, Website){

    var ClientStatusOptions = [
        {
            val: 'pending',
            label: 'Pending'
        },
        {
            val: 'active',
            label: 'Active'
        },
        {
            val: 'inactive',
            label: 'Inactive'
        }
    ];

    var RadioOptions = [
        {
            val: 'yes',
            label: 'Yes'
        },
        {
            val: 'no',
            label: 'No'
        }
    ];

    var Client = Backbone.Model.extend({
        urlRoot : 'path/to/client/model',

        schema : {
            name : { validators: ['required'] },
            slug : { validators: ['required', 'slug'] },
            twitter : { type: 'List' },
            status : {
                type: 'Select',
                options: ClientStatusOptions,
                editorClass : 'chosen'
            },
            yesNo : { type: 'Radio', options : RadioOptions },
            alias : { type: 'List' },
            website: { type: 'ObjectList', listType: 'NestedModel', model: Website }
        },
        defaults : {
            status : 'pending',
            yesNo : 'yes'
        }
    });

    return Client;
});