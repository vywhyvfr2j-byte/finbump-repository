// Legal documents, kept as content (not UI strings) so the text can be
// reviewed and updated as a whole. Each section is either a paragraph
// (`p`), a bullet list (`list`), or both. Both pages render this structure
// through components/legal/LegalDocument.jsx.
//
// The app's real data practices are described here, so a change to how the
// app handles data (a new processor, a new import source, a new AI feature)
// must be reflected in this file.

export const legalContent = {
  en: {
    lastUpdated: 'Last updated: November 21, 2026',
    privacy: {
      title: 'Privacy Policy',
      intro:
        'FinBump ("FinBump", "we", "us") is a personal memory and relationship app: it helps you keep track of the people you care about, remember the small things, and act on them. This policy explains what personal information we collect, why we collect it, who we share it with, and the choices and rights you have. It applies to the FinBump website and mobile apps.',
      sections: [
        {
          h: '1. Who is responsible for your information',
          p: 'FinBump is the controller of the personal information described in this policy. We handle it in line with this policy and applicable data-protection law. You can reach us using the message form in Settings (Help & support) for any privacy question, request, or complaint.',
        },
        {
          h: '2. Information you give us',
          list: [
            'Account details: your name, email address, and sign-in credentials. Passwords are stored in hashed form by our authentication provider; we never see them in plain text. If you sign in with Google, Apple, Microsoft, or another provider, we receive your name, email address, and account identifier from them.',
            'Profile details you choose to add: a photo, birthday, anniversary, postal code, favourite things, sizes, dietary preferences, love languages, and similar notes.',
            'Information about other people: names, relationships, contact details, birthdays and anniversaries, gift preferences and budgets, notes, care-reminder settings, prayer or remembrance details, and, if you choose to enter it, health notes. You may be entering information about someone else. Please only add it with their permission and make sure they know it is kept here.',
            'Content you create: acts of support, events, milestones, goals, personal notes, memory moments, meal and trip plans, cards and messages, saved ideas, and suggestions or reviews you send us.',
            'Photos and files you upload, which are stored privately and shown only to your own account through short-lived links.',
            'Imports you start: contacts from Google Contacts or Outlook (only when you connect that account and approve the permissions), and calendar files you choose to upload.',
            'Messages you send us through support, suggestions, or reviews, including your email address and anything you include in the message.',
          ],
        },
        {
          h: '3. Information we collect automatically',
          list: [
            'Usage and diagnostic data: which features and screens you use, timestamps, error and crash information, and browser or device type. This is used to keep the app working, fix faults, and understand which features are used.',
            'Technical data such as IP address, used for security, abuse prevention, and rate limiting.',
            'Preferences and cached data stored in your browser or device (see section 8).',
            'A push-notification token if you allow notifications, so reminders can reach your device.',
          ],
        },
        {
          h: '4. Payments',
          p: 'Payments are processed by Base44 Payments (Wix). Your card details are entered on, and handled by, the payment provider; we never see or store a full card number. We receive and keep only what is needed to run your subscription: the order and subscription identifiers, the plan, the amount, the status and dates, and the email address used at checkout.',
        },
        {
          h: '5. How we use your information, and our legal bases',
          p: 'We use personal information only for the purposes below. Where the EU or UK GDPR applies, the legal basis for each purpose is shown in brackets.',
          list: [
            'To provide the service: storing your entries, showing your reminders, and syncing the categories you choose with a partner you pair with (performance of our contract with you).',
            'To send reminders, digests, and notifications you have enabled, and service messages such as receipts and security notices (contract; consent for optional notifications).',
            'To run AI features when you ask for them (contract).',
            'To process payments, manage trials and subscriptions, and keep accounting records (contract; legal obligation).',
            'To keep the app secure, prevent abuse, enforce rate limits, and debug faults (our legitimate interests in running a safe, working service).',
            'To understand how features are used so we can improve them, using our own first-party usage records (our legitimate interests; you can object as described in section 11).',
            'To comply with the law and respond to lawful requests (legal obligation).',
          ],
        },
        {
          h: '6. AI features',
          p: 'Some features use AI: gift and message suggestions, meal and trip planning, card artwork, the chat assistant, and similar tools. When you use them, the text and details you submit for that request are sent through our platform to third-party AI model providers to generate the response. We do not use your content to train AI models, and we do not allow those providers to use it for their own purposes beyond producing the result. AI output can be wrong, incomplete, or out of date, so check anything important before relying on it. Please avoid putting sensitive details (such as health information or financial account numbers) into an AI request.',
        },
        {
          h: '7. Who we share information with',
          p: 'We do not sell your personal information, and we do not share it for cross-context behavioural advertising. We do not run third-party advertising networks or data brokers in the app. We share information only in these situations:',
          list: [
            'Service providers that run the app for us, acting on our instructions: Base44 (hosting, database, authentication, AI gateway, file storage), Wix (payments), Resend (email delivery), AI model providers (when you use an AI feature), and push-notification delivery services.',
            'People you choose to share with: a partner you pair with sees the categories you enable; someone you invite to a meal or trip sees what you send them through their private invite link; a card you send is delivered to its recipient.',
            'Legal and safety: when we believe in good faith that disclosure is required by law or legal process, or necessary to protect the rights, safety, or property of our users, the public, or us.',
            'A business transfer: if FinBump is merged, acquired, or its assets transferred, information may move as part of that transaction, under this policy.',
          ],
        },
        {
          h: '8. Cookies, local storage, and tracking',
          p: 'We do not use advertising cookies, ad pixels, or third-party behavioural trackers. We keep your sign-in session and your preferences (theme, language, quiet hours, dismissed notices) in your browser or device storage, and we keep our own first-party usage records on our servers. If we ever add a tool that tracks you across other websites, we will ask for your permission first and update this policy.',
        },
        {
          h: '9. Google user data',
          p: "If you connect Google Contacts, we use it only to import the names, email addresses, and phone numbers you choose to bring into FinBump, so you can reach those people from the app. We do not use Google user data for advertising, we do not sell it, and we do not transfer it to third parties except as needed to provide the feature (our hosting and database providers) or as required by law. FinBump's use and transfer to any other app of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements. You can disconnect Google at any time in Settings, and delete imported contacts from the app.",
        },
        {
          h: '10. How long we keep it',
          p: 'We keep your information while your account is active. When you delete your account, we remove your content from the live service promptly, and it is removed from rotating backups within a limited period. A few things may be kept longer where the law requires it or to protect our rights: subscription and tax records, records of a completed deletion, and information needed to resolve a dispute or enforce our terms.',
        },
        {
          h: '11. Security',
          p: 'Information is encrypted in transit. Access to your records is restricted to your own account through per-user access rules on our backend, so another account cannot read or change your entries. Uploaded photos are held in private storage and shown through short-lived signed links rather than public URLs. Our staff can access records only where needed to operate, support, or secure the service. No system is perfectly secure, so please use a strong, unique password and tell us right away if you think your account has been compromised.',
        },
        {
          h: '12. Your rights and choices',
          p: 'Depending on where you live, you have some or all of the following rights, and we will not treat you differently for exercising them:',
          list: [
            'Access and a copy of your information: use "Export my data" in Settings, or ask us.',
            'Correction of information that is wrong or incomplete.',
            'Deletion of your account and its content: use "Delete account" in Settings, or ask us.',
            'Portability of the information you provided, in a machine-readable format.',
            'Objection to, or restriction of, processing based on our legitimate interests, including our first-party usage analysis.',
            'Withdrawal of consent for optional features (notifications, contact or calendar imports) at any time, without affecting what was done before.',
            'For California residents: the right to know what we collect and how it is used, to delete, to correct, to opt out of sale or sharing (we do neither), to limit the use of sensitive personal information (we use it only to provide the service), and to use an authorized agent. We do not knowingly sell or share the personal information of anyone under 16.',
            'A complaint to your local data-protection authority. We would appreciate the chance to resolve it with you first.',
          ],
        },
        {
          h: '13. Responding to requests',
          p: 'We respond to verified requests within the time the law allows, normally within 30 days. To protect your data, we may ask you to confirm control of the account or email address before we act. If someone you have given authority acts for you, we may ask for proof of that authority. There is no fee unless a request is clearly unfounded or excessive.',
        },
        {
          h: '14. International transfers',
          p: 'We and our service providers process information in the United States and other countries where they operate. Where personal information protected by the EU or UK GDPR is transferred out of those regions, we rely on appropriate safeguards such as standard contractual clauses, together with the security measures described above.',
        },
        {
          h: '15. Children',
          p: "FinBump is not intended for children under 13 (or the higher minimum age where you live), and we do not knowingly collect their personal information. If you believe a child has created an account, contact us and we will delete it.",
        },
        {
          h: '16. Changes to this policy',
          p: 'We will update this policy as the service changes and will always show the date above. If a change materially affects how we use your information, we will tell you in the app or by email before it takes effect.',
        },
        {
          h: '17. Contact',
          p: 'For any question, request, or complaint about privacy, use the message form in Settings (Help & support). We will reply by email. If we cannot resolve your concern, you may complain to your local data-protection authority.',
        },
      ],
    },
    terms: {
      title: 'Terms of Service',
      intro:
        'These Terms of Service ("Terms") are an agreement between you and FinBump covering your use of the FinBump website and mobile apps (the "Service"). Please read them. By creating an account or using the Service, you agree to these Terms and to our Privacy Policy. If you do not agree, do not use the Service.',
      sections: [
        {
          h: '1. The Service',
          p: 'FinBump helps you record and remember details about your relationships and the people you care about, with optional partner syncing, reminders, gift ideas, memory keeping, and planning tools. Some features use AI. We may add, change, or remove features over time.',
        },
        {
          h: '2. Who can use FinBump',
          p: 'You must be at least 13 years old (or the higher minimum age where you live) to use the Service, and at least 18 (or the age of majority where you live) to buy a subscription. You must not be barred from using the Service under the laws that apply to you. If you use FinBump for an organisation, or set it up for someone else, you confirm you have authority to accept these Terms on their behalf.',
        },
        {
          h: '3. Your account',
          list: [
            'Give accurate information and keep it current.',
            'Keep your sign-in credentials secure and do not share your account. You are responsible for activity under your account.',
            'Tell us promptly if you think someone else has accessed your account.',
            'We may require email verification or two-factor authentication, and we may suspend an account we reasonably believe is compromised or being misused.',
          ],
        },
        {
          h: '4. Your content',
          p: 'You own the content you create in FinBump. You give us a limited, non-exclusive licence to host, store, process, transmit, back up, and display that content solely to run the Service for you: showing it to you, sending your reminders and digests, and syncing with people you explicitly choose. This licence ends when you delete the content or your account, apart from copies held in backups for a limited period and records we must keep by law. We never sell your content.',
        },
        {
          h: '5. Information about other people',
          p: "Much of what FinBump holds is about other people: your partner, family, friends, and pets. You are responsible for having a lawful basis to add their information, for using it only in ways they would reasonably expect, and for telling them about this app if they would want to know. Do not use FinBump to build a profile of someone in a way that harms, harasses, or deceives them. We may remove content, or close an account, where we reasonably believe this has happened.",
        },
        {
          h: '6. Acceptable use',
          p: 'You agree not to:',
          list: [
            'Use the Service unlawfully, or to store or share information you have no right to hold.',
            'Harass, threaten, defame, impersonate, or deceive anyone.',
            'Upload malware, or attempt to access another account, our systems, or data you are not authorised to see.',
            'Scrape, crawl, copy, reverse engineer, or resell the Service, or interfere with its operation or security.',
            'Use the AI features to generate unlawful, abusive, or deceptive content, or to process another person\'s sensitive information without permission.',
            'Use the Service as a medical, mental-health, legal, financial, or emergency service (see section 8).',
            'Circumvent usage limits, paywalls, or access controls.',
          ],
        },
        {
          h: '7. AI-generated content',
          p: 'AI features produce suggestions, text, plans, and images automatically. Output can be inaccurate, incomplete, biased, or unsuitable, and it may not reflect current facts. Review anything before you rely on it or send it to someone else. You are responsible for how you use AI output, and for the messages and cards you choose to send.',
        },
        {
          h: '8. Not professional advice, not an emergency service',
          p: 'FinBump is a personal organisation tool. It does not provide medical, mental-health, legal, financial, or other professional advice, and it is not a monitoring, alerting, or emergency service. Health notes, care reminders, and remembrance details are for your own reference only. If you or someone else is in danger or need urgent help, contact your local emergency services immediately. Never delay seeking professional advice because of something you read in the app.',
        },
        {
          h: '9. Subscriptions, trials, and payments',
          list: [
            'FinBump offers a free tier and paid plans (such as a free trial followed by a monthly or annual subscription, or a one-time lifetime purchase). The plan, price, billing period, and any trial length are always shown on the checkout page before you pay, and that is the offer you are accepting.',
            'A free trial converts to a paid subscription automatically at the end of the trial unless you cancel before it ends. We show the date of the first charge at checkout and in Settings.',
            'Subscriptions renew automatically for the same period until you cancel. You can cancel at any time in Settings (Premium); you keep access until the end of the period you have already paid for, and you will not be charged again.',
            'Payments are processed by Base44 Payments (Wix). We never receive your full card details. Prices are in the currency shown at checkout and may include applicable taxes.',
            'If a payment fails, we may retry it and may suspend paid features until it succeeds.',
            'Refunds are handled according to the payment provider\'s policy and the law that applies to you. Where a statutory cancellation right applies, contact us and we will honour it.',
            'If you buy through a third-party store (for example the Apple App Store or Google Play), that store\'s payment, billing, and refund terms apply, and cancellations are managed in that store.',
            'We may change plan prices. We will give you reasonable notice before a change affects a subscription you already hold, and you can cancel before it takes effect.',
          ],
        },
        {
          h: '10. Third-party services',
          p: 'Some features rely on other services, such as Google Contacts or Outlook for imports, Base44 Payments for billing, and AI providers for generated content. Those services have their own terms and privacy policies, and we are not responsible for them. Connecting one is always your choice, and you can disconnect it in Settings.',
        },
        {
          h: '11. Our intellectual property',
          p: 'The Service itself, including its software, design, text, graphics, and the FinBump name and logo, belongs to us or our licensors. We grant you a personal, non-transferable, non-exclusive licence to use the Service under these Terms. You may not copy, modify, distribute, or create derivative works from it, except as the law allows. If you send us a suggestion, you allow us to use it without obligation to you.',
        },
        {
          h: '12. Availability and changes',
          p: 'We work to keep FinBump reliable, but we do not guarantee uninterrupted or error-free service. We may perform maintenance, and features may change or be discontinued. If we discontinue a feature you rely on, we will give reasonable notice where we can, and you can export your data at any time from Settings.',
        },
        {
          h: '13. Termination',
          p: 'You can stop using FinBump and delete your account at any time in Settings. We may suspend or end your access if you materially breach these Terms, if we are required to by law, or if continuing would expose other users or us to risk; where practical we will tell you why and give you a chance to export your data. On termination your licence to use the Service ends, and your information is handled as described in the Privacy Policy.',
        },
        {
          h: '14. Disclaimers',
          p: 'To the extent the law allows, the Service is provided "as is" and "as available", without warranties of any kind, whether express or implied, including merchantability, fitness for a particular purpose, accuracy, and non-infringement. We do not warrant that content in the app, including AI output and information about your contacts, is accurate or complete. Nothing in these Terms limits rights you have under consumer law that cannot be excluded.',
        },
        {
          h: '15. Limitation of liability',
          p: 'To the extent the law allows, we are not liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, lost data, or loss of goodwill arising from your use of the Service. Our total liability for any claim relating to the Service is limited to the greater of the amount you paid us in the twelve months before the event giving rise to the claim, or the minimum amount the law requires. We do not exclude liability for death or personal injury caused by negligence, for fraud, or for anything else that cannot lawfully be excluded.',
        },
        {
          h: '16. Indemnity',
          p: 'To the extent the law allows, you agree to indemnify us against claims, losses, and reasonable costs arising from your breach of these Terms, your misuse of the Service, or a claim that information you added about another person infringed their rights or was added without a lawful basis.',
        },
        {
          h: '17. Governing law and disputes',
          p: 'These Terms are governed by the laws of the state or country in which the FinBump operator is established, without regard to conflict-of-law rules, and the courts there have exclusive jurisdiction, except where the law where you live gives you the right to bring a claim locally or requires a different law to apply. Before starting formal proceedings, please write to us through the message form in Settings and give us 30 days to try to resolve it.',
        },
        {
          h: '18. Changes to these Terms',
          p: 'We may update these Terms as the Service changes. We will surface material changes in the app or by email before they take effect. If you keep using the Service after a change takes effect, you accept the updated Terms; if you do not agree, you can stop using the Service and delete your account.',
        },
        {
          h: '19. General',
          p: 'These Terms and the Privacy Policy are the whole agreement between us on this subject. If a provision is found unenforceable, the rest remains in effect. A delay in enforcing a provision is not a waiver of it. You may not transfer your rights under these Terms without our consent; we may transfer ours as part of a merger, acquisition, or sale of assets.',
        },
        {
          h: '20. Contact',
          p: 'Questions about these Terms? Use the message form in Settings (Help & support) and we will reply by email.',
        },
      ],
    },
  },

  es: {
    lastUpdated: 'Última actualización: 21 de noviembre de 2026',
    privacy: {
      title: 'Política de privacidad',
      intro:
        'FinBump ("FinBump", "nosotros") es una aplicación de memoria personal y relaciones: te ayuda a llevar un registro de las personas que te importan, recordar los pequeños detalles y actuar en consecuencia. Esta política explica qué información personal recopilamos, por qué, con quién la compartimos y qué derechos tienes. Se aplica al sitio web y a las aplicaciones móviles de FinBump.',
      sections: [
        {
          h: '1. Quién es responsable de tu información',
          p: 'FinBump es el responsable del tratamiento de la información personal descrita en esta política, que gestionamos conforme a esta política y a la ley de protección de datos aplicable. Puedes contactarnos mediante el formulario de mensajes en Configuración (Ayuda y soporte) para cualquier consulta, solicitud o reclamación de privacidad.',
        },
        {
          h: '2. Información que nos facilitas',
          list: [
            'Datos de la cuenta: tu nombre, correo electrónico y credenciales de acceso. Las contraseñas se guardan cifradas (hash) por nuestro proveedor de autenticación; nunca las vemos en texto plano. Si inicias sesión con Google, Apple, Microsoft u otro proveedor, recibimos de ellos tu nombre, correo y un identificador de cuenta.',
            'Datos de perfil que decidas añadir: foto, cumpleaños, aniversario, código postal, cosas favoritas, tallas, preferencias alimentarias, lenguajes del amor y notas similares.',
            'Información sobre otras personas: nombres, parentescos, datos de contacto, cumpleaños y aniversarios, preferencias y presupuestos de regalos, notas, recordatorios de cuidado, detalles de oración o de memoria y, si decides introducirlos, notas de salud. Es posible que estés introduciendo información sobre otra persona: hazlo solo con su permiso y asegúrate de que sabe que se guarda aquí.',
            'Contenido que creas: actos de apoyo, eventos, hitos, metas, notas personales, momentos de memoria, planes de comidas y viajes, tarjetas y mensajes, ideas guardadas, y sugerencias o reseñas que nos envíes.',
            'Fotos y archivos que subes, que se almacenan de forma privada y solo se muestran a tu cuenta mediante enlaces de corta duración.',
            'Importaciones que inicias: contactos de Google Contactos u Outlook (solo si conectas esa cuenta y apruebas los permisos) y archivos de calendario que decidas subir.',
            'Mensajes que nos envías mediante soporte, sugerencias o reseñas, incluido tu correo electrónico y lo que incluyas en el mensaje.',
          ],
        },
        {
          h: '3. Información que recopilamos automáticamente',
          list: [
            'Datos de uso y diagnóstico: qué funciones y pantallas usas, marcas de tiempo, información de errores y fallos, y tipo de navegador o dispositivo. Se utilizan para mantener la aplicación funcionando, corregir fallos y entender qué funciones se usan.',
            'Datos técnicos como la dirección IP, usados para seguridad, prevención de abuso y limitación de solicitudes.',
            'Preferencias y datos en caché guardados en tu navegador o dispositivo (ver sección 8).',
            'Un token de notificaciones push si permites notificaciones, para que los recordatorios lleguen a tu dispositivo.',
          ],
        },
        {
          h: '4. Pagos',
          p: 'Los pagos los procesa Base44 Payments (Wix). Los datos de tu tarjeta se introducen y los gestiona el proveedor de pagos; nunca vemos ni almacenamos el número completo de la tarjeta. Solo recibimos y conservamos lo necesario para gestionar tu suscripción: los identificadores de pedido y suscripción, el plan, el importe, el estado y las fechas, y el correo usado en el pago.',
        },
        {
          h: '5. Cómo usamos tu información y nuestras bases legales',
          p: 'Usamos la información personal solo para los fines siguientes. Cuando se aplica el RGPD de la UE o del Reino Unido, la base legal de cada fin aparece entre paréntesis.',
          list: [
            'Prestar el servicio: guardar tus entradas, mostrar tus recordatorios y sincronizar las categorías que elijas con la pareja con la que te vinculas (ejecución de nuestro contrato contigo).',
            'Enviar recordatorios, resúmenes y notificaciones que hayas activado, y mensajes de servicio como recibos y avisos de seguridad (contrato; consentimiento para notificaciones opcionales).',
            'Ejecutar las funciones de IA cuando las solicitas (contrato).',
            'Procesar pagos, gestionar pruebas y suscripciones y mantener registros contables (contrato; obligación legal).',
            'Mantener la aplicación segura, prevenir abusos, aplicar límites de uso y depurar fallos (nuestro interés legítimo en ofrecer un servicio seguro y operativo).',
            'Entender cómo se usan las funciones para mejorarlas, con nuestros propios registros de uso (nuestro interés legítimo; puedes oponerte como se describe en la sección 12).',
            'Cumplir la ley y responder a solicitudes legales (obligación legal).',
          ],
        },
        {
          h: '6. Funciones de IA',
          p: 'Algunas funciones usan IA: sugerencias de regalos y mensajes, planificación de comidas y viajes, ilustraciones de tarjetas, el asistente de chat y herramientas similares. Cuando las usas, el texto y los detalles que envías para esa solicitud se transmiten a través de nuestra plataforma a proveedores externos de modelos de IA para generar la respuesta. No usamos tu contenido para entrenar modelos de IA y no permitimos que esos proveedores lo usen para fines propios más allá de producir el resultado. El resultado de la IA puede ser incorrecto, incompleto o estar desactualizado, así que comprueba lo importante antes de confiar en él. Evita incluir datos sensibles (como información de salud o números de cuentas financieras) en una solicitud de IA.',
        },
        {
          h: '7. Con quién compartimos la información',
          p: 'No vendemos tu información personal y no la compartimos para publicidad conductual entre contextos. No usamos redes publicitarias de terceros ni intermediarios de datos. Solo compartimos información en estos casos:',
          list: [
            'Proveedores de servicios que hacen funcionar la aplicación por nosotros, siguiendo nuestras instrucciones: Base44 (alojamiento, base de datos, autenticación, pasarela de IA, almacenamiento de archivos), Wix (pagos), Resend (envío de correo), proveedores de modelos de IA (cuando usas una función de IA) y servicios de entrega de notificaciones push.',
            'Personas con las que eliges compartir: la pareja con la que te vinculas ve las categorías que actives; quien invitas a una comida o viaje ve lo que le envías mediante su enlace privado; una tarjeta que envías se entrega a su destinatario.',
            'Motivos legales y de seguridad: cuando creemos de buena fe que la divulgación es exigida por la ley o un proceso legal, o necesaria para proteger los derechos, la seguridad o la propiedad de nuestros usuarios, del público o nuestros.',
            'Una operación empresarial: si FinBump se fusiona, es adquirida o transfiere sus activos, la información puede trasladarse como parte de esa operación, bajo esta política.',
          ],
        },
        {
          h: '8. Cookies, almacenamiento local y seguimiento',
          p: 'No usamos cookies publicitarias, píxeles de anuncios ni rastreadores conductuales de terceros. Guardamos tu sesión y tus preferencias (tema, idioma, horas de silencio, avisos descartados) en el almacenamiento de tu navegador o dispositivo, y mantenemos nuestros propios registros de uso en nuestros servidores. Si alguna vez añadimos una herramienta que te siga en otros sitios web, te pediremos permiso antes y actualizaremos esta política.',
        },
        {
          h: '9. Datos de usuario de Google',
          p: 'Si conectas Google Contactos, lo usamos solo para importar los nombres, correos y teléfonos que decidas traer a FinBump, para que puedas contactar con esas personas desde la aplicación. No usamos los datos de usuario de Google para publicidad, no los vendemos y no los transferimos a terceros salvo lo necesario para prestar la función (nuestros proveedores de alojamiento y base de datos) o cuando la ley lo exija. El uso y la transferencia a cualquier otra aplicación de la información recibida de las API de Google por parte de FinBump se ajustará a la Política de datos de usuario de los servicios de API de Google, incluidos los requisitos de uso limitado. Puedes desconectar Google en cualquier momento en Configuración y eliminar los contactos importados de la aplicación.',
        },
        {
          h: '10. Cuánto tiempo lo conservamos',
          p: 'Conservamos tu información mientras tu cuenta esté activa. Cuando eliminas tu cuenta, borramos tu contenido del servicio activo con prontitud, y se elimina de las copias de seguridad rotativas en un plazo limitado. Algunas cosas pueden conservarse más tiempo cuando la ley lo exige o para proteger nuestros derechos: registros de suscripción y fiscales, constancia de una eliminación completada e información necesaria para resolver una disputa o hacer cumplir nuestros términos.',
        },
        {
          h: '11. Seguridad',
          p: 'La información se cifra en tránsito. El acceso a tus registros está restringido a tu propia cuenta mediante reglas de acceso por usuario en nuestro backend, de modo que otra cuenta no puede leer ni modificar tus entradas. Las fotos subidas se guardan en almacenamiento privado y se muestran mediante enlaces firmados de corta duración en lugar de URL públicas. Nuestro personal solo accede a los registros cuando es necesario para operar, dar soporte o proteger el servicio. Ningún sistema es perfectamente seguro, así que usa una contraseña fuerte y única y avísanos de inmediato si crees que tu cuenta se ha visto comprometida.',
        },
        {
          h: '12. Tus derechos y opciones',
          p: 'Según dónde vivas, tienes algunos o todos los derechos siguientes, y no te trataremos de forma diferente por ejercerlos:',
          list: [
            'Acceso y copia de tu información: usa "Exportar mis datos" en Configuración o pídenoslo.',
            'Corrección de información incorrecta o incompleta.',
            'Eliminación de tu cuenta y su contenido: usa "Eliminar cuenta" en Configuración o pídenoslo.',
            'Portabilidad de la información que facilitaste, en un formato legible por máquina.',
            'Oposición o limitación del tratamiento basado en nuestros intereses legítimos, incluido nuestro análisis de uso.',
            'Retirada del consentimiento para funciones opcionales (notificaciones, importación de contactos o calendario) en cualquier momento, sin afectar a lo ya realizado.',
            'Para residentes de California: derecho a saber qué recopilamos y cómo se usa, a eliminar, a corregir, a oponerse a la venta o cesión (no hacemos ninguna de las dos), a limitar el uso de información personal sensible (solo la usamos para prestar el servicio) y a usar un agente autorizado. No vendemos ni cedemos a sabiendas la información personal de menores de 16 años.',
            'Presentar una reclamación ante tu autoridad de protección de datos. Agradeceríamos poder resolverla contigo primero.',
          ],
        },
        {
          h: '13. Cómo respondemos a las solicitudes',
          p: 'Respondemos a las solicitudes verificadas dentro del plazo que permite la ley, normalmente en 30 días. Para proteger tus datos, podemos pedirte que confirmes el control de la cuenta o del correo antes de actuar. Si actúa alguien con autorización tuya, podemos pedir prueba de esa autorización. No hay coste, salvo que la solicitud sea manifiestamente infundada o excesiva.',
        },
        {
          h: '14. Transferencias internacionales',
          p: 'Nosotros y nuestros proveedores procesamos información en Estados Unidos y en otros países donde operan. Cuando se transfiere fuera de esas regiones información personal protegida por el RGPD de la UE o del Reino Unido, nos basamos en garantías adecuadas como las cláusulas contractuales tipo, junto con las medidas de seguridad descritas arriba.',
        },
        {
          h: '15. Menores',
          p: 'FinBump no está destinado a menores de 13 años (ni por debajo de la edad mínima superior de tu país), y no recopilamos a sabiendas su información personal. Si crees que un menor ha creado una cuenta, contáctanos y la eliminaremos.',
        },
        {
          h: '16. Cambios en esta política',
          p: 'Actualizaremos esta política a medida que el servicio cambie y siempre mostraremos la fecha arriba. Si un cambio afecta de forma sustancial al uso de tu información, te lo comunicaremos en la aplicación o por correo antes de que entre en vigor.',
        },
        {
          h: '17. Contacto',
          p: 'Para cualquier consulta, solicitud o reclamación sobre privacidad, usa el formulario de mensajes en Configuración (Ayuda y soporte). Responderemos por correo. Si no podemos resolver tu preocupación, puedes reclamar ante tu autoridad de protección de datos.',
        },
      ],
    },
    terms: {
      title: 'Términos de servicio',
      intro:
        'Estos Términos de servicio ("Términos") son un acuerdo entre tú y FinBump que cubre tu uso del sitio web y de las aplicaciones móviles de FinBump (el "Servicio"). Léelos con atención. Al crear una cuenta o usar el Servicio, aceptas estos Términos y nuestra Política de privacidad. Si no estás de acuerdo, no uses el Servicio.',
      sections: [
        {
          h: '1. El Servicio',
          p: 'FinBump te ayuda a registrar y recordar detalles sobre tus relaciones y las personas que te importan, con sincronización opcional con tu pareja, recordatorios, ideas de regalos, memoria y herramientas de planificación. Algunas funciones usan IA. Podemos añadir, cambiar o retirar funciones con el tiempo.',
        },
        {
          h: '2. Quién puede usar FinBump',
          p: 'Debes tener al menos 13 años (o la edad mínima superior de tu país) para usar el Servicio, y al menos 18 (o la mayoría de edad de tu país) para comprar una suscripción. No debes estar impedido para usar el Servicio según las leyes que te apliquen. Si usas FinBump para una organización o lo configuras para otra persona, confirmas que tienes autoridad para aceptar estos Términos en su nombre.',
        },
        {
          h: '3. Tu cuenta',
          list: [
            'Facilita información exacta y mantenla actualizada.',
            'Mantén tus credenciales seguras y no compartas tu cuenta. Eres responsable de la actividad de tu cuenta.',
            'Avísanos con prontitud si crees que otra persona ha accedido a tu cuenta.',
            'Podemos exigir verificación por correo o autenticación en dos pasos, y suspender una cuenta que creamos razonablemente comprometida o mal utilizada.',
          ],
        },
        {
          h: '4. Tu contenido',
          p: 'El contenido que creas en FinBump es tuyo. Nos concedes una licencia limitada y no exclusiva para alojar, almacenar, procesar, transmitir, respaldar y mostrar ese contenido únicamente para prestarte el Servicio: mostrártelo, enviarte tus recordatorios y resúmenes, y sincronizarlo con las personas que elijas expresamente. Esta licencia termina cuando eliminas el contenido o tu cuenta, salvo las copias en respaldos durante un plazo limitado y los registros que debamos conservar por ley. Nunca vendemos tu contenido.',
        },
        {
          h: '5. Información sobre otras personas',
          p: 'Gran parte de lo que FinBump guarda es sobre otras personas: tu pareja, familia, amistades y mascotas. Eres responsable de tener una base legítima para añadir su información, de usarla solo como ellos esperarían razonablemente y de informarles de esta aplicación si querrían saberlo. No uses FinBump para crear un perfil de alguien de forma que le perjudique, le acose o le engañe. Podemos retirar contenido o cerrar una cuenta cuando creamos razonablemente que esto ha ocurrido.',
        },
        {
          h: '6. Uso aceptable',
          p: 'Te comprometes a no:',
          list: [
            'Usar el Servicio de forma ilícita, ni para guardar o compartir información que no tengas derecho a conservar.',
            'Acosar, amenazar, difamar, suplantar o engañar a nadie.',
            'Subir software malicioso ni intentar acceder a otra cuenta, a nuestros sistemas o a datos que no estés autorizado a ver.',
            'Extraer, rastrear, copiar, aplicar ingeniería inversa o revender el Servicio, ni interferir en su funcionamiento o seguridad.',
            'Usar las funciones de IA para generar contenido ilícito, abusivo o engañoso, ni para tratar información sensible de otra persona sin permiso.',
            'Usar el Servicio como servicio médico, de salud mental, jurídico, financiero o de emergencias (ver sección 8).',
            'Eludir límites de uso, muros de pago o controles de acceso.',
          ],
        },
        {
          h: '7. Contenido generado por IA',
          p: 'Las funciones de IA producen sugerencias, textos, planes e imágenes de forma automática. El resultado puede ser incorrecto, incompleto, sesgado o inadecuado, y puede no reflejar hechos actuales. Revisa cualquier cosa antes de confiar en ella o de enviarla a otra persona. Eres responsable de cómo usas el resultado de la IA y de los mensajes y tarjetas que decidas enviar.',
        },
        {
          h: '8. No es asesoramiento profesional ni un servicio de emergencias',
          p: 'FinBump es una herramienta de organización personal. No presta asesoramiento médico, de salud mental, jurídico, financiero ni de otro tipo profesional, y no es un servicio de monitorización, alerta o emergencias. Las notas de salud, los recordatorios de cuidado y los detalles de memoria son solo para tu referencia. Si tú u otra persona estáis en peligro o necesitáis ayuda urgente, contacta de inmediato con los servicios de emergencia locales. Nunca retrases la búsqueda de asesoramiento profesional por algo que hayas leído en la aplicación.',
        },
        {
          h: '9. Suscripciones, pruebas y pagos',
          list: [
            'FinBump ofrece un plan gratuito y planes de pago (como una prueba gratuita seguida de una suscripción mensual o anual, o una compra única de por vida). El plan, el precio, el periodo de facturación y la duración de cualquier prueba se muestran siempre en la página de pago antes de pagar, y esa es la oferta que aceptas.',
            'Una prueba gratuita se convierte automáticamente en una suscripción de pago al terminar, salvo que canceles antes. Mostramos la fecha del primer cargo en el pago y en Configuración.',
            'Las suscripciones se renuevan automáticamente por el mismo periodo hasta que canceles. Puedes cancelar en cualquier momento en Configuración (Premium); mantienes el acceso hasta el final del periodo ya pagado y no se te cobrará de nuevo.',
            'Los pagos los procesa Base44 Payments (Wix). Nunca recibimos los datos completos de tu tarjeta. Los precios están en la moneda mostrada en el pago y pueden incluir los impuestos aplicables.',
            'Si un pago falla, podemos reintentarlo y suspender las funciones de pago hasta que se complete.',
            'Los reembolsos se gestionan según la política del proveedor de pagos y la ley que te aplique. Cuando exista un derecho legal de desistimiento, contáctanos y lo respetaremos.',
            'Si compras a través de una tienda de terceros (por ejemplo, la App Store de Apple o Google Play), se aplican los términos de pago, facturación y reembolso de esa tienda, y las cancelaciones se gestionan en ella.',
            'Podemos cambiar los precios de los planes. Te avisaremos con antelación razonable antes de que un cambio afecte a una suscripción que ya tengas, y podrás cancelar antes de que entre en vigor.',
          ],
        },
        {
          h: '10. Servicios de terceros',
          p: 'Algunas funciones dependen de otros servicios, como Google Contactos u Outlook para importaciones, Base44 Payments para la facturación y proveedores de IA para el contenido generado. Esos servicios tienen sus propios términos y políticas de privacidad, y no somos responsables de ellos. Conectar uno es siempre tu elección, y puedes desconectarlo en Configuración.',
        },
        {
          h: '11. Nuestra propiedad intelectual',
          p: 'El Servicio, incluidos su software, diseño, textos, gráficos y el nombre y logotipo de FinBump, nos pertenece a nosotros o a nuestros licenciantes. Te concedemos una licencia personal, no transferible y no exclusiva para usar el Servicio conforme a estos Términos. No puedes copiarlo, modificarlo, distribuirlo ni crear obras derivadas, salvo lo que permita la ley. Si nos envías una sugerencia, nos permites usarla sin obligación hacia ti.',
        },
        {
          h: '12. Disponibilidad y cambios',
          p: 'Trabajamos para que FinBump sea fiable, pero no garantizamos un servicio ininterrumpido ni libre de errores. Podemos realizar tareas de mantenimiento, y las funciones pueden cambiar o retirarse. Si retiramos una función de la que dependes, avisaremos con antelación razonable cuando podamos, y puedes exportar tus datos en cualquier momento desde Configuración.',
        },
        {
          h: '13. Terminación',
          p: 'Puedes dejar de usar FinBump y eliminar tu cuenta en cualquier momento en Configuración. Podemos suspender o terminar tu acceso si incumples de forma sustancial estos Términos, si la ley nos lo exige, o si continuar expondría a otros usuarios o a nosotros a un riesgo; cuando sea posible, te diremos por qué y te daremos la oportunidad de exportar tus datos. Al terminar, tu licencia de uso del Servicio finaliza y tu información se trata como se describe en la Política de privacidad.',
        },
        {
          h: '14. Exenciones de responsabilidad',
          p: 'En la medida en que la ley lo permita, el Servicio se presta "tal cual" y "según disponibilidad", sin garantías de ningún tipo, expresas o implícitas, incluidas las de comerciabilidad, idoneidad para un fin concreto, exactitud y no infracción. No garantizamos que el contenido de la aplicación, incluido el resultado de la IA y la información sobre tus contactos, sea exacto o completo. Nada en estos Términos limita los derechos que te otorga la ley de consumo y que no pueden excluirse.',
        },
        {
          h: '15. Limitación de responsabilidad',
          p: 'En la medida en que la ley lo permita, no somos responsables de daños indirectos, incidentales, especiales, consecuentes o punitivos, ni de la pérdida de beneficios, de datos o de reputación derivados del uso del Servicio. Nuestra responsabilidad total por cualquier reclamación relacionada con el Servicio se limita al mayor de estos importes: lo que nos pagaste en los doce meses anteriores al hecho que originó la reclamación, o el mínimo que exija la ley. No excluimos la responsabilidad por muerte o daños personales causados por negligencia, por fraude, ni por cualquier otro supuesto que no pueda excluirse legalmente.',
        },
        {
          h: '16. Indemnización',
          p: 'En la medida en que la ley lo permita, aceptas indemnizarnos frente a reclamaciones, pérdidas y costes razonables derivados de tu incumplimiento de estos Términos, de tu mal uso del Servicio o de una reclamación de que la información que añadiste sobre otra persona infringió sus derechos o se añadió sin una base legítima.',
        },
        {
          h: '17. Ley aplicable y disputas',
          p: 'Estos Términos se rigen por las leyes del estado o país en el que está establecido el operador de FinBump, sin atender a las normas de conflicto de leyes, y los tribunales de ese lugar tienen jurisdicción exclusiva, salvo cuando la ley de tu país te dé derecho a reclamar localmente o exija aplicar otra ley. Antes de iniciar un procedimiento formal, escríbenos mediante el formulario de mensajes en Configuración y danos 30 días para intentar resolverlo.',
        },
        {
          h: '18. Cambios en estos Términos',
          p: 'Podemos actualizar estos Términos a medida que el Servicio cambie. Mostraremos los cambios sustanciales en la aplicación o por correo antes de que entren en vigor. Si sigues usando el Servicio después de que un cambio entre en vigor, aceptas los Términos actualizados; si no estás de acuerdo, puedes dejar de usar el Servicio y eliminar tu cuenta.',
        },
        {
          h: '19. Disposiciones generales',
          p: 'Estos Términos y la Política de privacidad constituyen el acuerdo completo entre nosotros sobre esta materia. Si una disposición resulta inaplicable, el resto sigue vigente. No renunciamos a una disposición por retrasar su aplicación. No puedes transferir tus derechos bajo estos Términos sin nuestro consentimiento; nosotros podemos transferir los nuestros como parte de una fusión, adquisición o venta de activos.',
        },
        {
          h: '20. Contacto',
          p: '¿Dudas sobre estos Términos? Usa el formulario de mensajes en Configuración (Ayuda y soporte) y te responderemos por correo.',
        },
      ],
    },
  },
};

// Resolve the document for the active language, falling back to English.
export function getLegalContent(language) {
  return legalContent[language] || legalContent.en;
}