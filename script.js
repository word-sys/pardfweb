// script.js
document.addEventListener('DOMContentLoaded', () => {
    const repoOwner = 'word-sys';
    const repoName = 'pardf';
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`;

    const releaseTitleEl = document.getElementById('latest-release-title');
    const releaseInfoEl = document.getElementById('latest-release-info');
    const releaseNotesEl = document.getElementById('latest-release-notes');
    const debDownloadLinkEl = document.getElementById('deb-download-link');
    // Get the SPAN inside the download button
    const debDownloadTextEl = document.getElementById('deb-download-text');
    const releasePageLinkEl = document.getElementById('release-page-link');
    const releasePageLinkInstallEl = document.getElementById('release-page-link-install'); // Link in install section
    const downloadsSection = document.getElementById('downloads');

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

            const releaseUrl = data.html_url || `https://github.com/${repoOwner}/${repoName}/releases`;

            // --- Update Release Info ---
            releaseTitleEl.textContent = data.name || data.tag_name || 'Latest Release';
            // Update both release page links
            releasePageLinkEl.href = releaseUrl;
            if (releasePageLinkInstallEl) {
                 releasePageLinkInstallEl.href = releaseUrl;
            }


            const publishedDate = new Date(data.published_at);
            const timeAgo = getTimeAgo(publishedDate);
            releaseInfoEl.textContent = `Published ${timeAgo} (Tag: ${data.tag_name})`;

            // --- Update Release Notes ---
            // Slightly improved Markdown to HTML conversion
            let notesHtml = data.body || '';
            // Convert headers (basic)
            notesHtml = notesHtml.replace(/^### (.*$)/gim, '<h4>$1</h4>');
            notesHtml = notesHtml.replace(/^## (.*$)/gim, '<h3>$1</h3>');
            notesHtml = notesHtml.replace(/^# (.*$)/gim, '<h2>$1</h2>');
            // Convert bold/italic
            notesHtml = notesHtml.replace(/\*\*\*(.*?)___\*\*\*/gim, '<b><i>$1</i></b>'); // Bold + Italic (mixed markers uncommon but possible)
            notesHtml = notesHtml.replace(/___(.*?)___/gim, '<b><i>$1</i></b>');
             notesHtml = notesHtml.replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>');
            notesHtml = notesHtml.replace(/__(.*?)__/gim, '<b>$1</b>');
             notesHtml = notesHtml.replace(/\*(.*?)\*/gim, '<i>$1</i>');
            notesHtml = notesHtml.replace(/_(.*?)_/gim, '<i>$1</i>');
            // Convert links
            notesHtml = notesHtml.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
            // Convert list items (very basic, doesn't handle nested)
            notesHtml = notesHtml.replace(/^\s*[\*\-\+] +(.*)/gm, '<li>$1</li>');
            notesHtml = notesHtml.replace(/<\/li>\n?<li>/g, '</li><li>'); // Compact list items
            // Wrap adjacent LIs in UL
            notesHtml = notesHtml.replace(/(<li>.*?<\/li>)/gs, (match) => {
                 if (!match.includes('<ul') && match.includes('<li>')) { // Basic check to avoid nesting incorrectly
                     return `<ul>${match}</ul>`;
                 }
                 return match;
            });
             // Convert paragraphs (handle consecutive newlines)
            notesHtml = notesHtml.split(/\n\s*\n/).map(paragraph => {
                 if (paragraph.trim().startsWith('<') || paragraph.trim() === '') {
                      return paragraph; // Avoid wrapping already converted HTML or empty lines
                 }
                 return `<p>${paragraph.trim().replace(/\n/g, '<br>')}</p>`; // Convert single newlines within para to <br>
            }).join('');
            // Cleanup potentially empty tags created by splitting
            notesHtml = notesHtml.replace(/<p>\s*<\/p>/g, '').replace(/<ul>\s*<\/ul>/g, '');


            releaseNotesEl.innerHTML = notesHtml || '<p>No release notes provided.</p>';

            // --- Find and Update .deb Download Link ---
            let debUrl = null;
            let debName = 'pardus-pdf-editor_latest_all.deb'; // Default name
            if (data.assets && data.assets.length > 0) {
                const debAsset = data.assets.find(asset => asset.name.endsWith('_all.deb'));
                if (debAsset) {
                    debUrl = debAsset.browser_download_url;
                    debName = debAsset.name;
                    debDownloadLinkEl.href = debUrl;
                    // Update only the text part of the button
                    debDownloadTextEl.textContent = `${debName} İndir`;
                    downloadsSection.style.display = 'block'; // Ensure section is visible
                    debDownloadLinkEl.classList.remove('disabled'); // Enable button appearance
                }
            }

            // Handle case where .deb is not found
            if (!debUrl) {
                 debDownloadTextEl.textContent = '.deb dosyası bulunamadı';
                 debDownloadLinkEl.href = '#'; // Keep disabled href
                 debDownloadLinkEl.classList.add('disabled'); // Visually disable button
                 debDownloadLinkEl.onclick = (e) => e.preventDefault();
                 downloadsSection.style.display = 'block'; // Still show section, but with disabled btn
            }

             // Add fade-in class after content is loaded (small delay for smoother effect)
            setTimeout(() => {
                document.querySelectorAll('.fade-in').forEach(el => el.style.opacity = 1);
                document.querySelectorAll('.screenshot-gallery figure').forEach(el => el.style.opacity = 1);
            }, 50); // Small delay

        })
        .catch(error => {
            console.error('Error fetching latest release:', error);
            if (releaseTitleEl) releaseTitleEl.textContent = 'Son Sürüm Bilgisi Alınamadı';
            if (releaseInfoEl) releaseInfoEl.textContent = 'GitHub API\'sinden veri alınırken hata oluştu.';
             if (releaseNotesEl) releaseNotesEl.innerHTML = '<p>Sürüm notları yüklenirken hata oluştu.</p>';
             if (downloadsSection) downloadsSection.style.display = 'block'; // Show section but button will be disabled
            if (debDownloadTextEl) debDownloadTextEl.textContent = 'İndirme Hatası';
            if(debDownloadLinkEl) debDownloadLinkEl.classList.add('disabled');


        });

    // --- Helper function for relative time ---
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

});
