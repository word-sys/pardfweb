document.addEventListener('DOMContentLoaded', () => {
    const repoOwner = 'word-sys';
    const repoName = 'pardf';
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`;

    const releaseTitleEl = document.getElementById('latest-release-title');
    const releaseInfoEl = document.getElementById('latest-release-info');
    const releaseNotesEl = document.getElementById('latest-release-notes');
    const debDownloadLinkEl = document.getElementById('deb-download-link');
    const debDownloadTextEl = document.getElementById('deb-download-text');
    const releasePageLinkEl = document.getElementById('release-page-link');
    const releasePageLinkInstallEl = document.getElementById('release-page-link-install');
    const downloadsSection = document.getElementById('downloads');

    if (!releaseTitleEl || !releaseInfoEl || !releaseNotesEl || !debDownloadLinkEl || !releasePageLinkEl || !debDownloadTextEl) {
        console.warn("One or more dynamic content elements are missing from the HTML.");
        if (downloadsSection) downloadsSection.style.display = 'none';
        return;
    }

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data) {
                 throw new Error('No release data received');
            }

            releaseTitleEl.textContent = data.name || data.tag_name || 'Latest Release';
            releasePageLinkEl.href = data.html_url || `https://github.com/${repoOwner}/${repoName}/releases`;
            if (releasePageLinkInstallEl) {
                releasePageLinkInstallEl.href = data.html_url || `https://github.com/${repoOwner}/${repoName}/releases`;
            }


            const publishedDate = new Date(data.published_at);
            const timeAgo = getTimeAgo(publishedDate);
            releaseInfoEl.innerHTML = `Yayınlandı: ${timeAgo} • Etiket: <a href="${data.html_url}" target="_blank" rel="noopener noreferrer">${data.tag_name}</a>`;

            let notesHtml = data.body || '<p>Bu sürüm için not bulunmamaktadır.</p>';
            notesHtml = notesHtml.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
            notesHtml = notesHtml.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>');
            notesHtml = notesHtml.replace(/\*([^\*]+)\*/g, '<em>$1</em>').replace(/_([^_]+)_/g, '<em>$1</em>');
            notesHtml = notesHtml.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
            notesHtml = notesHtml.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
            notesHtml = notesHtml.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
            notesHtml = notesHtml.replace(/^### (.*$)/gim, '<h3>$1</h3>');
            notesHtml = notesHtml.replace(/^## (.*$)/gim, '<h2>$1</h2>');
            notesHtml = notesHtml.replace(/^# (.*$)/gim, '<h1>$1</h1>');
            notesHtml = notesHtml.replace(/\r\n\r\n/g, '</p><p>').replace(/\n\n/g, '</p><p>');
            notesHtml = notesHtml.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
            if (!notesHtml.match(/^<(p|h[1-6]|ul|ol|blockquote|pre|hr|table|div)/i)) {
                notesHtml = `<p>${notesHtml}</p>`;
            }
            releaseNotesEl.innerHTML = notesHtml;

            let debUrl = null;
            let debAssetName = 'pardus-pdf-editor_latest_all.deb';
            if (data.assets && data.assets.length > 0) {
                const debAsset = data.assets.find(asset => asset.name.endsWith('_all.deb'));
                if (debAsset) {
                    debUrl = debAsset.browser_download_url;
                    debAssetName = debAsset.name;
                }
            }

            if (debUrl) {
                debDownloadLinkEl.href = debUrl;
                debDownloadTextEl.textContent = `${debAssetName} İndir`;
                debDownloadLinkEl.classList.remove('disabled');
                downloadsSection.style.display = 'block';
            } else {
                debDownloadTextEl.textContent = '.deb Dosyası Bulunamadı';
                debDownloadLinkEl.href = '#';
                debDownloadLinkEl.classList.add('disabled');
                debDownloadLinkEl.onclick = (e) => e.preventDefault();
            }
        })
        .catch(error => {
            console.error('Error fetching latest release:', error);
            releaseTitleEl.textContent = 'Son Sürüm Alınamadı';
            releaseInfoEl.textContent = 'GitHub API\'sinden veri alınırken bir hata oluştu.';
            releaseNotesEl.innerHTML = '<p>Sürüm notları yüklenemedi.</p>';
            debDownloadTextEl.textContent = 'İndirme Bağlantısı Alınamadı';
            debDownloadLinkEl.classList.add('disabled');
            debDownloadLinkEl.href = '#';
            debDownloadLinkEl.onclick = (e) => e.preventDefault();
            if (downloadsSection) downloadsSection.style.display = 'block';
        });

    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " yıl önce";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " ay önce";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " gün önce";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " saat önce";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " dakika önce";
        return (Math.floor(seconds) < 5 ? "az önce" : Math.floor(seconds) + " saniye önce");
    }

    // Image Modal Functionality
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-image");
    const captionText = document.getElementById("modal-caption");
    const galleryImages = document.querySelectorAll(".gallery-image");
    const closeBtn = document.querySelector(".modal-close-button");

    if (modal && modalImg && captionText && galleryImages.length > 0 && closeBtn) {
        galleryImages.forEach(img => {
            img.onclick = function(){
                document.body.classList.add('modal-open');
                modal.classList.add('visible');
                modalImg.src = this.src;
                modalImg.alt = this.alt;
                captionText.innerHTML = this.alt;
            }
        });

        function closeModal() {
            modal.classList.remove('visible');
            document.body.classList.remove('modal-open');
        }

        closeBtn.onclick = closeModal;

        modal.onclick = function(event) {
            if (event.target === modal) {
                closeModal();
            }
        }

        document.addEventListener('keydown', function(event) {
            if (event.key === "Escape" && modal.classList.contains('visible')) {
                closeModal();
            }
        });
    } else {
        console.warn("Image modal elements not found. Modal functionality will be disabled.");
    }
});
