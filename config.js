// =============================const SUPABASE_ANON_KEY = "YOUR_ANON_PUBLIC_KEY"; // <--- استبدل هذا بـ Project API Key (anon public)
const SUPABASE_URL = "https://bxxxvbaacdbkbxxrswed.supabase.co"; // <--- استبدل هذا بـ Project URL الخاص بك
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4eHh2YmFhY2Ria2J4eHJzd2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NzQxNzYsImV4cCI6MjA3MjE1MDE3Nn0.ScFx8SxlP0TqyBpJQQbDp-xJke2OC2V5FjjuyjY-dcM"; // <--- استبدل هذا بـ Project API Key (anon public)


// التأكد من أن مكتبة Supabase قد تم تحميلها في المتصفح قبل محاولة استخدامها.
// هذا السطر يمنع ظهور أخطاء إذا لم يتم تحميل السكربت بشكل صحيح.
if (typeof window.supabase === 'undefined') {
    throw new Error("Supabase client is not loaded. Make sure to include the script tag in your HTML files.");
}

/**
 * إنشاء وتصدير كائن Supabase Client باستخدام الكائن العام 'window.supabase'.
 * هذا هو السطر الصحيح الذي يحل مشكلة 'cannot access before initialization'.
 */
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * الرابط الأساسي لواجهة برمجة تطبيقات القرآن الكريم (هذا يبقى كما هو).
 */
export const QURAN_API_BASE_URL = "https://api.alquran.cloud/v1";

