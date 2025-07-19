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


  const fetchTasks = (userRoll) => {
    fetch(`https://todo-list-5-bc98.onrender.com/api/todos/${userRoll}`)
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(err => console.error('Error fetching tasks:', err));
  };


  const handleLogin = () => {
    fetch('https://todo-list-5-bc98.onrender.com/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roll_number: rollNumber, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.msg === 'Login successful') {
          localStorage.setItem('rollNumber', rollNumber);
          setIsLoggedIn(true);
          fetchTasks(rollNumber);
        } else {
          alert(data.error);
        }
      });
  };


  const handleRegister = () => {
    fetch('https://todo-list-5-bc98.onrender.com/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roll_number: rollNumber, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.msg) {
          alert(data.msg);
          setIsRegistering(false);
        } else {
          alert(data.error);
        }
      });
  };


  const handleLogout = () => {
    localStorage.removeItem('rollNumber');
    setRollNumber('');
    setPassword('');
    setIsLoggedIn(false);
    setTasks([]);
  };


  const addTask = () => {
    const storedRollNumber = localStorage.getItem('rollNumber');
    if (input.trim() !== '' && storedRollNumber) {
      fetch('https://todo-list-5-bc98.onrender.com/api/todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          task: input, 
          roll_number: storedRollNumber,
          date,
          time
        })
      })
        .then(() => {
          setInput('');
          setDate('');
          setTime('');
          fetchTasks(storedRollNumber);
        });
    }
  };


  const deleteTask = (id) => {
    const storedRollNumber = localStorage.getItem('rollNumber');
    fetch(`https://todo-list-5-bc98.onrender.com/api/todo/${id}`, {
      method: 'DELETE'
    })
      .then(() => fetchTasks(storedRollNumber));
  };


  const toggleTask = (id) => {
    const storedRollNumber = localStorage.getItem('rollNumber');
    fetch(`https://todo-list-5-bc98.onrender.com/api/todo/${id}`, {
      method: 'PUT'
    }).then(() => {
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
    });
  };

  const moveTaskUp = (index) => {
    if (index > 0) {
      const newTasks = [...tasks];
      [newTasks[index], newTasks[index - 1]] = [newTasks[index - 1], newTasks[index]];
      setTasks(newTasks);
    }
  };

  const moveTaskDown = (index) => {
    if (index < tasks.length - 1) {
      const newTasks = [...tasks];
      [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]];
      setTasks(newTasks);
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


  if (!isLoggedIn) {
    return (
      <div className={`app-container ${darkMode ? 'dark-mode' : ''} ${theme}`}>
        <h1>{isRegistering ? 'Register' : 'Login'}</h1>
        <input
          type="text"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value)}
          placeholder="Roll Number"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        {isRegistering ? (
          <>
            <button onClick={handleRegister}>Register</button>
            <p onClick={() => setIsRegistering(false)}>Already have an account? Login</p>
          </>
        ) : (
          <>
            <button onClick={handleLogin}>Login</button>
            <p onClick={() => setIsRegistering(true)}>Create a new account</p>
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
      <button onClick={handleLogout} className="logout-btn">Logout</button>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a task"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <button onClick={addTask}>Add</button>
      </div>
      <ul className="task-list">
        {tasks.length === 0 ? (
          <li>No tasks added yet.</li>
        ) : (
          tasks.map((todo, index) => (
            <li key={todo._id} className={todo.completed ? 'completed' : ''}>
              <button onClick={() => moveTaskUp(index)} disabled={index === 0}>↑</button>
              <button onClick={() => moveTaskDown(index)} disabled={index === tasks.length - 1}>↓</button>
              {todo.task} — {todo.date} {todo.time}
              <button onClick={() => toggleTask(todo._id)}>Toggle</button>
              <button className="delete-btn" onClick={() => deleteTask(todo._id)}>Delete</button>
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
    </div>
  );
}


export default App;
