// --- إعدادات Supabase ---
// استبدل هذه القيم بالقيم الخاصة بمشروعك في Supabase
const SUPABASE_URL = 'https://bxxxvbaacdbkbxxrswed.supabase.co'; // <--- استبدل هذا
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4eHh2YmFhY2Ria2J4eHJzd2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NzQxNzYsImV4cCI6MjA3MjE1MDE3Nn0.ScFx8SxlP0TqyBpJQQbDp-xJke2OC2V5FjjuyjY-dcM'; // <--- استبدل هذا
// =============================================================
// --- إنشاء عميل Supabase ---
// هذا الكود يفترض أن مكتبة Supabase قد تم تحميلها بالفعل في ملف HTML.
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- إعدادات أخرى ---
const QURAN_API_BASE_URL = "https://api.alquran.cloud/v1";

// --- تصدير (Export) ---
// نقوم بتصدير كل شيء قد نحتاجه في أماكن أخرى.
export { supabase, QURAN_API_BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY };

