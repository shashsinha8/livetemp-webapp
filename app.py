from flask import Flask, render_template, jsonify
import firebase_admin
from firebase_admin import credentials, db
from datetime import datetime, timedelta
import os
import json
from collections import deque

app = Flask(__name__)

# Store 24 hours of readings at 5-minute intervals (288 points per day)
temperature_history = deque(maxlen=288)

# Store last 10 minutes for detailed view
recent_history = deque(maxlen=10)

# Track last stored 5-minute interval
last_five_min_store = None

# Handle credentials for both local and production environments
if os.path.exists("serviceAccountKey.json"):
    cred = credentials.Certificate("serviceAccountKey.json")
else:
    google_creds = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if google_creds:
        service_account_info = json.loads(google_creds)
        cred = credentials.Certificate(service_account_info)
    else:
        raise ValueError("No credentials found!")

firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://livetemp-7257d-default-rtdb.firebaseio.com'
})

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_temperature')
def get_temperature():
    global last_five_min_store
    temp_ref = db.reference('/sensor/temperature')
    temperature = temp_ref.get()
    current_time = datetime.now()
    
    # Always store in recent history (for base view)
    recent_history.append({
        'temperature': float(temperature),
        'timestamp': current_time.strftime('%H:%M')
    })
    
    # Check if we should store a 5-minute reading (for expanded view)
    current_five_min = current_time.replace(second=0, microsecond=0)
    current_five_min = current_five_min.replace(minute=current_five_min.minute - (current_five_min.minute % 5))
    
    if last_five_min_store is None or current_five_min > last_five_min_store:
        temperature_history.append({
            'temperature': float(temperature),
            'timestamp': current_five_min.strftime('%H:%M'),
            'full_timestamp': current_five_min.isoformat()
        })
        last_five_min_store = current_five_min
    
    return jsonify({
        'temperature': float(temperature),
        'timestamp': current_time.strftime('%H:%M')
    })

@app.route('/get_temperature_history')
def get_temperature_history():
    # Return both recent and historical data with timestamps
    return jsonify({
        'recent': list(recent_history),
        'historical': list(temperature_history),
        'metadata': {
            'last_update': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'interval': '5min',
            'max_points': 288  # 24 hours of 5-minute intervals
        }
    })

if __name__ == '__main__':
    app.run(debug=True)