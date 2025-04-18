// script.js
document.addEventListener('DOMContentLoaded', () => {
    const repoOwner = 'word-sys';
    const repoName = 'pardf';
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`;

    const releaseTitleEl = document.getElementById('latest-release-title');
    const releaseInfoEl = document.getElementById('latest-release-info');
    const releaseNotesEl = document.getElementById('latest-release-notes');
    const debDownloadLinkEl = document.getElementById('deb-download-link');
    const releasePageLinkEl = document.getElementById('release-page-link');
    const downloadsSection = document.getElementById('downloads'); // To potentially hide/show

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

            // --- Update Release Info ---
            releaseTitleEl.textContent = data.name || data.tag_name || 'Latest Release'; // Fallback if name is missing
            releasePageLinkEl.href = data.html_url || `https://github.com/${repoOwner}/${repoName}/releases`; // Link to release page

            const publishedDate = new Date(data.published_at);
            const timeAgo = getTimeAgo(publishedDate);
            releaseInfoEl.textContent = `Published ${timeAgo} (Tag: ${data.tag_name})`; // Updated format

            // --- Update Release Notes (Handle basic formatting) ---
            // GitHub body is Markdown. This is a very basic conversion.
            // Replace Markdown links with HTML links (simple case)
            let notesHtml = data.body.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
            // Replace line breaks with <br> (ensure double breaks become paragraphs - basic)
            notesHtml = notesHtml.replace(/\r\n\r\n/g, '</p><p>').replace(/\n\n/g, '</p><p>');
            notesHtml = notesHtml.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
            // Wrap in initial <p> if not already
            if (!notesHtml.startsWith('<p>')) {
                 notesHtml = `<p>${notesHtml}</p>`
            }
            releaseNotesEl.innerHTML = notesHtml || '<p>No release notes provided.</p>';

            // --- Find and Update .deb Download Link ---
            let debUrl = null;
            if (data.assets && data.assets.length > 0) {
                const debAsset = data.assets.find(asset => asset.name.endsWith('_all.deb'));
                if (debAsset) {
                    debUrl = debAsset.browser_download_url;
                    debDownloadLinkEl.href = debUrl;
                    debDownloadLinkEl.textContent = `${debAsset.name} İndir`; // Update button text
                    // Make download section visible if hidden by default
                    downloadsSection.style.display = 'block';
                }
            }

            // Handle case where .deb is not found
            if (!debUrl) {
                debDownloadLinkEl.textContent = '.deb dosyası bulunamadı';
                debDownloadLinkEl.href = '#'; // Disable link
                debDownloadLinkEl.style.opacity = '0.6';
                debDownloadLinkEl.style.cursor = 'not-allowed';
                debDownloadLinkEl.onclick = (e) => e.preventDefault();
                 // Optionally keep the main release link active
            }

        })
        .catch(error => {
            console.error('Error fetching latest release:', error);
            if (releaseTitleEl) releaseTitleEl.textContent = 'Son Sürüm Bilgisi Alınamadı';
            if (releaseInfoEl) releaseInfoEl.textContent = 'GitHub API\'sinden veri alınırken hata oluştu.';
             if (releaseNotesEl) releaseNotesEl.innerHTML = '';
             if (downloadsSection) downloadsSection.style.display = 'none'; // Hide downloads if error
        });

    // --- Helper function for relative time ---
    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000; // years
        if (interval > 1) return Math.floor(interval) + " yıl önce";
        interval = seconds / 2592000; // months
        if (interval > 1) return Math.floor(interval) + " ay önce";
        interval = seconds / 86400; // days
        if (interval > 1) return Math.floor(interval) + " gün önce";
        interval = seconds / 3600; // hours
        if (interval > 1) return Math.floor(interval) + " saat önce";
        interval = seconds / 60; // minutes
        if (interval > 1) return Math.floor(interval) + " dakika önce";
        return Math.floor(seconds) + " saniye önce";
    }
});
