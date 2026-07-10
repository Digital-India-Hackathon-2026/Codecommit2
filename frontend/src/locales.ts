export const translations: Record<string, Record<string, string>> = {
    'English (US)': {
        nav_personal: 'Personal Information',
        nav_security: 'Sign-In and Security',
        nav_payment: 'Payment Methods',
        nav_subscriptions: 'Subscriptions',
        nav_devices: 'Devices',
        nav_privacy: 'Privacy',
        sign_out: 'Sign Out',
        
        // Personal Info
        header_personal: 'Personal Information',
        label_name: 'Name',
        label_birthday: 'Birthday',
        title_contactable: 'Contactable At',
        desc_contactable: 'These email addresses and phone numbers can be used to reach you.',
        label_email: 'Email',
        label_language: 'Language',
        
        // General
        btn_cancel: 'Cancel',
        btn_save: 'Save',
        return_home: 'Return to Nakshatra Homepage'
    },
    'Español': {
        nav_personal: 'Información Personal',
        nav_security: 'Inicio de Sesión y Seguridad',
        nav_payment: 'Métodos de Pago',
        nav_subscriptions: 'Suscripciones',
        nav_devices: 'Dispositivos',
        nav_privacy: 'Privacidad',
        sign_out: 'Cerrar Sesión',
        
        header_personal: 'Información Personal',
        label_name: 'Nombre',
        label_birthday: 'Fecha de Nacimiento',
        title_contactable: 'Contactable En',
        desc_contactable: 'Estas direcciones de correo electrónico y números de teléfono pueden usarse para comunicarnos con usted.',
        label_email: 'Correo Electrónico',
        label_language: 'Idioma',
        
        btn_cancel: 'Cancelar',
        btn_save: 'Guardar',
        return_home: 'Volver a la página de inicio de Nakshatra'
    },
    'Français': {
        nav_personal: 'Informations Personnelles',
        nav_security: 'Connexion et Sécurité',
        nav_payment: 'Méthodes de Paiement',
        nav_subscriptions: 'Abonnements',
        nav_devices: 'Appareils',
        nav_privacy: 'Confidentialité',
        sign_out: 'Se déconnecter',
        
        header_personal: 'Informations Personnelles',
        label_name: 'Nom',
        label_birthday: 'Date de Naissance',
        title_contactable: 'Joignable À',
        desc_contactable: 'Ces adresses e-mail et numéros de téléphone peuvent être utilisés pour vous joindre.',
        label_email: 'E-mail',
        label_language: 'Langue',
        
        btn_cancel: 'Annuler',
        btn_save: 'Enregistrer',
        return_home: 'Retour à l\'accueil de Nakshatra'
    },
    'Deutsch': {
        nav_personal: 'Persönliche Daten',
        nav_security: 'Anmeldung und Sicherheit',
        nav_payment: 'Zahlungsmethoden',
        nav_subscriptions: 'Abonnements',
        nav_devices: 'Geräte',
        nav_privacy: 'Datenschutz',
        sign_out: 'Abmelden',
        
        header_personal: 'Persönliche Daten',
        label_name: 'Name',
        label_birthday: 'Geburtsdatum',
        title_contactable: 'Erreichbar Unter',
        desc_contactable: 'Diese E-Mail-Adressen und Telefonnummern können verwendet werden, um Sie zu erreichen.',
        label_email: 'E-Mail',
        label_language: 'Sprache',
        
        btn_cancel: 'Abbrechen',
        btn_save: 'Speichern',
        return_home: 'Zurück zur Nakshatra Startseite'
    },
    '日本語': {
        nav_personal: '個人情報',
        nav_security: 'サインインとセキュリティ',
        nav_payment: 'お支払い方法',
        nav_subscriptions: 'サブスクリプション',
        nav_devices: 'デバイス',
        nav_privacy: 'プライバシー',
        sign_out: 'サインアウト',
        
        header_personal: '個人情報',
        label_name: '名前',
        label_birthday: '誕生日',
        title_contactable: '連絡先',
        desc_contactable: 'これらのメールアドレスと電話番号を使用して連絡を取ることができます。',
        label_email: '電子メール',
        label_language: '言語',
        
        btn_cancel: 'キャンセル',
        btn_save: '保存',
        return_home: 'Nakshatra ホームページに戻る'
    },
    '中文 (简体)': {
        nav_personal: '个人信息',
        nav_security: '登录和安全',
        nav_payment: '付款方式',
        nav_subscriptions: '订阅',
        nav_devices: '设备',
        nav_privacy: '隐私',
        sign_out: '退出登录',
        
        header_personal: '个人信息',
        label_name: '姓名',
        label_birthday: '生日',
        title_contactable: '联络方式',
        desc_contactable: '可以使用这些电子邮件地址和电话号码与您联系。',
        label_email: '电子邮件',
        label_language: '语言',
        
        btn_cancel: '取消',
        btn_save: '保存',
        return_home: '返回 Nakshatra 首页'
    }
};

export const useTranslation = (language: string) => {
    return (key: string, fallback: string = "") => {
        const langDict = translations[language] || translations['English (US)'];
        return langDict[key] || fallback || key;
    };
};
