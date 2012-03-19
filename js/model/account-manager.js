define(['jquery', 'backbone', 'model/user'], function($, Backbone, User){

    var AccountManager = Backbone.Model.extend({
        schema : {
            relationship_type: {
                type: 'Select',
                options: [
                    {
                        val: 'lead_acct_manager',
                        label: 'Lead Account Manager'
                    },
                    {
                        val: 'acct_manager',
                        label: 'Account Manager'
                    },
                    {
                        val: 'acct_exec',
                        label: 'Account Executive'
                    },
                    {
                        val: 'acct_assistant',
                        label: 'Account Assistant'
                    }
                ]
            },
            user_id: {
                type: 'Select',
                title : 'User',
                options: [
                    {
                        val: '1',
                        label: 'Dane'
                    },
                    {
                        val: '2',
                        label: 'Dal'
                    }
                ]
            }
        }
    });

    return AccountManager;
});