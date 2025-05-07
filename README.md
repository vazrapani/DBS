# Hybrid WebApp 개발 환경 (Express + Flask)

## 구조
- **api_server.py** (Flask, 5000번 포트): API 서버 (데이터, 업로드 등)
- **server.js** (Express, 8888번 포트): 정적 파일 + API 프록시 (파일 업로드 포함 완벽 지원)
- **index.html, admin.html 등 모든 웹페이지는 http://localhost:8888에서 접근**

## 실행 방법

### 1. Python(Flask) API 서버 실행
```bash
python api_server.py
```

### 2. Node.js 프록시 서버 실행
```bash
npm install   # 최초 1회
npm start     # 또는 node server.js
```

### 3. 접속
- http://localhost:8888/index.html
- http://localhost:8888/admin.html

## 주요 특징
- **파일 업로드, 이미지 등 multipart/form-data 완벽 지원**
- 프록시 서버가 정적 파일과 API를 모두 서비스하므로, 하이브리드앱(예: Cordova, Capacitor)으로 감쌀 때도 동일하게 동작
- git에 올리면 누구나 위 방법대로 바로 실행 가능

## 기타
- 기존 server.py는 더 이상 사용하지 않음 (Express 기반 server.js만 사용)
- 환경/포트 등은 필요시 server.js, api_server.py에서 수정 가능

## 웹사이트 주소
https://vazrapani.github.io/DBS

## 프로젝트 소개
상품 목록을 보여주는 웹 페이지입니다.

## 주요 기능
- 상품 이미지 클릭시 확대 보기
- 카카오톡 문의하기
- 전화 문의하기

## 기술 스택
- HTML5
- CSS3
- JavaScript

## 연락처
- 카카오톡: [오픈채팅방](https://open.kakao.com/o/shaHxdsh)
- 전화: 010-9002-0797

## 설치 및 실행 방법
1. 저장소 클론
```bash
git clone https://github.com/vazrapani/DBS.git
```

2. 서버 실행
- Flask API 서버 실행: `python api_server.py`
- Express 프록시 서버 실행: `npm install && npm start` 또는 `node server.js`

3. 브라우저에서 접속
```
http://localhost:8888
``` 