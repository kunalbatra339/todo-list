import React, { useState, useEffect } from 'react';
import './App.css';
import confetti from 'canvas-confetti';

function App() {
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [input, setInput] = useState('');
  const [tasks, setTasks] = useState([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [theme, setTheme] = useState('default');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedRollNumber = localStorage.getItem('rollNumber');
    const storedTheme = localStorage.getItem('theme');
    const storedDarkMode = localStorage.getItem('darkMode');

    if (storedRollNumber) {
      setRollNumber(storedRollNumber);
      setIsLoggedIn(true);
      fetchTasks(storedRollNumber);
    }
    if (storedTheme) setTheme(storedTheme);
    if (storedDarkMode) setDarkMode(JSON.parse(storedDarkMode));
  }, []);

  const fetchTasks = async (userRoll) => {
    try {
      setIsLoading(true);
      const response = await fetch(`https://todo-list-5-bc98.onrender.com/api/todos/${userRoll}`);
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://todo-list-5-bc98.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roll_number: rollNumber, password })
      });
      const data = await response.json();
      
      if (data.msg === 'Login successful') {
        localStorage.setItem('rollNumber', rollNumber);
        setIsLoggedIn(true);
        await fetchTasks(rollNumber);
        // Fix task order for existing users (run once)
        await fixTaskOrder(rollNumber);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://todo-list-5-bc98.onrender.com/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roll_number: rollNumber, password })
      });
      const data = await response.json();
      
      if (data.msg) {
        alert(data.msg);
        setIsRegistering(false);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rollNumber');
    setRollNumber('');
    setPassword('');
    setIsLoggedIn(false);
    setTasks([]);
  };

  const addTask = async () => {
    const storedRollNumber = localStorage.getItem('rollNumber');
    if (input.trim() !== '' && storedRollNumber) {
      try {
        setIsLoading(true);
        await fetch('https://todo-list-5-bc98.onrender.com/api/todo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            task: input, 
            roll_number: storedRollNumber,
            date,
            time
          })
        });
        
        setInput('');
        setDate('');
        setTime('');
        await fetchTasks(storedRollNumber);
      } catch (error) {
        console.error('Error adding task:', error);
        alert('Failed to add task. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const deleteTask = async (id) => {
    const storedRollNumber = localStorage.getItem('rollNumber');
    try {
      setIsLoading(true);
      await fetch(`https://todo-list-5-bc98.onrender.com/api/todo/${id}`, {
        method: 'DELETE'
      });
      await fetchTasks(storedRollNumber);
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = async (id) => {
    try {
      await fetch(`https://todo-list-5-bc98.onrender.com/api/todo/${id}`, {
        method: 'PUT'
      });
      
      const updatedTasks = tasks.map(task =>
        task._id === id ? { ...task, completed: !task.completed } : task
      );
      setTasks(updatedTasks);

      const completedTask = updatedTasks.find(task => task._id === id && task.completed);
      if (completedTask) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const moveTaskUp = async (index) => {
    if (index > 0) {
      const newTasks = [...tasks];
      [newTasks[index], newTasks[index - 1]] = [newTasks[index - 1], newTasks[index]];
      
      // Update local state immediately for smooth UX
      setTasks(newTasks);
      
      try {
        // Save the new order to backend
        await fetch('https://todo-list-5-bc98.onrender.com/api/reorder-todos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            roll_number: localStorage.getItem('rollNumber'),
            taskIds: newTasks.map(task => task._id)
          })
        });
      } catch (error) {
        console.error('Failed to save task order:', error);
        // Revert local state if API call fails
        await fetchTasks(localStorage.getItem('rollNumber'));
        alert('Failed to save task order. Order has been reverted.');
      }
    }
  };

  const moveTaskDown = async (index) => {
    if (index < tasks.length - 1) {
      const newTasks = [...tasks];
      [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]];
      
      // Update local state immediately for smooth UX
      setTasks(newTasks);
      
      try {
        // Save the new order to backend
        await fetch('https://todo-list-5-bc98.onrender.com/api/reorder-todos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            roll_number: localStorage.getItem('rollNumber'),
            taskIds: newTasks.map(task => task._id)
          })
        });
      } catch (error) {
        console.error('Failed to save task order:', error);
        // Revert local state if API call fails
        await fetchTasks(localStorage.getItem('rollNumber'));
        alert('Failed to save task order. Order has been reverted.');
      }
    }
  };

  const fixTaskOrder = async (userRoll) => {
    try {
      await fetch(`https://todo-list-5-bc98.onrender.com/api/fix-task-order/${userRoll}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error fixing task order:', error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', JSON.stringify(!darkMode));
  };

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Handle Enter key press for inputs
  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={`app-container ${darkMode ? 'dark-mode' : ''} ${theme}`}>
        <h1>{isRegistering ? 'Register' : 'Login'}</h1>
        
        {isLoading && <div className="loading">Loading...</div>}
        
        <input
          type="text"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value)}
          onKeyPress={(e) => handleKeyPress(e, isRegistering ? handleRegister : handleLogin)}
          placeholder="Roll Number"
          disabled={isLoading}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => handleKeyPress(e, isRegistering ? handleRegister : handleLogin)}
          placeholder="Password"
          disabled={isLoading}
        />
        
        {isRegistering ? (
          <>
            <button onClick={handleRegister} disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register'}
            </button>
            <p onClick={() => setIsRegistering(false)}>
              Already have an account? Login
            </p>
          </>
        ) : (
          <>
            <button onClick={handleLogin} disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            <p onClick={() => setIsRegistering(true)}>
              Create a new account
            </p>
          </>
        )}
        
        <div className="theme-controls">
          <button onClick={toggleDarkMode}>Toggle Dark Mode</button>
          <select onChange={(e) => changeTheme(e.target.value)} value={theme}>
            <option value="default">Default</option>
            <option value="blue">Blue Theme</option>
            <option value="green">Green Theme</option>
            <option value="pink">Pink Theme</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''} ${theme}`}>
      <h1>Todo List</h1>
      <button onClick={handleLogout} className="logout-btn" disabled={isLoading}>
        Logout
      </button>
      
      {isLoading && <div className="loading">Loading...</div>}
      
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => handleKeyPress(e, addTask)}
          placeholder="Enter a task"
          disabled={isLoading}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={isLoading}
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          disabled={isLoading}
        />
        <button onClick={addTask} disabled={isLoading || !input.trim()}>
          {isLoading ? 'Adding...' : 'Add'}
        </button>
      </div>
      
      <ul className="task-list">
        {tasks.length === 0 ? (
          <li className="no-tasks">
            {isLoading ? 'Loading tasks...' : 'No tasks added yet.'}
          </li>
        ) : (
          tasks.map((todo, index) => (
            <li key={todo._id} className={todo.completed ? 'completed' : ''}>
              <div className="task-content">
                <span className="task-text">
                  {todo.task} {todo.date && `— ${todo.date}`} {todo.time && todo.time}
                </span>
              </div>
              <div className="task-actions">
                <button 
                  className="move-btn move-up-btn" 
                  onClick={() => moveTaskUp(index)} 
                  disabled={index === 0 || isLoading}
                  title="Move up"
                >
                  ↑
                </button>
                <button 
                  className="move-btn move-down-btn" 
                  onClick={() => moveTaskDown(index)} 
                  disabled={index === tasks.length - 1 || isLoading}
                  title="Move down"
                >
                  ↓
                </button>
                <button 
                  onClick={() => toggleTask(todo._id)} 
                  disabled={isLoading}
                  className="toggle-btn"
                  title={todo.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                  {todo.completed ? '↶' : '✓'}
                </button>
                <button 
                  className="delete-btn" 
                  onClick={() => deleteTask(todo._id)}
                  disabled={isLoading}
                  title="Delete task"
                >
                  🗑️
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
      
      <div className="theme-controls">
        <button onClick={toggleDarkMode}>Toggle Dark Mode</button>
        <select onChange={(e) => changeTheme(e.target.value)} value={theme}>
          <option value="default">Default</option>
          <option value="blue">Blue Theme</option>
          <option value="green">Green Theme</option>
          <option value="pink">Pink Theme</option>
        </select>
      </div>
      
      {tasks.length > 0 && (
        <div className="task-stats">
          <small>
            Total: {tasks.length} | 
            Completed: {tasks.filter(t => t.completed).length} | 
            Pending: {tasks.filter(t => !t.completed).length}
          </small>
        </div>
      )}
    </div>
  );
}

export default App;
