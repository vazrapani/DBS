document.addEventListener('DOMContentLoaded', function() {
    // 메뉴 버튼 클릭 시 탭 전환
    const menuBtns = document.querySelectorAll('.admin-menu-btn');
    const tabSections = document.querySelectorAll('.admin-tab-section');
    menuBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            menuBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const tab = this.getAttribute('data-tab');
            tabSections.forEach(sec => sec.style.display = 'none');
            document.getElementById('tab-' + tab).style.display = 'block';
            // 인사말 탭이 열릴 때마다 인사말 불러오기
            if (tab === 'greeting') {
                const textarea = document.getElementById('greetingText');
                if (textarea) {
                    textarea.value = '데이터 로딩중...';
                    textarea.classList.add('loading-text');
                }
                fetch('/api/greeting')
                    .then(res => res.json())
                    .then(data => {
                        if (data.greeting) {
                            if (textarea) {
                                textarea.value = data.greeting;
                                textarea.classList.remove('loading-text');
                            }
                        }
                    })
                    .catch(() => {
                        if (textarea) {
                            textarea.value = '데이터 로딩중...';
                            textarea.classList.add('loading-text');
                        }
                    });
            }
        });
    });
    // 기본값: 상품카드 탭
    document.querySelector('.admin-menu-btn[data-tab="product"]').classList.add('active');
    document.getElementById('tab-product').style.display = 'block';

    // 인사말 저장 기능 (페이지 이동 방지)
    const greetingForm = document.getElementById('greetingForm');
    if (greetingForm) {
        greetingForm.addEventListener('submit', function(e) {
            e.preventDefault(); // 폼 제출 시 새로고침/탭 이동 방지
            const textarea = document.getElementById('greetingText');
            const msgArea = document.querySelector('.greeting-message-area');
            if (!msgArea) return;
            let timer = msgArea._timer;
            if (timer) clearTimeout(timer);
            msgArea.style.opacity = 0;
            msgArea.textContent = '';
            const value = textarea ? textarea.value.trim() : '';
            if (!value) {
                msgArea.textContent = '인사말을 입력해 주세요.';
                msgArea.style.color = '#ff6b6b';
                msgArea.style.opacity = 1;
                msgArea._timer = setTimeout(() => {
                    msgArea.style.opacity = 0;
                    setTimeout(() => { msgArea.textContent = ''; }, 500);
                }, 3000);
                return;
            }
            fetch('/api/greeting', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ greeting: value }),
                credentials: 'include'
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    msgArea.textContent = '저장되었습니다';
                    msgArea.style.color = '#4a90e2';
                } else {
                    msgArea.textContent = (data.message || '저장에 실패했습니다').replace(/\.$/, '');
                    msgArea.style.color = '#ff6b6b';
                }
                msgArea.style.opacity = 1;
                msgArea._timer = setTimeout(() => {
                    msgArea.style.opacity = 0;
                    setTimeout(() => { msgArea.textContent = ''; }, 500);
                }, 3000);
            })
            .catch(() => {
                msgArea.textContent = '저장 중 오류가 발생했습니다'.replace(/\.$/, '');
                msgArea.style.color = '#ff6b6b';
                msgArea.style.opacity = 1;
                setTimeout(() => {
                    msgArea.style.opacity = 0;
                    setTimeout(() => { msgArea.textContent = ''; }, 500);
                }, 3000);
            });
        });
    }

    // 개발 환경에서만 자동 로그인
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'rnjsdhepd',
                password: 'rnjsdhepd',
                keepLoggedIn: true
            }),
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                console.log('자동 로그인 성공');
            } else {
                console.warn('자동 로그인 실패:', data.message);
            }
        })
        .catch(err => {
            console.error('자동 로그인 오류:', err);
        });
    }

    // 갤러리(현장사진) 탭 클릭 시 사진 목록 로딩 및 메시지 표시
    const galleryTabBtn = document.querySelector('.admin-menu-btn[data-tab="gallery"]');
    if (galleryTabBtn) {
        galleryTabBtn.addEventListener('click', function() {
            const galleryList = document.getElementById('galleryList');
            if (galleryList) {
                galleryList.innerHTML = '<div class="loading-text" style="width:100%;text-align:center;color:rgba(247,249,244,0.2);font-size:18px;padding:32px 0;">데이터 로딩중...</div>';
                fetch('/api/gallery/list', { credentials: 'include' })
                    .then(res => res.json())
                    .then(data => {
                        galleryList.innerHTML = '';
                        galleryImages = (data.images && data.images.length > 0) ? data.images.slice() : [];
                        renderGalleryList();
                    })
                    .catch(() => {
                        galleryList.innerHTML = '<div style="width:100%;text-align:center;color:#ff6b6b;font-size:16px;padding:32px 0;">사진 목록을 불러오는 중 오류가 발생했습니다.</div>';
                    });
            }
        });
    }

    let deletedImages = [];
    let isAnimating = false; // 애니메이션 중 여부
    // 갤러리 리스트 렌더링 함수
    function renderGalleryList() {
        const galleryList = document.getElementById('galleryList');
        if (!galleryList) return;
        galleryList.innerHTML = '';
        if (galleryImages.length > 0) {
            galleryImages.forEach((filename, idx) => {
                // admin-gallery-item 생성
                const item = document.createElement('div');
                item.className = 'admin-gallery-item';

                // 메인(이미지) 영역
                const mainDiv = document.createElement('div');
                mainDiv.className = 'admin-gallery-item-main';
                mainDiv.style.position = 'relative'; // 이미지 위에 숫자 겹치기 위해 필요
                // 순번 닷 (gallery-order-dot)
                const orderDot = document.createElement('div');
                orderDot.className = 'gallery-order-dot';
                orderDot.textContent = (idx + 1).toString();
                mainDiv.appendChild(orderDot);
                const img = document.createElement('img');
                img.src = `images/gallery/${filename}`;
                img.alt = `현장 사진 ${idx + 1}`;
                img.style.width = '274px';
                img.style.height = '274px';
                img.style.background = 'none';
                img.style.border = '1px solid rgba(255,255,255,0.05)';
                mainDiv.appendChild(img);

                // 액션(버튼/컨트롤) 영역
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'admin-gallery-item-actions';

                // 순서 조정 버튼 그룹(gallery-order-controls)
                const orderControls = document.createElement('div');
                orderControls.className = 'gallery-order-controls';
                orderControls.style.display = 'flex';
                orderControls.style.flexDirection = 'row';
                orderControls.style.alignItems = 'center';
                orderControls.style.gap = '8px';
                orderControls.style.width = 'auto';

                // 위로 이동 버튼
                const upArrow = document.createElement('div');
                upArrow.className = 'gallery-order-arrow';
                if (idx === 0) upArrow.classList.add('disabled');
                upArrow.innerHTML = '<img src="images/icon-up.svg" alt="위로" style="width:20px;height:20px;">';
                if (idx !== 0) {
                    upArrow.onclick = function(e) {
                        e.stopPropagation();
                        const temp = galleryImages[idx-1];
                        galleryImages[idx-1] = galleryImages[idx];
                        galleryImages[idx] = temp;
                        renderGalleryList();
                    };
                }
                orderControls.appendChild(upArrow);

                // 아래로 이동 버튼
                const downArrow = document.createElement('div');
                downArrow.className = 'gallery-order-arrow';
                if (idx === galleryImages.length-1) downArrow.classList.add('disabled');
                downArrow.innerHTML = '<img src="images/icon-down.svg" alt="아래로" style="width:20px;height:20px;">';
                if (idx !== galleryImages.length-1) {
                    downArrow.onclick = function(e) {
                        e.stopPropagation();
                        const temp = galleryImages[idx+1];
                        galleryImages[idx+1] = galleryImages[idx];
                        galleryImages[idx] = temp;
                        renderGalleryList();
                    };
                }
                orderControls.appendChild(downArrow);

                actionsDiv.appendChild(orderControls);

                // 갤러리 버튼 그룹(gallery-btn-group)
                const btnGroup = document.createElement('div');
                btnGroup.className = 'gallery-btn-group';
                btnGroup.style.display = 'flex';
                btnGroup.style.alignItems = 'center';
                btnGroup.style.justifyContent = 'flex-end';
                btnGroup.style.gap = '0';
                btnGroup.style.marginLeft = '12px';

                // 삭제 버튼
                const delBtn = document.createElement('button');
                delBtn.className = 'gallery-delete-btn';
                delBtn.type = 'button';
                delBtn.title = '삭제';
                delBtn.innerHTML = '<img src="images/icon-del.svg" alt="삭제" style="width:14px;height:14px;">';
                delBtn.onclick = function() {
                    if (!deletedImages.includes(filename)) deletedImages.push(filename);
                    galleryImages.splice(idx, 1);
                    renderGalleryList();
                };
                btnGroup.appendChild(delBtn);
                actionsDiv.appendChild(btnGroup);

                // 구조 조립: main → actions (세로 쌓임)
                item.appendChild(mainDiv);
                item.appendChild(actionsDiv);
                galleryList.appendChild(item);
            });
        } else {
            galleryList.innerHTML = '<div style="width:100%;text-align:center;color:rgba(247,249,244,0.4);font-size:16px;padding:32px 0;">등록된 사진이 없습니다.</div>';
        }
    }

    // 이동 버튼 전체 클릭만 막는 함수
    function disableAllMoveButtonsPointerOnly() {
        document.querySelectorAll('.gallery-order-arrow').forEach(btn => {
            btn.style.pointerEvents = 'none';
        });
    }
    // 이동 버튼 전체 클릭 가능하게 복구
    function enableAllMoveButtonsPointerOnly() {
        document.querySelectorAll('.gallery-order-arrow').forEach(btn => {
            btn.style.pointerEvents = '';
        });
    }

    // 파일 선택 시 미리보기 표시 (여러 장 지원, 삭제 버튼 포함)
    const galleryFileInput = document.getElementById('galleryFile');
    const galleryPreviewArea = document.getElementById('galleryPreviewArea');
    let selectedFiles = [];
    const fileCountBadge = document.getElementById('fileCountBadge');
    function updateFileCountBadge() {
        if (fileCountBadge) {
            fileCountBadge.textContent = selectedFiles.length > 0 ? selectedFiles.length : '0';
        }
    }
    // 페이지 로드 시 0으로 초기화
    updateFileCountBadge();
    function renderGalleryPreview() {
        galleryPreviewArea.innerHTML = '';
        galleryPreviewArea.classList.remove('has-preview');
        const galleryUploadErr = document.getElementById('galleryUploadErr');
        if (galleryUploadErr) galleryUploadErr.style.display = 'none';
        const previewFiles = selectedFiles.slice().reverse();
        if (previewFiles.length > 0) {
            galleryPreviewArea.classList.add('has-preview');
            if (previewFiles.length === 1) {
                const file = previewFiles[0];
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const wrapper = document.createElement('div');
                        wrapper.style.position = 'relative';
                        wrapper.style.width = '100%';
                        wrapper.style.display = 'inline-block';
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.className = 'preview-single';
                        // 삭제 버튼
                        const delBtn = document.createElement('div');
                        delBtn.setAttribute('role', 'button');
                        delBtn.setAttribute('tabindex', '0');
                        delBtn.className = 'preview-delete-btn';
                        delBtn.innerHTML = `<img src="images/icon-trash.svg" alt="삭제" style="width:16px;height:16px;">`;
                        delBtn.onclick = function() {
                            selectedFiles.splice(selectedFiles.indexOf(file), 1);
                            updateFileCountBadge();
                            renderGalleryPreview();
                        };
                        wrapper.appendChild(img);
                        wrapper.appendChild(delBtn);
                        galleryPreviewArea.appendChild(wrapper);
                    };
                    reader.readAsDataURL(file);
                }
            } else if (previewFiles.length > 1) {
                const row = document.createElement('div');
                row.className = 'preview-row has-preview';
                previewFiles.forEach((file) => {
                    if (file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const wrapper = document.createElement('div');
                            wrapper.style.position = 'relative';
                            wrapper.style.width = 'calc(50% - 4px)';
                            wrapper.style.display = 'inline-block';
                            const img = document.createElement('img');
                            img.src = e.target.result;
                            img.style.width = '274px';
                            img.style.height = '274px';
                            img.style.borderRadius = '6px';
                            img.style.objectFit = 'cover';
                            img.style.background = 'none';
                            img.style.border = '1px solid rgba(255,255,255,0.05)';
                            // 삭제 버튼
                            const delBtn = document.createElement('div');
                            delBtn.setAttribute('role', 'button');
                            delBtn.setAttribute('tabindex', '0');
                            delBtn.className = 'preview-delete-btn';
                            delBtn.innerHTML = `<img src="images/icon-trash.svg" alt="삭제" style="width:16px;height:16px;">`;
                            delBtn.onclick = function() {
                                selectedFiles.splice(selectedFiles.indexOf(file), 1);
                                updateFileCountBadge();
                                renderGalleryPreview();
                            };
                            wrapper.appendChild(img);
                            wrapper.appendChild(delBtn);
                            row.appendChild(wrapper);
                        };
                        reader.readAsDataURL(file);
                    }
                });
                galleryPreviewArea.appendChild(row);
            }
        }
    }
    if (galleryFileInput && galleryPreviewArea) {
        galleryFileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                // 새로 선택한 파일들을 기존 selectedFiles에 누적
                const newFiles = Array.from(this.files);
                // 중복 방지: 이름+사이즈 기준으로 필터링
                const fileKey = f => f.name + '_' + f.size;
                const existingKeys = new Set(selectedFiles.map(fileKey));
                newFiles.forEach(f => {
                    if (!existingKeys.has(fileKey(f))) {
                        selectedFiles.push(f);
                    }
                });
            }
            updateFileCountBadge();
            renderGalleryPreview();
        });
    }

    const galleryUploadForm = document.getElementById('galleryUploadForm');
    const galleryUploadBtn = document.getElementById('galleryUploadBtn');
    const galleryMsgArea = document.querySelector('.gallery-upload-message-area');
    if (galleryUploadForm && galleryUploadBtn && galleryMsgArea) {
        let timer = null;
        function showGalleryMsg(msg, isSuccess) {
            if (timer) clearTimeout(timer);
            galleryMsgArea.textContent = msg;
            galleryMsgArea.style.color = isSuccess ? '#4a90e2' : '#ff6b6b';
            galleryMsgArea.style.opacity = 1;
            timer = setTimeout(() => {
                galleryMsgArea.style.opacity = 0;
            }, 3000);
        }
        galleryUploadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (!selectedFiles.length) {
                showGalleryMsg('업로드할 파일을 선택해 주세요', false);
                return;
            }
            const formData = new FormData();
            selectedFiles.forEach(f => formData.append('files', f));
            fetch('/api/gallery/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const count = (data.filenames && data.filenames.length) ? data.filenames.length : selectedFiles.length;
                    showGalleryMsg(`${count}개의 사진이 업로드 완료되었습니다`, true);
                    setTimeout(() => {
                        selectedFiles = [];
                        updateFileCountBadge();
                        renderGalleryPreview();
                        fetch('/api/gallery/list', { credentials: 'include' })
                          .then(res => res.json())
                          .then(data => {
                              galleryImages = (data.images && data.images.length > 0) ? data.images.slice() : [];
                              renderGalleryList();
                          });
                    }, 1000);
                } else {
                    showGalleryMsg((data.message || '업로드 실패').replace(/\.$/, ''), false);
                }
            })
            .catch(() => {
                showGalleryMsg('업로드 중 오류가 발생했습니다', false);
            });
        });
    }

    // 갤러리 리스트 저장 버튼 동작
    const galleryListSaveBtn = document.getElementById('galleryListSaveBtn');
    const galleryListSaveMsg = document.getElementById('galleryListSaveMsg');
    const galleryListSaveErr = document.getElementById('galleryListSaveErr');
    if (galleryListSaveMsg) {
        galleryListSaveMsg.style.opacity = 0;
        galleryListSaveMsg.style.transition = 'opacity 0.5s';
    }
    if (galleryListSaveErr) {
        galleryListSaveErr.style.opacity = 0;
        galleryListSaveErr.style.transition = 'opacity 0.5s';
    }
    if (galleryListSaveBtn) {
        galleryListSaveBtn.addEventListener('click', function() {
            if (galleryListSaveMsg) { galleryListSaveMsg.style.display = 'none'; galleryListSaveMsg.textContent = ''; }
            if (galleryListSaveErr) { galleryListSaveErr.style.display = 'none'; galleryListSaveErr.textContent = ''; }
            fetch('/api/gallery/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images: galleryImages, deleted: deletedImages }),
                credentials: 'include'
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    if (galleryListSaveMsg) {
                        galleryListSaveMsg.textContent = '저장 완료';
                        galleryListSaveMsg.style.display = 'block';
                        galleryListSaveMsg.style.opacity = 1;
                        setTimeout(() => {
                            galleryListSaveMsg.style.opacity = 0;
                            setTimeout(() => { galleryListSaveMsg.textContent = ''; galleryListSaveMsg.style.display = 'none'; }, 500);
                        }, 3000);
                    }
                    deletedImages = [];
                    fetch('/api/gallery/list', { credentials: 'include' })
                        .then(res => res.json())
                        .then(data => {
                            galleryImages = (data.images && data.images.length > 0) ? data.images.slice() : [];
                            renderGalleryList();
                        });
                } else {
                    if (galleryListSaveErr) {
                        galleryListSaveErr.textContent = (data.message || '저장 실패').replace(/\.$/, '');
                        galleryListSaveErr.style.display = 'block';
                        galleryListSaveErr.style.opacity = 1;
                        setTimeout(() => {
                            galleryListSaveErr.style.opacity = 0;
                            setTimeout(() => { galleryListSaveErr.textContent = ''; galleryListSaveErr.style.display = 'none'; }, 500);
                        }, 3000);
                    }
                }
            })
            .catch(() => {
                if (galleryListSaveErr) {
                    galleryListSaveErr.textContent = '저장 중 오류가 발생했습니다'.replace(/\.$/, '');
                    galleryListSaveErr.style.display = 'block';
                    galleryListSaveErr.style.opacity = 1;
                    setTimeout(() => {
                        galleryListSaveErr.style.opacity = 0;
                        setTimeout(() => { galleryListSaveErr.textContent = ''; galleryListSaveErr.style.display = 'none'; }, 500);
                    }, 3000);
                }
            });
        });
    }

    let originalProductOrder = [];
    let productListData = [];

    function animateSwap(idx, toIdx) {
        const productListDiv = document.getElementById('productList');
        const items = Array.from(productListDiv.children);
        const fromElem = items[idx];
        const toElem = items[toIdx];
        const fromRect = fromElem.getBoundingClientRect();
        const toRect = toElem.getBoundingClientRect();
        const dy = toRect.top - fromRect.top;
        // 애니메이션 적용
        fromElem.style.transition = 'transform 0.2s cubic-bezier(0.4,0,0.2,1)';
        toElem.style.transition = 'transform 0.2s cubic-bezier(0.4,0,0.2,1), scale 0.2s cubic-bezier(0.4,0,0.2,1)';
        fromElem.style.transform = `translateY(${dy}px)`;
        toElem.style.transform = `translateY(${-dy}px) scale(0.9)`;
        let ended = 0;
        function onEnd() {
            ended++;
            if (ended === 2) {
                fromElem.style.transition = '';
                fromElem.style.transform = '';
                toElem.style.transition = '';
                toElem.style.transform = '';
                // 실제 배열/DOM 갱신 (자리 바꿈)
                [productListData[toIdx], productListData[idx]] = [productListData[idx], productListData[toIdx]];
                renderProductList(productListData);
                // scale(1) 복귀 애니메이션 적용 (UI만)
                setTimeout(() => {
                    const productListDiv = document.getElementById('productList');
                    const items = Array.from(productListDiv.children);
                    const swappedElem = items[toIdx];
                    if (swappedElem) {
                        swappedElem.style.transition = '';
                        // swappedElem.style.transform = ''; // transform은 유지
                    }
                }, 0);
            }
        }
        fromElem.addEventListener('transitionend', onEnd, { once: true });
        toElem.addEventListener('transitionend', onEnd, { once: true });
    }

    function renderProductList(products) {
        const productListDiv = document.getElementById('productList');
        productListDiv.innerHTML = '';
        // reverse() 제거: 이미 최신순으로 정렬된 배열이 전달됨
        products.forEach((product, idx) => {
            const item = document.createElement('div');
            item.className = 'product-list-item';
            item.setAttribute('data-id', product.id || product._id || product.title);
            item.style.display = 'flex';
            item.style.flexDirection = 'column';
            item.style.alignItems = 'stretch';
            item.style.gap = '0';
            item.style.padding = '0';
            item.style.borderRadius = '4px';
            item.style.border = 'none';
            item.style.background = '';
            item.style.transition = 'transform 0.2s cubic-bezier(0.4,0,0.2,1)';
            // product-list-main: 이미지+상품명
            const mainGroup = document.createElement('div');
            mainGroup.className = 'product-list-main';
            mainGroup.style.display = 'flex';
            mainGroup.style.flexDirection = 'row';
            mainGroup.style.alignItems = 'center';
            mainGroup.style.gap = '8px';
            mainGroup.style.margin = '0';
            mainGroup.style.padding = '12px';
            // 이미지 영역 생성
            const imageDiv = document.createElement('div');
            imageDiv.className = 'product-admin-image';
            const img = document.createElement('img');
            img.className = 'product-admin-image';
            let imageUrl = product.image || product.imageUrl;
            if (!imageUrl) {
                imageUrl = '/images/no-image.png';
            } else if (!/^https?:\/\//.test(imageUrl)) {
                if (!imageUrl.startsWith('/')) {
                    imageUrl = '/' + imageUrl;
                }
            }
            img.src = imageUrl;
            img.alt = product.title;
            img.style.width = '274px';
            img.style.height = '274px';
            img.style.background = 'none';
            img.style.border = '1px solid rgba(255,255,255,0.05)';
            imageDiv.appendChild(img);
            mainGroup.appendChild(imageDiv);
            // 상품명/설명 등
            const infoDiv = document.createElement('div');
            infoDiv.className = 'product-info';
            let priceLines = '';
            if (Array.isArray(product.prices) && product.prices.length > 0) {
                priceLines = product.prices.map((p) => `
                    <div style='display:flex;align-items:center;gap:4px;font-size:14px;font-weight:400;color:rgba(247,249,244,0.4);'>
                        <span style='display:inline-flex;align-items:center;justify-content:center;width:8px;height:8px;font-size:10px;'>•</span>
                        <span>${p.amount} : ${p.price}</span>
                    </div>
                `).join('');
            }
            infoDiv.innerHTML = `<div style='font-weight:400;font-size:20px;color:rgba(247,249,244,0.9);'>${product.title}</div>${priceLines ? `<div style='display:flex;flex-direction:column;gap:4px;'>${priceLines}</div>` : ''}`;
            infoDiv.style.flex = '1';
            infoDiv.style.width = '100%';
            mainGroup.appendChild(infoDiv);
            // product-list-actions: 오더컨트롤+버튼그룹
            const actionsGroup = document.createElement('div');
            actionsGroup.className = 'product-list-actions';
            actionsGroup.style.display = 'flex';
            actionsGroup.style.flexDirection = 'row';
            actionsGroup.style.alignItems = 'center';
            actionsGroup.style.gap = '0';
            actionsGroup.style.margin = '0';
            // 오더 컨트롤(순서조정 버튼)
            const orderControls = document.createElement('div');
            orderControls.className = 'product-order-controls';
            orderControls.style.display = 'flex';
            orderControls.style.flexDirection = 'row';
            orderControls.style.alignItems = 'center';
            orderControls.style.gap = '0';
            orderControls.style.margin = '0';
            // 순번 원
            const orderDot = document.createElement('div');
            orderDot.className = 'product-order-dot';
            orderDot.textContent = (idx + 1).toString();
            mainGroup.insertBefore(orderDot, mainGroup.firstChild);
            // 위로 이동 버튼
            const upArrow = document.createElement('div');
            upArrow.className = 'product-order-arrow';
            const upImg = document.createElement('img');
            upImg.src = 'images/icon-up.svg';
            upImg.alt = '위로';
            upImg.style.width = '20px';
            upImg.style.height = '20px';
            upArrow.appendChild(upImg);
            if (idx === 0) upArrow.classList.add('disabled');
            else {
                upArrow.onclick = function(e) {
                    e.stopPropagation();
                    animateSwap(idx, idx-1);
                };
            }
            orderControls.appendChild(upArrow);
            // 아래로 이동 버튼
            const downArrow = document.createElement('div');
            downArrow.className = 'product-order-arrow';
            const downImg = document.createElement('img');
            downImg.src = 'images/icon-down.svg';
            downImg.alt = '아래로';
            downImg.style.width = '20px';
            downImg.style.height = '20px';
            downArrow.appendChild(downImg);
            if (idx === products.length-1) downArrow.classList.add('disabled');
            else {
                downArrow.onclick = function(e) {
                    e.stopPropagation();
                    animateSwap(idx, idx+1);
                };
            }
            orderControls.appendChild(downArrow);
            actionsGroup.appendChild(orderControls);
            // 수정/삭제 버튼 그룹
            const editBtn = document.createElement('div');
            editBtn.className = 'product-edit-btn';
            editBtn.innerHTML = '<img src="images/icon-modify.svg" alt="수정" style="width:14px;height:14px;">';
            editBtn.style.cursor = 'pointer';
            editBtn.style.borderWidth = '1px';
            editBtn.style.borderColor = 'rgba(255,255,255,0.03)';
            editBtn.onclick = function(e) {
                e.stopPropagation();
                openEditOverlay(product, idx);
            };
            const delBtn = document.createElement('div');
            delBtn.className = 'product-delete-btn';
            delBtn.innerHTML = '<img src="images/icon-del.svg" alt="삭제" style="width:14px;height:14px;">';
            delBtn.style.cursor = 'pointer';
            delBtn.style.borderWidth = '1px';
            delBtn.style.borderColor = 'rgba(255,255,255,0.03)';
            delBtn.onclick = function(e) {
                e.stopPropagation();
                // productListData에서 해당 상품 제거
                productListData.splice(idx, 1);
                renderProductList(productListData);
            };
            const btnGroup = document.createElement('div');
            btnGroup.className = 'btn-group';
            btnGroup.style.display = 'flex';
            btnGroup.style.flexDirection = 'row';
            btnGroup.style.alignItems = 'center';
            btnGroup.style.justifyContent = 'flex-end';
            btnGroup.style.gap = '8px';
            btnGroup.style.margin = '0';
            btnGroup.style.flex = '1';
            btnGroup.appendChild(editBtn);
            btnGroup.appendChild(delBtn);
            actionsGroup.appendChild(btnGroup);
            item.appendChild(mainGroup);
            item.appendChild(actionsGroup);
            productListDiv.appendChild(item);
        });
    }

    // 상품 리스트 최초 로드 시 서버에서 받아와서 productListData에 저장 후 렌더링
    function loadProductList() {
        const category = document.getElementById('productListCategory').value;
        fetch(`/api/products/${category}`)
            .then(res => res.json())
            .then(data => {
                if (!data.success || !data.products) return;
                // 최신순으로 productListData 저장
                productListData = data.products.slice().reverse();
                renderProductList(productListData);
            });
    }
    window.loadProductList = loadProductList;

    // 상품 업로드 버튼 클릭 이벤트
    const productUploadBtn = document.querySelector('.product-add-upload-btn');
    const productForm = document.getElementById('productForm');
    const productAddMsg = document.querySelector('.product-add-message');
    if (productUploadBtn && productForm && productAddMsg) {
        productAddMsg.style.opacity = 0;
        productAddMsg.style.transition = 'opacity 0.5s';
        productUploadBtn.addEventListener('click', function() {
            // 업로드 버튼 클릭 시 스크롤 위치 저장
            const prevScrollY = window.scrollY;
            // 메시지 초기화: 텍스트만 비우지 않고 opacity만 0으로
            productAddMsg.style.opacity = 0;
            productAddMsg.style.display = 'block';
            productAddMsg.style.color = '';
            // 입력값 검증
            const category = productForm.querySelector('#productCategory').value.trim();
            const title = productForm.querySelector('#productTitle').value.trim();
            const desc = productForm.querySelector('#productDesc').value.trim();
            const amountInputs = productForm.querySelectorAll('.amount');
            const priceInputs = productForm.querySelectorAll('.price');
            const imageInput = productForm.querySelector('#productImage');
            let valid = true;
            let msg = '';
            if (!title) {
                valid = false;
                msg = '상품명을 입력하세요.';
            } else if (!amountInputs[0].value.trim() || !priceInputs[0].value.trim()) {
                valid = false;
                msg = '가격 정보를 입력하세요.';
            } else if (!imageInput.files || imageInput.files.length === 0) {
                valid = false;
                msg = '상품 이미지를 선택하세요.';
            }
            if (!valid) {
                productAddMsg.textContent = msg.replace(/\.$/, '');
                productAddMsg.style.color = '#ff6b6b';
                productAddMsg.style.opacity = 1;
                setTimeout(() => {
                    productAddMsg.style.opacity = 0;
                    setTimeout(() => { productAddMsg.textContent = ''; }, 500);
                }, 3000);
                return;
            }
            // FormData 생성
            const formData = new FormData();
            formData.append('category', category);
            formData.append('title', title);
            formData.append('description', desc);
            // 가격 정보 배열
            const prices = [];
            for (let i = 0; i < amountInputs.length; i++) {
                const amount = amountInputs[i].value.trim();
                const price = priceInputs[i].value.trim();
                if (amount && price) {
                    prices.push({ amount, price });
                }
            }
            formData.append('prices', JSON.stringify(prices));
            formData.append('image', imageInput.files[0]);
            // 업로드 요청
            fetch(`/api/products/${category}`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    productAddMsg.textContent = '저장 완료';
                    productAddMsg.style.color = '#4a90e2';
                    productAddMsg.style.opacity = 1;
                    setTimeout(() => {
                        productAddMsg.style.opacity = 0;
                        setTimeout(() => { productAddMsg.textContent = ''; }, 500);
                    }, 3000);
                    productForm.reset();
                    // 이미지 미리보기까지 완전히 비움
                    const productImagePreview = document.getElementById('productImagePreview');
                    if (productImagePreview) productImagePreview.innerHTML = '';
                    if (window.loadProductList) window.loadProductList();
                    // 스크롤 위치 복원 (상품 목록 갱신 후)
                    setTimeout(() => {
                        window.scrollTo({ top: prevScrollY, behavior: 'auto' });
                    }, 0);
                } else {
                    productAddMsg.textContent = (data.message || '저장 실패').replace(/\.$/, '');
                    productAddMsg.style.color = '#ff6b6b';
                    productAddMsg.style.opacity = 1;
                    setTimeout(() => {
                        productAddMsg.style.opacity = 0;
                        setTimeout(() => { productAddMsg.textContent = ''; }, 500);
                    }, 3000);
                }
            })
            .catch(() => {
                productAddMsg.textContent = '저장 중 오류가 발생했습니다'.replace(/\.$/, '');
                productAddMsg.style.color = '#ff6b6b';
                productAddMsg.style.opacity = 1;
                setTimeout(() => {
                    productAddMsg.style.opacity = 0;
                    setTimeout(() => { productAddMsg.textContent = ''; }, 500);
                }, 3000);
            });
        });
    }

    function updateRemoveRowBtns() {
        const group = document.querySelector('.price-inputs-group');
        const rows = group ? group.querySelectorAll('div') : [];
        rows.forEach((row, idx) => {
            const btn = row.querySelector('.remove-price-row-btn');
            if (btn) {
                if (rows.length > 1) {
                    btn.style.display = 'flex';
                    btn.disabled = false;
                } else {
                    btn.style.display = 'none';
                    btn.disabled = true;
                }
                btn.onclick = function() {
                    if (rows.length > 1) {
                        row.remove();
                        updateRemoveRowBtns();
                    }
                };
            }
        });
    }

    window.addPriceInput = function() {
        const group = document.querySelector('.price-inputs-group');
        if (!group) return;
        const newInputsDiv = document.createElement('div');
        newInputsDiv.style.display = 'flex';
        newInputsDiv.style.flexDirection = 'row';
        newInputsDiv.style.gap = '8px';
        newInputsDiv.style.width = '100%';
        newInputsDiv.style.marginBottom = '8px';
        newInputsDiv.style.alignItems = 'center';
        newInputsDiv.innerHTML = `
            <input type="text" class="amount product-add-input" placeholder="용량" required>
            <input type="text" class="price product-add-input" placeholder="가격" required>
            <button type="button" class="remove-price-row-btn"><img src="images/icon-minus.svg" alt="삭제" style="width:20px;height:20px;"></button>
        `;
        group.appendChild(newInputsDiv);
        updateRemoveRowBtns();
    }

    document.addEventListener('DOMContentLoaded', function() {
        updateRemoveRowBtns();
    });

    // 상품 목록 드롭박스 변경 시 자동 갱신
    const productListCategory = document.getElementById('productListCategory');
    const productListSelectWrap = document.querySelector('.product-list-select-wrap');
    if (productListCategory && productListSelectWrap) {
        productListCategory.addEventListener('mousedown', function(e) {
            if (productListSelectWrap.classList.contains('open')) {
                productListSelectWrap.classList.remove('open');
                productListCategory.blur();
                e.preventDefault();
            } else {
                productListSelectWrap.classList.add('open');
                setTimeout(() => productListCategory.focus(), 0);
            }
        });
        ['blur', 'focusout', 'change'].forEach(evt => {
            productListCategory.addEventListener(evt, function() {
                productListSelectWrap.classList.remove('open');
            });
        });
        productListCategory.addEventListener('change', function() {
            loadProductList();
        });
        loadProductList();
    }

    // 순서 저장 버튼 클릭 이벤트 추가
    const productListSaveBtn = document.querySelector('.product-list-save-btn');
    const productListMsgArea = document.querySelector('.product-list-message-area');
    const productListMsg = productListMsgArea ? productListMsgArea.querySelector('.product-list-message') : null;
    if (productListSaveBtn && productListMsgArea && productListMsg) {
        productListMsg.style.opacity = 0;
        productListMsg.style.transition = 'opacity 0.5s';
        productListSaveBtn.addEventListener('click', function() {
            const productListDiv = document.getElementById('productList');
            const items = productListDiv.querySelectorAll('.product-list-item');
            const currentOrder = Array.from(items).map(item => item.getAttribute('data-id') || item.querySelector('.product-info > div')?.textContent?.trim());
            const isSame = currentOrder.length === originalProductOrder.length && currentOrder.every((id, idx) => id === originalProductOrder[idx]);
            // 메시지 초기화
            productListMsg.textContent = '';
            productListMsg.style.display = 'block';
            productListMsg.style.opacity = 0;
            if (isSame) {
                productListMsg.textContent = '변경된 내용이 없습니다';
                productListMsg.style.color = '#ff6b6b';
                productListMsg.style.opacity = 1;
                setTimeout(() => {
                    productListMsg.style.opacity = 0;
                    setTimeout(() => { productListMsg.textContent = ''; }, 500);
                }, 3000);
                return;
            }
            // 카테고리 값 가져오기
            const category = document.getElementById('productListCategory').value;
            // 서버에 상품 전체 배열을 전송
            fetch(`/api/products/${category}/reorder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products: productListData }),
                credentials: 'include'
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    productListMsg.textContent = '저장 완료';
                    productListMsg.style.color = '#4a90e2';
                } else {
                    productListMsg.textContent = (data.message || '저장 실패').replace(/\.$/, '');
                    productListMsg.style.color = '#ff6b6b';
                }
                productListMsg.style.opacity = 1;
                setTimeout(() => {
                    productListMsg.style.opacity = 0;
                    setTimeout(() => { productListMsg.textContent = ''; }, 500);
                }, 3000);
            })
            .catch(() => {
                productListMsg.textContent = '저장 중 오류가 발생했습니다'.replace(/\.$/, '');
                productListMsg.style.color = '#ff6b6b';
                productListMsg.style.opacity = 1;
                setTimeout(() => {
                    productListMsg.style.opacity = 0;
                    setTimeout(() => { productListMsg.textContent = ''; }, 500);
                }, 3000);
            });
        });
    }

    // 상품 수정 오버레이 및 폼 관련 전역 변수
    let editOverlay = null;
    let editForm = null;
    let editingProductIdx = null;

    function openEditOverlay(product, idx) {
        // 오버레이 생성
        editOverlay = document.createElement('div');
        editOverlay.className = 'admin-product-edit-overlay';
        editOverlay.style.position = 'fixed';
        editOverlay.style.top = '0';
        editOverlay.style.left = '0';
        editOverlay.style.width = '100vw';
        editOverlay.style.height = '100vh';
        editOverlay.style.zIndex = '9999';
        editOverlay.style.pointerEvents = 'auto';
        editOverlay.style.background = 'rgba(26,26,26,0.9)';
        editOverlay.style.backdropFilter = 'blur(12px)';
        editOverlay.style.webkitBackdropFilter = 'blur(12px)';
        editOverlay.style.padding = '40px';
        editOverlay.style.overflowY = 'auto'; // 오버레이에만 스크롤 적용
        editOverlay.style.borderRadius = '0';

        // 전체 폼 컨테이너 div (기존 코드 그대로)
        const adminProductEdit = document.createElement('div');
        adminProductEdit.className = 'admin-product-edit';
        adminProductEdit.style.background = 'none';
        adminProductEdit.style.borderRadius = '8px';
        adminProductEdit.style.border = '1px solid rgba(255,255,255,0.03)';
        adminProductEdit.style.padding = '28px 24px';
        adminProductEdit.style.maxWidth = '332px';
        adminProductEdit.style.width = '100%';
        adminProductEdit.style.boxSizing = 'border-box';
        adminProductEdit.style.display = 'flex';
        adminProductEdit.style.flexDirection = 'column';
        // 절대 gap, margin, padding 등 자의적 추가 금지 (사용자 지시 외 금지)
        adminProductEdit.style.position = 'relative';
        adminProductEdit.style.margin = '0 auto';
        adminProductEdit.style.alignSelf = 'flex-start';

        // 실제 form 생성
        editForm = document.createElement('form');
        editForm.className = 'admin-product-edit-form';
        editForm.style.display = 'flex';
        editForm.style.flexDirection = 'column';
        editForm.style.gap = '0';
        editForm.style.width = '100%';
        editForm.style.boxSizing = 'border-box';

        // 상품명 영역
        const nameDiv = document.createElement('div');
        nameDiv.className = 'admin-product-edit-name';
        nameDiv.style.display = 'flex';
        nameDiv.style.alignItems = 'center';
        nameDiv.style.marginBottom = '12px';
        nameDiv.style.height = 'auto';
        nameDiv.style.margin = '0';
        nameDiv.style.padding = '0';
        const nameLabel = document.createElement('div');
        nameLabel.className = 'admin-product-edit-name-label';
        nameLabel.textContent = '상품명';
        nameLabel.style.width = '90px';
        nameLabel.style.fontSize = '15px';
        nameLabel.style.color = 'rgba(247,249,244,0.9)';
        nameLabel.style.display = 'flex';
        nameLabel.style.alignItems = 'center';
        nameLabel.style.height = '18px';
        nameLabel.style.marginLeft = '4px';
        nameDiv.appendChild(nameLabel);
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'admin-product-edit-name-input';
        nameInput.placeholder = '상품명을 입력해 주세요';
        nameInput.value = product.title || '';
        nameInput.required = true;
        nameInput.style.flex = '1';
        nameInput.style.background = 'none';
        nameInput.style.borderRadius = '4px';
        nameInput.style.border = '1px solid rgba(255,255,255,0.05)';
        nameInput.style.color = '#fff';
        nameInput.style.padding = '10px 16px';
        nameInput.style.fontSize = '15px';
        nameInput.style.boxSizing = 'border-box';
        nameInput.style.minWidth = '0';
        nameInput.onfocus = nameInput.onmouseover = function(){ this.style.background = 'rgba(16,16,16,0.2)'; this.style.borderColor = 'rgba(255,255,255,0.1)'; };
        nameInput.onblur = nameInput.onmouseout = function(){ this.style.background = 'none'; this.style.borderColor = 'rgba(255,255,255,0.05)'; };
        nameInput.style.transition = 'border-color 0.2s, background 0.2s';
        nameInput.setAttribute('style', nameInput.getAttribute('style') + ';' + '::placeholder { color: rgba(247,249,244,0.10); }');
        nameDiv.appendChild(nameInput);

        // 상품 설명 영역
        const infoDiv = document.createElement('div');
        infoDiv.className = 'admin-product-edit-info';
        infoDiv.style.display = 'flex';
        infoDiv.style.flexDirection = 'column';
        infoDiv.style.alignItems = 'flex-start';
        infoDiv.style.margin = '0';
        infoDiv.style.padding = '0';
        // 라벨 (label 태그로)
        const infoLabel = document.createElement('label');
        infoLabel.className = 'admin-product-edit-info-label';
        infoLabel.textContent = '상품 설명';
        infoLabel.setAttribute('for', 'adminProductEditDesc');
        infoLabel.style.width = '90px';
        infoLabel.style.fontSize = '15px';
        infoLabel.style.color = 'rgba(247,249,244,0.9)';
        infoLabel.style.display = 'flex';
        infoLabel.style.alignItems = 'center';
        infoLabel.style.height = '18px';
        infoLabel.style.marginBottom = '12px';
        infoLabel.style.marginLeft = '4px';
        infoDiv.appendChild(infoLabel);
        // 인풋 그룹 div
        const descInputGroup = document.createElement('div');
        descInputGroup.className = 'admin-product-edit-desc-input-group';
        descInputGroup.style.width = '100%';
        descInputGroup.style.display = 'flex';
        descInputGroup.style.flexDirection = 'column';
        descInputGroup.style.position = 'relative';
        descInputGroup.style.border = '1px solid rgba(255,255,255,0.10)';
        descInputGroup.style.borderRadius = '4px';
        descInputGroup.style.transition = 'border-color 0.2s';
        // textarea
        const infoTextarea = document.createElement('textarea');
        infoTextarea.id = 'adminProductEditDesc';
        infoTextarea.className = 'admin-product-edit-info-input';
        infoTextarea.rows = 3;
        infoTextarea.placeholder = '상품 설명을 입력해 주세요';
        infoTextarea.maxLength = 75;
        infoTextarea.value = product.description || '';
        infoTextarea.style.background = 'none';
        infoTextarea.style.border = 'none';
        infoTextarea.style.outline = 'none';
        infoTextarea.style.color = '#fff';
        infoTextarea.style.padding = '10px 16px';
        infoTextarea.style.fontSize = '15px';
        infoTextarea.style.boxSizing = 'border-box';
        infoTextarea.style.minWidth = '0';
        infoTextarea.style.minHeight = '110px';
        infoTextarea.style.height = '110px';
        infoTextarea.style.lineHeight = '1.5';
        infoTextarea.style.resize = 'none';
        infoTextarea.style.transition = 'background 0.2s';
        infoTextarea.setAttribute('style', infoTextarea.getAttribute('style') + ';' + '::placeholder { color: rgba(247,249,244,0.10); }');
        descInputGroup.appendChild(infoTextarea);
        infoDiv.appendChild(descInputGroup);
        // 글자 제한 div (인풋 그룹 div 아래에 따로)
        const descCharCounter = document.createElement('div');
        descCharCounter.className = 'admin-product-edit-desc-char-counter';
        descCharCounter.style.fontSize = '12px';
        descCharCounter.style.color = 'rgba(247,249,244,0.4)';
        descCharCounter.style.textAlign = 'right';
        descCharCounter.style.width = '100%';
        descCharCounter.style.marginTop = '4px';
        descCharCounter.innerHTML = '글자 제한&nbsp;<span id="adminProductEditDescCharCount">0</span> / 75';
        infoDiv.appendChild(descCharCounter);
        // 카운터 동작
        function updateEditDescCounter() {
            let val = infoTextarea.value;
            if (val.length > 75) {
                infoTextarea.value = val.slice(0, 75);
                val = infoTextarea.value;
            }
            descCharCounter.querySelector('#adminProductEditDescCharCount').textContent = val.length;
            if (val.length >= 75) {
                descCharCounter.style.color = '#ff6b6b';
            } else {
                descCharCounter.style.color = 'rgba(247,249,244,0.4)';
            }
        }
        infoTextarea.addEventListener('input', updateEditDescCounter);
        infoTextarea.addEventListener('focus', function() {
            descInputGroup.style.border = '1.5px solid rgba(255,255,255,0.60)';
        });
        infoTextarea.addEventListener('blur', function() {
            descInputGroup.style.border = '1px solid rgba(255,255,255,0.10)';
        });
        updateEditDescCounter();

        // 가격/용량 영역
        const priceDiv = document.createElement('div');
        priceDiv.className = 'admin-product-edit-price';
        priceDiv.style.display = 'flex';
        priceDiv.style.flexDirection = 'column';
        priceDiv.style.alignItems = 'flex-start';
        priceDiv.style.marginBottom = '12px';
        priceDiv.style.height = 'auto';
        priceDiv.style.margin = '0';
        priceDiv.style.padding = '0';
        const priceLabel = document.createElement('div');
        priceLabel.className = 'admin-product-edit-price-label';
        priceLabel.textContent = '상품 가격';
        priceLabel.style.width = '90px';
        priceLabel.style.fontSize = '15px';
        priceLabel.style.color = 'rgba(247,249,244,0.9)';
        priceLabel.style.display = 'flex';
        priceLabel.style.alignItems = 'center';
        priceLabel.style.height = '18px';
        priceLabel.style.marginBottom = '12px';
        priceLabel.style.marginLeft = '4px';
        priceDiv.appendChild(priceLabel);
        // 가격/용량 입력 그룹
        const priceInputsGroup = document.createElement('div');
        priceInputsGroup.className = 'admin-product-edit-price-form';
        priceInputsGroup.style.width = '100%';
        let prices = Array.isArray(product.prices) && product.prices.length > 0 ? product.prices.slice() : [{ amount: '', price: '' }];
        function renderEditPriceRows() {
            priceInputsGroup.innerHTML = '';
            prices.forEach((p, i) => {
                const row = document.createElement('div');
                row.className = 'admin-product-edit-price-row';
                row.style.display = 'flex';
                row.style.flexDirection = 'row';
                row.style.gap = '8px';
                row.style.width = '100%';
                row.style.marginBottom = '8px';
                row.style.alignItems = 'center';
                const amountInput = document.createElement('input');
                amountInput.type = 'text';
                amountInput.className = 'admin-product-edit-price-amount';
                amountInput.placeholder = '용량';
                amountInput.required = true;
                amountInput.value = p.amount || '';
                amountInput.style.flex = '1';
                amountInput.style.background = 'none';
                amountInput.style.borderRadius = '4px';
                amountInput.style.border = '1px solid rgba(255,255,255,0.10)';
                amountInput.style.color = '#fff';
                amountInput.style.padding = '10px 16px';
                amountInput.style.fontSize = '15px';
                amountInput.style.boxSizing = 'border-box';
                amountInput.style.minWidth = '0';
                amountInput.onfocus = amountInput.onmouseover = function(){ this.style.background = 'rgba(16,16,16,0.2)'; this.style.borderColor = 'rgba(255,255,255,0.60)'; };
                amountInput.onblur = amountInput.onmouseout = function(){ this.style.background = 'none'; this.style.borderColor = 'rgba(255,255,255,0.10)'; };
                amountInput.style.transition = 'border-color 0.2s, background 0.2s';
                amountInput.setAttribute('style', amountInput.getAttribute('style') + ';' + '::placeholder { color: rgba(247,249,244,0.10); }');
                row.appendChild(amountInput);
                const priceInput = document.createElement('input');
                priceInput.type = 'text';
                priceInput.className = 'admin-product-edit-price-price';
                priceInput.placeholder = '가격';
                priceInput.required = true;
                priceInput.value = p.price || '';
                priceInput.style.flex = '1';
                priceInput.style.background = 'none';
                priceInput.style.borderRadius = '4px';
                priceInput.style.border = '1px solid rgba(255,255,255,0.10)';
                priceInput.style.color = '#fff';
                priceInput.style.padding = '10px 16px';
                priceInput.style.fontSize = '15px';
                priceInput.style.boxSizing = 'border-box';
                priceInput.style.minWidth = '0';
                priceInput.onfocus = priceInput.onmouseover = function(){ this.style.background = 'rgba(16,16,16,0.2)'; this.style.borderColor = 'rgba(255,255,255,0.60)'; };
                priceInput.onblur = priceInput.onmouseout = function(){ this.style.background = 'none'; this.style.borderColor = 'rgba(255,255,255,0.10)'; };
                priceInput.style.transition = 'border-color 0.2s, background 0.2s';
                priceInput.setAttribute('style', priceInput.getAttribute('style') + ';' + '::placeholder { color: rgba(247,249,244,0.10); }');
                row.appendChild(priceInput);
                // 삭제 버튼
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'admin-product-edit-price-remove-btn';
                removeBtn.innerHTML = '<img src="images/icon-minus.svg" alt="삭제" style="width:20px;height:20px;">';
                removeBtn.style.width = '30px';
                removeBtn.style.height = '30px';
                removeBtn.style.minWidth = '30px';
                removeBtn.style.minHeight = '30px';
                removeBtn.style.maxWidth = '30px';
                removeBtn.style.maxHeight = '30px';
                removeBtn.style.borderRadius = '50%';
                removeBtn.style.background = 'none';
                removeBtn.style.border = '1px solid rgba(255,255,255,0.05)';
                removeBtn.style.padding = '0';
                removeBtn.style.marginLeft = '8px';
                removeBtn.style.display = 'flex';
                removeBtn.style.alignItems = 'center';
                removeBtn.style.justifyContent = 'center';
                removeBtn.style.cursor = 'pointer';
                removeBtn.style.transition = 'background 0.2s, border-color 0.2s';
                removeBtn.onclick = function() {
                    if (prices.length > 1) {
                        prices.splice(i, 1);
                        renderEditPriceRows();
                    }
                };
                row.appendChild(removeBtn);
                priceInputsGroup.appendChild(row);
            });
        }
        renderEditPriceRows();
        priceDiv.appendChild(priceInputsGroup);
        // 가격/용량 추가 버튼
        const priceBtnDiv = document.createElement('div');
        priceBtnDiv.className = 'admin-product-edit-price-btn';
        priceBtnDiv.style.width = '100%';
        const addPriceBtn = document.createElement('button');
        addPriceBtn.type = 'button';
        addPriceBtn.className = 'admin-product-edit-price-add-btn';
        addPriceBtn.style.width = '100%';
        addPriceBtn.style.height = '40px';
        addPriceBtn.style.background = 'rgba(16,16,16,0.4)';
        addPriceBtn.style.border = '1px solid rgba(255,255,255,0.10)';
        addPriceBtn.style.borderRadius = '4px';
        addPriceBtn.style.boxSizing = 'border-box';
        addPriceBtn.style.transition = 'background 0.2s, border-color 0.2s';
        addPriceBtn.style.padding = '0';
        addPriceBtn.style.display = 'flex';
        addPriceBtn.style.alignItems = 'center';
        addPriceBtn.style.justifyContent = 'center';
        addPriceBtn.style.cursor = 'pointer';
        addPriceBtn.innerHTML = '<img src="images/icon-add.svg" alt="추가" style="width:20px;height:20px;">';
        addPriceBtn.onclick = function() {
            prices.push({ amount: '', price: '' });
            renderEditPriceRows();
        };
        priceBtnDiv.appendChild(addPriceBtn);
        priceDiv.appendChild(priceBtnDiv);

        // 이미지 영역
        const imageDiv = document.createElement('div');
        imageDiv.className = 'admin-product-edit-image';
        imageDiv.style.display = 'flex';
        imageDiv.style.flexDirection = 'column';
        imageDiv.style.alignItems = 'flex-start';
        imageDiv.style.marginBottom = '12px';
        imageDiv.style.height = 'auto';
        imageDiv.style.margin = '0';
        imageDiv.style.padding = '0';
        const imageLabel = document.createElement('div');
        imageLabel.className = 'admin-product-edit-image-label';
        imageLabel.textContent = '상품 사진';
        imageLabel.style.width = '90px';
        imageLabel.style.fontSize = '15px';
        imageLabel.style.color = 'rgba(247,249,244,0.9)';
        imageLabel.style.display = 'flex';
        imageLabel.style.alignItems = 'center';
        imageLabel.style.height = '18px';
        imageLabel.style.marginBottom = '12px';
        imageLabel.style.marginLeft = '4px';
        imageDiv.appendChild(imageLabel);
        // 파일 input
        const imageInput = document.createElement('input');
        imageInput.type = 'file';
        imageInput.accept = 'image/*';
        imageInput.style.display = 'none';
        imageInput.id = 'productEditImageInput';
        // 미리보기/업로드 영역
        const imageArea = document.createElement('div');
        imageArea.className = 'admin-product-edit-image-area';
        imageArea.style.width = '274px';
        imageArea.style.height = '274px';
        imageArea.style.display = 'flex';
        imageArea.style.flexDirection = 'column';
        imageArea.style.alignItems = 'center';
        imageArea.style.justifyContent = 'center';
        imageArea.style.marginTop = '0';
        imageArea.style.overflow = 'hidden';
        function renderImagePreview(fileOrUrl) {
            imageArea.innerHTML = '';
            if (fileOrUrl) {
                const wrapper = document.createElement('div');
                wrapper.style.position = 'relative';
                wrapper.style.display = 'inline-block';
                wrapper.style.width = '274px';
                wrapper.style.height = '274px';
                const img = document.createElement('img');
                img.style.width = '274px';
                img.style.height = '274px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '8px';
                img.style.background = 'none';
                img.style.border = '1px solid rgba(255,255,255,0.05)';
                if (typeof fileOrUrl === 'string') {
                    img.src = fileOrUrl;
                } else {
                    const reader = new FileReader();
                    reader.onload = function(e) { img.src = e.target.result; };
                    reader.readAsDataURL(fileOrUrl);
                }
                // 삭제 버튼
                const delBtn = document.createElement('div');
                delBtn.className = 'admin-product-edit-image-remove-btn';
                delBtn.setAttribute('role', 'button');
                delBtn.setAttribute('tabindex', '0');
                delBtn.style.position = 'absolute';
                delBtn.style.top = '4px';
                delBtn.style.right = '4px';
                delBtn.style.width = '28px';
                delBtn.style.height = '28px';
                delBtn.style.display = 'flex';
                delBtn.style.alignItems = 'center';
                delBtn.style.justifyContent = 'center';
                delBtn.style.background = 'rgba(0,0,0,0.4)';
                delBtn.style.borderRadius = '50%';
                delBtn.style.cursor = 'pointer';
                delBtn.innerHTML = '<img src="images/icon-trash.svg" alt="삭제" style="width:16px;height:16px;">';
                delBtn.onclick = function() {
                    imageInput.value = '';
                    renderImagePreview(null);
                };
                wrapper.appendChild(img);
                wrapper.appendChild(delBtn);
                imageArea.appendChild(wrapper);
            } else {
                // 파일 선택 버튼
                const uploadLabel = document.createElement('label');
                uploadLabel.className = 'admin-product-edit-image-upload-btn';
                uploadLabel.setAttribute('for', 'productEditImageInput');
                uploadLabel.style.display = 'inline-block';
                uploadLabel.style.width = '274px';
                uploadLabel.style.height = '274px';
                uploadLabel.style.background = 'rgba(16,16,16,0.1)';
                uploadLabel.style.border = '1px dashed #aaa';
                uploadLabel.style.borderRadius = '8px';
                uploadLabel.style.cursor = 'pointer';
                uploadLabel.style.display = 'flex';
                uploadLabel.style.alignItems = 'center';
                uploadLabel.style.justifyContent = 'center';
                uploadLabel.innerHTML = '<span style="color:#aaa;font-size:13px;">파일 선택</span>';
                imageArea.appendChild(uploadLabel);
                uploadLabel.appendChild(imageInput);
            }
        }
        imageInput.onchange = function() {
            if (imageInput.files && imageInput.files[0]) {
                renderImagePreview(imageInput.files[0]);
            }
        };
        let initialImageUrl = product.image || product.imageUrl || '';
        if (initialImageUrl && !/^https?:\/\//.test(initialImageUrl)) {
            if (!initialImageUrl.startsWith('/')) initialImageUrl = '/' + initialImageUrl;
        }
        renderImagePreview(initialImageUrl || null);
        imageDiv.appendChild(imageArea);

        // 버튼 그룹
        const btnGroupDiv = document.createElement('div');
        btnGroupDiv.className = 'admin-product-edit-buttongroup';
        btnGroupDiv.style.display = 'flex';
        btnGroupDiv.style.flexDirection = 'column';
        btnGroupDiv.style.gap = '12px';
        btnGroupDiv.style.justifyContent = 'flex-end';
        btnGroupDiv.style.marginTop = '16px';
        // 저장 버튼
        const saveBtn = document.createElement('button');
        saveBtn.type = 'submit';
        saveBtn.className = 'admin-product-edit-btn-confirm';
        saveBtn.textContent = '저장';
        saveBtn.style.background = '#4a90e2';
        saveBtn.style.color = '#fff';
        saveBtn.style.border = 'none';
        saveBtn.style.borderRadius = '6px';
        saveBtn.style.padding = '0';
        saveBtn.style.fontSize = '16px';
        saveBtn.style.cursor = 'pointer';
        saveBtn.style.width = '100%';
        saveBtn.style.height = '60px';
        // 취소 버튼
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'admin-product-edit-btn-cancel';
        cancelBtn.textContent = '취소';
        cancelBtn.style.background = '#333';
        cancelBtn.style.color = '#fff';
        cancelBtn.style.border = 'none';
        cancelBtn.style.borderRadius = '6px';
        cancelBtn.style.padding = '0';
        cancelBtn.style.fontSize = '16px';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.style.width = '100%';
        cancelBtn.style.height = '60px';
        cancelBtn.onclick = function() {
            closeEditOverlay();
        };
        btnGroupDiv.appendChild(saveBtn);
        btnGroupDiv.appendChild(cancelBtn);

        // 메시지 영역
        const messageDiv = document.createElement('div');
        messageDiv.className = 'admin-product-edit-message';
        messageDiv.style.minHeight = '24px';
        messageDiv.style.marginTop = '12px';
        messageDiv.style.marginBottom = '136px';
        messageDiv.style.textAlign = 'center';
        messageDiv.style.transition = 'opacity 0.5s';
        messageDiv.style.opacity = 0;
        messageDiv.style.fontSize = '12px';
        messageDiv.style.display = 'block';

        // form 조립
        editForm.innerHTML = '';
        editForm.appendChild(nameDiv);
        editForm.appendChild(infoDiv);
        editForm.appendChild(priceDiv);
        editForm.appendChild(imageDiv);
        // 버튼그룹을 form 내부에 추가 (submit 이벤트 정상 동작)
        editForm.appendChild(btnGroupDiv);
        // adminProductEdit에 form만 append
        adminProductEdit.innerHTML = '';
        // 라벨 라인 생성 함수
        function createLabelLine() {
            const line = document.createElement('div');
            line.style.width = '100%';
            line.style.height = '1px';
            line.style.background = 'rgba(255,255,255,0.02)';
            line.style.margin = '12px 0';
            return line;
        }
        // 입력 그룹(div) 배열
        const editSections = [nameDiv, infoDiv, priceDiv, imageDiv];
        for (let i = 0; i < editSections.length; i++) {
            adminProductEdit.appendChild(editSections[i]);
            // 마지막 요소 전까지만 라벨 라인 추가
            if (i < editSections.length - 1) {
                adminProductEdit.appendChild(createLabelLine());
            }
        }
        adminProductEdit.appendChild(editForm);
        // 오버레이에 폼, 버튼그룹, 메시지를 세로로 추가
        editOverlay.innerHTML = '';
        editOverlay.appendChild(adminProductEdit);
        editOverlay.appendChild(btnGroupDiv);
        editOverlay.appendChild(messageDiv);
        editingProductIdx = idx;
        document.body.appendChild(editOverlay);
        document.body.style.overflow = 'hidden';

        // 저장 버튼 직접 클릭 이벤트 연결 (폼 submit 사용 안 함)
        saveBtn.onclick = function(e) {
            e.preventDefault();
            if (messageDiv._timer) clearTimeout(messageDiv._timer);
            messageDiv.style.display = 'block';
            messageDiv.style.opacity = 0;
            messageDiv.textContent = '';
            // 입력값 검증
            const title = nameInput.value.trim();
            const desc = infoTextarea.value.trim();
            const priceRows = adminProductEdit.querySelectorAll('.admin-product-edit-price-row');
            const prices = [];
            priceRows.forEach(row => {
                const amount = row.querySelector('.admin-product-edit-price-amount').value.trim();
                const price = row.querySelector('.admin-product-edit-price-price').value.trim();
                if (amount && price) prices.push({ amount, price });
            });
            let valid = true;
            let msg = '';
            if (!title) {
                valid = false;
                msg = '상품명을 입력하세요.';
            } else if (!prices.length) {
                valid = false;
                msg = '가격 정보를 입력하세요.';
            }
            // productId 체크
            const productId = product.id || product._id;
            if (!productId) {
                valid = false;
                msg = '상품 ID가 없습니다. 저장할 수 없습니다.';
            }
            if (!valid) {
                messageDiv.textContent = msg;
                messageDiv.style.color = '#ff6b6b';
                messageDiv.style.opacity = 1;
                messageDiv._timer = setTimeout(() => {
                    messageDiv.style.opacity = 0;
                    setTimeout(() => { messageDiv.textContent = ''; }, 500);
                }, 3000);
                return;
            }
            // FormData 생성
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', desc);
            formData.append('prices', JSON.stringify(prices));
            // 이미지 파일이 있으면 추가
            if (imageInput.files && imageInput.files[0]) {
                formData.append('image', imageInput.files[0]);
            }
            // 상품 수정(업데이트) 요청: PATCH /api/products/<category> + id 필드 포함
            const category = product.category || document.getElementById('productListCategory').value;
            formData.append('id', product.id || product._id);
            fetch(`/api/products/${category}`, {
                method: 'PATCH',
                body: formData,
                credentials: 'include'
            })
            .then(res => {
                if (!res.ok) throw new Error('서버 응답 오류');
                return res.json();
            })
            .then(data => {
                if (data.success) {
                    messageDiv.textContent = '저장 완료';
                    messageDiv.style.color = '#4a90e2';
                    messageDiv.style.opacity = 1;
                    messageDiv._timer = setTimeout(() => {
                        messageDiv.style.opacity = 0;
                        setTimeout(() => { messageDiv.textContent = ''; }, 500);
                    }, 3000);
                    if (window.loadProductList) window.loadProductList();
                } else {
                    messageDiv.textContent = (data.message || '저장 실패').replace(/\.$/, '');
                    messageDiv.style.color = '#ff6b6b';
                    messageDiv.style.opacity = 1;
                    messageDiv._timer = setTimeout(() => {
                        messageDiv.style.opacity = 0;
                        setTimeout(() => { messageDiv.textContent = ''; }, 500);
                    }, 3000);
                }
            })
            .catch((err) => {
                messageDiv.textContent = '저장 중 오류가 발생했습니다: ' + (err.message || '');
                messageDiv.style.color = '#ff6b6b';
                messageDiv.style.opacity = 1;
                messageDiv._timer = setTimeout(() => {
                    messageDiv.style.opacity = 0;
                    setTimeout(() => { messageDiv.textContent = ''; }, 500);
                }, 3000);
            });
        };
    }

    function closeEditOverlay() {
        if (editOverlay) {
            document.body.removeChild(editOverlay);
            editOverlay = null;
            editForm = null;
            editingProductIdx = null;
            document.body.style.overflow = '';
        }
    }

    // 오버레이 팝업 스타일(모바일 대응 포함)을 위한 CSS를 동적으로 추가
    (function(){
        const style = document.createElement('style');
        style.innerHTML = `
        @media (max-width: 600px) {
            .product-edit-form {
                max-width: 98vw !important;
                padding: 16px 4px 12px 4px !important;
            }
        }
        .product-edit-overlay::-webkit-scrollbar { display: none; }
        .product-edit-overlay { -ms-overflow-style: none; scrollbar-width: none; }
        `;
        document.head.appendChild(style);
    })();
});