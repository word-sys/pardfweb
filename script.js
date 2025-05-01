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

    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    const modalCaption = document.getElementById('modal-caption');
    const closeModalButton = document.querySelector('.modal-close-button');
    const gallery = document.querySelector('.screenshot-gallery');

    function fetchReleaseData() {
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(handleReleaseData)
            .catch(handleFetchError);
    }

    function handleReleaseData(data) {
        if (!data) {
            throw new Error('No release data received');
        }

        const releaseUrl = data.html_url || `https://github.com/${repoOwner}/${repoName}/releases`;

        releaseTitleEl.textContent = data.name || data.tag_name || 'Latest Release';
        releasePageLinkEl.href = releaseUrl;
        if (releasePageLinkInstallEl) {
             releasePageLinkInstallEl.href = releaseUrl;
        }

        const publishedDate = new Date(data.published_at);
        const timeAgo = getTimeAgo(publishedDate);
        releaseInfoEl.textContent = `Published ${timeAgo} (Tag: ${data.tag_name})`;

        let notesHtml = formatReleaseNotes(data.body);
        releaseNotesEl.innerHTML = notesHtml || '<p>No release notes provided.</p>';

        let debUrl = null;
        let debName = 'pardus-pdf-editor_latest_all.deb';
        if (data.assets && data.assets.length > 0) {
            const debAsset = data.assets.find(asset => asset.name.endsWith('_all.deb'));
            if (debAsset) {
                debUrl = debAsset.browser_download_url;
                debName = debAsset.name;
                debDownloadLinkEl.href = debUrl;
                debDownloadTextEl.textContent = `${debName} İndir`;
                downloadsSection.style.display = 'block';
                debDownloadLinkEl.classList.remove('disabled');
            }
        }

        if (!debUrl) {
            handleDebNotFound();
        }

        triggerFadeInAnimations();
    }

    function handleFetchError(error) {
        console.error('Error fetching latest release:', error);
        if (releaseTitleEl) releaseTitleEl.textContent = 'Son Sürüm Bilgisi Alınamadı';
        if (releaseInfoEl) releaseInfoEl.textContent = 'GitHub API\'sinden veri alınırken hata oluştu.';
        if (releaseNotesEl) releaseNotesEl.innerHTML = '<p>Sürüm notları yüklenirken hata oluştu.</p>';
        if (downloadsSection) downloadsSection.style.display = 'block';
        handleDebNotFound();
    }

     function handleDebNotFound() {
          if (debDownloadTextEl) debDownloadTextEl.textContent = '.deb dosyası bulunamadı';
          if (debDownloadLinkEl) {
                debDownloadLinkEl.href = '#';
                debDownloadLinkEl.classList.add('disabled');
                debDownloadLinkEl.onclick = (e) => e.preventDefault();
           }
     }

     function triggerFadeInAnimations(){
          setTimeout(() => {
            document.querySelectorAll('.fade-in').forEach(el => el.style.opacity = 1);
            document.querySelectorAll('.screenshot-gallery figure').forEach(el => el.style.opacity = 1);
          }, 50);
     }

    function formatReleaseNotes(body) {
         let notesHtml = body || '';
         notesHtml = notesHtml.replace(/^### (.*$)/gim, '<h4>$1</h4>');
         notesHtml = notesHtml.replace(/^## (.*$)/gim, '<h3>$1</h3>');
         notesHtml = notesHtml.replace(/^# (.*$)/gim, '<h2>$1</h2>');
         notesHtml = notesHtml.replace(/\*\*\*(.*?)___\*\*\*/gim, '<b><i>$1</i></b>');
         notesHtml = notesHtml.replace(/___(.*?)___/gim, '<b><i>$1</i></b>');
          notesHtml = notesHtml.replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>');
         notesHtml = notesHtml.replace(/__(.*?)__/gim, '<b>$1</b>');
          notesHtml = notesHtml.replace(/\*(.*?)\*/gim, '<i>$1</i>');
         notesHtml = notesHtml.replace(/_(.*?)_/gim, '<i>$1</i>');
         notesHtml = notesHtml.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
         notesHtml = notesHtml.replace(/^\s*[\*\-\+] +(.*)/gm, '<li>$1</li>');
         notesHtml = notesHtml.replace(/<\/li>\n?<li>/g, '</li><li>');
         notesHtml = notesHtml.replace(/(<li>.*?<\/li>)/gs, (match) => {
              if (!match.includes('<ul') && match.includes('<li>')) {
                  return `<ul>${match}</ul>`;
              }
              return match;
         });
          notesHtml = notesHtml.split(/\n\s*\n/).map(paragraph => {
              if (paragraph.trim().startsWith('<') || paragraph.trim() === '') {
                   return paragraph;
              }
              return `<p>${paragraph.trim().replace(/\n/g, '<br>')}</p>`;
         }).join('');
         notesHtml = notesHtml.replace(/<p>\s*<\/p>/g, '').replace(/<ul>\s*<\/ul>/g, '');
         return notesHtml;
    }

    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 5) return "az önce";
        if (seconds < 60) return Math.floor(seconds) + " saniye önce";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return minutes + " dakika önce";
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return hours + " saat önce";
        const days = Math.floor(hours / 24);
        if (days < 30) return days + " gün önce";
        const months = Math.floor(days / 30);
        if (months < 12) return months + " ay önce";
        const years = Math.floor(days / 365);
        return years + " yıl önce";
    }

    function openModal(imgElement) {
        modalImage.src = imgElement.src;
        modalCaption.textContent = imgElement.alt;
        modal.classList.add('visible');
        document.body.classList.add('modal-open');
    }

    function closeModal() {
        modal.classList.remove('visible');
        document.body.classList.remove('modal-open');
        modalImage.src = "";
    }

    if (gallery) {
        gallery.addEventListener('click', (event) => {
            if (event.target.classList.contains('gallery-image')) {
                openModal(event.target);
            }
        });
    }

    if(closeModalButton) {
        closeModalButton.addEventListener('click', closeModal);
    }

    if(modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', (event) => {
         if (event.key === 'Escape' && modal.classList.contains('visible')) {
              closeModal();
         }
     });

    fetchReleaseData();
});
