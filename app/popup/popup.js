
document.addEventListener("DOMContentLoaded", (_e) => {
    document.getElementById("option").addEventListener('click', (e) => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
    })
})