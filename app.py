from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash  # Added generate_password_hash

app = Flask(__name__)
CORS(app)

# MongoDB Connection
client = MongoClient("mongodb+srv://kbatra339:3zre6Icx07XDcK0I@cluster0.wgcc4j6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")

db = client['todo_db']
users_collection = db['users']
tasks_collection = db['tasks']

# Helper to convert ObjectId to string
def serialize_task(task):
    return {
        '_id': str(task['_id']),
        'task': task['task'],
        'completed': task['completed'],
        'roll_number': task['roll_number'],
        'date': task.get('date', ''),    # new field
        'time': task.get('time', '')     # new field
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

    hashed_password = generate_password_hash(password)  # Password is hashed here
    users_collection.insert_one({
        'roll_number': roll_number,
        'password': hashed_password  # Store hashed password
    })
    return jsonify({'msg': 'Registration successful'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    roll_number = data.get('roll_number')
    password = data.get('password')

    user = users_collection.find_one({"roll_number": roll_number})
    if user and check_password_hash(user['password'], password):  # Check hashed password
        return jsonify({'msg': 'Login successful'})
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/todo', methods=['POST'])
def add_task():
    data = request.json
    task_text = data['task']
    roll_number = data['roll_number']
    date = data.get('date', '')   # new field
    time = data.get('time', '')   # new field

    result = tasks_collection.insert_one({
        'task': task_text,
        'completed': False,
        'roll_number': roll_number,
        'date': date,    # store date
        'time': time     # store time
    })
    return jsonify({'msg': 'Task added', 'id': str(result.inserted_id)})

@app.route('/api/todos/<roll_number>', methods=['GET'])
def get_tasks(roll_number):
    tasks = list(tasks_collection.find({'roll_number': roll_number}))
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

if __name__ == '__main__':
    app.run(debug=True)
