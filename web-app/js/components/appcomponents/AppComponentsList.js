/*
 * Copyright 2013 Next Century Corporation 
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 ;(function () {
    
    Ozone.components.appcomponents = Ozone.components.appcomponents || {};

    var SuperClass = Ozone.components.BaseView,
        DetailsTip = Ozone.components.appcomponents.DetailsTip,
        tip;

    Ozone.components.appcomponents.AppComponentsList = SuperClass.extend({

        // managed sub views
        views: null,

        searchQuery: '',

        addFilterFn: null,

        selectable: true,
        selectClass: 'selected',
        selected: null,

        events: {
            'click .widget': '_onClick',
            'click .widget-details': '_showDetailsTip',
            'mouseenter .widget': '_showDetailsTipOption',
            'mouseleave .widget': '_hideDetailsOption'
        },

        // boolean flag indicating whether or not to show details link
        details: true,

        // array of managed views
        views: null,

        // collection of all app components person has access to
        allAppComponents: null,

        initialize: function () {
            SuperClass.prototype.initialize.apply(this, arguments);
            _.bindAll(this, 'addOne');
        },

        render: function () {
            this.addAll();
            this.$el.disableSelection();
            return this;
        },

        addAll: function () {
            _.invoke(this.views, 'remove');
            this.views = [];
            this.collection.each(this.addOne);
            return this;
        },

        addOne: function (model, index) {
            if(_.isFunction(this.addFilterFn) && !this.addFilterFn(model, index)) {
                return;
            }

            var view = new Ozone.components.appcomponents.AppComponent({
                details: this.details,
                model: model
            });
            this.views.push(view);

            this.$el.append(view.render().$el);
        },

        filter: function (query) {
            this.searchQuery = query;
            this.removeDetailsTip();
            return this.addAll();
        },

        removeDetailsTip: function () {
            tip && tip.remove();
            tip = null;
        },

        removeAppComponent: function (view, tip) {
            var me = this,
                model = view.model,
                dashboardContainer = Ext.getCmp('mainPanel'),
                widgetsToDelete = [];

            widgetsToDelete.push({
                guid: model.get('widgetGuid'),
                name: model.get('name'),
                headerIcon: model.get('headerIcon'),
                image: model.get('image')
            });

            Ext.create('Ext.window.Window', {
                id: 'delete-widgets-window',
                title: 'Deleting App Components',
                cls: 'delete-widgets-window',
                height: 550,
                ownerCt: dashboardContainer,
                dashboardContainer: dashboardContainer,
                constrain: Ext.isIE,
                constrainHeader: true,
                width: 600,
                layout: 'fit',
                resizable: false,
                modal: true,
                items: {
                    xtype: 'deletewidgetspanel',
                    delWidgets: widgetsToDelete,
                    dashboardContainer: dashboardContainer
                },
                listeners: {
                    show: function (cmp) {
                        /*
                         * Needs to be deferred or it will happen before the
                         * window close in IE
                         */
                        Ext.defer(function() {
                            this.focus();
                        }, 100, cmp.getComponent('topdeletepanel').okBtn);
                    }
                }
            }).show();
            
            this.removeDetailsTip();
        },

        remove: function () {
            _.invoke(this.views, 'remove');
            this.views = null;

            this.removeDetailsTip();

            this.$el.enableSelection()

            return SuperClass.prototype.remove.call(this);
        },

        _onClick: function (evt) {
            if(this.selectable) {
                var view = $(evt.currentTarget).data('view');

                if(this.selected) {
                    this.selected.$el.removeClass(this.selectClass);
                }
                this.selected = view;
                this.selected.$el.addClass(this.selectClass);
            }
        },

        _showDetailsTip: function (evt) {
            var me = this,
                view = $(evt.currentTarget).parent().data('view');

            evt.preventDefault();
            evt.stopPropagation();

            this.removeDetailsTip();
            
            tip = new DetailsTip({
                model: view.model
            });

            tip.render().$el
                .appendTo('body')
                .position({
                    my: 'top',
                    at: 'bottom',
                    of: view.$el
                })
                .on('click', '.widget-remove', function(evt) {
                	var userGroups = Ozone.config.user.groups;
                	var stackGroups = view.model.attributes.groups
                	
                	var groupAssignment
                    // Find out whether stack belongs to one of the user's groups (including OWF Users and OFW Administrators)
                    if (_.find(stackGroups, function(stackGroup) { return _.find(userGroups, {'id' : stackGroup.id})})) {
                        groupAssignment = true;
                    } else {
                        // A hack to verify whether the stack is in one of the user's implicit groups
                        groupAssignment = Boolean(_.find(stackGroups, { 'displayName': 'OWF Users' }) ||
                            (Ozone.config.user.isAdmin && _.find(stackGroups, { 'displayName': 'OWF Administrators' })));
                    }

                    if(groupAssignment || view.model.attributes.groupWidget){
                    	alert("You may not delete this app component because it is required by an app.")
                    	me.removeDetailsTip();
                	} else {
	                    evt.preventDefault();
	                    me.removeAppComponent(view, tip);
                	}
                });
            tip.shown();
        },

        _showDetailsTipOption: function (evt) {
            this.$el.find('.widget-details').css('visibility', 'hidden');
            $(evt.currentTarget).children('.widget-details').css('visibility', '');
        },

        _hideDetailsOption: function (evt) {
            $(evt.currentTarget).children('.widget-details').css('visibility', 'hidden');
        }

    });

})();