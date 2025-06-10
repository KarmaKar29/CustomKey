from flask import Flask, jsonify, request, render_template_string, send_from_directory
import random
import re
import os

app = Flask(__name__, static_folder='.', static_url_path='')

CHAR_SETS = {
    "lowercase": "abcdefghijklmnopqrstuvwxyz",
    "uppercase": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "numbers": "0123456789",
    "special": "!@#$%^&*()-_=+[]{}|;:,.<>?/~`",
}

# Serve the HTML
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/styles.css')
def styles():
    return send_from_directory('.', 'styles.css')

@app.route('/script.js')
def script():
    return send_from_directory('.', 'script.js')

def sanitize_keywords(raw_keywords):
    if not raw_keywords:
        return []
    # split by comma or whitespace and filter out empties
    parts = re.split(r'[\s,]+', raw_keywords)
    return [w.strip() for w in parts if w.strip()]

def shuffle_string(s):
    arr = list(s)
    random.shuffle(arr)
    return ''.join(arr)

def generate_password(data):
    keywords = data.get('keywords', [])
    length = int(data.get('length', 16))
    include_uppercase = data.get('include_uppercase', True)
    include_numbers = data.get('include_numbers', True)
    include_special = data.get('include_special', True)

    available_chars = CHAR_SETS['lowercase']
    if include_uppercase:
        available_chars += CHAR_SETS['uppercase']
    if include_numbers:
        available_chars += CHAR_SETS['numbers']
    if include_special:
        available_chars += CHAR_SETS['special']

    clean_keywords = [re.sub(r'[^\w]', '', k) for k in keywords]

    keywords_joined = ''.join(clean_keywords)
    base_length = length - len(keywords_joined)
    base_length = max(0, base_length)

    base_password = ''.join(random.choice(available_chars) for _ in range(base_length))

    combined = base_password + keywords_joined
    combined = shuffle_string(combined)

    if len(combined) > length:
        combined = combined[:length]

    return combined

@app.route('/generate_password', methods=['POST'])
def generate_password_api():
    try:
        data = request.json
        # Ensure keys default if missing
        if data is None:
            return jsonify({'error': 'Missing JSON data'}), 400
        password = generate_password(data)
        return jsonify({'password': password})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run the app on localhost with debug mode for ease of testing
    app.run(debug=True, host='127.0.0.1', port=5000)
