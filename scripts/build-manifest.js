/**
 * Quran Audio Manifest Builder
 * Scans a folder containing Quran surah audio files, inspects actual file sizes,
 * correlates with canonical Quran surah metadata, and generates surahs.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CANONICAL_SURAHS = [
  { id: 1, nameAr: "الفاتحة", englishName: "Al-Faatiha", malayalamName: "അൽ ഫാത്തിഹ", revelation: "Meccan", ayahCount: 7, meaningEn: "The Opening", meaningMl: "പ്രാരംഭം" },
  { id: 2, nameAr: "البقرة", englishName: "Al-Baqarah", malayalamName: "അൽ ബഖറ", revelation: "Medinan", ayahCount: 286, meaningEn: "The Cow", meaningMl: "പശു" },
  { id: 3, nameAr: "آل عمران", englishName: "Aal-i-Imraan", malayalamName: "ആലു ഇംറാൻ", revelation: "Medinan", ayahCount: 200, meaningEn: "The Family of Imran", meaningMl: "ഇംറാന്റെ കുടുംബം" },
  { id: 4, nameAr: "النساء", englishName: "An-Nisaa", malayalamName: "അന്നിസാഅ്", revelation: "Medinan", ayahCount: 176, meaningEn: "The Women", meaningMl: "സ്ത്രീകൾ" },
  { id: 5, nameAr: "المائدة", englishName: "Al-Maaida", malayalamName: "അൽ മാഇദ", revelation: "Medinan", ayahCount: 120, meaningEn: "The Table Spread", meaningMl: "ഭക്ഷണത്തളിക" },
  { id: 6, nameAr: "الأنعام", englishName: "Al-An'aam", malayalamName: "അൽ അൻആം", revelation: "Meccan", ayahCount: 165, meaningEn: "The Cattle", meaningMl: "കന്നുകാലികൾ" },
  { id: 7, nameAr: "الأعراف", englishName: "Al-A'raaf", malayalamName: "അൽ അഅ്റാഫ്", revelation: "Meccan", ayahCount: 206, meaningEn: "The Heights", meaningMl: "ഉന്നതസ്ഥലങ്ങൾ" },
  { id: 8, nameAr: "الأنفال", englishName: "Al-Anfaal", malayalamName: "അൽ അൻഫാൽ", revelation: "Medinan", ayahCount: 75, meaningEn: "The Spoils of War", meaningMl: "യുദ്ധമുതലുകൾ" },
  { id: 9, nameAr: "التوبة", englishName: "At-Tawba", malayalamName: "അത്തൗബ", revelation: "Medinan", ayahCount: 129, meaningEn: "The Repentance", meaningMl: "പശ്ചാത്താപം" },
  { id: 10, nameAr: "يونس", englishName: "Yunus", malayalamName: "യൂനുസ്", revelation: "Meccan", ayahCount: 109, meaningEn: "Jonah", meaningMl: "യൂനുസ് നബി" },
  { id: 11, nameAr: "هود", englishName: "Hud", malayalamName: "ഹൂദ്", revelation: "Meccan", ayahCount: 123, meaningEn: "Hud", meaningMl: "ഹൂദ് നബി" },
  { id: 12, nameAr: "يوسف", englishName: "Yusuf", malayalamName: "യൂസുഫ്", revelation: "Meccan", ayahCount: 111, meaningEn: "Joseph", meaningMl: "യൂസുഫ് നബി" },
  { id: 13, nameAr: "الرعد", englishName: "Ar-Ra'd", malayalamName: "അർറഅ്ദ്", revelation: "Medinan", ayahCount: 43, meaningEn: "The Thunder", meaningMl: "ഇടിനാദം" },
  { id: 14, nameAr: "إبراهيم", englishName: "Ibrahim", malayalamName: "ഇബ്രാഹീം", revelation: "Meccan", ayahCount: 52, meaningEn: "Abraham", meaningMl: "ഇബ്രാഹീം നബി" },
  { id: 15, nameAr: "الحجر", englishName: "Al-Hijr", malayalamName: "അൽ ഹിജ്ർ", revelation: "Meccan", ayahCount: 99, meaningEn: "The Rocky Tract", meaningMl: "പാറക്കെട്ട്" },
  { id: 16, nameAr: "النحل", englishName: "An-Nahl", malayalamName: "അന്നഹ്ൽ", revelation: "Meccan", ayahCount: 128, meaningEn: "The Bee", meaningMl: "തേനീച്ച" },
  { id: 17, nameAr: "الإسراء", englishName: "Al-Israa", malayalamName: "അൽ ഇസ്റാഅ്", revelation: "Meccan", ayahCount: 111, meaningEn: "The Night Journey", meaningMl: "രാപ്രയാണം" },
  { id: 18, nameAr: "الكهف", englishName: "Al-Kahf", malayalamName: "അൽ കഹ്ഫ്", revelation: "Meccan", ayahCount: 110, meaningEn: "The Cave", meaningMl: "ഗുഹ" },
  { id: 19, nameAr: "مريم", englishName: "Maryam", malayalamName: "മർയം", revelation: "Meccan", ayahCount: 98, meaningEn: "Mary", meaningMl: "മർയം ബീവി" },
  { id: 20, nameAr: "طه", englishName: "Taa-Haa", malayalamName: "ത്വാഹാ", revelation: "Meccan", ayahCount: 135, meaningEn: "Ta-Ha", meaningMl: "ത്വാഹാ" },
  { id: 21, nameAr: "الأنبياء", englishName: "Al-Anbiyaa", malayalamName: "അൽ അൻബിയാഅ്", revelation: "Meccan", ayahCount: 112, meaningEn: "The Prophets", meaningMl: "പ്രവാചകന്മാർ" },
  { id: 22, nameAr: "الحج", englishName: "Al-Hajj", malayalamName: "അൽ ഹജ്ജ്", revelation: "Medinan", ayahCount: 78, meaningEn: "The Pilgrimage", meaningMl: "തീർത്ഥാടനം" },
  { id: 23, nameAr: "المؤمنون", englishName: "Al-Muminoon", malayalamName: "അൽ മുഅ്മിനൂൻ", revelation: "Meccan", ayahCount: 118, meaningEn: "The Believers", meaningMl: "സത്യവിശ്വാസികൾ" },
  { id: 24, nameAr: "النور", englishName: "An-Noor", malayalamName: "അന്നൂർ", revelation: "Medinan", ayahCount: 64, meaningEn: "The Light", meaningMl: "വെളിച്ചം" },
  { id: 25, nameAr: "الفرقان", englishName: "Al-Furqaan", malayalamName: "അൽ ഫുർഖാൻ", revelation: "Meccan", ayahCount: 77, meaningEn: "The Criterion", meaningMl: "സത്യ-അസത്യ വിവേചകം" },
  { id: 26, nameAr: "الشعراء", englishName: "Ash-Shu'araa", malayalamName: "അശ്ശുഅറാഅ്", revelation: "Meccan", ayahCount: 227, meaningEn: "The Poets", meaningMl: "കവികൾ" },
  { id: 27, nameAr: "النمل", englishName: "An-Naml", malayalamName: "അന്നംല്", revelation: "Meccan", ayahCount: 93, meaningEn: "The Ant", meaningMl: "ഉറുമ്പ്" },
  { id: 28, nameAr: "القصص", englishName: "Al-Qasas", malayalamName: "അൽ ഖസ്വസ്വ്", revelation: "Meccan", ayahCount: 88, meaningEn: "The Stories", meaningMl: "ചരിത്രകഥകൾ" },
  { id: 29, nameAr: "العنكبوت", englishName: "Al-Ankaboot", malayalamName: "അൽ അൻകബൂത്ത്", revelation: "Meccan", ayahCount: 69, meaningEn: "The Spider", meaningMl: "എട്ടുകാലി" },
  { id: 30, nameAr: "الروم", englishName: "Ar-Room", malayalamName: "അർറൂം", revelation: "Meccan", ayahCount: 60, meaningEn: "The Romans", meaningMl: "റോമാക്കാർ" },
  { id: 31, nameAr: "لقمان", englishName: "Luqman", malayalamName: "ലുഖ്മാൻ", revelation: "Meccan", ayahCount: 34, meaningEn: "Luqman", meaningMl: "ലുഖ്മാൻ മഹർഷി" },
  { id: 32, nameAr: "السجدة", englishName: "As-Sajda", malayalamName: "അസ്സജദ", revelation: "Meccan", ayahCount: 30, meaningEn: "The Prostration", meaningMl: "സാഷ്ടാംഗം" },
  { id: 33, nameAr: "الأحزاب", englishName: "Al-Ahzaab", malayalamName: "അൽ അഹ്സാബ്", revelation: "Medinan", ayahCount: 73, meaningEn: "The Combined Forces", meaningMl: "സംഘടിത കക്ഷികൾ" },
  { id: 34, nameAr: "سبأ", englishName: "Saba", malayalamName: "സബഅ്", revelation: "Meccan", ayahCount: 54, meaningEn: "Sheba", meaningMl: "സബഅ് രാജ്യം" },
  { id: 35, nameAr: "فاطر", englishName: "Faatir", malayalamName: "ഫാത്വിർ", revelation: "Meccan", ayahCount: 45, meaningEn: "Originator", meaningMl: "സൃഷ്ടികർത്താവ്" },
  { id: 36, nameAr: "يس", englishName: "Yaseen", malayalamName: "യാസീൻ", revelation: "Meccan", ayahCount: 83, meaningEn: "Ya-Sin", meaningMl: "യാസീൻ" },
  { id: 37, nameAr: "الصافات", englishName: "As-Saaffaat", malayalamName: "അസ്സ്വാഫാത്ത്", revelation: "Meccan", ayahCount: 182, meaningEn: "Those Who Set The Ranks", meaningMl: "അണിനിരന്നവർ" },
  { id: 38, nameAr: "ص", englishName: "Saad", malayalamName: "സ്വാദ്", revelation: "Meccan", ayahCount: 88, meaningEn: "The Letter Saad", meaningMl: "സ്വാദ്" },
  { id: 39, nameAr: "الزمر", englishName: "Az-Zumar", malayalamName: "അസ്സുമർ", revelation: "Meccan", ayahCount: 75, meaningEn: "The Crowds", meaningMl: "കൂട്ടങ്ങൾ" },
  { id: 40, nameAr: "غافر", englishName: "Ghaafir", malayalamName: "ഗാഫിർ", revelation: "Meccan", ayahCount: 85, meaningEn: "The Forgiver", meaningMl: "പാപം പൊറുക്കുന്നവൻ" },
  { id: 41, nameAr: "فصلت", englishName: "Fussilat", malayalamName: "ഫുസ്സിലത്ത്", revelation: "Meccan", ayahCount: 54, meaningEn: "Explained In Detail", meaningMl: "വിശദീകരിക്കപ്പെട്ടത്" },
  { id: 42, nameAr: "الشورى", englishName: "Ash-Shoora", malayalamName: "അശ്ശൂറാ", revelation: "Meccan", ayahCount: 53, meaningEn: "The Consultation", meaningMl: "കൂടിയാലോചന" },
  { id: 43, nameAr: "الزخرف", englishName: "Az-Zukhruf", malayalamName: "അസ്സുഖ്റുഫ്", revelation: "Meccan", ayahCount: 89, meaningEn: "The Gold Adornments", meaningMl: "സ്വർണ്ണാലങ്കാരം" },
  { id: 44, nameAr: "الدخان", englishName: "Ad-Dukhaan", malayalamName: "അദ്ദുഖാൻ", revelation: "Meccan", ayahCount: 59, meaningEn: "The Smoke", meaningMl: "പുക" },
  { id: 45, nameAr: "الجاثية", englishName: "Al-Jaathiya", malayalamName: "അൽ ജാഥിയ", revelation: "Meccan", ayahCount: 37, meaningEn: "The Crouching", meaningMl: "മുട്ടുകുത്തിയവർ" },
  { id: 46, nameAr: "الأحقاف", englishName: "Al-Ahqaf", malayalamName: "അൽ അഹ്ഖാഫ്", revelation: "Meccan", ayahCount: 35, meaningEn: "The Wind-Curved Sandhills", meaningMl: "മണൽക്കൂനകൾ" },
  { id: 47, nameAr: "محمد", englishName: "Muhammad", malayalamName: "മുഹമ്മദ്", revelation: "Medinan", ayahCount: 38, meaningEn: "Muhammad", meaningMl: "മുഹമ്മദ് നബി" },
  { id: 48, nameAr: "الفتح", englishName: "Al-Fath", malayalamName: "അൽ ഫത്ഹ്", revelation: "Medinan", ayahCount: 29, meaningEn: "The Victory", meaningMl: "വിജയം" },
  { id: 49, nameAr: "الحجرات", englishName: "Al-Hujuraat", malayalamName: "അൽ ഹുജുറാത്ത്", revelation: "Medinan", ayahCount: 18, meaningEn: "The Rooms", meaningMl: "മുറികൾ" },
  { id: 50, nameAr: "ق", englishName: "Qaaf", malayalamName: "ഖാഫ്", revelation: "Meccan", ayahCount: 45, meaningEn: "The Letter Qaf", meaningMl: "ഖാഫ്" },
  { id: 51, nameAr: "الذاريات", englishName: "Adh-Dhaariyaat", malayalamName: "അദ്ദാരിയാത്ത്", revelation: "Meccan", ayahCount: 60, meaningEn: "The Winnowing Winds", meaningMl: "ചിതറിക്കുന്ന കാറ്റുകൾ" },
  { id: 52, nameAr: "الطور", englishName: "At-Toor", malayalamName: "അത്ത്വൂർ", revelation: "Meccan", ayahCount: 49, meaningEn: "The Mount", meaningMl: "തൂർ പർവ്വതം" },
  { id: 53, nameAr: "النجم", englishName: "An-Najm", malayalamName: "അന്നജ്മ്", revelation: "Meccan", ayahCount: 62, meaningEn: "The Star", meaningMl: "നക്ഷത്രം" },
  { id: 54, nameAr: "القمر", englishName: "Al-Qamar", malayalamName: "അൽ ഖമർ", revelation: "Meccan", ayahCount: 55, meaningEn: "The Moon", meaningMl: "ചന്ദ്രൻ" },
  { id: 55, nameAr: "الرحمن", englishName: "Ar-Rahmaan", malayalamName: "അർറഹ്മാൻ", revelation: "Medinan", ayahCount: 78, meaningEn: "The Beneficent", meaningMl: "പരമകാരുണികൻ" },
  { id: 56, nameAr: "الواقعة", englishName: "Al-Waaqia", malayalamName: "അൽ വാഖിഅ", revelation: "Meccan", ayahCount: 96, meaningEn: "The Inevitable", meaningMl: "അനിവാര്യ സംഭവം" },
  { id: 57, nameAr: "الحديد", englishName: "Al-Hadeed", malayalamName: "അൽ ഹദീദ്", revelation: "Medinan", ayahCount: 29, meaningEn: "The Iron", meaningMl: "ഇരുമ്പ്" },
  { id: 58, nameAr: "المجادلة", englishName: "Al-Mujaadila", malayalamName: "അൽ മുജാദില", revelation: "Medinan", ayahCount: 22, meaningEn: "The Pleading Woman", meaningMl: "തർക്കിച്ച സ്ത്രീ" },
  { id: 59, nameAr: "الحشر", englishName: "Al-Hashr", malayalamName: "അൽ ഹശ്ർ", revelation: "Medinan", ayahCount: 24, meaningEn: "The Exile", meaningMl: "തുരത്തിയോടിക്കൽ" },
  { id: 60, nameAr: "الممتحنة", englishName: "Al-Mumtahana", malayalamName: "അൽ മുംതഹന", revelation: "Medinan", ayahCount: 13, meaningEn: "She That Is To Be Examined", meaningMl: "പരീക്ഷിക്കപ്പെടുന്നവൾ" },
  { id: 61, nameAr: "الصف", englishName: "As-Saff", malayalamName: "അസ്സ്വഫ്ഫ്", revelation: "Medinan", ayahCount: 14, meaningEn: "The Ranks", meaningMl: "അണി" },
  { id: 62, nameAr: "الجمعة", englishName: "Al-Jumu'a", malayalamName: "അൽ ജുമുഅ", revelation: "Medinan", ayahCount: 11, meaningEn: "The Congregation", meaningMl: "വെള്ളിയാഴ്ച" },
  { id: 63, nameAr: "المنافقون", englishName: "Al-Munaafiqoon", malayalamName: "അൽ മുനാഫിഖൂൻ", revelation: "Medinan", ayahCount: 11, meaningEn: "The Hypocrites", meaningMl: "കപടവിശ്വാസികൾ" },
  { id: 64, nameAr: "التغابن", englishName: "At-Taghaabun", malayalamName: "അത്തഗാബുൻ", revelation: "Medinan", ayahCount: 18, meaningEn: "The Mutual Disillusion", meaningMl: "ലാഭനഷ്ടങ്ങൾ വെളിപ്പെടൽ" },
  { id: 65, nameAr: "الطلاق", englishName: "At-Talaaq", malayalamName: "അത്ത്വലാഖ്", revelation: "Medinan", ayahCount: 12, meaningEn: "The Divorce", meaningMl: "വിവാഹമോചനം" },
  { id: 66, nameAr: "التحريم", englishName: "At-Tahreem", malayalamName: "അത്തഹ്രീം", revelation: "Medinan", ayahCount: 12, meaningEn: "The Prohibition", meaningMl: "നിഷിദ്ധമാക്കൽ" },
  { id: 67, nameAr: "الملك", englishName: "Al-Mulk", malayalamName: "അൽ മുൽക്", revelation: "Meccan", ayahCount: 30, meaningEn: "The Sovereignty", meaningMl: "ആധിപത്യം" },
  { id: 68, nameAr: "القلم", englishName: "Al-Qalam", malayalamName: "അൽ ഖലം", revelation: "Meccan", ayahCount: 52, meaningEn: "The Pen", meaningMl: "എഴുത്തുകോൽ" },
  { id: 69, nameAr: "الحاقة", englishName: "Al-Haaqqa", malayalamName: "അൽ ഹാഖ്ഖ", revelation: "Meccan", ayahCount: 52, meaningEn: "The Reality", meaningMl: "യഥാർത്ഥ സംഭവം" },
  { id: 70, nameAr: "المعارج", englishName: "Al-Ma'aarij", malayalamName: "അൽ മആരിജ്", revelation: "Meccan", ayahCount: 44, meaningEn: "The Ascending Stairways", meaningMl: "കയറുന്ന വഴികൾ" },
  { id: 71, nameAr: "نوح", englishName: "Nooh", malayalamName: "നൂഹ്", revelation: "Meccan", ayahCount: 28, meaningEn: "Noah", meaningMl: "നൂഹ് നബി" },
  { id: 72, nameAr: "الجن", englishName: "Al-Jinn", malayalamName: "അൽ ജിന്ന്", revelation: "Meccan", ayahCount: 28, meaningEn: "The Jinn", meaningMl: "ജിന്നുകൾ" },
  { id: 73, nameAr: "المزمل", englishName: "Al-Muzzammil", malayalamName: "അൽ മുസ്സമ്മിൽ", revelation: "Meccan", ayahCount: 20, meaningEn: "The Enshrouded One", meaningMl: "പുതച്ചു മൂടിയവൻ" },
  { id: 74, nameAr: "المدثر", englishName: "Al-Muddathir", malayalamName: "അൽ മുദ്ദഥ്ഥിർ", revelation: "Meccan", ayahCount: 56, meaningEn: "The Cloaked One", meaningMl: "വസ്ത്രം പുതച്ചവൻ" },
  { id: 75, nameAr: "القيامة", englishName: "Al-Qiyaama", malayalamName: "അൽ ഖിയാമ", revelation: "Meccan", ayahCount: 40, meaningEn: "The Resurrection", meaningMl: "ഉയിർത്തെഴുന്നേൽപ്പ്" },
  { id: 76, nameAr: "الإنسان", englishName: "Al-Insaan", malayalamName: "അൽ ഇൻസാൻ", revelation: "Medinan", ayahCount: 31, meaningEn: "The Human", meaningMl: "മനുഷ്യൻ" },
  { id: 77, nameAr: "المرسلات", englishName: "Al-Mursalaat", malayalamName: "അൽ മുർസലാത്ത്", revelation: "Meccan", ayahCount: 50, meaningEn: "The Emissaries", meaningMl: "അയക്കപ്പെടുന്ന കാറ്റുകൾ" },
  { id: 78, nameAr: "النبأ", englishName: "An-Naba", malayalamName: "അന്നബഅ്", revelation: "Meccan", ayahCount: 40, meaningEn: "The Tidings", meaningMl: "സുപ്രധാന വാർത്ത" },
  { id: 79, nameAr: "النازعات", englishName: "An-Naazi'aat", malayalamName: "അന്നാസിആത്ത്", revelation: "Meccan", ayahCount: 46, meaningEn: "Those Who Drag Forth", meaningMl: "തീവ്രമായി ഊരിയെടുക്കുന്നവ" },
  { id: 80, nameAr: "عبس", englishName: "Abasa", malayalamName: "അബസ", revelation: "Meccan", ayahCount: 42, meaningEn: "He Frowned", meaningMl: "മുഖം ചുളിച്ചു" },
  { id: 81, nameAr: "التكوير", englishName: "At-Takweer", malayalamName: "അത്തക്വീർ", revelation: "Meccan", ayahCount: 29, meaningEn: "The Overthrowing", meaningMl: "ചുരുട്ടിപ്പൊതിയൽ" },
  { id: 82, nameAr: "الانفطار", englishName: "Al-Infitaar", malayalamName: "അൽ ഇൻഫിത്വാർ", revelation: "Meccan", ayahCount: 19, meaningEn: "The Cleaving", meaningMl: "പൊട്ടിപ്പിളരൽ" },
  { id: 83, nameAr: "المطففين", englishName: "Al-Mutaffifeen", malayalamName: "അൽ മുത്വഫ്ഫിഫീൻ", revelation: "Meccan", ayahCount: 36, meaningEn: "The Defrauding", meaningMl: "അളവിൽ കുറക്കുന്നവർ" },
  { id: 84, nameAr: "الانشقاق", englishName: "Al-Inshiqaaq", malayalamName: "അൽ ഇൻശിഖാഖ്", revelation: "Meccan", ayahCount: 25, meaningEn: "The Splitting Open", meaningMl: "പിളർന്നുപോകൽ" },
  { id: 85, nameAr: "البروج", englishName: "Al-Burooj", malayalamName: "അൽ ബുറൂജ്", revelation: "Meccan", ayahCount: 22, meaningEn: "The Mansions of the Stars", meaningMl: "നക്ഷത്രമണ്ഡലങ്ങൾ" },
  { id: 86, nameAr: "الطارق", englishName: "At-Taariq", malayalamName: "അത്ത്വാരിഖ്", revelation: "Meccan", ayahCount: 17, meaningEn: "The Morning Star", meaningMl: "രാത്രിയിലെത്തുന്നവൻ" },
  { id: 87, nameAr: "الأعلى", englishName: "Al-A'laa", malayalamName: "അൽ അഅ്ലാ", revelation: "Meccan", ayahCount: 19, meaningEn: "The Most High", meaningMl: "അത്യുന്നതൻ" },
  { id: 88, nameAr: "الغاشية", englishName: "Al-Ghaashiya", malayalamName: "അൽ ഗാശിയ", revelation: "Meccan", ayahCount: 26, meaningEn: "The Overwhelming", meaningMl: "മൂടിപ്പൊതിയുന്ന വിപത്ത്" },
  { id: 89, nameAr: "الفجر", englishName: "Al-Fajr", malayalamName: "അൽ ഫജ്ർ", revelation: "Meccan", ayahCount: 30, meaningEn: "The Dawn", meaningMl: "പ്രഭാതം" },
  { id: 90, nameAr: "البلد", englishName: "Al-Balad", malayalamName: "അൽ ബലദ്", revelation: "Meccan", ayahCount: 20, meaningEn: "The City", meaningMl: "വിശുദ്ധ നഗരം" },
  { id: 91, nameAr: "الشمس", englishName: "Ash-Shams", malayalamName: "അശ്ശംസ്", revelation: "Meccan", ayahCount: 15, meaningEn: "The Sun", meaningMl: "സൂര്യൻ" },
  { id: 92, nameAr: "الليل", englishName: "Al-Lail", malayalamName: "അൽ ലൈൽ", revelation: "Meccan", ayahCount: 21, meaningEn: "The Night", meaningMl: "രാത്രി" },
  { id: 93, nameAr: "الضحى", englishName: "Ad-Dhuhaa", malayalamName: "അള്ളുഹാ", revelation: "Meccan", ayahCount: 11, meaningEn: "The Morning Hours", meaningMl: "പൂർവ്വാഹ്നം" },
  { id: 94, nameAr: "الشرح", englishName: "Ash-Sharh", malayalamName: "അശ്ശർഹ്", revelation: "Meccan", ayahCount: 8, meaningEn: "The Relief", meaningMl: "മനശ്ശാന്തി" },
  { id: 95, nameAr: "التين", englishName: "At-Teen", malayalamName: "അത്തീൻ", revelation: "Meccan", ayahCount: 8, meaningEn: "The Fig", meaningMl: "അത്തിപ്പഴം" },
  { id: 96, nameAr: "العلق", englishName: "Al-Alaq", malayalamName: "അൽ അലഖ്", revelation: "Meccan", ayahCount: 19, meaningEn: "The Clot", meaningMl: "ഭ്രൂണം" },
  { id: 97, nameAr: "القدر", englishName: "Al-Qadr", malayalamName: "അൽ ഖദ്ർ", revelation: "Meccan", ayahCount: 5, meaningEn: "The Power", meaningMl: "നിർണ്ണയം" },
  { id: 98, nameAr: "البينة", englishName: "Al-Bayyina", malayalamName: "അൽ ബയ്യിന", revelation: "Medinan", ayahCount: 8, meaningEn: "The Clear Proof", meaningMl: "വ്യക്തമായ തെളിവ്" },
  { id: 99, nameAr: "الزلزلة", englishName: "Az-Zalzala", malayalamName: "അസ്സൽസല", revelation: "Medinan", ayahCount: 8, meaningEn: "The Earthquake", meaningMl: "ഭൂകമ്പം" },
  { id: 100, nameAr: "العاديات", englishName: "Al-Aadiyaat", malayalamName: "അൽ ആദിയാത്ത്", revelation: "Meccan", ayahCount: 11, meaningEn: "The Courser", meaningMl: "കിതച്ചോടുന്ന കുതിരകൾ" },
  { id: 101, nameAr: "القارعة", englishName: "Al-Qaari'a", malayalamName: "അൽ ഖാരിഅ", revelation: "Meccan", ayahCount: 11, meaningEn: "The Calamity", meaningMl: "ഭയങ്കര സംഭവം" },
  { id: 102, nameAr: "التكاثر", englishName: "At-Takaathur", malayalamName: "അത്തകാഥുർ", revelation: "Meccan", ayahCount: 8, meaningEn: "The Rivalry In World Increase", meaningMl: "കൂടുതൽ നേടാനുള്ള ദുര" },
  { id: 103, nameAr: "العصر", englishName: "Al-Asr", malayalamName: "അൽ അസ്വർ", revelation: "Meccan", ayahCount: 3, meaningEn: "The Declining Day", meaningMl: "കാലം" },
  { id: 104, nameAr: "الهمزة", englishName: "Al-Humaza", malayalamName: "അൽ ഹുമസ", revelation: "Meccan", ayahCount: 9, meaningEn: "The Traducer", meaningMl: "കുത്തുവാക്ക് പറയുന്നവൻ" },
  { id: 105, nameAr: "الفيل", englishName: "Al-Feel", malayalamName: "അൽ ഫീൽ", revelation: "Meccan", ayahCount: 5, meaningEn: "The Elephant", meaningMl: "ആനക്കൂട്ടം" },
  { id: 106, nameAr: "قريش", englishName: "Quraish", malayalamName: "ഖുറൈശ്", revelation: "Meccan", ayahCount: 4, meaningEn: "Quraysh", meaningMl: "ഖുറൈശികൾ" },
  { id: 107, nameAr: "الماعون", englishName: "Al-Maa'oon", malayalamName: "അൽ മാഊൻ", revelation: "Meccan", ayahCount: 7, meaningEn: "The Small Kindnesses", meaningMl: "പരോപകാരം" },
  { id: 108, nameAr: "الكوثر", englishName: "Al-Kawthar", malayalamName: "അൽ കൗഥർ", revelation: "Meccan", ayahCount: 3, meaningEn: "The Abundance", meaningMl: "ധാരാളിത്തം" },
  { id: 109, nameAr: "الكافرون", englishName: "Al-Kaafiroon", malayalamName: "അൽ കാഫിറൂൻ", revelation: "Meccan", ayahCount: 6, meaningEn: "The Disbelievers", meaningMl: "സത്യനിഷേധികൾ" },
  { id: 110, nameAr: "النصر", englishName: "An-Nasr", malayalamName: "അന്നസ്വർ", revelation: "Medinan", ayahCount: 3, meaningEn: "The Divine Support", meaningMl: "സഹായം" },
  { id: 111, nameAr: "المسد", englishName: "Al-Masad", malayalamName: "അൽ മസദ്", revelation: "Meccan", ayahCount: 5, meaningEn: "The Palm Fibre", meaningMl: "ഈന്തപ്പനച്ചരട്" },
  { id: 112, nameAr: "الإخلاص", englishName: "Al-Ikhlaas", malayalamName: "അൽ ഇഖ്‌ലാസ്", revelation: "Meccan", ayahCount: 4, meaningEn: "The Sincerity", meaningMl: "നിഷ്കളങ്കത" },
  { id: 113, nameAr: "الفلق", englishName: "Al-Falaq", malayalamName: "അൽ ഫലഖ്", revelation: "Meccan", ayahCount: 5, meaningEn: "The Daybreak", meaningMl: "പുലരി" },
  { id: 114, nameAr: "الناس", englishName: "An-Naas", malayalamName: "അന്നാസ്", revelation: "Meccan", ayahCount: 6, meaningEn: "Mankind", meaningMl: "മനുഷ്യർ" }
];

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseArgs() {
  const args = process.argv.slice(2);
  let audioDir = path.join(process.cwd(), 'malayalam quran mp3');
  let outFile = path.join(process.cwd(), 'public', 'data', 'surahs.json');

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' && args[i + 1]) {
      audioDir = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === '--out' && args[i + 1]) {
      outFile = path.resolve(args[i + 1]);
      i++;
    }
  }

  return { audioDir, outFile };
}

function main() {
  const { audioDir, outFile } = parseArgs();
  console.log(`Scanning audio directory: ${audioDir}`);

  let audioFiles = [];
  if (fs.existsSync(audioDir)) {
    audioFiles = fs.readdirSync(audioDir).filter(f => f.toLowerCase().endsWith('.mp3'));
    console.log(`Found ${audioFiles.length} MP3 files in audio directory.`);
  } else {
    console.warn(`Warning: Audio directory not found at ${audioDir}. Manifest will use standard filenames.`);
  }

  const manifest = CANONICAL_SURAHS.map((surah) => {
    let matchedFile = null;
    let fileSizeBytes = 0;

    if (audioFiles.length > 0) {
      const p3 = String(surah.id).padStart(3, '0');
      const p2 = String(surah.id).padStart(2, '0');

      // Rule 1: Special case for Surah 1 if named 000_
      if (surah.id === 1) {
        matchedFile = audioFiles.find(f => f.startsWith('000_') || f.startsWith('001_'));
      }

      // Rule 2: Prefix number matching (002_, 02_, 2_, etc.)
      if (!matchedFile) {
        matchedFile = audioFiles.find(f => {
          const m = f.match(/^(\d+)[\s_\.\-]/);
          if (m) {
            const num = parseInt(m[1], 10);
            return num === surah.id;
          }
          return false;
        });
      }

      // Rule 3: Exact normalized name match
      if (!matchedFile) {
        const normalizedSurah = normalize(surah.englishName);
        matchedFile = audioFiles.find(file => {
          const normFile = normalize(file);
          return normFile.includes(normalizedSurah);
        });
      }

      // Get stats
      if (matchedFile) {
        try {
          const stats = fs.statSync(path.join(audioDir, matchedFile));
          fileSizeBytes = stats.size;
        } catch (e) {
          fileSizeBytes = 0;
        }
      }
    }

    const defaultFilename = matchedFile || `${String(surah.id).padStart(3, '0')}_${surah.englishName.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;

    return {
      id: surah.id,
      number: surah.id,
      nameArabic: surah.nameAr,
      englishName: surah.englishName,
      englishMeaning: surah.meaningEn,
      malayalamName: surah.malayalamName,
      malayalamMeaning: surah.meaningMl,
      revelationType: surah.revelation,
      ayahCount: surah.ayahCount,
      audioFile: defaultFilename,
      fileSizeBytes: fileSizeBytes || Math.round(surah.ayahCount * 180000)
    };
  });

  const outDir = path.dirname(outFile);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Generated manifest with ${manifest.length} surahs at: ${outFile}`);

  const srcDataDir = path.join(process.cwd(), 'src', 'data');
  if (!fs.existsSync(srcDataDir)) {
    fs.mkdirSync(srcDataDir, { recursive: true });
  }
  fs.writeFileSync(path.join(srcDataDir, 'surahs.json'), JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Mirrored manifest to: ${path.join(srcDataDir, 'surahs.json')}`);
}

main();
