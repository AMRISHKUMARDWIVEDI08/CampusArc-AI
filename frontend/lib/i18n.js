'use client';

export const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr' },
];

const translations = {
  en: {
    signOut: 'Sign out', student: 'student', admin: 'admin', guest: 'guest',
    language: 'Language', home: 'Home', helpCenter: 'Help Center',
    back: 'Back', refresh: 'Refresh', loading: 'Loading…',
    askAI: 'Ask CampusArc AI', linkWallet: 'Link Arc wallet',
    payment: 'Payment', payments: 'Payments', wallet: 'Wallet',
    save: 'Save', cancel: 'Cancel', search: 'Search',
  },
  es: {
    signOut: 'Cerrar sesión', student: 'estudiante', admin: 'administrador', guest: 'invitado',
    language: 'Idioma', home: 'Inicio', helpCenter: 'Centro de ayuda',
    back: 'Atrás', refresh: 'Actualizar', loading: 'Cargando…',
    askAI: 'Preguntar a CampusArc AI', linkWallet: 'Vincular cartera de Arc',
    payment: 'Pago', payments: 'Pagos', wallet: 'Cartera',
    save: 'Guardar', cancel: 'Cancelar', search: 'Buscar',
  },
  fr: {
    signOut: 'Se déconnecter', student: 'étudiant', admin: 'administrateur', guest: 'invité',
    language: 'Langue', home: 'Accueil', helpCenter: "Centre d'aide",
    back: 'Retour', refresh: 'Actualiser', loading: 'Chargement…',
    askAI: 'Demander à CampusArc AI', linkWallet: 'Associer le portefeuille Arc',
    payment: 'Paiement', payments: 'Paiements', wallet: 'Portefeuille',
    save: 'Enregistrer', cancel: 'Annuler', search: 'Rechercher',
  },
  de: {
    signOut: 'Abmelden', student: 'Schüler', admin: 'Administrator', guest: 'Gast',
    language: 'Sprache', home: 'Startseite', helpCenter: 'Hilfezentrum',
    back: 'Zurück', refresh: 'Aktualisieren', loading: 'Wird geladen…',
    askAI: 'CampusArc AI fragen', linkWallet: 'Arc-Wallet verbinden',
    payment: 'Zahlung', payments: 'Zahlungen', wallet: 'Wallet',
    save: 'Speichern', cancel: 'Abbrechen', search: 'Suchen',
  },
  pt: {
    signOut: 'Sair', student: 'aluno', admin: 'administrador', guest: 'convidado',
    language: 'Idioma', home: 'Início', helpCenter: 'Central de ajuda',
    back: 'Voltar', refresh: 'Atualizar', loading: 'Carregando…',
    askAI: 'Perguntar ao CampusArc AI', linkWallet: 'Vincular carteira Arc',
    payment: 'Pagamento', payments: 'Pagamentos', wallet: 'Carteira',
    save: 'Salvar', cancel: 'Cancelar', search: 'Pesquisar',
  },
  ar: {
    signOut: 'تسجيل الخروج', student: 'طالب', admin: 'مسؤول', guest: 'زائر',
    language: 'اللغة', home: 'الرئيسية', helpCenter: 'مركز المساعدة',
    back: 'رجوع', refresh: 'تحديث', loading: 'جارٍ التحميل…',
    askAI: 'اسأل CampusArc AI', linkWallet: 'ربط محفظة Arc',
    payment: 'الدفع', payments: 'المدفوعات', wallet: 'المحفظة',
    save: 'حفظ', cancel: 'إلغاء', search: 'بحث',
  },
  hi: {
    signOut: 'साइन आउट', student: 'छात्र', admin: 'व्यवस्थापक', guest: 'अतिथि',
    language: 'भाषा', home: 'होम', helpCenter: 'सहायता केंद्र',
    back: 'वापस', refresh: 'रिफ्रेश', loading: 'लोड हो रहा है…',
    askAI: 'CampusArc AI से पूछें', linkWallet: 'Arc वॉलेट जोड़ें',
    payment: 'भुगतान', payments: 'भुगतान', wallet: 'वॉलेट',
    save: 'सहेजें', cancel: 'रद्द करें', search: 'खोजें',
  },
  ja: {
    signOut: 'ログアウト', student: '学生', admin: '管理者', guest: 'ゲスト',
    language: '言語', home: 'ホーム', helpCenter: 'ヘルプセンター',
    back: '戻る', refresh: '更新', loading: '読み込み中…',
    askAI: 'CampusArc AI に質問', linkWallet: 'Arc ウォレットを接続',
    payment: '支払い', payments: '支払い履歴', wallet: 'ウォレット',
    save: '保存', cancel: 'キャンセル', search: '検索',
  },
  ko: {
    signOut: '로그아웃', student: '학생', admin: '관리자', guest: '게스트',
    language: '언어', home: '홈', helpCenter: '도움말 센터',
    back: '뒤로', refresh: '새로 고침', loading: '로드 중…',
    askAI: 'CampusArc AI에게 질문', linkWallet: 'Arc 지갑 연결',
    payment: '결제', payments: '결제 내역', wallet: '지갑',
    save: '저장', cancel: '취소', search: '검색',
  },
};

export function getLocale() {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem('campusarc-locale');
  if (saved && SUPPORTED_LOCALES.some((item) => item.code === saved)) return saved;
  const browser = String(navigator.language || 'en').split('-')[0].toLowerCase();
  return SUPPORTED_LOCALES.some((item) => item.code === browser) ? browser : 'en';
}

export function getTranslations(locale) {
  return translations[locale] || translations.en;
}

export function getLocaleMeta(locale) {
  return SUPPORTED_LOCALES.find((item) => item.code === locale) || SUPPORTED_LOCALES[0];
}
