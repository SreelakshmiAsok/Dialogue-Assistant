import tamil

TAMIL_TO_TANGLISH_MAP = {
    'அ': 'a', 'ஆ': 'aa', 'இ': 'i', 'ஈ': 'ee', 'உ': 'u', 'ஊ': 'oo', 'எ': 'e', 'ஏ': 'e', 'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'o', 'ஔ': 'au',
    'க்': 'k', 'ங்': 'ng', 'ச்': 'ch', 'ஞ்': 'nj', 'ட்': 'd', 'ண்': 'n', 'த்': 'th', 'ந்': 'n', 'ப்': 'p', 'ம்': 'm', 'ய்': 'y', 'ர்': 'r', 'ல்': 'l', 'வ்': 'v', 'ழ்': 'zh', 'ள்': 'l', 'ற்': 'r', 'ன்': 'n',
    'க': 'ka', 'ங': 'nga', 'ச': 'cha', 'ஞ': 'nja', 'ட': 'da', 'ண': 'na', 'த': 'tha', 'ந': 'na', 'ப': 'pa', 'ம': 'ma', 'ய': 'ya', 'ர': 'ra', 'ல': 'la', 'வ': 'va', 'ழ': 'zha', 'ள': 'la', 'ற': 'ra', 'ன': 'na',
    'கா': 'kaa', 'ஙா': 'ngaa', 'சா': 'chaa', 'ஞா': 'njaa', 'டா': 'daa', 'ணா': 'naa', 'தா': 'thaa', 'நா': 'naa', 'பா': 'paa', 'மா': 'maa', 'யா': 'yaa', 'ரா': 'raa', 'லா': 'laa', 'வா': 'vaa', 'ழா': 'zhaa', 'ளா': 'laa', 'றா': 'raa', 'னா': 'naa',
    'கி': 'ki', 'ஙி': 'ngi', 'சி': 'chi', 'ஞி': 'nji', 'டி': 'di', 'ணி': 'ni', 'தி': 'thi', 'நி': 'ni', 'பி': 'pi', 'மி': 'mi', 'யி': 'yi', 'ரி': 'ri', 'லி': 'li', 'வி': 'vi', 'ழி': 'zhi', 'ளி': 'li', 'றி': 'ri', 'னி': 'ni',
    'கீ': 'kee', 'ஙீ': 'ngee', 'சீ': 'chee', 'ஞீ': 'njee', 'டீ': 'dee', 'ணீ': 'nee', 'தீ': 'thee', 'நீ': 'nee', 'பீ': 'pee', 'மீ': 'mee', 'யீ': 'yee', 'ரீ': 'ree', 'லீ': 'lee', 'வீ': 'vee', 'ழீ': 'zhee', 'ளீ': 'lee', 'றீ': 'ree', 'னீ': 'nee',
    'கு': 'ku', 'ஙு': 'ngu', 'சு': 'chu', 'ஞு': 'nju', 'டு': 'du', 'ணு': 'nu', 'து': 'thu', 'நு': 'nu', 'பு': 'pu', 'மு': 'mu', 'யு': 'yu', 'ரு': 'ru', 'லு': 'lu', 'வு': 'vu', 'ழு': 'zhu', 'ளு': 'lu', 'று': 'ru', 'னு': 'nu',
    'கூ': 'koo', 'ஙூ': 'ngoo', 'சூ': 'choo', 'ஞூ': 'njoo', 'டூ': 'doo', 'ணூ': 'noo', 'தூ': 'thoo', 'நூ': 'noo', 'பூ': 'poo', 'மூ': 'moo', 'யூ': 'yoo', 'ரூ': 'roo', 'லூ': 'loo', 'வூ': 'voo', 'ழூ': 'zhoo', 'ளூ': 'loo', 'றூ': 'roo', 'னூ': 'noo',
    'கெ': 'ke', 'ஙெ': 'nge', 'செ': 'che', 'ஞெ': 'nje', 'டெ': 'de', 'ணெ': 'ne', 'தெ': 'the', 'நெ': 'ne', 'பெ': 'pe', 'மெ': 'me', 'யெ': 'ye', 'ரெ': 're', 'லெ': 'le', 'வெ': 've', 'ழெ': 'zhe', 'ளெ': 'le', 'றெ': 're', 'னெ': 'ne',
    'கே': 'ke', 'ஙே': 'nge', 'சே': 'che', 'ஞே': 'nje', 'டே': 'de', 'ணே': 'ne', 'தே': 'the', 'நே': 'ne', 'பே': 'pe', 'மே': 'me', 'யே': 'ye', 'ரே': 're', 'லே': 'le', 'வே': 've', 'ழே': 'zhe', 'ளே': 'le', 'றே': 're', 'னே': 'ne',
    'கை': 'kai', 'ஙை': 'ngai', 'சை': 'chai', 'ஞை': 'njai', 'டை': 'dai', 'ணை': 'nai', 'தை': 'thai', 'நை': 'nai', 'பை': 'pai', 'மை': 'mai', 'யை': 'yai', 'ரை': 'rai', 'லை': 'lai', 'வை': 'vai', 'ழை': 'zhai', 'ளை': 'lai', 'றை': 'rai', 'னை': 'nai',
    'கொ': 'ko', 'ஙொ': 'ngo', 'சொ': 'cho', 'ஞொ': 'njo', 'டொ': 'do', 'ணொ': 'no', 'தொ': 'tho', 'நொ': 'no', 'பொ': 'po', 'மொ': 'mo', 'யொ': 'yo', 'ரொ': 'ro', 'லொ': 'lo', 'வொ': 'vo', 'ழொ': 'zho', 'ளொ': 'lo', 'றொ': 'ro', 'னொ': 'no',
    'கோ': 'ko', 'ஙோ': 'ngo', 'சோ': 'cho', 'ஞோ': 'njo', 'டோ': 'do', 'ணோ': 'no', 'தோ': 'tho', 'நோ': 'no', 'போ': 'po', 'மோ': 'mo', 'யோ': 'yo', 'ரோ': 'ro', 'லோ': 'lo', 'வோ': 'vo', 'ழோ': 'zho', 'ளோ': 'lo', 'றோ': 'ro', 'னோ': 'no',
    'கௌ': 'kau', 'ஙௌ': 'ngau', 'சௌ': 'chau', 'ஞௌ': 'njau', 'டௌ': 'dau', 'ணௌ': 'nau', 'தௌ': 'thau', 'நௌ': 'nau', 'பௌ': 'pau', 'மௌ': 'mau', 'யௌ': 'yau', 'ரௌ': 'rau', 'லௌ': 'lau', 'வௌ': 'vau', 'ழௌ': 'zhau', 'ளௌ': 'lau', 'றௌ': 'rau', 'னௌ': 'nau',
    'ஸ்ரீ': 'sri', 'ஜ': 'ja', 'ஜி': 'ji', 'ஜீ': 'jee', 'ஜு': 'ju', 'ஜூ': 'joo', 'ஜெ': 'je', 'ஜே': 'je', 'ஜை': 'jai', 'ஜொ': 'jo', 'ஜோ': 'jo', 'ஜௌ': 'jau',
    'ஷ': 'sha', 'ஷி': 'shi', 'ஷீ': 'shee', 'ஷு': 'shu', 'ஷூ': 'shoo', 'ஷெ': 'she', 'ஷே': 'she', 'ஷை': 'shai', 'ஷொ': 'sho', 'ஷோ': 'sho', 'ஷௌ': 'shau',
    'ஸ': 'sa', 'ஸி': 'si', 'ஸீ': 'see', 'ஸு': 'su', 'ஸூ': 'soo', 'ஸெ': 'se', 'ஸே': 'se', 'ஸை': 'sai', 'ஸொ': 'so', 'ஸோ': 'so', 'ஸௌ': 'sau',
    'ஹ': 'ha', 'ஹி': 'hi', 'ஹீ': 'hee', 'ஹு': 'hu', 'ஹூ': 'hoo', 'ஹெ': 'he', 'ஹே': 'he', 'ஹை': 'hai', 'ஹொ': 'ho', 'ஹோ': 'ho', 'ஹௌ': 'hau',
    'க்ஷ': 'ksha', 'க்ஷி': 'kshi', 'க்ஷீ': 'kshee', 'க்ஷு': 'kshu', 'க்ஷூ': 'kshoo', 'க்ஷெ': 'kshe', 'க்ஷே': 'kshe', 'க்ஷை': 'kshai', 'க்ஷொ': 'ksho', 'க்ஷோ': 'ksho', 'க்ஷௌ': 'kshau',
    'ஜ்': 'j', 'ஷ்': 'sh', 'ஸ்': 's', 'ஹ்': 'h', 'க்ஷ்': 'ksh'
}

try:
    import tamil.utf8
except ImportError:
    pass

def to_tanglish(text):
    """Accurately maps Tamil script to Tanglish phonetics."""
    if not text:
        return ""
    try:
        if hasattr(tamil, 'utf8') and hasattr(tamil.utf8, 'get_letters'):
            letters = tamil.utf8.get_letters(text)
        else:
            letters = list(text)
    except Exception:
        letters = list(text)
        
    out = ""
    for l in letters:
        if l in TAMIL_TO_TANGLISH_MAP:
            out += TAMIL_TO_TANGLISH_MAP[l]
        else:
            out += l
    return out.strip()
