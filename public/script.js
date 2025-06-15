document.addEventListener('DOMContentLoaded', () => {
  const todoForm = document.getElementById('todo-form');
  const todoInput = document.getElementById('todo-input');
  const todoList = document.getElementById('todo-list');

  const apiUrl = '/api/todos';

  // Fetch and display existing todos
  async function fetchTodos() {
      try {
          const response = await fetch(apiUrl);
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          const todos = await response.json();
          renderTodos(todos);
      } catch (error) {
          console.error('Failed to fetch todos:', error);
          todoList.innerHTML = '<li>Error loading todos. Please try again later.</li>';
      }
  }

  // Render todos to the DOM
  function renderTodos(todos) {
      todoList.innerHTML = ''; // Clear the list first
      if (todos.length === 0) {
          todoList.innerHTML = '<li>No todos yet. Add one above!</li>';
          return;
      }
      todos.forEach(todo => {
          const li = createTodoElement(todo);
          todoList.appendChild(li);
      });
  }

  // Create a single todo list item element
  function createTodoElement(todo) {
      const li = document.createElement('li');
      li.dataset.id = todo.id;

      const taskSpan = document.createElement('span');
      taskSpan.textContent = todo.task;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '×';
      deleteBtn.className = 'delete-btn';
      deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

      li.appendChild(taskSpan);
      li.appendChild(deleteBtn);
      return li;
  }

  // Handle form submission to add a new todo
  todoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const task = todoInput.value.trim();
      if (!task) return;

      try {
          const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ task }),
          });
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          const newTodo = await response.json();
          // Optimistically add to UI, or refetch
          fetchTodos(); // Simple refetch is robust
          todoInput.value = '';
          todoInput.focus();
      } catch (error) {
          console.error('Failed to add todo:', error);
          alert('Error adding todo. Please check the console for details.');
      }
  });

  // Delete a todo
  async function deleteTodo(id) {
      if (!confirm('Are you sure you want to delete this todo?')) {
          return;
      }
      try {
          const response = await fetch(`${apiUrl}/${id}`, {
              method: 'DELETE',
          });
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          // Remove from DOM
          document.querySelector(`li[data-id='${id}']`).remove();
      } catch (error) {
          console.error('Failed to delete todo:', error);
          alert('Error deleting todo. Please check the console for details.');
      }
  }

  // Initial fetch
  fetchTodos();
});
