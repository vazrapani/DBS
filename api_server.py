import os
import json
import uuid
from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from datetime import timedelta

app = Flask(__name__, static_folder='.', static_url_path='')
app.secret_key = 'your_secret_key'  # 실제 서비스 시 더 복잡하게 변경
CORS(app, supports_credentials=True)
app.permanent_session_lifetime = timedelta(days=30)

ADMIN_ID = 'rnjsdhepd'
ADMIN_PW = 'rnjsdhepd'
GREETING_FILE = 'greeting.json'
GALLERY_FOLDER = os.path.join('images', 'gallery')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
PRODUCTS_FILE = 'products.json'
PRODUCTS_IMAGE_FOLDER = os.path.join('images', 'products')

os.makedirs(GALLERY_FOLDER, exist_ok=True)
os.makedirs(PRODUCTS_IMAGE_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    keep_logged_in = data.get('keepLoggedIn', False)
    if username == ADMIN_ID and password == ADMIN_PW:
        session['admin'] = True
        session.permanent = bool(keep_logged_in)
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': '아이디 또는 비밀번호가 올바르지 않습니다.'}), 401

@app.route('/api/greeting', methods=['GET'])
def get_greeting():
    if not os.path.exists(GREETING_FILE):
        # 기본 인사말 생성
        with open(GREETING_FILE, 'w', encoding='utf-8') as f:
            json.dump({'greeting': '안녕하세요. 동빈 스토어 입니다.\n저희는 전국 식당 및 업소에 신선하고 믿을 수 있는 식자재를 공급하고 있습니다.\n앞으로도 변함없는 품질과 서비스로 보답하겠습니다.\n\n대표 궈노뎅'}, f, ensure_ascii=False)
    with open(GREETING_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify({'greeting': data.get('greeting', '')})

@app.route('/api/greeting', methods=['POST'])
def set_greeting():
    if not session.get('admin'):
        return jsonify({'success': False, 'message': '관리자 인증 필요'}), 403
    data = request.get_json()
    greeting = data.get('greeting', '').strip()
    with open(GREETING_FILE, 'w', encoding='utf-8') as f:
        json.dump({'greeting': greeting}, f, ensure_ascii=False)
    return jsonify({'success': True})

@app.route('/api/gallery/list', methods=['GET'])
def gallery_list():
    files = [f for f in os.listdir(GALLERY_FOLDER) if allowed_file(f)]
    files.sort()
    return jsonify({'images': files})

@app.route('/api/gallery/upload', methods=['POST'])
def gallery_upload():
    if not session.get('admin'):
        return jsonify({'success': False, 'message': '관리자 인증 필요'}), 403
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': '파일이 없습니다.'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': '파일명이 비어 있습니다.'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        save_path = os.path.join(GALLERY_FOLDER, filename)
        file.save(save_path)
        return jsonify({'success': True, 'filename': filename})
    else:
        return jsonify({'success': False, 'message': '허용되지 않는 파일 형식입니다.'}), 400

@app.route('/api/gallery/delete', methods=['POST'])
def gallery_delete():
    if not session.get('admin'):
        return jsonify({'success': False, 'message': '관리자 인증 필요'}), 403
    data = request.get_json()
    filename = data.get('filename')
    if not filename or not allowed_file(filename):
        return jsonify({'success': False, 'message': '잘못된 파일명입니다.'}), 400
    file_path = os.path.join(GALLERY_FOLDER, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': '파일이 존재하지 않습니다.'}), 404

@app.route('/')
def root():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('.', path)

def load_products():
    if not os.path.exists(PRODUCTS_FILE):
        with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
            json.dump({'red-pepper': [], 'perilla': [], 'processed': []}, f, ensure_ascii=False)
    with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_products(data):
    with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route('/api/products/<category>', methods=['GET'])
def get_products(category):
    data = load_products()
    if category not in data:
        return jsonify({'success': False, 'message': '잘못된 카테고리'}), 400
    return jsonify({'success': True, 'products': data[category]})

@app.route('/api/products/<category>', methods=['POST'])
def add_product(category):
    if not session.get('admin'):
        return jsonify({'success': False, 'message': '관리자 인증 필요'}), 403
    data = load_products()
    if category not in data:
        return jsonify({'success': False, 'message': '잘못된 카테고리'}), 400
    title = request.form.get('title', '').strip()
    description = request.form.get('description', '').strip()
    prices_json = request.form.get('prices', '[]')
    try:
        prices = json.loads(prices_json)
    except:
        prices = []
    image_file = request.files.get('image')
    if not title or not image_file or not allowed_file(image_file.filename):
        return jsonify({'success': False, 'message': '필수 정보 누락 또는 이미지 형식 오류'}), 400
    product_id = str(uuid.uuid4())
    ext = image_file.filename.rsplit('.', 1)[1].lower()
    image_filename = f'{product_id}.{ext}'
    image_path = os.path.join(PRODUCTS_IMAGE_FOLDER, image_filename)
    image_file.save(image_path)
    product = {
        'id': product_id,
        'title': title,
        'description': description,
        'prices': prices,
        'image': f'images/products/{image_filename}'
    }
    data[category].append(product)
    save_products(data)
    return jsonify({'success': True, 'product': product})

@app.route('/api/products/<category>', methods=['DELETE'])
def delete_product(category):
    if not session.get('admin'):
        return jsonify({'success': False, 'message': '관리자 인증 필요'}), 403
    data = load_products()
    if category not in data:
        return jsonify({'success': False, 'message': '잘못된 카테고리'}), 400
    req = request.get_json()
    product_id = req.get('id')
    if not product_id:
        return jsonify({'success': False, 'message': '상품 id 누락'}), 400
    products = data[category]
    product = next((p for p in products if p['id'] == product_id), None)
    if not product:
        return jsonify({'success': False, 'message': '상품을 찾을 수 없음'}), 404
    # 이미지 파일 삭제
    image_path = product.get('image')
    if image_path and os.path.exists(image_path):
        try:
            os.remove(image_path)
        except:
            pass
    data[category] = [p for p in products if p['id'] != product_id]
    save_products(data)
    return jsonify({'success': True})

@app.route('/api/products/<category>', methods=['PATCH'])
def update_product(category):
    if not session.get('admin'):
        return jsonify({'success': False, 'message': '관리자 인증 필요'}), 403
    data = load_products()
    if category not in data:
        return jsonify({'success': False, 'message': '잘못된 카테고리'}), 400
    product_id = request.form.get('id')
    if not product_id:
        return jsonify({'success': False, 'message': '상품 id 누락'}), 400
    products = data[category]
    product = next((p for p in products if p['id'] == product_id), None)
    if not product:
        return jsonify({'success': False, 'message': '상품을 찾을 수 없음'}), 404
    # 수정할 필드
    title = request.form.get('title', '').strip()
    description = request.form.get('description', '').strip()
    prices_json = request.form.get('prices', '[]')
    try:
        prices = json.loads(prices_json)
    except:
        prices = []
    image_file = request.files.get('image')
    # 기존 이미지 삭제 및 새 이미지 저장
    if image_file and allowed_file(image_file.filename):
        # 기존 이미지 삭제
        old_image_path = product.get('image')
        if old_image_path and os.path.exists(old_image_path):
            try:
                os.remove(old_image_path)
            except:
                pass
        ext = image_file.filename.rsplit('.', 1)[1].lower()
        image_filename = f'{product_id}.{ext}'
        image_path = os.path.join(PRODUCTS_IMAGE_FOLDER, image_filename)
        image_file.save(image_path)
        product['image'] = f'images/products/{image_filename}'
    # 필드 업데이트
    if title:
        product['title'] = title
    product['description'] = description
    product['prices'] = prices
    save_products(data)
    return jsonify({'success': True, 'product': product})

if __name__ == '__main__':
    app.run(port=5000, debug=False) 