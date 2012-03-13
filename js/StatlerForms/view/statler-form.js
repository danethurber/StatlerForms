define([
    'jquery',
    'backbone',

    'app/helpers',

    'text!template/form.html',
    'text!template/fieldset.html',
    'text!template/field.html'
], function(
    $,
    Backbone,

    Helpers,

    templateForm,
    templateFieldset,
    templateField
){


    // -----------------------------------------
    // Helpers
    // -----------------------------------------
    Helpers.getNestedSchema = function(obj, path) {
        path = path.replace(/\./g, '.subSchema.');
        return this.getNested(obj, path);
    };
    Helpers.getNested = function(obj, path) {
        var fields = path.split(".");
        var result = obj;
        for (var i = 0, n = fields.length; i < n; i++) {
            result = result[fields[i]];
        }

        return result;
    };
    Helpers.createEditor = function(schemaType, options) {
        var constructorFn;

        if (_.isString(schemaType))
            constructorFn = Editors[schemaType];
        else
            constructorFn = schemaType;

        return new constructorFn(options);
    };
    Helpers.getValidators = function(validator) {
        // check if it's a regex
            if( _.isRegExp(validator) )
                return Validators.regex({ regex: validator });

            // check against predefined validators
            if( _.isString(validator) ) {
                if( !Validators[validator] )
                    throw new Error('Validator ' + validator + ' not found');

                return Validators[validator]();
            }

            // take a function directly
            if( _.isFunction(validator) )
                return validator;

            // nothing matches, throw error
            throw new Error('Invalid validator: ' + validator);
    };

    // -----------------------------------------
    // Validators
    // -----------------------------------------
    var Validators = {

        errMessages : {
            required : 'Required',
            regex :    'Invalid',
            email :    'Invalid email address',
            url:       'Invalid URL',
            slug:      'Invalid slug'
        },
        required : function(options) {
            options = _.extend({
                type : 'required',
                message : this.errMessages.required
            }, options);

            return function required(value) {
                options.value = value;

                var err = {
                    type : options.type,
                    message : options.message
                };

                if(value === null || value === undefined || value === '')
                    return err;
            };
        },
        regexp : function(options) {
            if (!options.regexp)
                throw new Error('Missing required `regex` option for `regex` validator');

            options = _.extend({
                type: 'regexp',
                message: this.errMessages.regexp
            }, options);

            return function regexp(value) {
                options.value = value;

                var err = {
                    type: options.type,
                    message: options.message
                };

                //Don't check empty values (add a 'required' validator for this)
                if (value === null || value === undefined || value === '')
                    return;

                if (!options.regexp.test(value))
                    return err;
            };
        },
        email : function(options) {
            options = _.extend({
                type: 'email',
                message: this.errMessages.email,
                regexp: /^[\w\-]{1,}([\w\-.]{1,1}[\w\-]{1,}){0,}[@][\w\-]{1,}([.]([\w\-]{1,})){1,3}$/
            }, options);

            return this.regexp(options);
        },
        url : function(options) {
            options = _.extend({
                type: 'url',
                message: this.errMessages.url,
                regexp: /^(http|https):\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)(:(\d+))?\/?/i
            }, options);

            return this.regexp(options);
        },
        slug : function(options) {
            options = _.extend({
                type: 'slug',
                message: this.errMessages.slug,
                regexp: /^[a-z0-9-]+$/
            }, options);

            return this.regexp(options);
        }
    };

    // -----------------------------------------
    // Field
    // -----------------------------------------
    var Field = Backbone.View.extend({
        template : _.template( templateField ),

        className : 'control-group',

        initialize : function(options) {
            _.extend(this, options);
            _.bindAll(this, 'render',
                            'getValue',
                            'setValue',
                            'commit',
                            'validate',
                            'setError',
                            'clearError');

            
            if (!this.schema.type)
                this.schema.type = 'Text';
            if (!this.schema.title)
                this.schema.title = Helpers.camelToTitleCase(this.key);
        },
        render : function() {
            this.$el.html( this.template({
                label : this.schema.title,
                help_text : (this.schema.help) ? this.schema.help : ''
            }) );

            //Standard options that will go to all editors
            var options = {
                form: this.form,
                key: this.key,
                schema: this.schema
            };

            //Decide on data delivery type to pass to editors
            if (this.model)
                options.model = this.model;
            else
                options.value = this.value;

            var editor = this.editor = Helpers.createEditor(this.schema.type, options);

            this.$el.find('.controls').prepend( editor.render().el );

            // store value for help/error text
            this.$help = this.$el.find('.help-block');

            return this;
        },
        getValue : function() {
            return this.editor.getValue();
        },
        setValue : function() {
            this.editor.setValue(value);
        },
        commit : function() {
            return this.editor.commit();
        },
        validate : function() {
            var error = this.editor.validate();

            if(error)
                this.setError(error.message);
            else
                this.clearError();

            return error;
        },
        setError : function(message) {
            if (this.editor.hasNestedForm)
                return;

            this.$el.addClass('error');

            if( this.$help )
                this.$help.html(message);
        },
        clearError : function() {
            var $help = this.$help;

            this.$el.removeClass('error');

            if( $help ) {
                // reset if available or else clear
                if( this.schema.help )
                    $help.html(this.schema.help);
                else
                    $help.empty();
            }
        }
    });

    // -----------------------------------------
    // Form
    // -----------------------------------------
    var Form = Backbone.View.extend({
        template : _.template( templateForm ),
        fieldsetTemplate: _.template( templateFieldset ),

        tagName : 'form',
        className : 'statler-form form-horizontal',

        events : {
            'click [type="submit"]' : 'onSave'
        },

        fields : null,

        initialize : function(options) {
            _.extend(this, options);
            this.schema = options.schema || (options.model ? options.model.schema : {});
            this.fieldsToRender = options.fields || _.keys(this.schema);

            _.bindAll(this, 'render',
                            'renderFields',
                            'getValue',
                            'setValue',
                            'validate',
                            'onSave',
                            'commit');


            this.fields = {};
        },

        render : function() {
            var self = this;

            // make initial el from template
            this.$el.html( this.template() );

            // reference the fieldset placeholder
            var $fieldsetContainer = $('.fieldsets', this.$el);

            // get all fieldsets from the layout schema and create
            // views for each
            if (this.fieldsets) {
                _.each(this.fieldsets, function(fs) {
                    // make sure it's json and if it's an array then change it to json
                    if (_(fs).isArray())
                        fs = {'fields': fs};

                    // fieldset el from template
                    // TODO: think about making this a seperate view
                    var $fieldset = $( self.fieldsetTemplate({
                        legend : (fs.legend) ? fs.legend : ''
                    }) );

                    // reference the fields placeholder and remove it
                    var $fieldsContainer = $('.fields_placeholder', $fieldset).parent();
                        $fieldsContainer.find('.fields_placeholder').remove();

                    // render the field and pass the container el in so it knows where to go
                    self.renderFields(fs.fields, $fieldsContainer);

                    // append the fieldset to the rest of the form
                    $fieldsetContainer.append( $fieldset );
                });
            }
            // Handle if it's not passed as json or an array of fieldsets
            // this is also needed for nested forms
            else {
                var $fieldset = $( self.fieldsetTemplate({
                    legend : ''
                }) );

                // reference the fields placeholder and remove it
                var $fieldsContainer = $('.fields_placeholder', $fieldset).parent();
                    $fieldsContainer.find('.fields_placeholder').remove();

                // render the field and pass the container el in so it knows where to go
                this.renderFields(self.fieldsToRender, $fieldsContainer);
        
                // append the fieldset to the rest of the form
                $fieldsetContainer.append($fieldset);
            }

            return this;
        },

        renderFields : function(fieldsToRender, $container) {
            var self = this;

            // get each field that was passed in
            // and create the field view for them
            _.each(fieldsToRender, function(key) {
                
                // check against model schema
                var itemSchema = Helpers.getNestedSchema(self.schema, key);
                if(!itemSchema)
                    throw "Field '" + key + "' not found in schema";

                var options = {
                    form: self,
                    key: key,
                    schema: itemSchema
                };

                if(self.model) {
                    options.model = self.model;
                } else if (self.data) {
                    options.value = self.data[key];
                } else {
                    options.value = null;
                }

                // create view for Field
                var field = new Field(options);

                if(itemSchema.type == 'Hidden')
                    field.editor = Helpers.createEditor('Hidden', options);
                else
                    $container.append( field.render().el );

                // store in the form fields array
                self.fields[key] = field;
            });
        },
        getValue : function(key) {
            // if key param then only get that value
            if(key)
                return this.fields[key].getValue();

            var values = {};

            _.each(this.fields, function(field) {
                values[field.key] = field.getValue();
            });

            return values;
        },
        setValue : function(data) {
            for(var key in data) {
                this.fields[key].setValue( data[key] );
            }
        },
        validate : function() {
            var self = this,
                errors = {};

            // check against schema validation
            _.each(this.fields, function(field) {
                var error = field.validate();

                if(error)
                    errors[field.key] = error;
            });

            // check against model validation

            return _.isEmpty(errors) ? null : errors;
        },

        onSave : function(evt) {
            evt.preventDefault();
            this.commit();
        },

        commit : function() {
            var modelError = null,
                errors = this.validate();

            if (errors)
                return errors;

            this.model.set(this.getValue(), {
                error: function(model, e) {
                    modelError = e;
                }
            });

            if (modelError)
                return modelError;

            this.model.save();
        }
    });

    var NestedForm = Form.extend({
        template : _.template( '<div class="fieldsets"></div>' ),

        tagName : 'div',
        className : 'nested-form well'
    });

    var NestedListForm = NestedForm.extend({
        template : _.template(
            '<div class="fieldsets">' +
            '</div>'
        )
    });

    // -----------------------------------------
    // Editors
    // -----------------------------------------
    var Editors = {};

    Editors.Base = Backbone.View.extend({
        defaultValue : null,

        initialize : function(options) {
            _.extend(this, options);
            _.bindAll(this, 'validate',
                            'commit',
                            'getValue',
                            'setValue');


            if (this.model) {
                if (!this.key)
                    throw 'Missing option: `key`';

                // set the value by using the `key` to look it up
                this.value = this.model.get(this.key);
            }

            if (this.value === undefined)
                this.value = this.defaultValue;

            this.validators = options.validators || this.schema.validators;

            if (this.key)
                this.$el.attr('name', this.key);

            // support custom CSS class names
            if(this.schema.editorClass)
                this.$el.addClass(this.schema.editorClass);

            // support custom attributes
            if(this.schema.editorAttrs)
                this.$el.attr( this.schema.editorAttrs );
        },
        validate : function() {
            var error = null,
                value = this.getValue(),
                formValues = this.form ? this.form.getValue() : {},
                validators = this.validators;

            if(validators) {
                _.each(validators, function(validator) {
                    if(!error)
                        error = Helpers.getValidators(validator)(value, formValues);
                });
            }

            return error;
        },
        commit : function() {
            var error = this.validate();
            if(error)
                return error;

            this.model.set(this.key, this.getValue(), {
                error : function(model, e) {
                    error = e;
                }
            });

            if(error)
                return error;
        },
        getValue: function() {
            throw 'Not implemented. Extend and override this method.';
        },
        setValue: function() {
            throw 'Not implemented. Extend and override this method.';
        }
    });
    Editors.Text = Editors.Base.extend({
        tagName : 'input',

        defaultValue: '',

        initialize: function(options) {
            Editors.Base.prototype.initialize.call(this, options);

            _.bindAll(this, 'render');
        },
        render : function() {
            this.setValue(this.value);
            return this;
        },
        getValue: function() {
            return this.$el.val();
        },
        setValue: function(value) {
            this.$el.val(value);
        }
    });
    Editors.TextArea = Editors.Text.extend({
        tagName : 'textarea'
    });

    Editors.Select = Editors.Text.extend({
        tagName : 'select',

        initialize : function(options) {
            Editors.Base.prototype.initialize.call(this, options);

            if(!this.schema || !this.schema.options)
                throw 'Missing required `schema.options`';
        },
        render : function() {
            var self = this,
                options = this.schema.options;

            // Does the collection need fetched
            if(options instanceof Backbone.Collection) {
                var collection = options;

                // has it already populated
                if(collection.length > 0)
                    self.renderOptions(options);
                else {
                    collection.fetch({
                        success : function(collection) {
                            self.renderOptions(options);
                        }
                    });
                }
            }
            else
                this.renderOptions(options);

            return this;
        },
        renderOptions : function(options) {
            var self = this,
                html;

            // is it a string
            if(_.isString(options))
                html = options;
            // how about an array
            else if(_.isArray(options))
                html = self._arrayToHtml(options);
            // try Backbone Collection
            else if(options instanceof Backbone.Collection)
                html = self._collectionToString(options);

            this.$el.html( html );

            this.setValue(this.value);

        },
        getValue: function() {
            return this.$el.val();
        },

        setValue: function(value) {
            this.$el.val(value);
        },

        _arrayToHtml : function(array) {
            var html = [];

            //Generate HTML
            _.each(array, function(option) {
                option = _.extend({
                    disabled : false,
                    val : ''
                }, option);

                if (_.isObject(option)) {
                    var isDisabled = (option.disabled) ? 'disabled' : '';
                    html.push('<option value="' + option.val + '"' + isDisabled + '>' + option.label + '</option>');
                }
                else {
                    html.push('<option>' + option + '</option>');
                }
            });

            return html.join('');
        },
        _collectionToString : function(collection) {
            var array = [];
                collection.each(function(model) {
                array.push({ val: model.id, label: model.toString() });
            });

            //Now convert to HTML
            var html = this._arrayToHtml(array);

            return html;
        }
    });
    Editors.MultiSelect = Editors.Select.extend({
        initialize : function(options) {
            if(!options.schema.editorAttrs)
                options.schema.editorAttrs = {};

            options.schema.editorAttrs = _.extend({ multiple : 'multiple'}, options.schema.editorAttrs);

            Editors.Select.prototype.initialize.call(this, options);
        }
    });

    Editors.Radio = Editors.Select.extend({
        radioTemplate : _.template(
            '<label class="radio">' +
                '<input type="radio" name="<%= name %>" value="<%= value %>">' +
                '<%= label %>' +
            '</label>'
        ),


        tagName: 'div',

        _arrayToHtml : function(array) {
            var self = this,
                html = [];

            _.each(array, function(option, index) {
                var name = self.id ? self.id : self.key;

                if (_.isObject(option)) {
                    html.push( self.radioTemplate({
                        name : name,
                        value : option.val ? option.val : '',
                        label : option.label
                    }) );
                }
                else {
                    html.push( self.radioTemplate({
                        name : name,
                        value : option,
                        label : option
                    }) );
                }
            });

            return html.join('');
        },

        getValue: function() {
            return this.$el.find('input[type=radio]:checked').val();
        },

        setValue: function(value) {
            this.$el.find('input[type=radio][value=' + value + ']').attr('checked', true);
        }
    });

    Editors.Hidden = Editors.Base.extend();


    Editors.List = Editors.Base.extend({
        template : _.template(
            '<div class="fields"></div>' +
            '<a class="btn add">Add Another</a>'
        ),

        itemTemplate : _.template(
            '<p class="item">' +
                '<input type="text" value="<%= value %>"> ' +
                '<a class="btn delete btn-danger"><i class="icon-trash icon-white"></i></a>' +
            '</p>'
        ),

        events : {
            'click .add' : 'onAddClick',
            'click .delete' : 'onDeleteClick'
        },

        initialize: function(options) {
            Editors.Base.prototype.initialize.call(this, options);

            _.bindAll(this, 'addItem',
                            'onAddClick',
                            'onDeleteClick',
                            'removeItem');

            if (!this.schema)
                throw "Missing required option 'schema'";

            this.schema.listType = this.schema.listType || 'Text';

            if (this.schema.listType == 'NestedModel' && !this.schema.model)
                throw "Missing required option 'schema.model'";
        },

        render : function() {
            this.$el.html( this.template() );

            var self = this,
                data = this.value || [],
                $fields = $('.fields', this.$el);

            _.each(data, function(item, index) {
                self.addItem(item, index);
            });

            return this;
        },

        getValue : function() {
            var self = this,
                data = [];

            $('input', this.el).each(function(index, item) {
                var itemValue = $(item).val();

                if(itemValue)
                    data.push( itemValue );
            });

            return data;
        },

        setValue: function(value) {
            this.value = value;
            this.render();
        },


        addItem : function(item) {
            var itemEl = $( this.itemTemplate({
                value : (item) ? item : ''
            }) );
            this.$el.find('.fields').append( itemEl );
        },
        removeItem : function(item) {
            $(item).parents('.item').remove();
        },
        onAddClick : function(evt) {
            evt.preventDefault();
            this.addItem();
        },
        onDeleteClick : function(evt) {
            evt.preventDefault();
            this.removeItem( evt.target );
        }
    });

    Editors.Object = Editors.Base.extend({
        className : '',

        hasNestedForm : true,
        defaultValue : {},

        initialize : function(options) {
            Editors.Base.prototype.initialize.call(this, options);

            if (!this.schema.subSchema)
                throw 'Missing required `schema.subSchema` option for Object editor';
        },
        render : function() {
            this.form = new NestedForm({
                schema: this.schema.subSchema,
                data: this.value || {}
            });

            this.$el.html( this.form.render().el );

            return this;
        },
        getValue: function() {
            return this.form.getValue();
        },

        setValue: function(value) {
            this.value = value;

            this.render();
        },

        // remove: function() {
        //     this.form.remove();

        //     Backbone.View.prototype.remove.call(this);
        // },

        validate: function() {
            return this.form.validate();
        }
    });

    Editors.NestedModel = Editors.Object.extend({
        initialize : function(options) {
            Editors.Base.prototype.initialize.call(this, options);

            if (!options.schema.model)
                throw 'Missing required `schema.model` option for NestedModel editor';
        },
        render : function() {
            var data = this.value || {},
                  nestedModel = this.schema.model,
                  nestedModelSchema = (nestedModel).prototype.schema;

            this.form = new NestedForm({
                schema: nestedModelSchema,
                model: new nestedModel(data)
            });

            this.$el.html( this.form.render().el );

            return this;
        }
    });

    Editors.ObjectList = Editors.List.extend({
        subForms : [],

        addItem : function(data, index) {
            var nestedModel = this.schema.model,
                  nestedModelSchema = (nestedModel).prototype.schema;

            var form = new NestedListForm({
                schema: nestedModelSchema,
                model: new nestedModel(data)
            });

            this.subForms.push( form );
            this.$el.find('.fields').append( form.render().el );
        },
        validate : function() {
            var errors = [];

            _.each(this.subForms, function(form) {
                var error = form.validate();

                if(error)
                    errors.push( error );
            });

            return errors.length ? errors : null;
        },
        getValue : function() {
            var self = this,
                data = [];

            _.each(this.subForms, function(form) {
                var itemValue = form.getValue();

                if(itemValue)
                    data.push( itemValue );
            });

            return data;
        }
    });

    return Form;
});