// TEİAŞ EKLİM v5.2 - Tüm eksiklikler giderilmiş versiyon

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. UYGULAMA DURUMU (STATE) VE AYARLAR ---
    const state = {
        token: localStorage.getItem('sessionToken') || null,
        logPaused: false,
        autoScroll: true,
        pollingIntervals: {
            status: null,
            logs: null,
            faults: null,
            notifications: null,
            systemInfo: null
        }
    };

    // Klavye navigasyonu için
document.addEventListener('keydown', function(e) {
    if (e.target.classList.contains('ip-part')) {
        // Backspace ile geri gitme
        if (e.key === 'Backspace' && e.target.value === '') {
            const part = parseInt(e.target.dataset.part);
            if (part > 1) {
                const prevInput = e.target.parentElement.querySelector(`.ip-part[data-part="${part - 1}"]`);
                if (prevInput) {
                    prevInput.focus();
                    prevInput.select();
                }
            }
        }
        // Sol ok ile geri gitme
        else if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
            const part = parseInt(e.target.dataset.part);
            if (part > 1) {
                const prevInput = e.target.parentElement.querySelector(`.ip-part[data-part="${part - 1}"]`);
                if (prevInput) {
                    prevInput.focus();
                    prevInput.select();
                }
            }
        }
        // Sağ ok ile ileri gitme
        else if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value.length) {
            const part = parseInt(e.target.dataset.part);
            if (part < 4) {
                const nextInput = e.target.parentElement.querySelector(`.ip-part[data-part="${part + 1}"]`);
                if (nextInput) {
                    nextInput.focus();
                    nextInput.select();
                }
            }
        }
    }
});

    // --- 2. SAYFA BAŞLATMA FONKSİYONLARI ---
    
    // Gösterge Paneli
    function initDashboardPage() {
        console.log("Gösterge paneli başlatılıyor...");
        const updateStatus = () => {
            secureFetch('/api/status')
                .then(response => response && response.json())
                .then(data => data && updateDashboardUI(data))
                .catch(error => {
                    console.error('Durum verileri alınamadı:', error);
                    showMessage('Durum verileri alınamadı', 'error');
                });
        };
        updateStatus();
        state.pollingIntervals.status = setInterval(updateStatus, 5000);
    }
    
// Network Ayarları Sayfası - GELİŞTİRİLMİŞ VERSİYON
function initNetworkPage() {
    console.log("🌐 Network sayfası başlatılıyor...");
    
    const form = document.getElementById('networkForm');
    const dhcpRadio = document.getElementById('dhcp');
    const staticRadio = document.getElementById('static');
    const staticSettings = document.getElementById('staticSettings');
    const refreshNetworkBtn = document.getElementById('refreshNetworkBtn');
    
    if (!form) {
        console.error('❌ Network form bulunamadı!');
        return;
    }
    
    // Mevcut network durumunu yükle
    loadNetworkStatus();
    
    // DHCP/Static toggle event listeners
    if (dhcpRadio) {
        dhcpRadio.addEventListener('change', function() {
            if (this.checked && staticSettings) {
                staticSettings.style.display = 'none';
                console.log('📡 DHCP modu seçildi');
                clearStaticFields();
            }
        });
    }
    
    if (staticRadio) {
        staticRadio.addEventListener('change', function() {
            if (this.checked && staticSettings) {
                staticSettings.style.display = 'block';
                console.log('🔧 Static IP modu seçildi');
            }
        });
    }
    
    // IP validation helper
    function validateIPAddress(ip) {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(ip);
    }
    
    // Static alanları temizle
    function clearStaticFields() {
        const fields = ['staticIP', 'gateway', 'subnet', 'dns1', 'dns2'];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.value = '';
        });
    }
    
    // Real-time IP validation
    const ipInputs = ['staticIP', 'gateway', 'subnet', 'dns1', 'dns2'];
    ipInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('blur', function() {
                if (this.value && !validateIPAddress(this.value)) {
                    this.style.borderColor = 'var(--error)';
                    this.style.backgroundColor = 'rgba(245, 101, 101, 0.1)';
                    showMessage(`Geçersiz IP adresi: ${this.value}`, 'error');
                } else {
                    this.style.borderColor = '';
                    this.style.backgroundColor = '';
                }
            });
            
            // Enter tuşu ile sonraki alana geç
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const currentIndex = ipInputs.indexOf(inputId);
                    if (currentIndex < ipInputs.length - 1) {
                        const nextInput = document.getElementById(ipInputs[currentIndex + 1]);
                        if (nextInput) nextInput.focus();
                    } else {
                        // Son alan, form submit
                        form.dispatchEvent(new Event('submit'));
                    }
                }
            });
        }
    });
    
    // Form validation
    function validateNetworkForm() {
        if (staticRadio && staticRadio.checked) {
            const requiredFields = ['staticIP', 'gateway', 'subnet', 'dns1'];
            
            for (const fieldId of requiredFields) {
                const field = document.getElementById(fieldId);
                if (!field || !field.value.trim()) {
                    showMessage(`${fieldId} alanı zorunludur`, 'error');
                    if (field) {
                        field.style.borderColor = 'var(--error)';
                        field.focus();
                    }
                    return false;
                }
                
                if (!validateIPAddress(field.value.trim())) {
                    showMessage(`Geçersiz IP adresi: ${field.value}`, 'error');
                    field.style.borderColor = 'var(--error)';
                    field.focus();
                    return false;
                }
            }
            
            // DNS2 opsiyonel ama girilmişse valid olmalı
            const dns2 = document.getElementById('dns2');
            if (dns2 && dns2.value.trim() && !validateIPAddress(dns2.value.trim())) {
                showMessage(`Geçersiz DNS2 adresi: ${dns2.value}`, 'error');
                dns2.style.borderColor = 'var(--error)';
                dns2.focus();
                return false;
            }
        }
        
        return true;
    }
    
    // Form gönderim handler'ı
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateNetworkForm()) {
            return;
        }
        
        const saveBtn = document.getElementById('saveNetworkBtn');
        const btnText = saveBtn?.querySelector('.btn-text');
        const btnLoader = saveBtn?.querySelector('.btn-loader');
        
        // Loading state
        if (saveBtn) saveBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'inline-block';
        
        const formData = new FormData(form);
        
        // Debug: Form verilerini logla
        console.log('📤 Network form verileri gönderiliyor...');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }
        
        try {
            const response = await secureFetch('/api/network', {
                method: 'POST',
                body: new URLSearchParams(formData)
            });
            
            if (response && response.ok) {
                const result = await response.json();
                showMessage(result.message || 'Network ayarları kaydedildi! Cihaz yeniden başlatılıyor...', 'success');
                
                // Countdown timer göster
                let countdown = 10;
                const countdownInterval = setInterval(() => {
                    showMessage(`Cihaz ${countdown} saniye içinde yeniden başlatılıyor...`, 'warning');
                    countdown--;
                    
                    if (countdown < 0) {
                        clearInterval(countdownInterval);
                        // Yeni IP ile yönlendirme
                        const newIP = formData.get('staticIP');
                        if (newIP) {
                            window.location.href = `http://${newIP}`;
                        } else {
                            window.location.href = '/';
                        }
                    }
                }, 1000);
                
            } else {
                const errorText = response ? await response.text() : 'Ağ hatası';
                showMessage('Network ayarları kaydedilemedi: ' + errorText, 'error');
            }
        } catch (error) {
            console.error('❌ Network kayıt hatası:', error);
            showMessage('Network ayarları kaydedilirken bir hata oluştu', 'error');
        } finally {
            // Reset loading state
            if (saveBtn) saveBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoader) btnLoader.style.display = 'none';
        }
    });
    
    // Yenile butonu
    if (refreshNetworkBtn) {
        refreshNetworkBtn.addEventListener('click', function() {
            showMessage('Sayfa yenileniyor...', 'info');
            setTimeout(() => {
                location.reload();
            }, 500);
        });
    }
    
    // Network test butonu (eğer varsa)
    const networkTestBtn = document.getElementById('networkTestBtn');
    if (networkTestBtn) {
        networkTestBtn.addEventListener('click', async function() {
            showMessage('Network bağlantısı test ediliyor...', 'info');
            
            try {
                const response = await secureFetch('/api/network');
                if (response && response.ok) {
                    const data = await response.json();
                    if (data.linkUp) {
                        showMessage('✅ Network bağlantısı başarılı', 'success');
                    } else {
                        showMessage('❌ Network bağlantısı yok', 'error');
                    }
                }
            } catch (error) {
                showMessage('Network testi başarısız', 'error');
            }
        });
    }
    
    // Preset butonları ekle
    setTimeout(() => {
        addNetworkPresets();
    }, 1000);
    
    console.log('✅ Network sayfası hazır');
}

// Network durumu yükleme fonksiyonu
async function loadNetworkStatus() {
    try {
        console.log('🔄 Network durumu yükleniyor...');
        
        const response = await secureFetch('/api/network');
        if (response && response.ok) {
            const data = await response.json();
            console.log('📊 Network verisi alındı:', data);
            
            // Durum göstergelerini güncelle
            updateElement('ethStatus', data.linkUp ? 'Bağlı' : 'Bağlı Değil');
            updateElement('currentIP', data.ip || 'Bilinmiyor');
            updateElement('macAddress', data.mac || 'Bilinmiyor');
            updateElement('linkSpeed', (data.linkSpeed || 0) + ' Mbps');
            updateElement('currentGateway', data.gateway || 'Bilinmiyor');
            updateElement('currentDNS', data.dns1 || 'Bilinmiyor');
            
            // Status badge rengini güncelle
            const ethStatusEl = document.getElementById('ethStatus');
            if (ethStatusEl) {
                ethStatusEl.className = `status-value ${data.linkUp ? 'online' : 'offline'}`;
            }
            
            // Form değerlerini doldur
            const dhcpRadio = document.getElementById('dhcp');
            const staticRadio = document.getElementById('static');
            const staticSettings = document.getElementById('staticSettings');
            
            if (data.dhcp && dhcpRadio) {
                dhcpRadio.checked = true;
                if (staticSettings) staticSettings.style.display = 'none';
                console.log('📡 DHCP modu aktif');
            } else if (staticRadio) {
                staticRadio.checked = true;
                if (staticSettings) staticSettings.style.display = 'block';
                
                // Static IP değerlerini doldur
                updateElement('staticIP', data.ip);
                updateElement('gateway', data.gateway);
                updateElement('subnet', data.subnet);
                updateElement('dns1', data.dns1);
                updateElement('dns2', data.dns2 || '');
                
                console.log('🔧 Static IP modu aktif');
            }
            
        } else {
            console.error('❌ Network durumu alınamadı');
            showMessage('Network bilgileri yüklenemedi', 'error');
        }
    } catch (error) {
        console.error('❌ Network durumu yükleme hatası:', error);
        showMessage('Network durumu yüklenirken hata oluştu', 'error');
    }
}

// Network preset butonları ekle
function addNetworkPresets() {
    const staticSettings = document.getElementById('staticSettings');
    if (!staticSettings || staticSettings.querySelector('.network-presets')) return;
    
    const presetsHTML = `
        <div class="network-presets" style="margin: 1rem 0; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-primary);">
            <h4 style="margin-bottom: 0.5rem; color: var(--text-primary); font-size: 0.875rem;">🚀 Hızlı IP Ayarları</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                <button type="button" class="preset-network-btn" data-ip="192.168.1.100" data-gw="192.168.1.1" data-subnet="255.255.255.0" data-dns="8.8.8.8">
                    🏠 Ev Ağı (192.168.1.x)
                </button>
                <button type="button" class="preset-network-btn" data-ip="192.168.0.100" data-gw="192.168.0.1" data-subnet="255.255.255.0" data-dns="1.1.1.1">
                    🏢 Ofis Ağı (192.168.0.x)
                </button>
                <button type="button" class="preset-network-btn" data-ip="10.0.0.100" data-gw="10.0.0.1" data-subnet="255.255.255.0" data-dns="8.8.4.4">
                    🏭 Kurumsal (10.0.0.x)
                </button>
            </div>
        </div>
    `;
    
    staticSettings.insertAdjacentHTML('beforeend', presetsHTML);
    
    // Event listeners ekle
    staticSettings.querySelectorAll('.preset-network-btn').forEach(btn => {
        btn.style.cssText = `
            padding: 0.25rem 0.5rem;
            background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary));
            border: 1px solid var(--border-primary);
            border-radius: var(--radius-full);
            color: var(--text-secondary);
            font-size: 0.75rem;
            cursor: pointer;
            transition: all var(--transition-fast);
        `;
        
        btn.addEventListener('mouseover', function() {
            this.style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))';
            this.style.color = 'white';
        });
        
        btn.addEventListener('mouseout', function() {
            this.style.background = 'linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary))';
            this.style.color = 'var(--text-secondary)';
        });
        
        btn.addEventListener('click', function() {
            const ip = this.dataset.ip;
            const gw = this.dataset.gw;
            const subnet = this.dataset.subnet;
            const dns = this.dataset.dns;
            
            // Değerleri doldur
            updateElement('staticIP', ip);
            updateElement('gateway', gw);
            updateElement('subnet', subnet);
            updateElement('dns1', dns);
            
            showMessage(`✅ ${this.textContent.trim()} ayarları yüklendi`, 'success');
        });
    });
}

// updateElement fonksiyonu güvenli versiyon
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        if (element.tagName === 'INPUT') {
            element.value = value || '';
        } else {
            element.textContent = value || '';
        }
    }
}

    // System Info Sayfası - YENİ
    function initSystemInfoPage() {
        const updateSystemInfo = async () => {
            try {
                const response = await secureFetch('/api/system-info');
                if (response && response.ok) {
                    const data = await response.json();
                    
                    // Hardware bilgileri
                    updateElement('chipModel', data.hardware.chip);
                    updateElement('coreCount', data.hardware.cores);
                    updateElement('cpuFreq', data.hardware.frequency + ' MHz');
                    updateElement('chipRevision', data.hardware.revision);
                    updateElement('flashSize', formatBytes(data.hardware.flashSize));
                    
                    // Memory bilgileri
                    updateElement('totalHeap', formatBytes(data.memory.totalHeap));
                    updateElement('usedHeap', formatBytes(data.memory.usedHeap));
                    updateElement('freeHeap', formatBytes(data.memory.freeHeap));
                    updateElement('minFreeHeap', formatBytes(data.memory.minFreeHeap));
                    
                    const usagePercent = Math.round((data.memory.usedHeap / data.memory.totalHeap) * 100);
                    updateElement('ramUsageBar', '', usagePercent);
                    updateElement('ramUsagePercent', usagePercent + '%');
                    document.getElementById('ramUsageBar').style.width = usagePercent + '%';
                    
                    // Software bilgileri
                    updateElement('firmwareVersion', 'v' + data.software.version);
                    updateElement('sdkVersion', data.software.sdk);
                    updateElement('buildDate', data.software.buildDate);
                    updateElement('uptime', formatUptime(data.software.uptime));
                    
                    // UART istatistikleri
                    updateElement('uartTxCount', data.uart.txCount);
                    updateElement('uartRxCount', data.uart.rxCount);
                    updateElement('uartErrorCount', data.uart.errors);
                    updateElement('uartSuccessRate', data.uart.successRate.toFixed(1) + '%');
                    updateElement('currentBaud', data.uart.baudRate);
                    
                    // Dosya sistemi
                    updateElement('totalSpace', formatBytes(data.filesystem.total));
                    updateElement('usedSpace', formatBytes(data.filesystem.used));
                    updateElement('freeSpace', formatBytes(data.filesystem.free));
                }
            } catch (error) {
                console.error('System info hatası:', error);
                showMessage('Sistem bilgileri alınamadı', 'error');
            }
        };

        updateSystemInfo();
        state.pollingIntervals.systemInfo = setInterval(updateSystemInfo, 10000);

        // Yenile butonu
        document.getElementById('refreshBtn')?.addEventListener('click', updateSystemInfo);

        // Yeniden başlat butonu
        document.getElementById('rebootBtn')?.addEventListener('click', async () => {
            if (confirm('Sistemi yeniden başlatmak istediğinize emin misiniz?')) {
                const response = await secureFetch('/api/system/reboot', { method: 'POST' });
                if (response && response.ok) {
                    showMessage('Sistem yeniden başlatılıyor...', 'warning');
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 3000);
                }
            }
        });
    }

    // Hesap Ayarları
    function initAccountPage() {
        const form = document.getElementById('accountForm');
        if (!form) return;

        secureFetch('/api/settings').then(r => r && r.json()).then(settings => {
            if (settings) {
                form.querySelector('#deviceName').value = settings.deviceName || '';
                form.querySelector('#tmName').value = settings.tmName || '';
                form.querySelector('#username').value = settings.username || '';
            }
        }).catch(error => {
            console.error('Ayarlar yüklenemedi:', error);
            showMessage('Ayarlar yüklenemedi', 'error');
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const response = await secureFetch('/api/settings', {
                    method: 'POST',
                    body: new URLSearchParams(new FormData(form))
                });
                showMessage(response && response.ok ? 'Ayarlar başarıyla kaydedildi.' : 'Ayarlar kaydedilirken bir hata oluştu.', response && response.ok ? 'success' : 'error');
            } catch (error) {
                console.error('Ayar kayıt hatası:', error);
                showMessage('Bir hata oluştu', 'error');
            }
        });
    }

    // NTP Ayarları
    // Global fonksiyon - window nesnesine ekle ki HTML'den çağrılabilsin
window.moveToNext = function(input, nextPart, isSecondary = false) {
    const value = input.value;
    
    // Sadece sayı girişine izin ver ve temizle
    const numericValue = value.replace(/[^0-9]/g, '');
    input.value = numericValue;
    
    // 255'i aşmasını engelle
    if (parseInt(numericValue) > 255) {
        input.value = '255';
    }
    
    // Otomatik geçiş koşulları
    const shouldMoveNext = (input.value.length === 3) || 
                          (input.value === '255') || 
                          (input.value.length === 2 && parseInt(input.value) > 25);
    
    if (shouldMoveNext && nextPart <= 4) {
        const nextInput = getNextIPInput(input, nextPart, isSecondary);
        if (nextInput) {
            setTimeout(() => {
                nextInput.focus();
                nextInput.select();
            }, 10);
        }
    }
    
    // Hidden input'u güncelle
    updateHiddenIPInput(isSecondary);
    
    // Container'ı validate et
    validateIPContainer(input.closest('.ip-input-container'));
};

function getNextIPInput(currentInput, nextPart, isSecondary) {
    if (isSecondary) {
        return document.getElementById(`ntp2-part${nextPart}`);
    } else {
        const container = currentInput.closest('.ip-input-container');
        return container ? container.querySelector(`.ip-part[data-part="${nextPart}"]`) : null;
    }
}

function getPrevIPInput(currentInput, currentPart, isSecondary) {
    if (currentPart <= 1) return null;
    
    if (isSecondary) {
        return document.getElementById(`ntp2-part${currentPart - 1}`);
    } else {
        const container = currentInput.closest('.ip-input-container');
        return container ? container.querySelector(`.ip-part[data-part="${currentPart - 1}"]`) : null;
    }
}

function updateHiddenIPInput(isSecondary = false) {
    const hiddenId = isSecondary ? 'ntpServer2' : 'ntpServer1';
    const hiddenInput = document.getElementById(hiddenId);
    
    if (!hiddenInput) return;
    
    let parts = [];
    
    if (isSecondary) {
        // İkincil NTP için ID'leri kullan
        for (let i = 1; i <= 4; i++) {
            const input = document.getElementById(`ntp2-part${i}`);
            const value = input ? (input.value || '0') : '0';
            parts.push(value);
        }
    } else {
        // Birincil NTP için container'dan seç
        const container = document.querySelector('.ip-input-container:not(:has(#ntp2-part1))');
        if (container) {
            const inputs = container.querySelectorAll('.ip-part');
            inputs.forEach(input => {
                const value = input.value || '0';
                parts.push(value);
            });
        } else {
            parts = ['0', '0', '0', '0'];
        }
    }
    
    const ip = parts.join('.');
    hiddenInput.value = ip;
    
    console.log(`${isSecondary ? 'NTP2' : 'NTP1'} güncellendi:`, ip);
}

function validateIPContainer(container) {
    if (!container) return false;
    
    const inputs = container.querySelectorAll('.ip-part');
    let isValid = true;
    let isEmpty = true;
    
    inputs.forEach(input => {
        const value = input.value.trim();
        if (value !== '' && value !== '0') {
            isEmpty = false;
        }
        
        if (value !== '') {
            const num = parseInt(value);
            if (isNaN(num) || num < 0 || num > 255) {
                isValid = false;
            }
        }
    });
    
    // CSS class'larını güncelle
    container.classList.remove('valid', 'invalid', 'empty');
    
    if (isEmpty) {
        container.classList.add('empty');
        return false;
    } else if (isValid) {
        container.classList.add('valid');
        return true;
    } else {
        container.classList.add('invalid');
        return false;
    }
}

function validateIPFormat(ip) {
    if (!ip || ip.trim() === '' || ip === '0.0.0.0') return false;
    
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    
    return parts.every(part => {
        const num = parseInt(part);
        return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
    });
}

function validateNTPForm() {
    const ntp1 = document.getElementById('ntpServer1').value;
    const ntp2 = document.getElementById('ntpServer2').value;
    
    console.log('NTP Form Validation:', { ntp1, ntp2 });
    
    // Birincil NTP zorunlu kontrol
    if (!validateIPFormat(ntp1)) {
        showMessage('Lütfen geçerli bir birincil NTP IP adresi girin. Örnek: 192.168.1.1', 'error');
        
        // İlk container'a focus et
        const firstContainer = document.querySelector('.ip-input-container:not(:has(#ntp2-part1))');
        if (firstContainer) {
            const firstInput = firstContainer.querySelector('.ip-part');
            if (firstInput) firstInput.focus();
            firstContainer.classList.add('invalid');
        }
        return false;
    }
    
    // İkincil NTP opsiyonel ama girilmişse geçerli olmalı
    if (ntp2 && ntp2 !== '0.0.0.0' && !validateIPFormat(ntp2)) {
        showMessage('İkincil NTP IP adresi geçersiz. Boş bırakabilir veya geçerli IP girebilirsiniz.', 'error');
        
        // İkinci container'a focus et
        const secondContainer = document.querySelector('.ip-input-container:has(#ntp2-part1)');
        if (secondContainer) {
            const firstInput = secondContainer.querySelector('.ip-part');
            if (firstInput) firstInput.focus();
            secondContainer.classList.add('invalid');
        }
        return false;
    }
    
    return true;
}

function loadCurrentNTPToInputs(server1, server2) {
    console.log('NTP değerleri yükleniyor:', { server1, server2 });
    
    // Birincil NTP yükle
    if (server1 && validateIPFormat(server1)) {
        const parts = server1.split('.');
        const container = document.querySelector('.ip-input-container:not(:has(#ntp2-part1))');
        if (container) {
            const inputs = container.querySelectorAll('.ip-part');
            parts.forEach((part, index) => {
                if (inputs[index]) {
                    inputs[index].value = part;
                }
            });
            updateHiddenIPInput(false);
            validateIPContainer(container);
        }
    }
    
    // İkincil NTP yükle
    if (server2 && validateIPFormat(server2)) {
        const parts = server2.split('.');
        for (let i = 1; i <= 4; i++) {
            const input = document.getElementById(`ntp2-part${i}`);
            if (input && parts[i-1]) {
                input.value = parts[i-1];
            }
        }
        updateHiddenIPInput(true);
        const container2 = document.querySelector('.ip-input-container:has(#ntp2-part1)');
        validateIPContainer(container2);
    }
}

function setupIPInputKeyboardHandlers() {
    document.addEventListener('keydown', function(e) {
        if (!e.target.classList.contains('ip-part')) return;
        
        const currentInput = e.target;
        const currentPart = parseInt(currentInput.dataset.part);
        const isSecondary = currentInput.id && currentInput.id.startsWith('ntp2-');
        
        switch(e.key) {
            case 'Backspace':
                if (currentInput.value === '' && currentInput.selectionStart === 0) {
                    e.preventDefault();
                    const prevInput = getPrevIPInput(currentInput, currentPart, isSecondary);
                    if (prevInput) {
                        prevInput.focus();
                        prevInput.setSelectionRange(prevInput.value.length, prevInput.value.length);
                    }
                }
                break;
                
            case 'ArrowLeft':
                if (currentInput.selectionStart === 0) {
                    e.preventDefault();
                    const prevInput = getPrevIPInput(currentInput, currentPart, isSecondary);
                    if (prevInput) {
                        prevInput.focus();
                        prevInput.setSelectionRange(prevInput.value.length, prevInput.value.length);
                    }
                }
                break;
                
            case 'ArrowRight':
                if (currentInput.selectionStart === currentInput.value.length) {
                    e.preventDefault();
                    const nextInput = getNextIPInput(currentInput, currentPart + 1, isSecondary);
                    if (nextInput) {
                        nextInput.focus();
                        nextInput.setSelectionRange(0, 0);
                    }
                }
                break;
                
            case '.':
            case 'Period':
                e.preventDefault();
                const nextInput = getNextIPInput(currentInput, currentPart + 1, isSecondary);
                if (nextInput) {
                    nextInput.focus();
                    nextInput.select();
                }
                break;
                
            case 'Tab':
                // Tab normal davranışını korur, müdahale etme
                break;
                
            default:
                // Sadece sayısal girişe izin ver
                if (!/[0-9]/.test(e.key) && 
                    !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) &&
                    !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                }
        }
    });
    
    // Input change olayları
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('ip-part')) {
            const isSecondary = e.target.id && e.target.id.startsWith('ntp2-');
            
            // Değeri güncelle
            setTimeout(() => {
                updateHiddenIPInput(isSecondary);
                validateIPContainer(e.target.closest('.ip-input-container'));
            }, 10);
        }
    });
}

function addPresetServerButtons() {
    const form = document.getElementById('ntpForm');
    if (!form) return;
    
    const firstSection = form.querySelector('.settings-section');
    if (!firstSection || firstSection.querySelector('.preset-servers')) return; // Zaten eklenmişse çık
    
    const presetHTML = `
        <div class="preset-servers">
            <h4>🚀 Hızlı NTP Sunucu Seçenekleri</h4>
            <div class="preset-buttons">
                <button type="button" class="preset-btn" data-ip="192.168.1.1" title="Yerel Router/Modem">
                    🏠 Router (192.168.1.1)
                </button>
                <button type="button" class="preset-btn" data-ip="8.8.8.8" title="Google Public DNS">
                    🌐 Google (8.8.8.8)
                </button>
                <button type="button" class="preset-btn" data-ip="1.1.1.1" title="Cloudflare DNS">
                    ⚡ Cloudflare (1.1.1.1)
                </button>
                <button type="button" class="preset-btn" data-ip="208.67.222.222" title="OpenDNS">
                    🔒 OpenDNS (208.67.222.222)
                </button>
            </div>
        </div>
    `;
    
    firstSection.insertAdjacentHTML('beforeend', presetHTML);
    
    // Event listener'ları ekle
    form.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const ip = this.dataset.ip;
            const parts = ip.split('.');
            
            // Birincil NTP'ye yükle
            const container = document.querySelector('.ip-input-container:not(:has(#ntp2-part1))');
            if (container) {
                const inputs = container.querySelectorAll('.ip-part');
                parts.forEach((part, index) => {
                    if (inputs[index]) {
                        inputs[index].value = part;
                        
                        // Güzel bir animasyon efekti
                        inputs[index].style.background = 'rgba(72, 187, 120, 0.3)';
                        setTimeout(() => {
                            inputs[index].style.background = '';
                        }, 500);
                    }
                });
                
                updateHiddenIPInput(false);
                validateIPContainer(container);
                
                showMessage(`✅ Birincil NTP sunucu: ${ip} seçildi`, 'success');
            }
        });
    });
}

// İyileştirilmiş initNtpPage fonksiyonu
function initNtpPage() {
    const form = document.getElementById('ntpForm');
    if (!form) {
        console.warn('NTP form bulunamadı');
        return;
    }
    
    console.log('NTP sayfası başlatılıyor...');
    
    // Klavye handler'larını kur
    setupIPInputKeyboardHandlers();
    
    // Preset butonları ekle
    setTimeout(() => addPresetServerButtons(), 100);
    
    // Mevcut ayarları yükle
    secureFetch('/api/ntp')
        .then(r => r && r.json())
        .then(ntp => {
            if (ntp) {
                console.log('Mevcut NTP ayarları:', ntp);
                
                updateElement('currentServer1', ntp.ntpServer1 || 'Belirtilmemiş');
                updateElement('currentServer2', ntp.ntpServer2 || 'Belirtilmemiş');
                updateElement('lastUpdate', new Date().toLocaleTimeString());
                
                // IP inputlarına yükle
                setTimeout(() => {
                    loadCurrentNTPToInputs(ntp.ntpServer1, ntp.ntpServer2);
                }, 200);
            }
        })
        .catch(error => {
            console.error('NTP ayarları yüklenemedi:', error);
            showMessage('NTP ayarları yüklenirken hata oluştu', 'error');
        });

    // Form gönderim handler'ı
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        console.log('NTP formu gönderiliyor...');
        
        // Validation
        if (!validateNTPForm()) {
            return;
        }
        
        const saveBtn = document.getElementById('saveNtpBtn');
        const btnText = saveBtn.querySelector('.btn-text');
        const btnLoader = saveBtn.querySelector('.btn-loader');
        
        // Loading state
        saveBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
        
        const formData = new FormData(form);
        const server1 = formData.get('ntpServer1');
        const server2 = formData.get('ntpServer2');
        
        console.log('Gönderilecek NTP ayarları:', { server1, server2 });
        
        try {
            const response = await secureFetch('/api/ntp', {
                method: 'POST',
                body: new URLSearchParams(formData)
            });
            
            if (response && response.ok) {
                showMessage('✅ NTP ayarları başarıyla dsPIC33EP\'ye gönderildi', 'success');
                
                // Mevcut değerleri göster
                updateElement('currentServer1', server1);
                updateElement('currentServer2', server2 || 'Belirtilmemiş');
                updateElement('lastUpdate', new Date().toLocaleTimeString());
                
            } else {
                const errorText = await response.text();
                showMessage('❌ NTP ayarları gönderilemedi: ' + errorText, 'error');
            }
        } catch (error) {
            console.error('NTP API hatası:', error);
            showMessage('⚠️ Sunucu ile iletişim kurulamadı', 'error');
        } finally {
            // Reset loading state
            saveBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
    });
    
    // Sayfa yüklendiğinde hidden input'ları başlat
    setTimeout(() => {
        updateHiddenIPInput(false);
        updateHiddenIPInput(true);
    }, 300);
    
    console.log('✅ NTP sayfası hazır');
}
    
    // BaudRate Ayarları (Test butonu kaldırıldı)
    function initBaudRatePage() { 
        const form = document.getElementById('baudrateForm');
        if (!form) return;

        secureFetch('/api/baudrate').then(r => r && r.json()).then(br => {
            if (br) {
                updateElement('currentBaudRate', br.baudRate + ' bps');
                const radio = document.querySelector(`input[name="baud"][value="${br.baudRate}"]`);
                if (radio) radio.checked = true;
            }
        }).catch(error => {
            console.error('Baudrate yüklenemedi:', error);
            showMessage('Baudrate bilgisi alınamadı', 'error');
        });
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            try {
                const response = await secureFetch('/api/baudrate', { method: 'POST', body: new URLSearchParams(formData) });
                showMessage(response && response.ok ? 'BaudRate başarıyla değiştirildi.' : 'BaudRate değiştirilemedi.', response && response.ok ? 'success' : 'error');
                if(response && response.ok) updateElement('currentBaudRate', formData.get('baud') + ' bps');
            } catch (error) {
                console.error('Baudrate değiştirme hatası:', error);
                showMessage('Bir hata oluştu', 'error');
            }
        });
    }

    // Arıza Kayıtları Sayfası - GÜNCELLENMİŞ
    function initFaultPage() {
    const firstFaultBtn = document.getElementById('firstFaultBtn');
    const nextFaultBtn = document.getElementById('nextFaultBtn');
    const refreshFaultBtn = document.getElementById('refreshFaultBtn');
    const exportFaultBtn = document.getElementById('exportFaultBtn');
    const clearFaultBtn = document.getElementById('clearFaultBtn');
    const autoRefreshToggle = document.getElementById('autoRefreshToggle');
    const filterLevel = document.getElementById('filterLevel');
    const faultContent = document.getElementById('faultContent');
    
    if (!firstFaultBtn) return;
    
    let faultCount = 0;
    let autoRefreshInterval = null;
    let allFaults = []; // Tüm arızaları saklamak için
    let currentFilter = 'all';
    
    // Otomatik yenileme durumu
    let autoRefreshActive = false;
    
    // Filtreleme fonksiyonu
    function filterFaults() {
        const filteredFaults = currentFilter === 'all' 
            ? allFaults 
            : allFaults.filter(fault => fault.level === currentFilter);
        
        faultContent.innerHTML = '';
        
        if (filteredFaults.length === 0) {
            faultContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h4>Arıza kaydı bulunamadı</h4>
                    <p>Filtreleme kriterlerine uygun arıza kaydı bulunamadı.</p>
                </div>
            `;
            return;
        }
        
        filteredFaults.forEach(fault => {
            const recordDiv = document.createElement('div');
            recordDiv.className = `fault-record ${fault.level}`;
            recordDiv.innerHTML = `
                <div class="fault-header">
                    <span class="fault-number">#${fault.number}</span>
                    <span class="fault-time">${fault.time}</span>
                    <span class="fault-level ${fault.level}">${fault.level.toUpperCase()}</span>
                </div>
                <div class="fault-body">${fault.content}</div>
            `;
            faultContent.appendChild(recordDiv);
        });
    }
    
    // Arıza kaydı getirme fonksiyonu
    const fetchFault = async (endpoint) => {
        try {
            const response = await secureFetch(endpoint, { method: 'POST' });
            if (response && response.ok) {
                const text = await response.text();
                if (text && text.length > 0 && !text.toLowerCase().includes("error")) {
                    // Arıza seviyesini belirleme (basit bir yaklaşım)
                    let level = 'info';
                    if (text.toLowerCase().includes('error') || text.toLowerCase().includes('critical')) level = 'critical';
                    else if (text.toLowerCase().includes('warning') || text.toLowerCase().includes('uyarı')) level = 'warning';
                    
                    const faultRecord = {
                        number: ++faultCount,
                        time: new Date().toLocaleTimeString(),
                        content: text,
                        level: level
                    };
                    
                    allFaults.unshift(faultRecord); // En yeni en üstte
                    
                    const emptyState = faultContent.querySelector('.empty-state');
                    if (emptyState) emptyState.remove();
                    
                    // Filtreye uygun mu diye kontrol et
                    if (currentFilter === 'all' || currentFilter === level) {
                        const recordDiv = document.createElement('div');
                        recordDiv.className = `fault-record ${level}`;
                        recordDiv.innerHTML = `
                            <div class="fault-header">
                                <span class="fault-number">#${faultRecord.number}</span>
                                <span class="fault-time">${faultRecord.time}</span>
                                <span class="fault-level ${level}">${level.toUpperCase()}</span>
                            </div>
                            <div class="fault-body">${faultRecord.content}</div>
                        `;
                        faultContent.prepend(recordDiv);
                    }
                    
                    updateElement('totalFaults', faultCount.toString());
                    updateElement('lastQuery', new Date().toLocaleTimeString());
                    
                    return faultRecord;
                } else {
                    showMessage('Alınacak başka arıza kaydı yok.', 'info');
                    return null;
                }
            } else {
                showMessage('Arıza kaydı alınamadı.', 'error');
                return null;
            }
        } catch (error) {
            console.error('Arıza kaydı hatası:', error);
            showMessage('Bir hata oluştu', 'error');
            return null;
        }
    };

    // İlk arıza butonu
    firstFaultBtn.addEventListener('click', () => {
        faultCount = 0;
        allFaults = [];
        faultContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⏳</div>
                <h4>Arıza kayıtları yükleniyor</h4>
                <p>İlk arıza kaydı alınıyor...</p>
            </div>
        `;
        fetchFault('/api/faults/first');
    });

    // Sonraki arıza butonu
    nextFaultBtn.addEventListener('click', () => fetchFault('/api/faults/next'));

    // Yenile butonu
    refreshFaultBtn.addEventListener('click', () => {
        if (allFaults.length > 0) {
            fetchFault('/api/faults/next');
        } else {
            firstFaultBtn.click();
        }
    });

    // Dışa aktar butonu
    exportFaultBtn.addEventListener('click', () => {
        if (allFaults.length === 0) {
            showMessage('Dışa aktarılacak arıza kaydı bulunamadı.', 'warning');
            return;
        }
        
        let exportContent = "TEİAŞ EKLİM - Arıza Kayıtları Raporu\n";
        exportContent += "Oluşturulma Tarihi: " + new Date().toLocaleString() + "\n";
        exportContent += "Toplam Kayıt: " + allFaults.length + "\n\n";
        
        allFaults.forEach(fault => {
            exportContent += `#${fault.number} [${fault.time}] [${fault.level.toUpperCase()}]\n`;
            exportContent += `${fault.content}\n`;
            exportContent += "─".repeat(50) + "\n";
        });
        
        const blob = new Blob([exportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `teias_eklim_ariza_kayitlari_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showMessage('Arıza kayıtları başarıyla dışa aktarıldı.', 'success');
    });

    // Ekranı temizle butonu
    clearFaultBtn.addEventListener('click', () => {
        if (allFaults.length === 0) {
            showMessage('Zaten temiz!', 'info');
            return;
        }
        
        if (confirm('Tüm arıza kayıtları ekrandan silinecek. Emin misiniz?')) {
            faultCount = 0;
            allFaults = [];
            faultContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h4>Arıza kaydı bulunamadı</h4>
                    <p>Arıza kayıtlarını görüntülemek için yukarıdaki butonları kullanın.</p>
                </div>
            `;
            updateElement('totalFaults', '0');
            updateElement('lastQuery', 'Henüz sorgu yapılmadı');
            showMessage('Ekran temizlendi.', 'success');
        }
    });

    // Otomatik yenileme toggle
    autoRefreshToggle.addEventListener('click', () => {
        autoRefreshActive = !autoRefreshActive;
        
        if (autoRefreshActive) {
            autoRefreshToggle.classList.add('active');
            autoRefreshToggle.querySelector('.toggle-icon').textContent = '▶️';
            autoRefreshToggle.querySelector('.toggle-text').textContent = 'Otomatik Yenileme (Aktif)';
            
            autoRefreshInterval = setInterval(() => {
                if (allFaults.length > 0) {
                    fetchFault('/api/faults/next');
                }
            }, 10000); // 10 saniyede bir
            
            showMessage('Otomatik yenileme başlatıldı.', 'info');
        } else {
            autoRefreshToggle.classList.remove('active');
            autoRefreshToggle.querySelector('.toggle-icon').textContent = '⏸️';
            autoRefreshToggle.querySelector('.toggle-text').textContent = 'Otomatik Yenileme';
            
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                autoRefreshInterval = null;
            }
            
            showMessage('Otomatik yenileme durduruldu.', 'info');
        }
    });

    // Filtre dropdown
    filterLevel.addEventListener('change', () => {
        currentFilter = filterLevel.value;
        filterFaults();
        showMessage(`Filtre: ${currentFilter === 'all' ? 'Tümü' : currentFilter}`, 'info');
    });
    
    // Sayfa kapatılırken interval'i temizle
    window.addEventListener('beforeunload', () => {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
        }
    });
}

// Log Kayıtları Sayfası - GÜNCELLENMİŞ
function initLogPage() {
    const logContainer = document.getElementById('logContainer');
    const pauseLogsBtn = document.getElementById('pauseLogsBtn');
    const exportLogsBtn = document.getElementById('exportLogsBtn');
    const refreshLogsBtn = document.getElementById('refreshLogsBtn');
    const clearLogsBtn = document.getElementById('clearLogsBtn');
    const autoScrollToggle = document.getElementById('autoScrollToggle');
    const autoRefreshToggle = document.getElementById('autoRefreshToggle');
    const refreshInterval = document.getElementById('refreshInterval');
    const logSearch = document.getElementById('logSearch');
    const logLevelFilter = document.getElementById('logLevelFilter');
    const logSourceFilter = document.getElementById('logSourceFilter');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    
    if (!logContainer) {
        console.warn('Log container bulunamadı');
        return;
    }
    
    console.log('🔍 Log filtreleme sistemi başlatılıyor...');
    
    // Log verileri ve filtreler
    let allLogs = [];
    let filteredLogs = [];
    let autoRefreshActive = true;
    let autoScrollActive = true;
    let refreshIntervalId = null;
    
    // Mevcut filtreler
    const currentFilters = {
        search: '',
        level: 'all',
        source: 'all'
    };

    // Logları filtrele
    function applyFilters() {
        console.log('Filtreler uygulanıyor:', currentFilters);
        
        filteredLogs = allLogs.filter(log => {
            // Seviye filtresi
            if (currentFilters.level !== 'all' && log.l !== currentFilters.level) {
                return false;
            }
            
            // Kaynak filtresi
            if (currentFilters.source !== 'all' && log.s !== currentFilters.source) {
                return false;
            }
            
            // Arama filtresi - hem mesajda hem de kaynakta ara
            if (currentFilters.search) {
                const searchTerm = currentFilters.search.toLowerCase();
                const messageMatch = log.m.toLowerCase().includes(searchTerm);
                const sourceMatch = log.s.toLowerCase().includes(searchTerm);
                const levelMatch = log.l.toLowerCase().includes(searchTerm);
                
                if (!messageMatch && !sourceMatch && !levelMatch) {
                    return false;
                }
            }
            
            return true;
        });
        
        console.log(`Filtreleme sonucu: ${filteredLogs.length}/${allLogs.length} log`);
        renderLogs();
        updateLogStats();
        updateFilterBadges();
    }

    // Logları ekranda göster
    function renderLogs() {
        if (!logContainer) return;
        
        // Loading spinner'ı kaldır
        const loadingElement = logContainer.querySelector('.loading-logs');
        if (loadingElement) {
            loadingElement.remove();
        }
        
        // Mevcut logları temizle
        logContainer.innerHTML = '';
        
        if (filteredLogs.length === 0) {
            const emptyMessage = allLogs.length === 0 ? 
                'Henüz log kaydı yok. Sistem çalıştıkça loglar burada görünecek.' :
                `Filtreleme kriterlerine uygun log bulunamadı. (${allLogs.length} log var)`;
                
            logContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h4>Log bulunamadı</h4>
                    <p>${emptyMessage}</p>
                    ${currentFilters.search || currentFilters.level !== 'all' || currentFilters.source !== 'all' ? 
                        '<button class="btn secondary small" onclick="clearAllFilters()">🧹 Filtreleri Temizle</button>' : ''}
                </div>
            `;
            return;
        }

        // Fragment kullanarak performansı artır
        const fragment = document.createDocumentFragment();
        
        filteredLogs.forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry log-${log.l.toLowerCase()}`;
            
            // Arama terimini vurgula
            let highlightedMessage = log.m;
            if (currentFilters.search) {
                const regex = new RegExp(`(${escapeRegExp(currentFilters.search)})`, 'gi');
                highlightedMessage = log.m.replace(regex, '<mark>$1</mark>');
            }
            
            logEntry.innerHTML = `
                <span class="log-time" title="Tam tarih: ${log.t}">${log.t}</span>
                <span class="log-level level-${log.l.toLowerCase()}" title="Log seviyesi">${log.l}</span>
                <span class="log-source" title="Log kaynağı">${log.s}</span>
                <span class="log-message">${highlightedMessage}</span>
            `;
            
            fragment.appendChild(logEntry);
        });
        
        logContainer.appendChild(fragment);
        
        // Otomatik kaydırma
        if (autoScrollActive) {
            setTimeout(() => {
                logContainer.scrollTop = logContainer.scrollHeight;
            }, 100);
        }
    }

    // İstatistikleri güncelle
    function updateLogStats() {
        updateElement('totalLogs', allLogs.length.toString());
        
        const errorCount = allLogs.filter(log => log.l === 'ERROR').length;
        const warningCount = allLogs.filter(log => log.l === 'WARN').length;
        
        updateElement('errorCount', errorCount.toString());
        updateElement('warningCount', warningCount.toString());
        updateElement('lastLogUpdate', new Date().toLocaleTimeString());
    }

    // Filtre badge'lerini güncelle (aktif filtre sayısını göster)
    function updateFilterBadges() {
        let activeFilterCount = 0;
        
        if (currentFilters.search) activeFilterCount++;
        if (currentFilters.level !== 'all') activeFilterCount++;
        if (currentFilters.source !== 'all') activeFilterCount++;
        
        // Filtre butonuna badge ekle
        if (clearFiltersBtn) {
            clearFiltersBtn.textContent = activeFilterCount > 0 ? 
                `🧹 Filtreleri Temizle (${activeFilterCount})` : 
                '🧹 Filtreleri Temizle';
            clearFiltersBtn.style.display = activeFilterCount > 0 ? 'block' : 'none';
        }
        
        // Input'lara aktif class ekle
        const searchInput = document.getElementById('logSearch');
        const levelSelect = document.getElementById('logLevelFilter');
        const sourceSelect = document.getElementById('logSourceFilter');
        
        if (searchInput) {
            searchInput.classList.toggle('filter-active', !!currentFilters.search);
        }
        if (levelSelect) {
            levelSelect.classList.toggle('filter-active', currentFilters.level !== 'all');
        }
        if (sourceSelect) {
            sourceSelect.classList.toggle('filter-active', currentFilters.source !== 'all');
        }
    }

    // RegExp escape helper
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Logları API'den çek
    async function fetchLogs() {
        if (state.logPaused) {
            console.log('Log yenileme duraklatıldı');
            return;
        }
        
        try {
            const response = await secureFetch('/api/logs');
            if (response && response.ok) {
                const logs = await response.json();
                if (Array.isArray(logs)) {
                    allLogs = logs;
                    
                    // Kaynak listesini güncelle
                    updateSourceFilter();
                    
                    // Filtreleri uygula
                    applyFilters();
                    
                    console.log(`✅ ${logs.length} log yüklendi`);
                } else {
                    console.error('Geçersiz log formatı:', logs);
                }
            }
        } catch (error) {
            console.error('Log yükleme hatası:', error);
            if (!logContainer.innerHTML.includes('error')) {
                showMessage('Log kayıtları yüklenemedi', 'error');
            }
        }
    }

    // Kaynak filtresini dinamik olarak güncelle
    function updateSourceFilter() {
        if (!logSourceFilter) return;
        
        const sources = new Set(['all']);
        allLogs.forEach(log => sources.add(log.s));
        
        const currentValue = logSourceFilter.value;
        
        // Mevcut seçenekleri temizle (all hariç)
        while (logSourceFilter.children.length > 1) {
            logSourceFilter.removeChild(logSourceFilter.lastChild);
        }
        
        // Yeni seçenekler ekle
        Array.from(sources).sort().forEach(source => {
            if (source !== 'all') {
                const option = document.createElement('option');
                option.value = source;
                option.textContent = source;
                logSourceFilter.appendChild(option);
            }
        });
        
        // Eski değeri geri yükle
        if (sources.has(currentValue)) {
            logSourceFilter.value = currentValue;
        }
    }

    // Yenileme interval'ini ayarla
    function setRefreshInterval(interval) {
        if (refreshIntervalId) {
            clearInterval(refreshIntervalId);
        }
        
        if (autoRefreshActive && interval > 0) {
            refreshIntervalId = setInterval(fetchLogs, interval);
            console.log(`Otomatik yenileme ${interval/1000}s aralıkla ayarlandı`);
        }
    }

    // Global clear function (empty state'ten çağrılabilir)
    window.clearAllFilters = function() {
        if (logSearch) logSearch.value = '';
        if (logLevelFilter) logLevelFilter.value = 'all';
        if (logSourceFilter) logSourceFilter.value = 'all';
        
        currentFilters.search = '';
        currentFilters.level = 'all';
        currentFilters.source = 'all';
        
        applyFilters();
        showMessage('Tüm filtreler temizlendi', 'info');
    };

    // EVENT LISTENERS

    // Arama filtresi
    if (logSearch) {
        // Debounce için timer
        let searchTimeout;
        
        logSearch.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            
            searchTimeout = setTimeout(() => {
                currentFilters.search = e.target.value.trim();
                console.log('Arama terimi:', currentFilters.search);
                applyFilters();
            }, 300); // 300ms bekle
        });
        
        // Enter tuşu ile hemen ara
        logSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                currentFilters.search = e.target.value.trim();
                applyFilters();
            }
        });
    }

    // Seviye filtresi
    if (logLevelFilter) {
        logLevelFilter.addEventListener('change', (e) => {
            currentFilters.level = e.target.value;
            console.log('Seviye filtresi:', currentFilters.level);
            applyFilters();
        });
    }

    // Kaynak filtresi
    if (logSourceFilter) {
        logSourceFilter.addEventListener('change', (e) => {
            currentFilters.source = e.target.value;
            console.log('Kaynak filtresi:', currentFilters.source);
            applyFilters();
        });
    }

    // Filtreleri temizle butonu
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', window.clearAllFilters);
    }

    // Yenile butonu
    if (refreshLogsBtn) {
        refreshLogsBtn.addEventListener('click', () => {
            console.log('Manuel log yenileme');
            fetchLogs();
        });
    }

    // Duraklat/Devam butonu
    if (pauseLogsBtn) {
        pauseLogsBtn.addEventListener('click', () => {
            state.logPaused = !state.logPaused;
            
            const btnIcon = pauseLogsBtn.querySelector('.btn-icon');
            const btnText = pauseLogsBtn.querySelector('.btn-text');
            
            if (state.logPaused) {
                btnIcon.textContent = '▶️';
                btnText.textContent = 'Devam Et';
                pauseLogsBtn.classList.add('paused');
                showMessage('Log akışı duraklatıldı', 'info');
            } else {
                btnIcon.textContent = '⏸️';
                btnText.textContent = 'Duraklat';
                pauseLogsBtn.classList.remove('paused');
                showMessage('Log akışı devam ediyor', 'info');
                fetchLogs(); // Hemen yenile
            }
        });
    }

    // Export butonu - Türkçe karakter desteği ile düzeltilmiş
if (exportLogsBtn) {
    exportLogsBtn.addEventListener('click', () => {
        if (allLogs.length === 0) {
            showMessage('Dışa aktarılacak log kaydı bulunamadı', 'warning');
            return;
        }
        
        try {
            // Filtrelenmiş logları kullan (kullanıcının gördüğü loglar)
            const logsToExport = filteredLogs.length > 0 ? filteredLogs : allLogs;
            
            // CSV içeriği oluştur - UTF-8 BOM ile
            const BOM = '\uFEFF'; // UTF-8 Byte Order Mark
            
            // Excel'in Türkçe karakterleri doğru tanıması için separator belirt
            let csvContent = 'sep=;\n'; // Noktalı virgül ayırıcı (Türkiye için)
            
            // Header ekle
            csvContent += '"Zaman";"Seviye";"Kaynak";"Mesaj"\n';
            
            // Her log kaydını işle
            logsToExport.forEach(log => {
                // Mesajdaki çift tırnakları escape et
                const cleanMessage = log.m
                    .replace(/"/g, '""') // CSV kuralı: çift tırnak için ""
                    .replace(/[\r\n\t]/g, ' ') // Yeni satır ve tab karakterlerini boşlukla değiştir
                    .trim(); // Başta/sonda boşlukları temizle
                
                // Türkçe karakterleri koru
                const time = log.t || '';
                const level = log.l || '';
                const source = log.s || '';
                
                // CSV satırı oluştur - noktalı virgül ile
                csvContent += `"${time}";"${level}";"${source}";"${cleanMessage}"\n`;
            });
            
            // Blob oluştur - UTF-8 encoding ile
            const blob = new Blob([BOM + csvContent], { 
                type: 'text/csv;charset=utf-8' 
            });
            
            // Dosya adı oluştur - Türkçe karaktersiz
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
            const timeStr = now.toTimeString().slice(0, 5).replace(':', ''); // HHMM
            const filename = `teias_eklim_logs_${dateStr}_${timeStr}.csv`;
            
            // İndir
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Memory cleanup
            URL.revokeObjectURL(url);
            
            showMessage(`✅ ${logsToExport.length} log kaydı Excel uyumlu CSV olarak dışa aktarıldı`, 'success');
            
        } catch (error) {
            console.error('Export hatası:', error);
            showMessage('❌ Dışa aktarma sırasında hata oluştu: ' + error.message, 'error');
        }
    });
}

// Alternatif - Excel XLSX formatında export (bonus özellik)
// Bu fonksiyonu da ekleyebilirsiniz
function exportToExcel() {
    if (allLogs.length === 0) {
        showMessage('Dışa aktarılacak log kaydı bulunamadı', 'warning');
        return;
    }
    
    try {
        // Basit Excel XML formatı (Excel 2003+ uyumlu)
        const logsToExport = filteredLogs.length > 0 ? filteredLogs : allLogs;
        
        let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
        xmlContent += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n';
        xmlContent += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
        xmlContent += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n';
        xmlContent += ' xmlns:html="http://www.w3.org/TR/REC-html40">\n';
        xmlContent += '<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">\n';
        xmlContent += '<Title>TEİAŞ EKLİM Log Kayıtları</Title>\n';
        xmlContent += '<Author>TEİAŞ EKLİM Sistemi</Author>\n';
        xmlContent += '<Created>' + new Date().toISOString() + '</Created>\n';
        xmlContent += '</DocumentProperties>\n';
        xmlContent += '<Styles>\n';
        xmlContent += '<Style ss:ID="Header">\n';
        xmlContent += '<Font ss:Bold="1"/>\n';
        xmlContent += '<Interior ss:Color="#CCCCCC" ss:Pattern="Solid"/>\n';
        xmlContent += '</Style>\n';
        xmlContent += '<Style ss:ID="Error">\n';
        xmlContent += '<Interior ss:Color="#FFCCCC" ss:Pattern="Solid"/>\n';
        xmlContent += '</Style>\n';
        xmlContent += '<Style ss:ID="Warning">\n';
        xmlContent += '<Interior ss:Color="#FFFFCC" ss:Pattern="Solid"/>\n';
        xmlContent += '</Style>\n';
        xmlContent += '<Style ss:ID="Success">\n';
        xmlContent += '<Interior ss:Color="#CCFFCC" ss:Pattern="Solid"/>\n';
        xmlContent += '</Style>\n';
        xmlContent += '</Styles>\n';
        xmlContent += '<Worksheet ss:Name="Log Kayıtları">\n';
        xmlContent += '<Table>\n';
        
        // Header row
        xmlContent += '<Row ss:StyleID="Header">\n';
        xmlContent += '<Cell><Data ss:Type="String">Zaman</Data></Cell>\n';
        xmlContent += '<Cell><Data ss:Type="String">Seviye</Data></Cell>\n';
        xmlContent += '<Cell><Data ss:Type="String">Kaynak</Data></Cell>\n';
        xmlContent += '<Cell><Data ss:Type="String">Mesaj</Data></Cell>\n';
        xmlContent += '</Row>\n';
        
        // Data rows
        logsToExport.forEach(log => {
            const styleID = log.l === 'ERROR' ? 'Error' : 
                           log.l === 'WARN' ? 'Warning' : 
                           log.l === 'SUCCESS' ? 'Success' : '';
            
            xmlContent += `<Row${styleID ? ' ss:StyleID="' + styleID + '"' : ''}>\n`;
            xmlContent += `<Cell><Data ss:Type="String">${escapeXml(log.t)}</Data></Cell>\n`;
            xmlContent += `<Cell><Data ss:Type="String">${escapeXml(log.l)}</Data></Cell>\n`;
            xmlContent += `<Cell><Data ss:Type="String">${escapeXml(log.s)}</Data></Cell>\n`;
            xmlContent += `<Cell><Data ss:Type="String">${escapeXml(log.m)}</Data></Cell>\n`;
            xmlContent += '</Row>\n';
        });
        
        xmlContent += '</Table>\n';
        xmlContent += '</Worksheet>\n';
        xmlContent += '</Workbook>\n';
        
        // XML escape fonksiyonu
        function escapeXml(str) {
            return str.replace(/[<>&'"]/g, function (c) {
                switch (c) {
                    case '<': return '&lt;';
                    case '>': return '&gt;';
                    case '&': return '&amp;';
                    case "'": return '&apos;';
                    case '"': return '&quot;';
                }
            });
        }
        
        // Blob oluştur
        const blob = new Blob([xmlContent], { 
            type: 'application/vnd.ms-excel;charset=utf-8' 
        });
        
        // İndir
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const filename = `teias_eklim_logs_${dateStr}.xls`;
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showMessage(`✅ ${logsToExport.length} log kaydı Excel XLS formatında dışa aktarıldı`, 'success');
        
    } catch (error) {
        console.error('Excel export hatası:', error);
        showMessage('❌ Excel dışa aktarma sırasında hata oluştu', 'error');
    }
}
    // Excel Export butonu - Yeni eklenen
    if (document.getElementById('exportExcelBtn')) {
        document.getElementById('exportExcelBtn').addEventListener('click', () => {
            if (allLogs.length === 0) {
                showMessage('Dışa aktarılacak log kaydı bulunamadı', 'warning');
                return;
            }
            
            try {
                // Excel için XML formatı oluştur
                const logsToExport = filteredLogs.length > 0 ? filteredLogs : allLogs;
                
                let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
                xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
                xmlContent += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n';
                xmlContent += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
                xmlContent += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n';
                xmlContent += ' xmlns:html="http://www.w3.org/TR/REC-html40">\n';
                
                // Document Properties
                xmlContent += '<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">\n';
                xmlContent += '<Title>TEİAŞ EKLİM Log Kayıtları</Title>\n';
                xmlContent += '<Author>TEİAŞ EKLİM Sistemi</Author>\n';
                xmlContent += '<Created>' + new Date().toISOString() + '</Created>\n';
                xmlContent += '<Company>TEİAŞ</Company>\n';
                xmlContent += '</DocumentProperties>\n';
                
                // Styles
                xmlContent += '<Styles>\n';
                xmlContent += '<Style ss:ID="Default" ss:Name="Normal">\n';
                xmlContent += '<Alignment ss:Vertical="Bottom"/>\n';
                xmlContent += '<Borders/>\n';
                xmlContent += '<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>\n';
                xmlContent += '<Interior/>\n';
                xmlContent += '<NumberFormat/>\n';
                xmlContent += '<Protection/>\n';
                xmlContent += '</Style>\n';
                
                xmlContent += '<Style ss:ID="Header">\n';
                xmlContent += '<Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>\n';
                xmlContent += '<Interior ss:Color="#4F81BD" ss:Pattern="Solid"/>\n';
                xmlContent += '<Borders>\n';
                xmlContent += '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>\n';
                xmlContent += '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>\n';
                xmlContent += '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>\n';
                xmlContent += '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>\n';
                xmlContent += '</Borders>\n';
                xmlContent += '</Style>\n';
                
                xmlContent += '<Style ss:ID="Error">\n';
                xmlContent += '<Font ss:FontName="Calibri" ss:Size="11" ss:Color="#9C0006"/>\n';
                xmlContent += '<Interior ss:Color="#FFC7CE" ss:Pattern="Solid"/>\n';
                xmlContent += '</Style>\n';
                
                xmlContent += '<Style ss:ID="Warning">\n';
                xmlContent += '<Font ss:FontName="Calibri" ss:Size="11" ss:Color="#9C6500"/>\n';
                xmlContent += '<Interior ss:Color="#FFEB9C" ss:Pattern="Solid"/>\n';
                xmlContent += '</Style>\n';
                
                xmlContent += '<Style ss:ID="Success">\n';
                xmlContent += '<Font ss:FontName="Calibri" ss:Size="11" ss:Color="#006100"/>\n';
                xmlContent += '<Interior ss:Color="#C6EFCE" ss:Pattern="Solid"/>\n';
                xmlContent += '</Style>\n';
                
                xmlContent += '<Style ss:ID="Info">\n';
                xmlContent += '<Font ss:FontName="Calibri" ss:Size="11" ss:Color="#0F1494"/>\n';
                xmlContent += '<Interior ss:Color="#B7DEE8" ss:Pattern="Solid"/>\n';
                xmlContent += '</Style>\n';
                
                xmlContent += '<Style ss:ID="DateTime">\n';
                xmlContent += '<Font ss:FontName="Consolas" ss:Size="10"/>\n';
                xmlContent += '<NumberFormat ss:Format="dd/mm/yyyy hh:mm:ss"/>\n';
                xmlContent += '</Style>\n';
                
                xmlContent += '</Styles>\n';
                
                // Worksheet
                xmlContent += '<Worksheet ss:Name="Log Kayıtları">\n';
                xmlContent += '<Table ss:ExpandedColumnCount="4" ss:ExpandedRowCount="' + (logsToExport.length + 1) + '" x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="60">\n';
                
                // Column definitions
                xmlContent += '<Column ss:AutoFitWidth="0" ss:Width="120"/>\n'; // Zaman
                xmlContent += '<Column ss:AutoFitWidth="0" ss:Width="80"/>\n';  // Seviye
                xmlContent += '<Column ss:AutoFitWidth="0" ss:Width="100"/>\n'; // Kaynak
                xmlContent += '<Column ss:AutoFitWidth="0" ss:Width="300"/>\n'; // Mesaj
                
                // Header row
                xmlContent += '<Row ss:StyleID="Header">\n';
                xmlContent += '<Cell><Data ss:Type="String">Zaman</Data></Cell>\n';
                xmlContent += '<Cell><Data ss:Type="String">Seviye</Data></Cell>\n';
                xmlContent += '<Cell><Data ss:Type="String">Kaynak</Data></Cell>\n';
                xmlContent += '<Cell><Data ss:Type="String">Mesaj</Data></Cell>\n';
                xmlContent += '</Row>\n';
                
                // Data rows
                logsToExport.forEach((log, index) => {
                    let styleID = '';
                    switch(log.l) {
                        case 'ERROR':
                            styleID = 'Error';
                            break;
                        case 'WARN':
                            styleID = 'Warning';
                            break;
                        case 'SUCCESS':
                            styleID = 'Success';
                            break;
                        case 'INFO':
                            styleID = 'Info';
                            break;
                        default:
                            styleID = 'Default';
                    }
                    
                    xmlContent += `<Row ss:StyleID="${styleID}">\n`;
                    xmlContent += `<Cell ss:StyleID="DateTime"><Data ss:Type="String">${escapeXml(log.t)}</Data></Cell>\n`;
                    xmlContent += `<Cell><Data ss:Type="String">${escapeXml(log.l)}</Data></Cell>\n`;
                    xmlContent += `<Cell><Data ss:Type="String">${escapeXml(log.s)}</Data></Cell>\n`;
                    xmlContent += `<Cell><Data ss:Type="String">${escapeXml(log.m)}</Data></Cell>\n`;
                    xmlContent += '</Row>\n';
                });
                
                xmlContent += '</Table>\n';
                
                // Worksheet Options
                xmlContent += '<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">\n';
                xmlContent += '<PageSetup>\n';
                xmlContent += '<Header x:Margin="0.3"/>\n';
                xmlContent += '<Footer x:Margin="0.3"/>\n';
                xmlContent += '<PageMargins x:Bottom="0.75" x:Left="0.7" x:Right="0.7" x:Top="0.75"/>\n';
                xmlContent += '</PageSetup>\n';
                xmlContent += '<Selected/>\n';
                xmlContent += '<FreezePanes/>\n';
                xmlContent += '<FrozenNoSplit/>\n';
                xmlContent += '<SplitHorizontal>1</SplitHorizontal>\n';
                xmlContent += '<TopRowBottomPane>1</TopRowBottomPane>\n';
                xmlContent += '<ActivePane>2</ActivePane>\n';
                xmlContent += '<Panes>\n';
                xmlContent += '<Pane>\n';
                xmlContent += '<Number>3</Number>\n';
                xmlContent += '</Pane>\n';
                xmlContent += '<Pane>\n';
                xmlContent += '<Number>2</Number>\n';
                xmlContent += '<ActiveRow>0</ActiveRow>\n';
                xmlContent += '</Pane>\n';
                xmlContent += '</Panes>\n';
                xmlContent += '<ProtectObjects>False</ProtectObjects>\n';
                xmlContent += '<ProtectScenarios>False</ProtectScenarios>\n';
                xmlContent += '</WorksheetOptions>\n';
                xmlContent += '</Worksheet>\n';
                xmlContent += '</Workbook>';
                
                // XML escape helper function
                function escapeXml(str) {
                    if (!str) return '';
                    return str.toString().replace(/[<>&'"]/g, function (c) {
                        switch (c) {
                            case '<': return '&lt;';
                            case '>': return '&gt;';
                            case '&': return '&amp;';
                            case "'": return '&apos;';
                            case '"': return '&quot;';
                            default: return c;
                        }
                    });
                }
                
                // Create and download file
                const BOM = '\uFEFF'; // UTF-8 BOM for Turkish characters
                const blob = new Blob([BOM + xmlContent], { 
                    type: 'application/vnd.ms-excel;charset=utf-8' 
                });
                
                const now = new Date();
                const dateStr = now.toISOString().slice(0, 10);
                const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
                const filename = `teias_eklim_logs_${dateStr}_${timeStr}.xls`;
                
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.style.display = 'none';
                
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                showMessage(`✅ ${logsToExport.length} log kaydı renkli Excel formatında dışa aktarıldı`, 'success');
                
            } catch (error) {
                console.error('Excel export hatası:', error);
                showMessage('❌ Excel dışa aktarma sırasında hata oluştu: ' + error.message, 'error');
            }
        });
    }

    // Logları temizle
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', async () => {
            if (!confirm("Tüm log kayıtlarını silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz ve tüm log geçmişi silinecektir.")) {
                return;
            }
            
            try {
                const response = await secureFetch('/api/logs/clear', { method: 'POST' });
                if (response && response.ok) {
                    allLogs = [];
                    filteredLogs = [];
                    
                    logContainer.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-icon">✨</div>
                            <h4>Loglar temizlendi</h4>
                            <p>Yeni log kayıtları bekleniyor...</p>
                        </div>
                    `;
                    
                    updateLogStats();
                    updateFilterBadges();
                    
                    showMessage('✅ Tüm log kayıtları başarıyla temizlendi', 'success');
                } else {
                    showMessage('Log temizleme başarısız oldu', 'error');
                }
            } catch (error) {
                console.error('Log temizleme hatası:', error);
                showMessage('Log temizleme sırasında hata oluştu', 'error');
            }
        });
    }

    // Otomatik kaydırma toggle
    if (autoScrollToggle) {
        autoScrollToggle.addEventListener('click', () => {
            autoScrollActive = !autoScrollActive;
            
            autoScrollToggle.setAttribute('data-active', autoScrollActive.toString());
            autoScrollToggle.classList.toggle('active', autoScrollActive);
            
            const toggleIcon = autoScrollToggle.querySelector('.toggle-icon');
            const toggleText = autoScrollToggle.querySelector('.toggle-text');
            
            if (autoScrollActive) {
                toggleIcon.textContent = '📜';
                toggleText.textContent = 'Otomatik Kaydırma';
                showMessage('Otomatik kaydırma aktif', 'info');
                
                // Hemen aşağı kaydır
                setTimeout(() => {
                    logContainer.scrollTop = logContainer.scrollHeight;
                }, 100);
            } else {
                toggleIcon.textContent = '✋';
                toggleText.textContent = 'Manuel Kaydırma';
                showMessage('Manuel kaydırma aktif', 'info');
            }
        });
    }

    // Otomatik yenileme toggle
    if (autoRefreshToggle) {
        autoRefreshToggle.addEventListener('click', () => {
            autoRefreshActive = !autoRefreshActive;
            
            autoRefreshToggle.setAttribute('data-active', autoRefreshActive.toString());
            autoRefreshToggle.classList.toggle('active', autoRefreshActive);
            
            const toggleIcon = autoRefreshToggle.querySelector('.toggle-icon');
            const toggleText = autoRefreshToggle.querySelector('.toggle-text');
            
            if (autoRefreshActive) {
                toggleIcon.textContent = '🔄';
                toggleText.textContent = 'Otomatik Yenileme';
                showMessage('Otomatik yenileme aktif', 'info');
                
                // Interval'i yeniden başlat
                const interval = parseInt(refreshInterval?.value || '5000');
                setRefreshInterval(interval);
            } else {
                toggleIcon.textContent = '⏸️';
                toggleText.textContent = 'Manuel Yenileme';
                showMessage('Otomatik yenileme durduruldu', 'info');
                
                // Interval'i durdur
                setRefreshInterval(0);
            }
        });
    }

    // Yenileme aralığı değişimi
    if (refreshInterval) {
        refreshInterval.addEventListener('change', () => {
            if (autoRefreshActive) {
                const interval = parseInt(refreshInterval.value);
                setRefreshInterval(interval);
                
                const intervalText = refreshInterval.options[refreshInterval.selectedIndex].text;
                showMessage(`Yenileme aralığı ${intervalText} olarak ayarlandı`, 'info');
            }
        });
    }

    // BAŞLATMA

    // İlk logları yükle
    fetchLogs();
    
    // Otomatik yenileme başlat
    const initialInterval = parseInt(refreshInterval?.value || '5000');
    setRefreshInterval(initialInterval);
    
    // Cleanup - sayfa değiştiğinde
    window.addEventListener('beforeunload', () => {
        if (refreshIntervalId) {
            clearInterval(refreshIntervalId);
        }
    });
    
    console.log('✅ Log filtreleme sistemi hazır');
}

// Yedekleme Sayfası
function initBackupPage() {
    // Download butonunun click event'ini kaldır (HTML'de onclick kullanacağız)
    document.getElementById('downloadBackupBtn')?.removeEventListener('click', () => {});
    
    // Upload form event listener
    document.getElementById('uploadBackupForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('backupFile');
        if (fileInput.files.length === 0) {
            showMessage('Lütfen bir yedek dosyası seçin.', 'warning');
            return;
        }
        const formData = new FormData();
        formData.append('backup', fileInput.files[0]);
        
        showMessage('Yedek yükleniyor, lütfen bekleyin. Cihaz işlem sonrası yeniden başlatılacak.', 'info');

        try {
            const response = await secureFetch('/api/backup/upload', {
                method: 'POST',
                body: formData
            });

            if(response && response.ok){
                showMessage('Yedek başarıyla yüklendi! Cihaz 3 saniye içinde yeniden başlatılıyor...', 'success');
                setTimeout(() => window.location.href = '/', 3000);
            } else {
                showMessage('Yedek yükleme başarısız oldu. Dosyanın geçerli olduğundan emin olun.', 'error');
            }
        } catch (error) {
            console.error('Backup yükleme hatası:', error);
            showMessage('Bir hata oluştu', 'error');
        }
    });
}

// Yedek indirme fonksiyonu (global olarak tanımlanmalı)
async function downloadBackup() {
    try {
        const response = await secureFetch('/api/backup/download');
        
        if (response && response.ok) {
            // Blob olarak indirme
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `teias_eklim_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showMessage('Yedek dosyası indiriliyor...', 'success');
        } else {
            showMessage('Yedek indirme yetkisi yok veya bir hata oluştu', 'error');
        }
    } catch (error) {
        console.error('Backup indirme hatası:', error);
        showMessage('Yedek indirilirken bir hata oluştu', 'error');
    }
}

    // --- 3. SAYFA YÖNLENDİRİCİ (ROUTER) İÇİN SAYFA LİSTESİ ---
    const pages = {
        dashboard: { file: 'pages/dashboard.html', init: initDashboardPage },
        network: { file: 'pages/network.html', init: initNetworkPage },
        ntp: { file: 'pages/ntp.html', init: initNtpPage },
        baudrate: { file: 'pages/baudrate.html', init: initBaudRatePage },
        fault: { file: 'pages/fault.html', init: initFaultPage },
        log: { file: 'pages/log.html', init: initLogPage },
        systeminfo: { file: 'pages/systeminfo.html', init: initSystemInfoPage },
        account: { file: 'pages/account.html', init: initAccountPage },
        backup: { file: 'pages/backup.html', init: initBackupPage }
    };

    // --- 4. TEMEL FONKSİYONLAR (Router, Auth, API Fetch) ---

    function logout() {
        Object.values(state.pollingIntervals).forEach(clearInterval);
        localStorage.removeItem('sessionToken');
        window.location.href = '/login.html';
    }

    async function secureFetch(url, options = {}) {
        if (!state.token) {
            logout();
            return null;
        }
        const headers = { ...options.headers, 'Authorization': `Bearer ${state.token}` };
        if (options.body instanceof FormData) {
             delete headers['Content-Type'];
        }

        try {
            const response = await fetch(url, { ...options, headers });
            if (response.status === 401) {
                logout();
                return null;
            }
            return response;
        } catch (error) {
            console.error('API İsteği Hatası:', error);
            updateElement('currentDateTime', 'Bağlantı Hatası');
            return null;
        }
    }

    async function loadPage(pageName) {
        Object.values(state.pollingIntervals).forEach(clearInterval);

        const page = pages[pageName] || pages['dashboard'];
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>Yükleniyor...</p></div>';

        try {
            const response = await secureFetch(`/${page.file}`);
            if (response && response.ok) {
                mainContent.innerHTML = await response.text();
                document.querySelectorAll('.nav-item').forEach(link => {
                    link.classList.toggle('active', link.dataset.page === pageName);
                });
                if (page.init) {
                    try {
                        page.init();
                    } catch(e) {
                        console.error("Sayfa başlatma hatası:", e);
                        mainContent.innerHTML = `<div class="error">Sayfa başlatılırken bir hata oluştu.</div>`;
                    }
                }
                // Bildirim sayısını güncelle
                updateNotificationCount();
            } else {
                mainContent.innerHTML = `<div class="error">Sayfa yüklenemedi (Hata: ${response ? response.status : 'Ağ Hatası'})</div>`;
            }
        } catch (error) {
            console.error('Sayfa yükleme hatası:', error);
            mainContent.innerHTML = `<div class="error">Sayfa yüklenirken bir hata oluştu.</div>`;
        }
    }

    function router() {
        const pageName = window.location.hash.substring(1) || 'dashboard';
        loadPage(pageName);
    }

    // --- 5. YARDIMCI UI FONKSİYONLARI ---
    
    function appendLog(logData) {
        const logContainer = document.getElementById('logContainer');
        if (!logContainer) return;

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${logData.l.toLowerCase()}`;
        logEntry.innerHTML = `
            <span class="log-time">${logData.t}</span>
            <span class="log-level">${logData.l}</span>
            <span class="log-source">${logData.s}</span>
            <span class="log-message">${logData.m}</span>`;
        logContainer.appendChild(logEntry);
        if (state.autoScroll) logContainer.scrollTop = logContainer.scrollHeight;
    }

    function updateDashboardUI(data) {
        updateElement('currentDateTime', data.datetime);
        const ethStatusEl = document.getElementById('ethernetStatus');
        if(ethStatusEl) ethStatusEl.innerHTML = `<span class="status-indicator ${data.ethernetStatus ? 'active' : 'error'}"></span> ${data.ethernetStatus ? 'Bağlı' : 'Yok'}`;
        const timeStatusEl = document.getElementById('ntpStatus');
        if(timeStatusEl) timeStatusEl.innerHTML = `<span class="status-indicator ${data.timeSynced ? 'active' : 'warning'}"></span> ${data.timeSynced ? 'Senkronize' : 'Bekleniyor'}`;
        
        updateElement('deviceName', data.deviceName);
        updateElement('tmName', data.tmName);
        updateElement('deviceIP', data.deviceIP);
        updateElement('uptime', data.uptime);
        
        const memoryUsage = document.getElementById('memoryUsage');
        if(memoryUsage && data.freeHeap && data.totalHeap) {
            const usagePercent = Math.round(((data.totalHeap - data.freeHeap) / data.totalHeap) * 100);
            const progressBar = memoryUsage.querySelector('.progress-fill');
            const percentText = memoryUsage.querySelector('span:last-child');
            if(progressBar) progressBar.style.width = `${usagePercent}%`;
            if(percentText) percentText.textContent = `${usagePercent}%`;
        }
    }

    function updateElement(id, value, width = null) {
        const element = document.getElementById(id);
        if (element) {
            if (width !== null) {
                element.style.width = width + '%';
            } else {
                element.textContent = value;
            }
        }
    }

    function showMessage(text, type = 'info', duration = 4000) {
        const container = document.getElementById('message-container');
        if (container) {
            container.innerHTML = `<div class="message ${type}">${text}</div>`;
            setTimeout(() => { if(container) container.innerHTML = ''; }, duration);
        } else {
            console.warn("Mesaj konteyneri bulunamadı:", text);
        }
    }

    // Notification sistemi
    async function updateNotificationCount() {
        try {
            const response = await secureFetch('/api/notifications');
            if (response && response.ok) {
                const data = await response.json();
                const badge = document.getElementById('notificationCount');
                if (badge) {
                    badge.textContent = data.count;
                    badge.style.display = data.count > 0 ? 'block' : 'none';
                }
            }
        } catch (error) {
            console.error('Bildirim hatası:', error);
        }
    }

    // Yardımcı formatters
    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (days > 0) {
            return `${days}g ${hours}s ${minutes}d`;
        } else if (hours > 0) {
            return `${hours}s ${minutes}d ${secs}s`;
        } else {
            return `${minutes}d ${secs}s`;
        }
    }

    // --- 6. UYGULAMA BAŞLATMA ---
    function main() {
        // Login veya parola değiştirme sayfasındaysak ana scripti çalıştırma
        if (window.location.pathname.includes('login.html') || window.location.pathname.includes('password_change.html')) {
            return; 
        }

        // Token yoksa login sayfasına yönlendir
        if (!state.token) {
            logout();
            return;
        }
        
        // Device info'yu al ve mDNS adresini göster
        fetch('/api/device-info')
            .then(r => r.json())
            .then(data => {
                updateElement('mdnsAddress', data.mdns || 'teias-eklim.local');
            })
            .catch(() => {
                updateElement('mdnsAddress', 'teias-eklim.local');
            });
        
        // Çıkış butonu
        document.getElementById('logoutBtn')?.addEventListener('click', (e) => { 
            e.preventDefault(); 
            logout(); 
        });
        
        // Navigasyon menüsü
        document.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.hash = link.dataset.page;
            });
        });
        
        // Notification butonu
        document.getElementById('notificationBtn')?.addEventListener('click', async () => {
            const response = await secureFetch('/api/notifications');
            if (response && response.ok) {
                const data = await response.json();
                console.log('Bildirimler:', data);
                // TODO: Bildirim popup'ı göster
            }
        });
        
        // Bildirim güncelleme timer'ı
        setInterval(updateNotificationCount, 30000); // 30 saniyede bir
        
        // Router'ı dinle ve ilk sayfayı yükle
        window.addEventListener('hashchange', router);
        router();
    }

    main();
});