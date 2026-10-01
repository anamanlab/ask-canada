/**
 * "Renewing is simpler" in the most common other home languages (program terms keep their English form, and
 * the citations go to the English pages). The planner under the answer is in English for now, and says so.
 */
import { URLS } from '../data';

export const RENEW_INTL: Partial<Record<string, string>> = {
      ar: `# خبر سار: تجديد جواز السفر *أسهل* من التقديم على جواز جديد.

إذا كان جوازك الأخير جواز سفر للبالغين صدر خلال آخر 15 سنة، يمكنك تجديده دون ضامن (guarantor) أو إثبات للجنسية أو وثائق هوية داعمة. ستحتاج إلى **شخصين مرجعيين** (references). [1](${URLS.renew.en}) [2](${URLS.whoCanRenew.en})

يمكنك التجديد **عبر الإنترنت** عندما يتبقى على انتهاء جوازك 6 أشهر أو أقل (أو إذا كان منتهيًا)، وتستغرق المعالجة حتى **20 يوم عمل، إضافة إلى مدة البريد**. التقديم شخصيًا في مكتب جوازات السفر هو الخيار الأسرع. [3](${URLS.online.en}) [4](${URLS.processing.en})

أخبر أداة التخطيط أدناه (باللغة الإنجليزية حاليًا) بموعد انتهاء جوازك لترتّب لك المواعيد.`,
      'zh-Hans': `# 好消息：续办护照比申请新护照*更简单*。

如果您上一本护照是过去 15 年内签发的成人护照，续办时无需担保人（guarantor）、公民身份证明或其他身份证件，但需要 **2 位推荐人（references）**。[1](${URLS.renew.en}) [2](${URLS.whoCanRenew.en})

护照在 6 个月内到期（或已过期）时，您可以**在线**续办，处理时间最长 **20 个工作日，另加邮寄时间**。亲自前往护照办公室办理最快。[3](${URLS.online.en}) [4](${URLS.processing.en})

在下方的规划工具（目前为英文）中填写护照到期时间，即可看到您的时间安排。`,
      pa: `# ਚੰਗੀ ਖ਼ਬਰ: ਪਾਸਪੋਰਟ ਨਵਿਆਉਣਾ ਨਵੇਂ ਪਾਸਪੋਰਟ ਲਈ ਅਰਜ਼ੀ ਦੇਣ ਨਾਲੋਂ *ਸੌਖਾ* ਹੈ।

ਜੇ ਤੁਹਾਡਾ ਪਿਛਲਾ ਪਾਸਪੋਰਟ ਪਿਛਲੇ 15 ਸਾਲਾਂ ਵਿੱਚ ਜਾਰੀ ਹੋਇਆ ਬਾਲਗ ਪਾਸਪੋਰਟ ਸੀ, ਤਾਂ ਤੁਸੀਂ ਇਸਨੂੰ ਗਾਰੰਟਰ (guarantor), ਨਾਗਰਿਕਤਾ ਦੇ ਸਬੂਤ ਜਾਂ ਹੋਰ ਪਛਾਣ ਪੱਤਰ ਤੋਂ ਬਿਨਾਂ ਨਵਿਆ ਸਕਦੇ ਹੋ। ਤੁਹਾਨੂੰ **2 ਹਵਾਲਿਆਂ (references)** ਦੀ ਲੋੜ ਪਵੇਗੀ। [1](${URLS.renew.en}) [2](${URLS.whoCanRenew.en})

ਜਦੋਂ ਤੁਹਾਡਾ ਪਾਸਪੋਰਟ 6 ਮਹੀਨਿਆਂ ਦੇ ਅੰਦਰ ਖ਼ਤਮ ਹੋਣ ਵਾਲਾ ਹੋਵੇ (ਜਾਂ ਖ਼ਤਮ ਹੋ ਚੁੱਕਾ ਹੋਵੇ), ਤੁਸੀਂ ਇਸਨੂੰ **ਔਨਲਾਈਨ** ਨਵਿਆ ਸਕਦੇ ਹੋ। ਇਸ ਵਿੱਚ **20 ਕੰਮਕਾਜੀ ਦਿਨ, ਨਾਲ ਡਾਕ ਦਾ ਸਮਾਂ** ਲੱਗਦਾ ਹੈ। ਪਾਸਪੋਰਟ ਦਫ਼ਤਰ ਵਿੱਚ ਖ਼ੁਦ ਜਾ ਕੇ ਅਰਜ਼ੀ ਦੇਣਾ ਸਭ ਤੋਂ ਤੇਜ਼ ਤਰੀਕਾ ਹੈ। [3](${URLS.online.en}) [4](${URLS.processing.en})

ਹੇਠਾਂ ਦਿੱਤੇ ਯੋਜਨਾਕਾਰ (ਹਾਲੇ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ) ਵਿੱਚ ਦੱਸੋ ਕਿ ਤੁਹਾਡਾ ਪਾਸਪੋਰਟ ਕਦੋਂ ਖ਼ਤਮ ਹੁੰਦਾ ਹੈ, ਅਤੇ ਇਹ ਤੁਹਾਡੀਆਂ ਤਰੀਕਾਂ ਦੱਸੇਗਾ।`,
      es: `# Buena noticia: renovar es *más sencillo* que solicitar un pasaporte nuevo.

Si tu último pasaporte fue un pasaporte de adulto emitido en los últimos 15 años, puedes renovarlo sin garante (guarantor), prueba de ciudadanía ni documentos de identidad adicionales. Necesitarás **2 referencias**. [1](${URLS.renew.en}) [2](${URLS.whoCanRenew.en})

Puedes renovarlo **en línea** cuando falten 6 meses o menos para que venza (o si ya venció). El trámite tarda hasta **20 días hábiles, más el envío por correo**. Hacerlo en persona en una oficina de pasaportes es la opción más rápida. [3](${URLS.online.en}) [4](${URLS.processing.en})

Indica en el planificador (por ahora en inglés) cuándo vence tu pasaporte y verás tus fechas.`,
};
