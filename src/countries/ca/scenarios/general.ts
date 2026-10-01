/**
 * General scripted scenarios for the Canada pack (foundation-owned): safety, greetings, what this is,
 * and the fallback used when nothing else matches.
 */
import type { Scenario } from '@/lib/scripted/types';
import { ALL_SERVICES, DEPT_PAGES } from '../knowledge/pages';
import { routeDepartments } from '../knowledge/router';

const general: Scenario[] = [
  {
    id: 'crisis',
    priority: 100,
    match: [
      /\b(suicid\w*|kill (myself|me)|end my life|self[- ]harm|want to die|hurt myself)\b/i,
      /\b(me suicider|suicid\w*|me tuer|mettre fin à (mes jours|ma vie)|me faire du mal|envie de mourir)\b/i,
    ],
    reply: {
      en: `# You don’t have to go through this alone. *Call or text 9-8-8* any time.

If you are in immediate danger, **call 911** now.

**9-8-8: Suicide Crisis Helpline** is free, confidential and open 24 hours a day, 7 days a week, in English and French. You can call or text 9-8-8 from anywhere in Canada. [1](https://988.ca/)

If you’d rather talk to someone you know, reach out to them now and tell them how you’re feeling. You can keep talking to me too.`,
      fr: `# Vous n’êtes pas seul. *Appelez ou textez le 9-8-8* en tout temps.

Si vous êtes en danger immédiat, **composez le 911** maintenant.

**9-8-8 : Ligne d’aide en cas de crise de suicide** est gratuite, confidentielle et ouverte 24 heures sur 24, 7 jours sur 7, en français et en anglais. Vous pouvez appeler ou texter le 9-8-8 de partout au Canada. [1](https://988.ca/fr)

Si vous préférez parler à une personne que vous connaissez, communiquez avec elle maintenant. Vous pouvez aussi continuer à m’écrire.`,
    },
    followUps: {
      en: ['What happens when I call 9-8-8?', 'Find mental health support near me'],
      fr: ['Que se passe-t-il quand j’appelle le 9-8-8?', 'Trouver du soutien en santé mentale près de chez moi'],
    },
  },
  {
    id: 'hello',
    match: [
      /^\s*(hi|hello|hey|good (morning|afternoon|evening))\b[\s!.?]*$/i,
      /^\s*(bonjour|salut|allo|bonsoir)\b[\s!.?]*$/i,
      /\bwhat (can|do) you (help( me)? with|do)\b/i,
      /\b(avec quoi|comment) pouvez-vous m[’']aider\b/i,
    ],
    reply: {
      en: `# Hello! What can I help you with today?

Ask me about any federal service in your own words: passports, taxes, benefits, Employment Insurance, travel, immigration and more. I’ll give you a clear answer with the official source, and tools like calculators and checklists when they help.`,
      fr: `# Bonjour! Comment puis-je vous aider aujourd’hui?

Posez-moi vos questions sur les services fédéraux dans vos propres mots : passeports, impôts, prestations, assurance-emploi, voyages, immigration et plus encore. Je vous donne une réponse claire avec la source officielle, et des outils comme des calculateurs et des listes de vérification quand c’est utile.`,
    },
    followUps: {
      en: ['How do I renew my passport?', 'When is my next benefit payment?', 'Am I eligible for the Canada Child Benefit?'],
      fr: ['Comment renouveler mon passeport?', 'Quand est mon prochain paiement de prestations?', 'Suis-je admissible à l’Allocation canadienne pour enfants?'],
    },
  },
  {
    id: 'about',
    match: [/\b(who (are|made) you|what is (this|ask canada)|are you (the )?government|is this official)\b/i, /\b(qui êtes-vous|est-ce officiel|êtes-vous le gouvernement)\b/i],
    reply: {
      en: `# I’m Ask Canada, an independent guide to *official* government information.

I’m not the Government of Canada. I answer from official pages like canada.ca and link the exact page for every fact, so you can check it yourself. When you need to sign in, apply or pay, I send you to the official site. [1](https://www.canada.ca/en.html)

I don’t need an account, and your conversation isn’t stored on our servers. Plans and checklists you save stay on this device.`,
      fr: `# Je suis Ask Canada, un guide indépendant de l’information gouvernementale *officielle*.

Je ne suis pas le gouvernement du Canada. Je réponds à partir de pages officielles comme canada.ca et je donne le lien exact pour chaque fait, pour que vous puissiez le vérifier. Pour ouvrir une session, présenter une demande ou payer, je vous dirige vers le site officiel. [1](https://www.canada.ca/fr.html)

Aucun compte n’est nécessaire, et votre conversation n’est pas conservée sur nos serveurs. Les plans et listes que vous enregistrez restent sur cet appareil.`,
    },
    followUps: {
      en: ['How do you keep my information private?', 'What can you help me with?'],
      fr: ['Comment protégez-vous mes renseignements?', 'Avec quoi pouvez-vous m’aider?'],
    },
  },
  {
    id: 'crisis-what-happens',
    priority: 90,
    match: [/\bwhat happens when (i|you) (call|text)\b.*\b9-?8-?8\b/i, /\b9-?8-?8\b.*\b(what happens|what to expect|who answers)\b/i, /\bque se passe-t-il\b.*\b9-?8-?8\b/i, /\b9-?8-?8\b.*\b(que se passe|à quoi s[’']attendre|qui répond)\b/i],
    reply: {
      en: `# A trained responder listens, *without judgement.*

When you call or text 9-8-8, a trained responder answers. They listen, help you explore ways to stay safe when things feel overwhelming, and you decide how much you share. [1](https://988.ca/get-help/what-to-expect)

It’s free, available 24 hours a day in English and French, and interpretation can be arranged for other languages. In most calls, emergency services are not contacted; responders call them only if you’re at risk of dying or seriously harming yourself. [1](https://988.ca/get-help/what-to-expect)`,
      fr: `# Une personne formée vous écoute, *sans jugement.*

Quand vous appelez ou textez le 9-8-8, une personne formée vous répond. Elle vous écoute, vous aide à trouver des façons de rester en sécurité quand tout semble trop lourd, et c’est vous qui décidez ce que vous partagez. [1](https://988.ca/fr)

Le service est gratuit, offert 24 heures sur 24 en français et en anglais, et l’interprétation peut être organisée pour d’autres langues. Dans la plupart des cas, les services d’urgence ne sont pas appelés; ils le sont seulement si votre vie est en danger ou si vous risquez de vous blesser gravement. [1](https://988.ca/fr)`,
    },
    followUps: {
      en: ['Find mental health support near me', 'How do you keep my information private?'],
      fr: ['Trouver du soutien en santé mentale près de chez moi', 'Comment protégez-vous mes renseignements?'],
    },
  },
  {
    id: 'mental-health-support',
    priority: 20,
    match: [/\bmental health\b.*\b(support|help|near me|services?)\b/i, /\b(support|help)\b.*\bmental health\b/i, /\bsanté mentale\b/i],
    reply: {
      en: `# Support is available *right now*, by phone or text.

- **9-8-8: Suicide Crisis Helpline**: call or text 9-8-8, 24 hours a day, 7 days a week.
- **Kids Help Phone** (young people): call 1-800-668-6868 or text CONNECT to 686868, 24/7.
- **Hope for Wellness Help Line** (Indigenous Peoples): call 1-855-242-3310, or use the online chat.

Your province or territory also has local services, like 8-1-1 Info-Social in Quebec or 2-1-1 in Alberta. The official list has them all. [1](https://www.canada.ca/en/public-health/services/mental-health-services/mental-health-get-help.html)

If you are in immediate danger, call 911.`,
      fr: `# Du soutien est offert *dès maintenant*, par téléphone ou texto.

- **9-8-8 : Ligne d’aide en cas de crise de suicide** : appelez ou textez le 9-8-8, 24 heures sur 24, 7 jours sur 7.
- **Jeunesse, J’écoute** (jeunes) : appelez le 1-800-668-6868 ou textez PARLER au 686868, 24 heures sur 24.
- **Ligne d’écoute d’espoir pour le mieux-être** (Premières Nations, Inuits et Métis) : appelez le 1-855-242-3310 ou utilisez le clavardage en ligne.

Votre province ou territoire offre aussi des services locaux, comme Info-Social 811 au Québec ou le 2-1-1 en Alberta. La liste officielle les présente tous. [1](https://www.canada.ca/fr/sante-publique/services/services-sante-mentale/sante-mentale-obtenir-aide.html)

Si vous êtes en danger immédiat, composez le 911.`,
    },
    followUps: {
      en: ['What happens when I call 9-8-8?', 'How do you keep my information private?'],
      fr: ['Que se passe-t-il quand j’appelle le 9-8-8?', 'Comment protégez-vous mes renseignements?'],
    },
  },
  {
    id: 'privacy',
    priority: 15,
    match: [
      /\b(you|ask canada)\b.*\b(keep|protect|store|save|track|use)\w*\b.*\b(information|data|privacy|questions|chats?|conversations?)\b/i,
      /\b(do|does) (you|ask canada) (store|keep|save|track|log)\b/i,
      /\bprivacy\b.*\b(ask canada|this (service|site|app))\b/i,
      /\b(protégez|conservez|gardez|enregistrez|utilisez)[-\s]vous\b.*\b(renseignements|données|questions|conversations)\b/i,
      /\b(vous|ask canada)\b.*\b(protég|conserv|gard|enregistr)\w*\b.*\b(renseignements|données|questions|conversations)\b/i,
      /\bconfidentialité.*\b(ask canada|ce (service|site))\b/i,
    ],
    reply: {
      en: `# Private by design: *nothing you ask is stored* on our servers.

There’s no account and no profile, and no tracking cookies. Your question is sent to write the answer, then it isn’t kept. Recent chats, plans and checklists you save stay in this browser only, and you can remove them any time with **Clear this device** in the Menu.

Never type your SIN, passport number, banking details or passwords here. When you need to sign in, apply or pay, I send you to the official site.`,
      fr: `# Confidentiel dès la conception : *rien de ce que vous demandez n’est conservé* sur nos serveurs.

Aucun compte, aucun profil, aucun témoin de suivi. Votre question sert à rédiger la réponse, puis elle n’est pas conservée. Les conversations récentes, plans et listes que vous enregistrez restent dans ce navigateur seulement, et vous pouvez les supprimer en tout temps avec **Effacer cet appareil** dans le Menu.

N’écrivez jamais ici votre NAS, votre numéro de passeport, vos renseignements bancaires ou vos mots de passe. Pour ouvrir une session, présenter une demande ou payer, je vous dirige vers le site officiel.`,
    },
    followUps: {
      en: ['What can you help me with?', 'Is this official?'],
      fr: ['Avec quoi pouvez-vous m’aider?', 'Est-ce officiel?'],
    },
  },
  {
    id: 'fallback',
    match: [],
    reply: {
      en: `# Let’s find the right page.

{where} [1]({deptUrl} "{deptTitle}")

For a step-by-step answer here, try naming the service, like “How do I apply for Employment Insurance?” or “When is the next Canada Child Benefit payment?”.`,
      fr: `# Trouvons la bonne page.

{where} [1]({deptUrl} "{deptTitle}")

Pour une réponse étape par étape ici, essayez de nommer le service, par exemple « Comment demander l’assurance-emploi? » ou « Quand est le prochain paiement de l’Allocation canadienne pour enfants? ».`,
    },
    // Questions in other languages that no scenario recognizes: honest, in the person's language.
    replyIntl: {
      ar: `# لنجد الصفحة المناسبة.\n\nأفضل نقطة للبدء هي الصفحة الرسمية **{deptNameEn}**. [1]({deptUrlEn} "{deptNameEn}")\n\nللحصول على إجابة مفصلة هنا، يمكنك أيضًا طرح سؤالك باللغة الإنجليزية أو الفرنسية.`,
      fa: `# بیایید صفحه مناسب را پیدا کنیم.\n\nبهترین نقطه شروع، صفحه رسمی **{deptNameEn}** است. [1]({deptUrlEn} "{deptNameEn}")\n\nبرای دریافت پاسخ کامل در اینجا، می‌توانید سؤال خود را به انگلیسی یا فرانسوی هم بپرسید.`,
      ur: `# آئیے درست صفحہ تلاش کریں۔\n\nشروع کرنے کے لیے بہترین جگہ سرکاری صفحہ **{deptNameEn}** ہے۔ [1]({deptUrlEn} "{deptNameEn}")\n\nیہاں تفصیلی جواب کے لیے آپ اپنا سوال انگریزی یا فرانسیسی میں بھی پوچھ سکتے ہیں۔`,
      'zh-Hans': `# 我们来找到合适的页面。\n\n最好从官方页面 **{deptNameEn}** 开始。[1]({deptUrlEn} "{deptNameEn}")\n\n如需在这里获得详细解答，也可以用英语或法语提问。`,
      'zh-Hant': `# 我們來找到合適的頁面。\n\n最好從官方頁面 **{deptNameEn}** 開始。[1]({deptUrlEn} "{deptNameEn}")\n\n如需在這裡獲得詳細解答，也可以用英文或法文提問。`,
      pa: `# ਆਓ ਸਹੀ ਪੰਨਾ ਲੱਭੀਏ।\n\nਸ਼ੁਰੂ ਕਰਨ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਥਾਂ ਸਰਕਾਰੀ ਪੰਨਾ **{deptNameEn}** ਹੈ। [1]({deptUrlEn} "{deptNameEn}")\n\nਇੱਥੇ ਵਿਸਥਾਰ ਨਾਲ ਜਵਾਬ ਲਈ, ਤੁਸੀਂ ਆਪਣਾ ਸਵਾਲ ਅੰਗਰੇਜ਼ੀ ਜਾਂ ਫ਼ਰਾਂਸੀਸੀ ਵਿੱਚ ਵੀ ਪੁੱਛ ਸਕਦੇ ਹੋ।`,
      hi: `# आइए सही पेज खोजें।\n\nशुरुआत के लिए सबसे अच्छी जगह आधिकारिक पेज **{deptNameEn}** है। [1]({deptUrlEn} "{deptNameEn}")\n\nयहाँ विस्तृत जवाब के लिए, आप अपना सवाल अंग्रेज़ी या फ़्रेंच में भी पूछ सकते हैं।`,
      gu: `# ચાલો યોગ્ય પેજ શોધીએ.\n\nશરૂઆત કરવા માટે શ્રેષ્ઠ સ્થાન સત્તાવાર પેજ **{deptNameEn}** છે. [1]({deptUrlEn} "{deptNameEn}")\n\nઅહીં વિગતવાર જવાબ માટે, તમે તમારો પ્રશ્ન અંગ્રેજી અથવા ફ્રેન્ચમાં પણ પૂછી શકો છો.`,
      ta: `# சரியான பக்கத்தைக் கண்டுபிடிப்போம்.\n\nதொடங்குவதற்குச் சிறந்த இடம் அதிகாரப்பூர்வ பக்கமான **{deptNameEn}**. [1]({deptUrlEn} "{deptNameEn}")\n\nஇங்கே விரிவான பதிலுக்கு, உங்கள் கேள்வியை ஆங்கிலத்திலோ பிரெஞ்சிலோ கேட்கலாம்.`,
      ko: `# 알맞은 페이지를 찾아보겠습니다.\n\n가장 먼저 확인할 곳은 공식 페이지 **{deptNameEn}**입니다. [1]({deptUrlEn} "{deptNameEn}")\n\n여기에서 자세한 답변을 받으려면 영어나 프랑스어로도 질문하실 수 있습니다.`,
      ru: `# Давайте найдём нужную страницу.\n\nЛучше всего начать с официальной страницы **{deptNameEn}**. [1]({deptUrlEn} "{deptNameEn}")\n\nЧтобы получить здесь подробный ответ, вы также можете задать вопрос на английском или французском языке.`,
      uk: `# Знайдімо потрібну сторінку.\n\nНайкраще почати з офіційної сторінки **{deptNameEn}**. [1]({deptUrlEn} "{deptNameEn}")\n\nЩоб отримати тут детальну відповідь, ви також можете поставити запитання англійською або французькою мовою.`,
      es: `# Encontremos la página correcta.\n\nEl mejor punto de partida es la página oficial **{deptNameEn}**. [1]({deptUrlEn} "{deptNameEn}")\n\nPara obtener aquí una respuesta detallada, también puede hacer su pregunta en inglés o en francés.`,
      pt: `# Vamos encontrar a página certa.\n\nO melhor ponto de partida é a página oficial **{deptNameEn}**. [1]({deptUrlEn} "{deptNameEn}")\n\nPara receber aqui uma resposta detalhada, você também pode fazer sua pergunta em inglês ou francês.`,
      it: `# Troviamo la pagina giusta.\n\nIl punto di partenza migliore è la pagina ufficiale **{deptNameEn}**. [1]({deptUrlEn} "{deptNameEn}")\n\nPer una risposta dettagliata qui, puoi anche fare la tua domanda in inglese o in francese.`,
      de: `# Finden wir die richtige Seite.\n\nAm besten beginnen Sie mit der offiziellen Seite **{deptNameEn}**. [1]({deptUrlEn} "{deptNameEn}")\n\nFür eine ausführliche Antwort hier können Sie Ihre Frage auch auf Englisch oder Französisch stellen.`,
      vi: `# Hãy cùng tìm đúng trang.\n\nNơi tốt nhất để bắt đầu là trang chính thức **{deptNameEn}**. [1]({deptUrlEn} "{deptNameEn}")\n\nĐể nhận câu trả lời chi tiết tại đây, bạn cũng có thể đặt câu hỏi bằng tiếng Anh hoặc tiếng Pháp.`,
      tl: `# Hanapin natin ang tamang pahina.\n\nPinakamainam na magsimula sa opisyal na pahinang **{deptNameEn}**. [1]({deptUrlEn} "{deptNameEn}")\n\nPara sa detalyadong sagot dito, maaari mo ring itanong ito sa Ingles o Pranses.`,
    },
    vars: ({ text, lang }) => {
      const dept = DEPT_PAGES[routeDepartments(text, 1)[0] ?? ''];
      const page = dept ?? ALL_SERVICES;
      const host = new URL(page.url[lang]).hostname.replace(/^www\./, '');
      const where = dept
        ? lang === 'fr'
          ? `Commencez par **${page.name.fr}** sur ${host} : c’est la page officielle pour ce type de question.`
          : `Start with **${page.name.en}** on ${host}, the official page for this kind of question.`
        : lang === 'fr'
          ? `Commencez par la liste officielle des **services du gouvernement du Canada**, classés par thème sur ${host}.`
          : `Start with the official list of **Government of Canada services**, organized by topic on ${host}.`;
      return {
        where,
        deptUrl: page.url[lang],
        deptTitle: page.name[lang],
        deptNameEn: page.name.en,
        deptUrlEn: page.url.en,
      };
    },
    followUps: {
      en: ['How do I renew my passport?', 'How do I apply for Employment Insurance?', 'Am I eligible for the Canada Child Benefit?'],
      fr: ['Comment renouveler mon passeport?', 'Comment demander l’assurance-emploi?', 'Suis-je admissible à l’Allocation canadienne pour enfants?'],
    },
  },
];

export default general;
