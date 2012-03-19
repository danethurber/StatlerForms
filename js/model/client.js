define(['jquery', 'backbone', 'model/email', 'model/website', 'model/address', 'model/account-manager'], function($, Backbone, Email, Website, Address, AccountManager){

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

    var Client = Backbone.Model.extend({
        urlRoot : 'path/to/client/model',

        schema : {
            name : { validators: ['required'], title : 'Company Name' },
            slug : { validators: ['required', 'slug'] },
            twitter : { type: 'List' },
            status : {
                type: 'Select',
                options: ClientStatusOptions,
                editorClass : 'chosen'
            },
            accountManager : { type: 'ObjectList', listType: 'NestedModel', model: AccountManager, title : 'Account Manager(s)' },
            // yesNo : { type: 'Radio', options : RadioOptions },
            alias : { type: 'List', title : 'Alias(es)' },
            website: { type: 'ObjectList', listType: 'NestedModel', model: Website, title : 'Website(s)' },
            address : { type: 'ObjectList', listType: 'NestedModel', model: Address, title : 'Address(es)' },
            affiliateCode : {},
            taxId : {}
        },
        defaults : {
            status : 'pending'
        }
    });

    return Client;
});