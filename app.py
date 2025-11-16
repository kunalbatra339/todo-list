from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
import time
import os  # <-- Import os to access environment variables
from dotenv import load_dotenv  # <-- Import dotenv to load the .env file

# Load environment variables from a .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# --- MongoDB Connection (Updated) ---

# 1. Get the MongoDB URI from the environment variable
MONGO_URI = os.environ.get('MONGO_URI')

# 2. Optional but recommended: Check if the variable exists
if not MONGO_URI:
    raise EnvironmentError("MONGO_URI environment variable not set. Please create a .env file and add it.")

# 3. Connect to MongoDB using the variable
db = client['todo_db']
client = MongoClient(MONGO_URI)
users_collection = db['users']
tasks_collection = db['tasks']


# Helper to convert ObjectId to string
def serialize_task(task):
    return {
        '_id': str(task['_id']),
        'task': task['task'],
        'completed': task['completed'],
        'roll_number': task['roll_number'],
        'date': task.get('date', ''),
        'time': task.get('time', ''),
        'order': task.get('order', 0)  # Added order field
    }


@app.route('/')
def home():
    return 'Flask App is Running!'


@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    roll_number = data['roll_number']
    password = data['password']


    if users_collection.find_one({'roll_number': roll_number}):
        return jsonify({'error': 'User already exists'}), 400


    hashed_password = generate_password_hash(password)
    users_collection.insert_one({
        'roll_number': roll_number,
        'password': hashed_password
    })
    return jsonify({'msg': 'Registration successful'})


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    roll_number = data.get('roll_number')
    password = data.get('password')


    user = users_collection.find_one({"roll_number": roll_number})
    if user and check_password_hash(user['password'], password):
        return jsonify({'msg': 'Login successful'})
    else:
        return jsonify({'error': 'Invalid credentials'}), 401


@app.route('/api/todo', methods=['POST'])
def add_task():
    data = request.json
    task_text = data['task']
    roll_number = data['roll_number']
    date = data.get('date', '')
    time = data.get('time', '')
    
    # Get the highest order number for this user and add 1
    highest_order_task = tasks_collection.find_one(
        {'roll_number': roll_number}, 
        sort=[('order', -1)]
    )
    next_order = (highest_order_task.get('order', -1) + 1) if highest_order_task else 0


    result = tasks_collection.insert_one({
        'task': task_text,
        'completed': False,
        'roll_number': roll_number,
        'date': date,
        'time': time,
        'order': next_order  # Add order field
    })
    return jsonify({'msg': 'Task added', 'id': str(result.inserted_id)})


@app.route('/api/todos/<roll_number>', methods=['GET'])
def get_tasks(roll_number):
    # Sort tasks by order field
    tasks = list(tasks_collection.find({'roll_number': roll_number}).sort('order', 1))
    serialized_tasks = [serialize_task(task) for task in tasks]
    return jsonify(serialized_tasks)


@app.route('/api/todo/<task_id>', methods=['PUT'])
def toggle_task(task_id):
    task = tasks_collection.find_one({'_id': ObjectId(task_id)})
    if task:
        new_status = not task['completed']
        tasks_collection.update_one({'_id': ObjectId(task_id)}, {'$set': {'completed': new_status}})
        return jsonify({'msg': 'Task status updated'})
    else:
        return jsonify({'error': 'Task not found'}), 404


@app.route('/api/todo/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    result = tasks_collection.delete_one({'_id': ObjectId(task_id)})
    if result.deleted_count == 1:
        return jsonify({'msg': 'Task deleted'})
    else:
        return jsonify({'error': 'Task not found'}), 404


# NEW ENDPOINT: Reorder tasks
@app.route('/api/reorder-todos', methods=['PUT'])
def reorder_tasks():
    try:
        data = request.json
        roll_number = data.get('roll_number')
        task_ids = data.get('taskIds', [])
        
        if not roll_number or not task_ids:
            return jsonify({'error': 'Missing roll_number or taskIds'}), 400
        
        # Update the order field for each task
        for index, task_id in enumerate(task_ids):
            try:
                tasks_collection.update_one(
                    {
                        '_id': ObjectId(task_id),
                        'roll_number': roll_number  # Security: ensure user owns the task
                    },
                    {'$set': {'order': index}}
                )
            except Exception as e:
                print(f"Error updating task {task_id}: {e}")
                continue
        
        return jsonify({'msg': 'Tasks reordered successfully'})
    
    except Exception as e:
        return jsonify({'error': f'Failed to reorder tasks: {str(e)}'}), 500


# NEW ENDPOINT: Move single task up/down (alternative approach)
@app.route('/api/move-task', methods=['PUT'])
def move_task():
    try:
        data = request.json
        task_id = data.get('taskId')
        roll_number = data.get('roll_number')
        direction = data.get('direction')  # 'up' or 'down'
        
        if not all([task_id, roll_number, direction]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Get all tasks for the user, sorted by order
        tasks = list(tasks_collection.find({'roll_number': roll_number}).sort('order', 1))
        
        # Find the current task index
        current_index = None
        for i, task in enumerate(tasks):
            if str(task['_id']) == task_id:
                current_index = i
                break
        
        if current_index is None:
            return jsonify({'error': 'Task not found'}), 404
        
        # Calculate new index
        if direction == 'up' and current_index > 0:
            new_index = current_index - 1
        elif direction == 'down' and current_index < len(tasks) - 1:
            new_index = current_index + 1
        else:
            return jsonify({'msg': 'No movement needed'})
        
        # Swap the order values
        current_order = tasks[current_index].get('order', current_index)
        target_order = tasks[new_index].get('order', new_index)
        
        # Update both tasks
        tasks_collection.update_one(
            {'_id': tasks[current_index]['_id']},
            {'$set': {'order': target_order}}
        )
        
        tasks_collection.update_one(
            {'_id': tasks[new_index]['_id']},
            {'$set': {'order': current_order}}
        )
        
        return jsonify({'msg': 'Task moved successfully'})
    
    except Exception as e:
        return jsonify({'error': f'Failed to move task: {str(e)}'}), 500


# OPTIONAL: Fix existing tasks that don't have order field
@app.route('/api/fix-task-order/<roll_number>', methods=['POST'])
def fix_task_order(roll_number):
    try:
        # Get all tasks for user without order field or with order = None
        tasks = list(tasks_collection.find({'roll_number': roll_number, '$or': [{'order': {'$exists': False}}, {'order': None}]}))
        
        # Assign order based on creation time or existing order
        for index, task in enumerate(tasks):
            tasks_collection.update_one(
                {'_id': task['_id']},
                {'$set': {'order': index}}
            )
        
        return jsonify({'msg': f'Fixed order for {len(tasks)} tasks'})
    
    except Exception as e:
        return jsonify({'error': f'Failed to fix task order: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(debug=True)
