/*global define*/
define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/todos.html',
	'common',
	'ElementsView'
], function ($, _, Backbone, todosTemplate, Common, ElementsView) {
	'use strict';

	var TodoView = ElementsView.extend({

		tagName:  'li',

		template: _.template(todosTemplate),

		// Place here our CSS classes to avoid their duplication in the code
		_classes: function () {
			return {
				completed: 'completed',
				hidden: 'hidden',
				editing: 'editing'
			};
		},

		// Place here our selectors to avoid their duplication in the code
		_selectors: function () {
			return {
				toggle: '.toggle',
				label: 'label',
				destroy: '.destroy',
				edit: '.edit'
			};
		},

		// The DOM events specific to an item.
		events: function () {
			var events = {};
			var editSelector = this._selector('edit');
			events['click ' + this._selector('toggle')] = this.toggleCompleted;
			events['dblclick ' + this._selector('label')] = this.edit;
			events['click ' + this._selector('destroy')] = this.clear;
			events['keypress ' + editSelector] = this.updateOnEnter;
			events['keydown ' + editSelector] = this.revertOnEscape;
			events['blur ' + editSelector] = this.close;
			return events;
		},

		// The TodoView listens for changes to its model, re-rendering. Since there's
		// a one-to-one correspondence between a **Todo** and a **TodoView** in this
		// app, we set a direct reference on the model for convenience.
		initialize: function () {
			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'destroy', this.remove);
			this.listenTo(this.model, 'visible', this.toggleVisible);
		},

		// Re-render the titles of the todo item.
		render: function () {
			this.$el.html(this.template(this.model.toJSON()));
			this._toggleClass('completed', this.model.get('completed'));

			this.toggleVisible();
			this._dropElemCache('edit');
			return this;
		},

		toggleVisible: function () {
			this._toggleClass('hidden', this.isHidden());
		},

		isHidden: function () {
			var isCompleted = this.model.get('completed');
			return (// hidden cases only
				(!isCompleted && Common.TodoFilter === 'completed') ||
				(isCompleted && Common.TodoFilter === 'active')
			);
		},

		// Toggle the `"completed"` state of the model.
		toggleCompleted: function () {
			this.model.toggle();
		},

		// Switch this view into `"editing"` mode, displaying the input field.
		edit: function () {
			this._addClass('editing');
			this._elem('edit').focus();
		},

		// Close the `"editing"` mode, saving changes to the todo.
		close: function () {
			var value = this._elem('edit').val();
			var trimmedValue = value.trim();

			if (trimmedValue) {
				this.model.save({ title: trimmedValue });

				if (value !== trimmedValue) {
					// Model values changes consisting of whitespaces only are not causing change to be triggered
					// Therefore we've to compare untrimmed version with a trimmed one to chech whether anything changed
					// And if yes, we've to trigger change event ourselves
					this.model.trigger('change');
				}
			} else {
				this.clear();
			}

			this._removeClass('editing');
		},

		// If you hit `enter`, we're through editing the item.
		updateOnEnter: function (e) {
			if (e.keyCode === Common.ENTER_KEY) {
				this.close();
			}
		},

		// If you're pressing `escape` we revert your change by simply leaving
		// the `editing` state.
		revertOnEscape: function (e) {
			if (e.which === Common.ESCAPE_KEY) {
				this._removeClass('editing');
				// Also reset the hidden input back to the original value.
				this._elem('edit').val(this.model.get('title'));
			}
		},

		// Remove the item, destroy the model from *localStorage* and delete its view.
		clear: function () {
			this.model.destroy();
		}
	});

	return TodoView;
});
