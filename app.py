from flask import Flask, render_template, jsonify
import firebase_admin
from firebase_admin import credentials, db
from datetime import datetime
import os
import json
from collections import deque

app = Flask(__name__)

# Handle credentials for both local and production environments
if os.path.exists("serviceAccountKey.json"):
    # Local development
    cred = credentials.Certificate("serviceAccountKey.json")
else:
    # Production environment (Render.com)
    google_creds = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if google_creds:
        # Convert the JSON string to a temporary file
        service_account_info = json.loads(google_creds)
        cred = credentials.Certificate(service_account_info)
    else:
        raise ValueError("No credentials found!")

firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://livetemp-7257d-default-rtdb.firebaseio.com'
})

# Store last 500 readings in memory
temperature_history = deque(maxlen=500)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_temperature')
def get_temperature():
    temp_ref = db.reference('/sensor/temperature')
    temperature = temp_ref.get()
    timestamp = datetime.now().strftime('%H:%M')
    
    # Store in history
    temperature_history.append({
        'temperature': temperature,
        'timestamp': timestamp
    })
    
    return jsonify({
        'temperature': temperature,
        'timestamp': timestamp
    })

@app.route('/get_temperature_history')
def get_temperature_history():
    return jsonify(list(temperature_history))

if __name__ == '__main__':
    app.run(debug=True) 