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
            const errorDiv = document.getElementById('greetingError');
            const successDiv = document.getElementById('greetingSuccess');
            if (errorDiv) errorDiv.style.display = 'none';
            if (successDiv) successDiv.style.display = 'none';
            const value = textarea ? textarea.value.trim() : '';
            if (!value) {
                if (errorDiv) {
                    errorDiv.textContent = '인사말을 입력해 주세요.';
                    errorDiv.style.display = 'block';
                }
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
                    if (successDiv) {
                        successDiv.textContent = '저장되었습니다';
                        successDiv.style.display = 'block';
                    }
                } else {
                    if (errorDiv) {
                        errorDiv.textContent = (data.message || '저장에 실패했습니다').replace(/\.$/, '');
                        errorDiv.style.display = 'block';
                    }
                }
            })
            .catch(() => {
                if (errorDiv) {
                    errorDiv.textContent = '저장 중 오류가 발생했습니다'.replace(/\.$/, '');
                    errorDiv.style.display = 'block';
                }
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
                const item = document.createElement('div');
                item.className = 'admin-gallery-item';

                const img = document.createElement('img');
                img.className = 'admin-gallery-image';
                img.src = `images/gallery/${filename}`;
                img.alt = `현장 사진 ${idx + 1}`;

                // 삭제 버튼 (휴지통)
                const delBtn = document.createElement('div');
                delBtn.setAttribute('role', 'button');
                delBtn.setAttribute('tabindex', '0');
                delBtn.className = 'gallery-delete-btn';
                delBtn.innerHTML = `<img src="images/icon-del.svg" alt="삭제" style="width:16px;height:16px;">`;
                delBtn.onclick = function() {
                    if (!deletedImages.includes(filename)) deletedImages.push(filename);
                    galleryImages.splice(idx, 1);
                    renderGalleryList();
                };
                item.appendChild(delBtn);

                item.appendChild(img);

                // 순서 조정 버튼 영역 복구 (gallery-order-controls)
                const orderControls = document.createElement('div');
                orderControls.className = 'gallery-order-controls';

                // 순번 원
                const orderDot = document.createElement('div');
                orderDot.className = 'gallery-order-dot';
                orderDot.textContent = (idx + 1).toString();
                orderControls.appendChild(orderDot);

                // 위로 이동 버튼
                const upArrow = document.createElement('div');
                upArrow.className = 'gallery-order-arrow';
                if (idx === 0) upArrow.classList.add('disabled');
                const upImg = document.createElement('img');
                upImg.src = 'images/icon-up.svg';
                upImg.alt = '위로';
                upArrow.appendChild(upImg);
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
                const downImg = document.createElement('img');
                downImg.src = 'images/icon-down.svg';
                downImg.alt = '아래로';
                downArrow.appendChild(downImg);
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

                item.appendChild(orderControls);

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
                            img.style.width = '100%';
                            img.style.borderRadius = '6px';
                            img.style.objectFit = 'cover';
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

    const galleryUploadBtn = document.getElementById('galleryUploadBtn');
    const galleryUploadMsg = document.getElementById('galleryUploadMsg');
    const galleryUploadErr = document.getElementById('galleryUploadErr');
    if (galleryUploadBtn) {
        galleryUploadBtn.addEventListener('click', function(e) {
            if (galleryUploadErr) galleryUploadErr.style.display = 'none';
            if (!selectedFiles.length) {
                if (galleryUploadErr) {
                    galleryUploadErr.textContent = '업로드할 파일을 선택해 주세요';
                    galleryUploadErr.style.display = 'block';
                }
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
                    if (galleryUploadMsg) {
                        const count = (data.filenames && data.filenames.length) ? data.filenames.length : selectedFiles.length;
                        galleryUploadMsg.textContent = `${count}개의 사진이 업로드 완료되었습니다`;
                        galleryUploadMsg.style.display = 'block';
                        // 3초 뒤 메시지 텍스트만 사라지게
                        setTimeout(() => { galleryUploadMsg.textContent = ''; }, 3000);
                    }
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
                    if (galleryUploadErr) {
                        galleryUploadErr.textContent = (data.message || '업로드 실패').replace(/\.$/, '');
                        galleryUploadErr.style.display = 'block';
                        setTimeout(() => { galleryUploadErr.textContent = ''; }, 3000);
                    }
                }
            })
            .catch(() => {
                if (galleryUploadErr) {
                    galleryUploadErr.textContent = '업로드 중 오류가 발생했습니다'.replace(/\.$/, '');
                    galleryUploadErr.style.display = 'block';
                }
            });
        });
    }

    // 갤러리 리스트 저장 버튼 동작
    const galleryListSaveBtn = document.getElementById('galleryListSaveBtn');
    const galleryListSaveMsg = document.getElementById('galleryListSaveMsg');
    const galleryListSaveErr = document.getElementById('galleryListSaveErr');
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
                        setTimeout(() => { galleryListSaveMsg.textContent = ''; }, 3000);
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
                        setTimeout(() => { galleryListSaveErr.textContent = ''; }, 3000);
                    }
                }
            })
            .catch(() => {
                if (galleryListSaveErr) {
                    galleryListSaveErr.textContent = '저장 중 오류가 발생했습니다'.replace(/\.$/, '');
                    galleryListSaveErr.style.display = 'block';
                }
            });
        });
    }

    function loadProductList() {
        const category = document.getElementById('productListCategory').value;
        console.log('[DEBUG] productListCategory value:', category);
        const productListDiv = document.getElementById('productList');
        productListDiv.innerHTML = '<div style="color:#aaa;text-align:center;">데이터 로딩중...</div>';
        fetch(`/api/products/${category}`)
            .then(res => {
                console.log('[DEBUG] fetch URL:', `/api/products/${category}`);
                return res.json();
            })
            .then(data => {
                if (!data.success || !data.products) {
                    productListDiv.innerHTML = '<div style="color:#ff6b6b;text-align:center;">상품 정보를 불러올 수 없습니다.</div>';
                    return;
                }
                if (data.products.length === 0) {
                    productListDiv.innerHTML = '<div style="color:#aaa;text-align:center;">등록된 상품이 없습니다.</div>';
                    return;
                }
                productListDiv.innerHTML = '';
                // 그룹 래퍼 생성
                const group = document.createElement('div');
                group.className = 'product-list-group';
                group.style.borderRadius = '8px';
                group.style.border = '1px solid rgba(16,16,16,0.1)';
                group.style.padding = '0';
                group.style.background = 'none';
                group.style.display = 'flex';
                group.style.flexDirection = 'column';
                group.style.gap = '0';
                try {
                    data.products.forEach((product, idx) => {
                        const item = document.createElement('div');
                        item.className = 'product-list-item';
                        item.style.display = 'flex';
                        item.style.flexDirection = 'row';
                        item.style.alignItems = 'center';
                        item.style.padding = '16px';
                        item.style.borderRadius = '0';
                        item.style.border = 'none';
                        item.style.background = 'none';
                        item.style.marginBottom = (idx === data.products.length-1) ? '0' : '12px';
                        item.style.transition = 'background 0.2s';
                        // 호버/클릭 효과
                        item.onmouseenter = function() {
                            item.style.background = 'rgba(16,16,16,0.8)';
                        };
                        item.onmouseleave = function() {
                            item.style.background = 'none';
                        };
                        item.onmousedown = function() {
                            item.style.background = 'rgba(16,16,16,0.8)';
                        };
                        item.onmouseup = function() {
                            item.style.background = 'rgba(16,16,16,0.8)';
                        };

                        // 순서 변경 버튼 영역 (상품카드 전용)
                        const orderControls = document.createElement('div');
                        orderControls.className = 'product-order-controls';

                        // 순번 원
                        const orderDot = document.createElement('div');
                        orderDot.className = 'product-order-dot';
                        orderDot.textContent = (idx + 1).toString();
                        orderControls.appendChild(orderDot);

                        // 위로 이동 버튼
                        const upArrow = document.createElement('div');
                        upArrow.className = 'product-order-arrow';
                        if (idx === 0) upArrow.classList.add('disabled');
                        const upImg = document.createElement('img');
                        upImg.src = 'images/icon-up.svg';
                        upImg.alt = '위로';
                        upArrow.appendChild(upImg);
                        if (idx !== 0) {
                            upArrow.onclick = function(e) {
                                e.stopPropagation();
                                const temp = data.products[idx-1];
                                data.products[idx-1] = data.products[idx];
                                data.products[idx] = temp;
                                loadProductList();
                            };
                        }
                        orderControls.appendChild(upArrow);

                        // 아래로 이동 버튼
                        const downArrow = document.createElement('div');
                        downArrow.className = 'product-order-arrow';
                        if (idx === data.products.length-1) downArrow.classList.add('disabled');
                        const downImg = document.createElement('img');
                        downImg.src = 'images/icon-down.svg';
                        downImg.alt = '아래로';
                        downArrow.appendChild(downImg);
                        if (idx !== data.products.length-1) {
                            downArrow.onclick = function(e) {
                                e.stopPropagation();
                                const temp = data.products[idx+1];
                                data.products[idx+1] = data.products[idx];
                                data.products[idx] = temp;
                                loadProductList();
                            };
                        }
                        orderControls.appendChild(downArrow);

                        orderControls.style.marginRight = '16px';
                        orderControls.style.minWidth = '40px';

                        // 상품 이미지
                        const img = document.createElement('img');
                        img.className = 'product-image admin-product-image';
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
                        img.style.objectFit = 'cover';
                        img.style.borderRadius = '4px';

                        // 상품명/설명 등(간단하게 title만 표시, 필요시 확장)
                        const infoDiv = document.createElement('div');
                        infoDiv.style.flex = '1';
                        infoDiv.style.marginLeft = '16px';
                        infoDiv.textContent = product.title;

                        // 수정 버튼
                        const editBtn = document.createElement('div');
                        editBtn.className = 'product-edit-btn';
                        editBtn.innerHTML = '<img src="images/icon-modify.svg" alt="수정" style="width:20px;height:20px;">';
                        editBtn.style.cursor = 'pointer';
                        editBtn.onclick = function(e) {
                            e.stopPropagation();
                            // TODO: 수정 모달/폼 열기 (기존 기능 그대로)
                            alert('수정 기능은 구현되어야 합니다.');
                        };
                        // 삭제 버튼
                        const delBtn = document.createElement('div');
                        delBtn.className = 'product-delete-btn';
                        delBtn.innerHTML = '<img src="images/icon-del.svg" alt="삭제" style="width:20px;height:20px;">';
                        delBtn.style.cursor = 'pointer';
                        delBtn.onclick = function(e) {
                            e.stopPropagation();
                            // TODO: 삭제 기능 (기존 기능 그대로)
                            alert('삭제 기능은 구현되어야 합니다.');
                        };
                        // 버튼 그룹
                        const btnGroup = document.createElement('div');
                        btnGroup.style.display = 'flex';
                        btnGroup.style.gap = '8px';
                        btnGroup.appendChild(editBtn);
                        btnGroup.appendChild(delBtn);

                        // 순서: [순서조정][이미지][정보][수정/삭제]
                        item.appendChild(orderControls);
                        item.appendChild(img);
                        item.appendChild(infoDiv);
                        item.appendChild(btnGroup);
                        group.appendChild(item);
                    });
                    productListDiv.appendChild(group);
                } catch (err) {
                    console.error('[DEBUG] render error:', err);
                    productListDiv.innerHTML = '<div style="color:#ff6b6b;text-align:center;">상품 정보를 불러올 수 없습니다.</div>';
                }
            })
            .catch((err) => {
                console.error('[DEBUG] fetch error:', err);
                productListDiv.innerHTML = '<div style="color:#ff6b6b;text-align:center;">상품 정보를 불러올 수 없습니다.</div>';
            });
    }
    window.loadProductList = loadProductList;
}); 