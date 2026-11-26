const fs = require('fs');
let content = fs.readFileSync('src/app/admin/components/AdminSidebar.tsx', 'utf-8');

const emojiMap = {
    '🏠': '<Home size={16} />',
    '🎥': '<Video size={16} />',
    '💬': '<MessageSquare size={16} />',
    '📺': '<Tv size={16} />',
    '📦': '<Package size={16} />',
    '📝': '<FileText size={16} />',
    '🌟': '<Star size={16} />',
    '📄': '<File size={16} />',
    '🎨': '<Palette size={16} />',
    '🛠️': '<Settings size={16} />',
    '🗂️': '<Folder size={16} />',
    '🤝': '<Handshake size={16} />',
    '💰': '<Coins size={16} />',
    '🛒': '<ShoppingCart size={16} />',
    '📊': '<BarChart2 size={16} />',
    '📈': '<TrendingUp size={16} />',
    '🎯': '<Target size={16} />',
    '💳': '<CreditCard size={16} />',
    '🎟️': '<Ticket size={16} />',
    '📢': '<Megaphone size={16} />',
    '📧': '<Mail size={16} />',
    '🔍': '<Search size={16} />',
    '👥': '<Users size={16} />',
    '📥': '<Download size={16} />',
    '🔑': '<Key size={16} />',
    '🤖': '<Bot size={16} />',
    '🌸': '<Flower size={16} />',
    '🪔': '<Flame size={16} />',
    '🚪': '<LogOut size={16} />'
};

const lucideComponents = new Set();
for (const [emoji, tag] of Object.entries(emojiMap)) {
    if (content.includes(emoji)) {
        content = content.replaceAll(emoji + ' ', '<span className="sidebar-icon" style={{marginRight: "6px"}}>' + tag + '</span>');
        content = content.replaceAll(emoji, '<span className="sidebar-icon" style={{marginRight: "6px"}}>' + tag + '</span>');
        lucideComponents.add(tag.split(' ')[0].replace('<', ''));
    }
}

if (!content.includes('lucide-react') && lucideComponents.size > 0) {
    const imports = Array.from(lucideComponents).join(', ');
    content = content.replace('import { usePathname } from \'next/navigation\';', 'import { usePathname } from \'next/navigation\';\nimport { ' + imports + ' } from \'lucide-react\';');
}

fs.writeFileSync('src/app/admin/components/AdminSidebar.tsx', content, 'utf-8');
