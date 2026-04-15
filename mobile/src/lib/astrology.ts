export type ZodiacSign =
  | "Aries" | "Taurus" | "Gemini" | "Cancer" | "Leo" | "Virgo"
  | "Libra" | "Scorpio" | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";

export type Element = "fire" | "earth" | "air" | "water";

export interface ZodiacInfo {
  sign: ZodiacSign;
  symbol: string;
  turkishName: string;
  element: Element;
  traits: string[];
  relationshipStyle: string;
}

const ZODIAC_DATA: Record<ZodiacSign, ZodiacInfo> = {
  Aries: {
    sign: "Aries",
    symbol: "♈",
    turkishName: "Koç",
    element: "fire",
    traits: ["Enerjik ve girişimci", "Lider ruhlu, cesur", "Heyecan arayan, spontane"],
    relationshipStyle: "Hızlı aşık olur, tutkuyla sever",
  },
  Taurus: {
    sign: "Taurus",
    symbol: "♉",
    turkishName: "Boğa",
    element: "earth",
    traits: ["Sadık ve güvenilir", "Sabırlı, istikrarlı", "Konforu ve güzelliği sever"],
    relationshipStyle: "Yavaş ısınır ama bir kez severse ömür boyu",
  },
  Gemini: {
    sign: "Gemini",
    symbol: "♊",
    turkishName: "İkizler",
    element: "air",
    traits: ["Meraklı ve zeki", "Sosyal ve eğlenceli", "Çok yönlü, adaptif"],
    relationshipStyle: "Zihinsel bağlantıya ihtiyaç duyar",
  },
  Cancer: {
    sign: "Cancer",
    symbol: "♋",
    turkishName: "Yengeç",
    element: "water",
    traits: ["Derin duygusal zeka", "Koruyucu ve şefkatli", "Sezgileri güçlü"],
    relationshipStyle: "Güven inşa edince tüm kalbini verir",
  },
  Leo: {
    sign: "Leo",
    symbol: "♌",
    turkishName: "Aslan",
    element: "fire",
    traits: ["Enerjik ve lider ruhlu", "Sosyal ortamlarda parlayan", "İlgi görmekten hoşlanır"],
    relationshipStyle: "Cömert ve tutkulu sever, sadık kalır",
  },
  Virgo: {
    sign: "Virgo",
    symbol: "♍",
    turkishName: "Başak",
    element: "earth",
    traits: ["Detaycı ve analitik", "Güvenilir ve titiz", "Pratik zeka"],
    relationshipStyle: "Sevgisini eylemlerle gösterir",
  },
  Libra: {
    sign: "Libra",
    symbol: "♎",
    turkishName: "Terazi",
    element: "air",
    traits: ["Adil ve dengeli", "Zarif ve sosyal", "Uyum seven, diplomatik"],
    relationshipStyle: "Ortaklık ve denge arar",
  },
  Scorpio: {
    sign: "Scorpio",
    symbol: "♏",
    turkishName: "Akrep",
    element: "water",
    traits: ["Yoğun ve karizmatik", "Sezgisel ve derinlikli", "Sadık ama gizemli"],
    relationshipStyle: "Derinden bağlanır, tüm ya da hiç",
  },
  Sagittarius: {
    sign: "Sagittarius",
    symbol: "♐",
    turkishName: "Yay",
    element: "fire",
    traits: ["Özgür ruhlu ve iyimser", "Maceracı ve meraklı", "Felsefi bakış açısı"],
    relationshipStyle: "Özgürlüğüne saygı duyulmasını ister",
  },
  Capricorn: {
    sign: "Capricorn",
    symbol: "♑",
    turkishName: "Oğlak",
    element: "earth",
    traits: ["Hırslı ve disiplinli", "Sorumlu ve olgun", "Uzun vadeli düşünür"],
    relationshipStyle: "Ciddi ilişkilere yatırım yapar",
  },
  Aquarius: {
    sign: "Aquarius",
    symbol: "♒",
    turkishName: "Kova",
    element: "air",
    traits: ["Yenilikçi ve özgün", "Bağımsız ve vizyoner", "İnsancıl yaklaşım"],
    relationshipStyle: "Önce arkadaşlık, sonra aşk",
  },
  Pisces: {
    sign: "Pisces",
    symbol: "♓",
    turkishName: "Balık",
    element: "water",
    traits: ["Empatik ve yaratıcı", "Rüya gibi romantik", "Sezgisel ve hassas"],
    relationshipStyle: "Ruhsal bağlantı arar",
  },
};

// Returns Turkish display string, e.g. "♌ Aslan"
export function getZodiacDisplay(sign: ZodiacSign): string {
  const info = ZODIAC_DATA[sign];
  return `${info.symbol} ${info.turkishName}`;
}

export function getZodiacInfo(sign: ZodiacSign): ZodiacInfo {
  return ZODIAC_DATA[sign];
}

export function getZodiacSign(birthDate: string): ZodiacSign {
  const date = new Date(birthDate);
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  return "Pisces";
}

type CompatKey = `${ZodiacSign}-${ZodiacSign}`;

// Special pair comments (bidirectional: A-B same as B-A)
const SPECIAL_PAIRS: Partial<Record<CompatKey, string>> = {
  "Leo-Aries": "İkiniz de ateş burcusunuz, enerjiniz kolayca tutuşabilir 🔥",
  "Leo-Sagittarius": "İki ateş burcu, sonsuz macera dolu bir enerji ✨",
  "Aries-Sagittarius": "Özgürlük seven iki ruh, birlikte uçarsınız 🚀",
  "Cancer-Virgo": "Duygusal ve detaycı bir denge yakalayabilirsiniz 🌿",
  "Taurus-Cancer": "Güven ve şefkati birlikte inşa edersiniz 🏡",
  "Taurus-Virgo": "İki toprak burcu, güçlü ve istikrarlı bir zemin 🪨",
  "Scorpio-Pisces": "Su burçları olarak derin bir ruhsal bağ kurabilirsiniz 🌊",
  "Cancer-Pisces": "Duygusal derinliğiniz birbirinizi tamamlıyor 💙",
  "Gemini-Libra": "Zihinsel uyumunuz olağanüstü, konuşmalarınız bitmez 💬",
  "Aquarius-Gemini": "İki hava burcu, fikirler havada uçuşur ☁️",
  "Libra-Aquarius": "Özgür düşünceli ikiniz, birlikte dünyayı değiştirirsiniz 🌍",
  "Scorpio-Capricorn": "İkiniz de derin ve kararlısınız, güçlü bir bağ olur 🖤",
  "Virgo-Capricorn": "Pratik ve hırslı, hedeflerinizi birlikte kovalarsınız 🎯",
  "Taurus-Capricorn": "İki toprak burcu, hayatı birlikte inşa edersiniz 🏛️",
};

const ELEMENT_COMMENTS: Record<Element, Record<Element, string>> = {
  fire: {
    fire: "İki ateş burcu, aranızdaki kıvılcım söndürülemez 🔥",
    earth: "Ateş ve toprak, birbirinizi dengeler ve büyütürsünüz 🌱",
    air: "Hava ateşi besler, ilginç bir kimya doğar ✨",
    water: "Ateş ve su, zıt ama çekici bir dinamik 💫",
  },
  earth: {
    fire: "Ateş ve toprak, birbirinizi dengeler ve büyütürsünüz 🌱",
    earth: "İki toprak burcu, sağlam ve kalıcı bir bağ kurarsınız 🪨",
    air: "Pratiklik ve zeka bir araya gelince güzel şeyler çıkar 💡",
    water: "Toprak ve su, birlikte büyüme ve beslenme 🌿",
  },
  air: {
    fire: "Hava ateşi besler, ilginç bir kimya doğar ✨",
    earth: "Pratiklik ve zeka bir araya gelince güzel şeyler çıkar 💡",
    air: "İki hava burcu, zihinsel uyumunuz harika 🌬️",
    water: "Hayal gücü ve duygu bir araya gelir, yaratıcı bir bağ 🎨",
  },
  water: {
    fire: "Ateş ve su, zıt ama çekici bir dinamik 💫",
    earth: "Toprak ve su, birlikte büyüme ve beslenme 🌿",
    air: "Hayal gücü ve duygu bir araya gelir, yaratıcı bir bağ 🎨",
    water: "İki su burcu, derin bir duygusal anlayış paylaşırsınız 🌊",
  },
};

export function getAstrologyComment(mySign: ZodiacSign, theirSign: ZodiacSign): string {
  // Check special pairs (both orderings)
  const key1 = `${mySign}-${theirSign}` as CompatKey;
  const key2 = `${theirSign}-${mySign}` as CompatKey;
  if (SPECIAL_PAIRS[key1]) return SPECIAL_PAIRS[key1]!;
  if (SPECIAL_PAIRS[key2]) return SPECIAL_PAIRS[key2]!;

  // Fall back to element-based comment
  const myElement = ZODIAC_DATA[mySign].element;
  const theirElement = ZODIAC_DATA[theirSign].element;
  return ELEMENT_COMMENTS[myElement][theirElement];
}
