// Immediate cleanup script for localStorage duplicates
// Run this in browser console to clean up existing duplicates

function cleanupQuickLaunchDuplicates() {
    const storageKey = 'quick_launch_shortcuts';
    const shortcuts = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    if (shortcuts.length === 0) {
        console.log('No shortcuts found in localStorage');
        return;
    }
    
    console.log(`Found ${shortcuts.length} shortcuts in localStorage`);
    
    // Remove duplicates based on ID
    const uniqueShortcuts = [];
    const seenIds = new Set();
    
    // Process in reverse to keep the last occurrence
    for (let i = shortcuts.length - 1; i >= 0; i--) {
        const shortcut = shortcuts[i];
        if (!seenIds.has(shortcut.id)) {
            seenIds.add(shortcut.id);
            uniqueShortcuts.unshift(shortcut);
        }
    }
    
    // Save cleaned shortcuts back
    localStorage.setItem(storageKey, JSON.stringify(uniqueShortcuts));
    
    console.log(`✅ Cleaned up ${shortcuts.length - uniqueShortcuts.length} duplicates`);
    console.log(`📊 Now have ${uniqueShortcuts.length} unique shortcuts`);
    
    // Reload the page to see changes
    if (shortcuts.length !== uniqueShortcuts.length) {
        console.log('🔄 Reloading page to apply changes...');
        setTimeout(() => window.location.reload(), 1000);
    }
}

// Run the cleanup
cleanupQuickLaunchDuplicates();
