import os
import json
import uuid
from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from datetime import timedelta

app = Flask(__name__, static_folder='.', static_url_path='')
app.secret_key = 'my-very-secret-key-1234'  # 반드시 고정값으로 설정
CORS(app, supports_credentials=True)
app.permanent_session_lifetime = timedelta(days=30)  # 30일 유지
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = False  # http 환경에서는 False, https에서는 True
app.config['SESSION_COOKIE_PATH'] = '/'

ADMIN_ID = 'rnjsdhepd'
ADMIN_PW = 'rnjsdhepd'
GREETING_FILE = 'greeting.json'
GALLERY_FOLDER = os.path.join('images', 'gallery')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
PRODUCTS_FILE = 'products.json'
PRODUCTS_IMAGE_FOLDER = os.path.join('images', 'products')
GALLERY_ORDER_FILE = 'gallery_order.json'

# 폴더/파일 충돌 근본적 차단: 파일로 존재하면 명확한 에러 메시지와 함께 실행 중단
if os.path.exists(PRODUCTS_IMAGE_FOLDER) and not os.path.isdir(PRODUCTS_IMAGE_FOLDER):
    raise RuntimeError(
        f"경로 {PRODUCTS_IMAGE_FOLDER}가 파일로 존재합니다. "
        "이 폴더는 반드시 폴더여야 하며, 파일로 존재하면 서버가 실행되지 않습니다. "
        "파일을 직접 삭제하고 폴더로 만들어 주세요."
    )
os.makedirs(PRODUCTS_IMAGE_FOLDER, exist_ok=True)

os.makedirs(GALLERY_FOLDER, exist_ok=True)

# 대표 인사말 데이터
greeting_data = {
    "greeting": "안녕하세요.\n정성과 신뢰로 보답하는 농업회사법인 ㈜에이치팜입니다.\n\n저희는 청양고추와 들깨를 전문적으로 재배하고 가공하여\n믿을 수 있는 농산물을 제공하고 있습니다.\n\n앞으로도 더 좋은 품질의 제품으로 보답하겠습니다.\n감사합니다."
}

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
        if keep_logged_in:
            session.permanent = True
        else:
            session.permanent = False
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'message': '아이디 또는 비밀번호가 올바르지 않습니다.'}), 401

@app.route('/api/greeting', methods=['GET'])
def get_greeting():
    try:
        if os.path.exists(GREETING_FILE):
            with open(GREETING_FILE, 'r', encoding='utf-8') as f:
                return jsonify(json.load(f))
    except Exception as e:
        print(f"Error loading greeting: {e}")
    return jsonify(greeting_data)  # 파일이 없거나 에러 시 기본 인사말 반환

@app.route('/api/greeting', methods=['POST'])
def save_greeting():
    # if not session.get('admin'):
    #     return jsonify({'success': False, 'message': '관리자 인증 필요'}), 403
    data = request.get_json()
    greeting = data.get('greeting', '').strip()
    if not greeting:
        return jsonify({'success': False, 'message': '인사말이 비어 있습니다.'}), 400
    with open(GREETING_FILE, 'w', encoding='utf-8') as f:
        json.dump({'greeting': greeting}, f, ensure_ascii=False)
    return jsonify({'success': True})

@app.route('/api/gallery/save', methods=['POST'])
def gallery_save():
    if not session.get('admin'):
        return jsonify({'success': False, 'message': '관리자 인증 필요'}), 403
    data = request.get_json()
    images = data.get('images', [])
    deleted = data.get('deleted', [])
    # 1. 삭제 처리
    for filename in deleted:
        if filename and allowed_file(filename):
            file_path = os.path.join(GALLERY_FOLDER, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
    # 2. 순서 저장
    with open(GALLERY_ORDER_FILE, 'w', encoding='utf-8') as f:
        json.dump(images, f, ensure_ascii=False)
    return jsonify({'success': True})

@app.route('/api/gallery/list', methods=['GET'])
def gallery_list():
    files = [f for f in os.listdir(GALLERY_FOLDER) if allowed_file(f)]
    # 순서 파일이 있으면 그 순서대로, 없으면 파일명 정렬
    order = []
    if os.path.exists(GALLERY_ORDER_FILE):
        try:
            with open(GALLERY_ORDER_FILE, 'r', encoding='utf-8') as f:
                order = json.load(f)
        except Exception:
            order = []
    if order:
        ordered = [f for f in order if f in files]
        unordered = [f for f in files if f not in order]
        result = ordered + sorted(unordered)
    else:
        result = sorted(files)
    return jsonify({'images': result})

@app.route('/api/gallery/upload', methods=['POST'])
def gallery_upload():
    if not session.get('admin'):
        return jsonify({'success': False, 'message': '관리자 인증 필요'}), 403
    if 'files' not in request.files:
        return jsonify({'success': False, 'message': '파일이 없습니다.'}), 400
    files = request.files.getlist('files')
    saved_files = []
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            save_path = os.path.join(GALLERY_FOLDER, filename)
            file.save(save_path)
            saved_files.append(filename)
    if saved_files:
        return jsonify({'success': True, 'filenames': saved_files})
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

@app.route('/api/products/<category>/reorder', methods=['POST'])
def reorder_products(category):
    if not session.get('admin'):
        return jsonify({'success': False, 'message': '관리자 인증 필요'}), 403
    data = load_products()
    if category not in data:
        return jsonify({'success': False, 'message': '잘못된 카테고리'}), 400
    req = request.get_json()
    new_products = req.get('products')
    if not isinstance(new_products, list):
        return jsonify({'success': False, 'message': '잘못된 데이터'}), 400
    data[category] = new_products
    save_products(data)
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False) 