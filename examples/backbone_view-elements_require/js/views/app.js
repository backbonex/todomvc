/*global define*/
define([
	'jquery',
	'underscore',
	'backbone',
	'collections/todos',
	'views/todos',
	'text!templates/stats.html',
	'common',
	'ElementsView'
], function ($, _, Backbone, Todos, TodoView, statsTemplate, Common, ElementsView) {
	'use strict';

	// Our overall **AppView** is the top-level piece of UI.
	var AppView = ElementsView.extend({

		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		el: '#todoapp',

		// Compile our stats template
		template: _.template(statsTemplate),

		// Place here our CSS classes to avoid their duplication in the code
		_classes: function () {
			return {
				selected: 'selected'
			};
		},

		// Place here our selectors to avoid their duplication in the code
		_selectors: function () {
			return {
				newTodo: '#new-todo',
				clearCompleted: '#clear-completed',
				toggleAll: '#toggle-all',
				footer: '#footer',
				main: '#main',
				todoList: '#todo-list',
				filterLinks: '#filters li a',
				activeFilterLink: '[href="#/%s"]'
			};
		},

		// Delegated events for creating new items, and clearing completed ones.
		events: function () {
			var events = {};
			events['keypress ' + this._selector('newTodo')] = this.createOnEnter;
			events['click ' + this._selector('clearCompleted')] = this.clearCompleted;
			events['click ' + this._selector('toggleAll')] = this.toggleAllComplete;
			return events;
		},

		// At initialization we bind to the relevant events on the `Todos`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting todos that might be saved in *localStorage*.
		initialize: function () {
			this.listenTo(Todos, 'add', this.addOne);
			this.listenTo(Todos, 'reset', this.addAll);
			this.listenTo(Todos, 'change:completed', this.filterOne);
			this.listenTo(Todos, 'filter', this.filterAll);
			this.listenTo(Todos, 'all', this.render);

			Todos.fetch({reset:true});
		},

		// Re-rendering the App just means refreshing the statistics -- the rest
		// of the app doesn't change.
		render: function () {
			var completed = Todos.completed().length;
			var remaining = Todos.remaining().length;
			var $footer = this._elem('footer');
			var $main = this._elem('main');

			if (Todos.length) {
				$main.show();
				$footer.show();

				$footer.html(this.template({
					completed: completed,
					remaining: remaining
				}));

				var selectedFilterClass = this._class('selected');
				this._findElem('filterLinks')
					.removeClass(selectedFilterClass)
					.filter(this._selector('activeFilterLink', Common.TodoFilter || ''))
					.addClass(selectedFilterClass);
			} else {
				$main.hide();
				$footer.hide();
			}

			this._elem('toggleAll').prop('checked', !remaining);
		},

		// Add a single todo item to the list by creating a view for it, and
		// appending its element to the `<ul>`.
		addOne: function (todo) {
			var view = new TodoView({ model: todo });
			this._elem('todoList').append(view.render().el);
		},

		// Add all items in the **Todos** collection at once.
		addAll: function () {
			this._elem('todoList').empty();
			Todos.each(this.addOne, this);
		},

		filterOne: function (todo) {
			todo.trigger('visible');
		},

		filterAll: function () {
			Todos.each(this.filterOne, this);
		},

		// Generate the attributes for a new Todo item.
		newAttributes: function () {
			return {
				title: this._elem('newTodo').val().trim(),
				order: Todos.nextOrder(),
				completed: false
			};
		},

		// If you hit return in the main input field, create new **Todo** model,
		// persisting it to *localStorage*.
		createOnEnter: function (e) {
			var $input = this._elem('newTodo');
			if (e.which !== Common.ENTER_KEY || !$input.val().trim()) {
				return;
			}

			Todos.create(this.newAttributes());
			$input.val('');
		},

		// Clear all completed todo items, destroying their models.
		clearCompleted: function () {
			_.invoke(Todos.completed(), 'destroy');
			return false;
		},

		toggleAllComplete: function () {
			var completed = this._elem('toggleAll').prop('checked');

			Todos.each(function (todo) {
				todo.save({
					completed: completed
				});
			});
		}
	});

	return AppView;
});
